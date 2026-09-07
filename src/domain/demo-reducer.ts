import type { DemoAction, DemoState, LogEntry } from "./types";
export function initialDemoState(connection: string): DemoState {
  return {
    configured: false,
    quantity: 0,
    order: null,
    actions: 0,
    tracked: 0,
    receipts: 0,
    events: [],
    cookies: [],
    consent: null,
    lastAction: "",
    lastTracked: false,
    connection,
  };
}

function record(state: DemoState, entry: LogEntry): DemoState {
  return { ...state, events: [entry, ...state.events].slice(0, 30) };
}

// Pure state transitions: no scripts, browser globals, timestamps or side effects.
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "shop-action": {
      const { event, entry, order } = action;
      const isTrackedAction = event === "add_to_cart" || event === "purchase";
      const cart =
        event === "add_to_cart"
          ? { quantity: state.quantity + 1, order: null }
          : event === "purchase"
            ? { quantity: 0, order: order ?? null }
            : { quantity: Math.max(0, state.quantity - 1) };
      return record(
        {
          ...state,
          ...cart,
          ...(isTrackedAction
            ? {
                actions: state.actions + 1,
                lastAction: event,
                lastTracked: false,
              }
            : {}),
        },
        entry,
      );
    }
    case "consent":
      return record(
        { ...state, consent: action.consent, connection: action.connection },
        action.entry,
      );
    case "receipt": {
      const { receipt, entry } = action;
      const isShop =
        receipt.event === "add_to_cart" || receipt.event === "purchase";
      const matchesOrder =
        receipt.event === "purchase" &&
        receipt.transactionId === state.order?.id;
      return record(
        {
          ...state,
          receipts: state.receipts + 1,
          cookies: action.cookies,
          ...(isShop ? { tracked: state.tracked + 1, lastTracked: true } : {}),
          ...(matchesOrder && state.order
            ? { order: { ...state.order, tracked: true } }
            : {}),
        },
        entry,
      );
    }
    case "connection":
      return {
        ...state,
        connection: action.message,
        configured: action.configured ?? state.configured,
      };
    case "cookies":
      return { ...state, cookies: action.cookies };
    case "log":
      return record(state, action.entry);
    case "clear-log":
      return { ...state, events: [] };
    default:
      return state;
  }
}
