import { Types } from "mongoose";

export type TContentIdSource = "sku" | "_id" | "slug";

export type TSentEventStatus = "queued" | "sent" | "failed" | "dead";

export type TEventSource =
  "browser_backup" | "status_rule" | "manual" | "test_connection";

export interface IMetaPixelTrigger {
  key: string;
  eventName: string;
  isCustomEvent: boolean;
  enabled: boolean;
  sendViaBrowser: boolean;
  sendViaCapi: boolean;
}

export interface IMetaPixelStatusRule {
  _id?: Types.ObjectId;
  status: string;
  eventName: string;
  isCustomEvent: boolean;
  enabled: boolean;
}

export interface IMetaPixelConfig {
  pixelId?: string;
  datasetId?: string;
  accessToken?: string;
  testEventCode?: string;
  tokenVerifiedAt?: Date;
  tokenExpiresAt?: Date;
  enabled: boolean;
  capiEnabled: boolean;
  currency: string;
  contentIdSource: TContentIdSource;
  contentType: string;
  excludedIps: string[];
  blockBots: boolean;
  triggers: IMetaPixelTrigger[];
  statusRules: IMetaPixelStatusRule[];
  lastUpdatedBy?: Types.ObjectId;
}

export interface IMetaPixelEventLog {
  eventName: string;
  eventId: string;
  source: TEventSource;
  orderId?: Types.ObjectId;
  triggerKey?: string;
  payload: Record<string, unknown>;
  status: TSentEventStatus;
  attempts: number;
  httpStatus?: number;
  metaResponse?: Record<string, unknown>;
  fbtraceId?: string;
  errorMessage?: string;
}

export interface IOrderSentEvent {
  eventName: string;
  eventId: string;
  status: TSentEventStatus;
  attempts: number;
  sentAt?: Date;
  fbtraceId?: string;
  errorMessage?: string;
}

export interface IOrderTrackingData {
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
  eventSourceUrl?: string;
  hashed?: {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    ct?: string;
    st?: string;
    zp?: string;
    country?: string;
    external_id?: string;
  };
  sentEvents: IOrderSentEvent[];
}
