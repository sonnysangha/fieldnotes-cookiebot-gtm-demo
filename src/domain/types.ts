export interface DemoConfig {
  gtmId: string;
  cookiebotId: string;
  allowedHosts: string[];
}
export interface ConsentState {
  necessary: boolean;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}
export type ShopEvent = "add_to_cart" | "remove_from_cart" | "purchase";
export interface Order {
  id: string;
  quantity: number;
  total: number;
  tracked: boolean;
}
export interface LogEntry {
  id: string;
  time: string;
  label: string;
  tagFired: boolean;
}
export interface TagReceipt {
  label: string;
  event?: ShopEvent;
  transactionId?: string;
}
export interface DemoState {
  quantity: number;
  order: Order | null;
  actions: number;
  tracked: number;
  receipts: number;
  events: LogEntry[];
  cookies: string[];
  consent: ConsentState | null;
  lastAction: ShopEvent | "";
  lastTracked: boolean;
  connection: string;
  configured: boolean;
}
export type DemoAction =
  | { type: "shop-action"; event: ShopEvent; entry: LogEntry; order?: Order }
  | {
      type: "consent";
      consent: ConsentState;
      connection: string;
      entry: LogEntry;
    }
  | { type: "receipt"; receipt: TagReceipt; cookies: string[]; entry: LogEntry }
  | { type: "connection"; message: string; configured?: boolean }
  | { type: "cookies"; cookies: string[] }
  | { type: "log"; entry: LogEntry }
  | { type: "clear-log" };
