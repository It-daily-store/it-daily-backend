import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import Order from "../order/order.model";
import { decryptToken, encryptToken, maskToken } from "./metaPixel.crypto";
import { isBotUserAgent, isIpExcluded } from "./metaPixel.identity";
import { BACKEND_VISIBLE_KEYS, TRIGGER_REGISTRY } from "./metaPixel.constants";
import { IMetaPixelConfig } from "./metaPixel.interface";
import MetaPixelConfig from "./metaPixel.model";
import MetaPixelEventLog from "./metaPixelEventLog.model";
import { sendToMeta } from "./metaPixel.sender";
import {
  buildOrderEventPayload,
  buildTriggerEventPayload,
  hasUsableIdentity,
} from "./metaPixel.payload";

const defaultTriggers = () =>
  TRIGGER_REGISTRY.map((def) => ({
    key: def.key,
    eventName: def.defaultEventName,
    isCustomEvent: false,
    enabled: def.defaultEnabled,
    sendViaBrowser: true,
    sendViaCapi: false,
  }));

const getConfigDocument = async () => {
  let doc = await MetaPixelConfig.findOne();

  if (!doc) {
    doc = await MetaPixelConfig.create({
      triggers: defaultTriggers(),
      statusRules: [
        {
          status: "delivered",
          eventName: "Purchase",
          isCustomEvent: false,
          enabled: true,
        },
      ],
    });
  }

  // A trigger key added to the registry after this document was created would
  // otherwise be missing from the admin UI forever.
  const missing = TRIGGER_REGISTRY.filter(
    (def) => !doc?.triggers.some((t) => t.key === def.key),
  );

  if (missing.length) {
    doc.triggers.push(
      ...missing.map((def) => ({
        key: def.key,
        eventName: def.defaultEventName,
        isCustomEvent: false,
        enabled: def.defaultEnabled,
        sendViaBrowser: true,
        sendViaCapi: false,
      })),
    );
    await doc.save();
  }

  return doc;
};

const getConfig = async () => {
  const doc = await getConfigDocument();
  const plain = doc.toObject();

  return {
    ...plain,
    accessToken: doc.accessToken ? decryptToken(doc.accessToken) : undefined,
  };
};

const getAdminConfig = async () => {
  const doc = await getConfigDocument();
  const plain = doc.toObject();

  delete plain.accessToken;

  return {
    ...plain,
    hasToken: !!doc.accessToken,
    tokenLast4: doc.accessToken
      ? maskToken(decryptToken(doc.accessToken))
      : undefined,
  };
};

const getPublicConfig = async (clientIp?: string) => {
  const doc = await getConfigDocument();

  const suppressed =
    !doc.enabled || !doc.pixelId || isIpExcluded(clientIp, doc.excludedIps);

  return {
    enabled: !suppressed,
    pixelId: suppressed ? undefined : doc.pixelId,
    testEventCode: suppressed ? undefined : doc.testEventCode,
    currency: doc.currency,
    triggers: doc.triggers
      .filter(
        (t) => t.enabled && t.eventName && (t.sendViaBrowser || t.sendViaCapi),
      )
      .map((t) => ({
        key: t.key,
        eventName: t.eventName,
        sendViaBrowser: t.sendViaBrowser,
        sendViaCapi: t.sendViaCapi,
      })),
  };
};

