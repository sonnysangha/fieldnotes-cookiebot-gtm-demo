import {
  createConsentClient,
  type ConsentClient,
} from "../integrations/consent-client";
import type { DemoConfig, Order, ShopEvent } from "../domain/types";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { demoReducer, initialDemoState } from "../domain/demo-reducer";
import { cartValue, ecommerceItem } from "../domain/shop";

function entry(label: string, tagFired = false) {
  return {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString(),
    label,
    tagFired,
  };
}

/** React owns application state; effects only subscribe to the external SDK. */
export function useDemo(client?: ConsentClient, config?: DemoConfig) {
  const connection = useRef<ConsentClient | null>(null);
  const [state, dispatch] = useReducer(
    demoReducer,
    client?.initialConnection ?? "Connecting to Cookiebot…",
    initialDemoState,
  );
  const submitted = useRef(false);

  useEffect(() => {
    const sdk = client ?? createConsentClient(window, document, config);
    connection.current = sdk;
    dispatch({
      type: "connection",
      message: sdk.initialConnection,
      configured: sdk.valid,
    });
    return sdk.connect({
      onConsent: (consent) =>
        dispatch({
          type: "consent",
          consent,
          connection:
            "Cookiebot connected. Consent shown below comes from the banner.",
          entry: entry("Consent state updated"),
        }),
      onReceipt: (receipt, cookies) =>
        dispatch({
          type: "receipt",
          receipt,
          cookies,
          entry: entry(receipt.label, true),
        }),
      onCookies: (cookies) => dispatch({ type: "cookies", cookies }),
    });
  }, [client, config]);

  const mountDeclaration = useCallback(
    (host: HTMLElement, onStatus: (status: string) => void) => {
      return connection.current?.mountDeclaration(host, onStatus);
    },
    [],
  );

  function emit(
    event: ShopEvent,
    ecommerce: ReturnType<typeof ecommerceItem> & { transaction_id?: string },
    order?: Order,
  ) {
    // Queue the shop transition first so a synchronous GTM receipt can match it.
    dispatch({
      type: "shop-action",
      event,
      order,
      entry: entry(`${event} → dataLayer`),
    });
    connection.current?.emit(event, ecommerce);
  }

  return {
    state,
    mountDeclaration,
    renew: () => connection.current?.renew(),
    withdraw: () => connection.current?.withdraw(),
    diagnostics: () => connection.current?.diagnostics() ?? "Connecting…",
    scriptFailed: () =>
      dispatch({
        type: "connection",
        message:
          "GTM was blocked or could not load. Check your connection or extension settings.",
      }),
    add() {
      submitted.current = false;
      emit("add_to_cart", ecommerceItem(1));
    },
    remove() {
      if (state.quantity) emit("remove_from_cart", ecommerceItem(1));
    },
    purchase() {
      if (!state.quantity || submitted.current) return;
      submitted.current = true;
      const id = connection.current?.createId();
      if (!id) return;
      emit(
        "purchase",
        { ...ecommerceItem(state.quantity), transaction_id: id },
        {
          id,
          quantity: state.quantity,
          total: cartValue(state.quantity),
          tracked: false,
        },
      );
    },
    clearCookies() {
      dispatch({
        type: "cookies",
        cookies: connection.current?.clearCookies() ?? [],
      });
      dispatch({
        type: "log",
        entry: entry(
          "Demo cookies cleared; consent unchanged. Reload to repeat page-load tags.",
        ),
      });
    },
    clearLog: () => dispatch({ type: "clear-log" }),
  };
}
