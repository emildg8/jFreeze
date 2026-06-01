import type { ConnectorOrder } from "@/connectors/types";
import type { StoreId } from "@/connectors/types";

export type SourceChannel = "email" | "sms" | "imap";

export interface StoreSourceCatalogEntry {
  id: string;
  name: string;
  storeId: string;
  emailFrom: string[];
  emailSubject: string[];
  smsKeywords: string[];
}

export interface StoreChannelPrefs {
  enabled: boolean;
  email: boolean;
  sms: boolean;
}

export type StoreConnectionsMap = Record<string, StoreChannelPrefs>;

export interface ParsedSourceImport {
  storeId: StoreId;
  storeName: string;
  channel: SourceChannel;
  confidence: "high" | "medium" | "low";
  orders: ConnectorOrder[];
  warnings?: string[];
}

export interface ImapConfig {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  mailbox: string;
  /** Только письма за N дней */
  sinceDays: number;
  /** 0 = только вручную; 6 / 12 / 24 — авто при открытии приложения и cron */
  autoSyncIntervalHours: number;
}

export const DEFAULT_IMAP_CONFIG: ImapConfig = {
  enabled: false,
  host: "imap.gmail.com",
  port: 993,
  user: "",
  password: "",
  tls: true,
  mailbox: "INBOX",
  sinceDays: 30,
  autoSyncIntervalHours: 0,
};