const updateConfig = async (
  userId: Types.ObjectId,
  payload: Partial<IMetaPixelConfig>,
) => {
  const doc = await getConfigDocument();

  if (payload.accessToken !== undefined) {
    if (payload.accessToken === "") {
      doc.accessToken = undefined;
      doc.tokenVerifiedAt = undefined;
      // Clearing the credential must also disable everything that depends on it.
      doc.capiEnabled = false;
    } else {
      doc.accessToken = encryptToken(payload.accessToken);
      doc.tokenVerifiedAt = undefined;
    }
  }

  if (payload.capiEnabled === true && !doc.tokenVerifiedAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Run Test connection successfully before enabling the Conversions API",
    );
  }

  const assignable: (keyof IMetaPixelConfig)[] = [
    "pixelId",
    "datasetId",
    "testEventCode",
    "enabled",
    "capiEnabled",
    "currency",
    "contentIdSource",
    "excludedIps",
    "blockBots",
    "statusRules",
  ];

  assignable.forEach((key) => {
    if (payload[key] !== undefined) {
      (doc as never as Record<string, unknown>)[key] = payload[key];
    }
  });

  if (payload.triggers) {
    payload.triggers.forEach((incoming) => {
      const existing = doc.triggers.find((t) => t.key === incoming.key);

      if (!existing) {
        return;
      }

      existing.eventName = incoming.eventName;
      existing.isCustomEvent = incoming.isCustomEvent;
      existing.enabled = incoming.enabled;
      existing.sendViaBrowser = incoming.sendViaBrowser;
      existing.sendViaCapi =
        incoming.sendViaCapi &&
        BACKEND_VISIBLE_KEYS.includes(incoming.key) &&
        doc.capiEnabled;
    });
  }

  // Turning CAPI off must not leave triggers claiming they still send server-side.
  if (!doc.capiEnabled) {
    doc.triggers.forEach((t) => {
      t.sendViaCapi = false;
    });
  }

  doc.lastUpdatedBy = userId;
  await doc.save();

  return getAdminConfig();
};

const previewPayload = async (input: {
  triggerKey?: string;
  statusRuleId?: string;
  sampleOrderId?: string;
}) => {
  const config = await getConfig();

  const order = input.sampleOrderId
    ? await Order.findById(input.sampleOrderId).populate("items.productId")
    : await Order.findOne().sort({ createdAt: -1 }).populate("items.productId");

  if (input.statusRuleId) {
    const rule = config.statusRules.find(
      (r) => String(r._id) === input.statusRuleId,
    );

    if (!rule) {
      throw new AppError(httpStatus.NOT_FOUND, "Status rule not found");
    }

    if (!order) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No order exists yet to preview this rule against",
      );
    }

    return buildOrderEventPayload({
      order: order.toObject() as never,
      config,
      eventName: rule.eventName,
      eventId: `${order._id}:${rule.eventName}`,
      eventTime: new Date(),
    });
  }

  const trigger = config.triggers.find((t) => t.key === input.triggerKey);

  if (!trigger) {
    throw new AppError(httpStatus.NOT_FOUND, "Trigger not found");
  }

  if (trigger.key === "checkout_success" && order) {
    return buildOrderEventPayload({
      order: order.toObject() as never,
      config,
      eventName: trigger.eventName,
      eventId: `${order._id}:${trigger.eventName}`,
      eventTime: new Date(),
    });
  }

  return buildTriggerEventPayload({
    config,
    eventName: trigger.eventName,
    eventId: "sample-event-id",
    eventTime: new Date(),
    userData: {
      client_ip_address: "203.0.113.7",
      client_user_agent: "Mozilla/5.0 (sample)",
      fbp: "fb.1.1757370000000.1234567890",
    },
    custom: { content_type: config.contentType },
    eventSourceUrl: "https://example.com/sample",
  });
};

const testConnection = async () => {
  const doc = await getConfigDocument();

  if (!doc.pixelId || !doc.accessToken) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Save a pixel ID and access token before testing the connection",
    );
  }

  const config = await getConfig();
  const eventId = `test-connection:${Date.now()}`;

  const payload = buildTriggerEventPayload({
    config,
    eventName: "PageView",
    eventId,
    eventTime: new Date(),
    userData: {
      client_ip_address: "203.0.113.7",
      client_user_agent: "DailyIt-Admin-TestConnection/1.0",
    },
  });

  // Sent inline, not queued: the admin is waiting for this answer.
  const result = await sendToMeta({
    pixelId: config.pixelId as string,
    accessToken: config.accessToken as string,
    payload,
  });

  // Written once, after the outcome is known — sendToMeta never throws, so
  // there is no window where a row sits at "queued" with no final status.
  await MetaPixelEventLog.create({
    eventName: "PageView",
    eventId,
    source: "test_connection",
    payload,
    status: result.ok ? "sent" : "dead",
    attempts: 1,
    httpStatus: result.httpStatus,
    metaResponse: result.body,
    fbtraceId: result.fbtraceId,
    errorMessage: result.errorMessage,
  });

  if (result.ok) {
    doc.tokenVerifiedAt = new Date();
    await doc.save();
  }

  return {
    ok: result.ok,
    httpStatus: result.httpStatus,
    fbtraceId: result.fbtraceId,
    errorMessage: result.errorMessage,
    response: result.body,
    testEventCode: config.testEventCode || null,
    tokenVerifiedAt: doc.tokenVerifiedAt,
  };
};

