import { IOrder } from "../order/order.interface";
import { IMetaPixelConfig, TContentIdSource } from "./metaPixel.interface";

export type TCapiUserData = Record<string, string | string[] | undefined>;

export type TCapiEvent = {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url?: string;
  user_data: TCapiUserData;
  custom_data?: Record<string, unknown>;
};

export type TCapiPayload = {
  data: TCapiEvent[];
  test_event_code?: string;
};

type TPopulatedItem = IOrder["items"][number] & {
  productId?: { _id?: unknown; sku?: string; slug?: string };
};

const resolveContentId = (
  item: TPopulatedItem,
  source: TContentIdSource,
): string => {
  const product = item.productId;

  if (!product) {
    return "";
  }

  if (source === "sku") {
    return product.sku ?? "";
  }

  if (source === "slug") {
    return product.slug ?? "";
  }

  return String(product._id ?? product);
};

// Goods only, after discount: shipping and tax are deliberately excluded so
// reported ROAS reflects product revenue.
export const calculateOrderValue = (order: IOrder): number => {
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0,
  );

  return Math.max(itemsTotal - (order.couponDiscount?.discountValue ?? 0), 0);
};

const buildUserDataFromOrder = (order: IOrder): TCapiUserData => {
  const tracking = (
    order as never as {
      trackingData?: {
        hashed?: Record<string, string>;
        fbp?: string;
        fbc?: string;
        clientIp?: string;
        userAgent?: string;
      };
    }
  ).trackingData;

  const userData: TCapiUserData = {};
  const hashed = tracking?.hashed ?? {};

  Object.entries(hashed).forEach(([key, value]) => {
    if (value) {
      userData[key] = [value];
    }
  });

  if (tracking?.fbp) userData.fbp = tracking.fbp;
  if (tracking?.fbc) userData.fbc = tracking.fbc;
  if (tracking?.clientIp) userData.client_ip_address = tracking.clientIp;
  if (tracking?.userAgent) userData.client_user_agent = tracking.userAgent;

  return userData;
};

export const hasUsableIdentity = (userData: TCapiUserData): boolean =>
  Object.values(userData).some((value) =>
    Array.isArray(value)
      ? value.some((v) => typeof v === "string" && v.length > 0)
      : typeof value === "string" && value.length > 0,
  );

export const buildOrderEventPayload = (args: {
  order: IOrder;
  config: IMetaPixelConfig;
  eventName: string;
  eventId: string;
  eventTime: Date;
}): TCapiPayload => {
  const { order, config, eventName, eventId, eventTime } = args;

  const items = order.items as TPopulatedItem[];

  const event: TCapiEvent = {
    event_name: eventName,
    event_time: Math.floor(eventTime.getTime() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: (
      order as never as { trackingData?: { eventSourceUrl?: string } }
    ).trackingData?.eventSourceUrl,
    user_data: buildUserDataFromOrder(order),
    custom_data: {
      currency: config.currency,
      value: calculateOrderValue(order),
      order_id: order.orderNumber,
      content_type: config.contentType,
      contents: items.map((item) => ({
        id: resolveContentId(item, config.contentIdSource),
        quantity: item.quantity,
        item_price: item.finalPrice,
      })),
      content_ids: items.map((item) =>
        resolveContentId(item, config.contentIdSource),
      ),
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    },
  };

  return {
    data: [event],
    test_event_code: config.testEventCode || undefined,
  };
};

export const buildTriggerEventPayload = (args: {
  config: IMetaPixelConfig;
  eventName: string;
  eventId: string;
  eventTime: Date;
  userData: TCapiUserData;
  custom?: Record<string, unknown>;
  eventSourceUrl?: string;
}): TCapiPayload => {
  const {
    config,
    eventName,
    eventId,
    eventTime,
    userData,
    custom,
    eventSourceUrl,
  } = args;

  return {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(eventTime.getTime() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: userData,
        custom_data: { currency: config.currency, ...custom },
      },
    ],
    test_event_code: config.testEventCode || undefined,
  };
};
