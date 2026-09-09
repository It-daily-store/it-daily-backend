import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import Order from "../order/order.model";
import { decryptToken, encryptToken, maskToken } from "./metaPixel.crypto";
import { isIpExcluded } from "./metaPixel.identity";
import { BACKEND_VISIBLE_KEYS, TRIGGER_REGISTRY } from "./metaPixel.constants";
import { IMetaPixelConfig } from "./metaPixel.interface";
import MetaPixelConfig from "./metaPixel.model";
import {
  buildOrderEventPayload,
  buildTriggerEventPayload,
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

export const MetaPixelService = {
  getConfig,
  getAdminConfig,
  getPublicConfig,
  updateConfig,
  previewPayload,
};