const onOrderStatusChanged = async (
  orderId: Types.ObjectId,
  newStatus: string,
): Promise<void> => {
  try {
    const config = await getConfig();

    if (!config.enabled || !config.capiEnabled) {
      return;
    }

    const rules = config.statusRules.filter(
      (rule) => rule.enabled && rule.status === newStatus,
    );

    if (!rules.length) {
      return;
    }

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) {
      return;
    }

    // Lazy import: metaPixel.queue.ts imports this service at the top level,
    // so a top-level import here would create a circular require.
    const { enqueueMetaEvent } = await import("./metaPixel.queue");

    for (const rule of rules) {
      const already = order.trackingData?.sentEvents?.find(
        (entry) => entry.eventName === rule.eventName,
      );

      // A rule never fires twice for the same order+event, even after a dead
      // send — re-sending after a permanent failure is a deliberate admin
      // action from the event log, not something a status change triggers.
      if (already) {
        continue;
      }

      const eventId = `${order._id}:${rule.eventName}`;
      const payload = buildOrderEventPayload({
        order: order.toObject() as never,
        config,
        eventName: rule.eventName,
        eventId,
        eventTime: new Date(),
      });

      // An order created before this feature existed has no identity data, so
      // Meta could never match the event. Record it instead of sending noise.
      if (!hasUsableIdentity(payload.data[0].user_data)) {
        await MetaPixelEventLog.create({
          eventName: rule.eventName,
          eventId,
          source: "status_rule",
          orderId: order._id,
          payload,
          status: "dead",
          errorMessage: "Order has no tracking data to match against",
        });
        continue;
      }

      const claim = await Order.updateOne(
        {
          _id: order._id,
          "trackingData.sentEvents.eventName": { $ne: rule.eventName },
        },
        {
          $push: {
            "trackingData.sentEvents": {
              eventName: rule.eventName,
              eventId,
              status: "queued",
              attempts: 0,
            },
          },
        },
      );

      // Losing this race means another invocation already claimed this event.
      if (claim.modifiedCount === 0) {
        continue;
      }

      let log;

      try {
        log = await MetaPixelEventLog.create({
          eventName: rule.eventName,
          eventId,
          source: "status_rule",
          orderId: order._id,
          payload,
          status: "queued",
        });

        await enqueueMetaEvent({
          logId: String(log._id),
          orderId: String(order._id),
          eventName: rule.eventName,
          eventId,
        });
      } catch (err) {
        // The claim must not outlive a failed hand-off, or the guard blocks this event forever.
        await Order.updateOne(
          { _id: order._id },
          { $pull: { "trackingData.sentEvents": { eventId } } },
        );

        if (log) {
          await MetaPixelEventLog.findByIdAndUpdate(log._id, {
            status: "dead",
            errorMessage: `Failed to enqueue after claim: ${
              err instanceof Error ? err.message : "unknown"
            }`,
          });
        }

        continue;
      }
    }
  } catch (err) {
    // Tracking must never break an order status update.
    console.log("meta pixel status rule error", err);
  }
};

// validateRequest never reassigns req.body from the zod parse result, so an
// allow-list in the schema alone would not stop unknown keys from reaching
// Meta here — the pick below is what actually enforces it.
const ALLOWED_CUSTOM_KEYS = [
  "content_ids",
  "content_type",
  "content_name",
  "content_category",
  "search_string",
  "value",
  "num_items",
  "contents",
] as const;

const pickAllowedCustom = (
  custom?: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  if (!custom) return undefined;

  const picked: Record<string, unknown> = {};
  for (const key of ALLOWED_CUSTOM_KEYS) {
    if (custom[key] !== undefined) picked[key] = custom[key];
  }
  return picked;
};

