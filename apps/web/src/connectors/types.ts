export type StoreId =
  | "demo"
  | "manual"
  | "csv"
  | "receipt"
  | "ozon"
  | "samokat"
  | "pyaterochka"
  | "perekrestok"
  | "wildberries"
  | "yandex_lavka"
  | "magnit";

export type ConnectorAvailability = "active" | "beta" | "planned";

export interface ConnectorOrderItem {
  name: string;
  qty: number;
  unit: string;
  category?: string;
}

export interface ConnectorOrder {
  externalId: string;
  orderedAt: Date;
  totalRub?: number;
  items: ConnectorOrderItem[];
}

export interface ConnectResult {
  success: boolean;
  message: string;
}

export interface StoreConnector {
  id: StoreId;
  displayName: string;
  availability: ConnectorAvailability;
  connect(config?: Record<string, string>): Promise<ConnectResult>;
  syncOrders(since: Date): Promise<ConnectorOrder[]>;
}