const ingestBrowserEvent = async (
  input: {
    triggerKey: string;
    eventId: string;
    orderId?: string;
    custom?: Record<string, unknown>;
    eventSourceUrl?: string;
  },
  meta: { clientIp?: string; userAgent?: string },
) => {
  const config = await getConfig();

  if (!config.enabled || !config.capiEnabled) {
    return { accepted: false, reason: "tracking disabled" };
  }

  const trigger = config.triggers.find((t) => t.key === input.triggerKey);

  // Only a trigger the admin explicitly opted into may be sent server-side.
  if (!trigger?.enabled || !trigger.sendViaCapi || !trigger.eventName) {
    return { accepted: false, reason: "trigger not enabled for CAPI" };
  }

  if (isIpExcluded(meta.clientIp, config.excludedIps)) {
    return { accepted: false, reason: "excluded ip" };
  }

  if (config.blockBots && isBotUserAgent(meta.userAgent)) {
    return { accepted: false, reason: "bot user agent" };
  }

  const order = input.orderId
    ? await Order.findById(input.orderId).populate("items.productId")
    : null;

  if (input.orderId && !order) {
    return { accepted: false, reason: "unknown order" };
  }

  const payload = order
    ? buildOrderEventPayload({
        order: order.toObject() as never,
        config,
        eventName: trigger.eventName,
        eventId: input.eventId,
        eventTime: new Date(),
      })
    : buildTriggerEventPayload({
        config,
        eventName: trigger.eventName,
        eventId: input.eventId,
        eventTime: new Date(),
        userData: {
          client_ip_address: meta.clientIp,
          client_user_agent: meta.userAgent,
        },
        custom: pickAllowedCustom(input.custom),
        eventSourceUrl: input.eventSourceUrl,
      });

  const log = await MetaPixelEventLog.create({
    eventName: trigger.eventName,
    eventId: input.eventId,
    source: "browser_backup",
    orderId: order?._id,
    triggerKey: trigger.key,
    payload,
    status: "queued",
  });

  const { enqueueMetaEvent } = await import("./metaPixel.queue");

  await enqueueMetaEvent({
    logId: String(log._id),
    orderId: order ? String(order._id) : undefined,
    eventName: trigger.eventName,
    eventId: input.eventId,
  });

  return { accepted: true };
};

const getLogs = async (query: {
  page?: string;
  limit?: string;
  status?: string;
  eventName?: string;
  source?: string;
  from?: string;
  to?: string;
}) => {
  const parsedPage = Number(query.page);
  const parsedLimit = Number(query.limit);
  const page = Math.max(Number.isFinite(parsedPage) ? parsedPage : 1, 1);
  const limit = Math.min(
    Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1),
    100,
  );

  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (query.eventName) filter.eventName = query.eventName;
  if (query.source) filter.source = query.source;

  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: new Date(query.from) } : {}),
      ...(query.to ? { $lte: new Date(query.to) } : {}),
    };
  }

  const [data, total] = await Promise.all([
    MetaPixelEventLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("orderId", "orderNumber")
      .lean(),
    MetaPixelEventLog.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
};

const retryLog = async (logId: string) => {
  const log = await MetaPixelEventLog.findById(logId);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Event log not found");
  }

  if (log.status === "sent") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This event was already accepted by Meta",
    );
  }

  await MetaPixelEventLog.findByIdAndUpdate(logId, {
    status: "queued",
    errorMessage: undefined,
  });

  if (log.orderId) {
    await Order.updateOne(
      { _id: log.orderId },
      { $set: { "trackingData.sentEvents.$[entry].status": "queued" } },
      { arrayFilters: [{ "entry.eventName": log.eventName }] },
    );
  }

  const { enqueueMetaEvent } = await import("./metaPixel.queue");

  await enqueueMetaEvent({
    logId: String(log._id),
    orderId: log.orderId ? String(log.orderId) : undefined,
    eventName: log.eventName,
    eventId: log.eventId,
  });

  return { queued: true };
};

export const MetaPixelService = {
  getConfig,
  getAdminConfig,
  getPublicConfig,
  updateConfig,
  previewPayload,
  testConnection,
  onOrderStatusChanged,
  ingestBrowserEvent,
  getLogs,
  retryLog,
};
