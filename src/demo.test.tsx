import { describe, it, expect, vi } from "vitest";
import { StrictMode, type ReactNode } from "react";
import { render, renderHook, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ShopApp from "./App";
import DemoProvider from "./components/DemoProvider";
import GtmLoader from "./components/GtmLoader";
import Storefront from "./components/Storefront";
import type { DemoConfig } from "./domain/types";
import type {
  ConsentClient,
  ConsentWindow,
} from "./integrations/consent-client";
import type { ecommerceItem } from "./domain/shop";
import { createConsentClient } from "./integrations/consent-client";
import { useDemo } from "./hooks/useDemo";

// Mirror the root layout: loader and page share one persistent provider.
function App({
  client,
  config,
  children,
}: {
  client: ConsentClient;
  config?: DemoConfig;
  children: ReactNode;
}) {
  return (
    <DemoProvider client={client} config={config}>
      {config && <GtmLoader gtmId={config.gtmId} />}
      <ShopApp>{children}</ShopApp>
    </DemoProvider>
  );
}

// Next Script is verified as a declarative boundary here; live browser tests
// below the README's walkthrough verify the actual script execution.
vi.mock("next/script", () => ({
  default: ({
    id,
    src,
    strategy,
  }: {
    id: string;
    src: string;
    strategy: string;
  }) => <span id={id} data-src={src} data-strategy={strategy} />,
}));

const config = {
  gtmId: "GTM-DEMO123",
  cookiebotId: "11111111-1111-4111-8111-111111111111",
  allowedHosts: ["localhost"],
};
function setup(
  options: { search?: string; config?: Partial<DemoConfig> } = {},
) {
  const win = Object.assign(new EventTarget(), {
    location: {
      hostname: "localhost",
      reload: vi.fn(),
      search: options.search || "",
    },
    crypto: window.crypto,
    dataLayer: [] as {
      event?: string;
      ecommerce?: ReturnType<typeof ecommerceItem> & {
        transaction_id?: string;
      };
    }[],
    Cookiebot: undefined as ConsentWindow["Cookiebot"],
    performance: { getEntriesByType: () => [] },
  });
  const doc = document.implementation.createHTMLDocument();
  let cookies = "";
  const writes: string[] = [];
  Object.defineProperty(doc, "cookie", {
    get: () => cookies,
    set: (v) => {
      writes.push(v);
      cookies = v;
    },
  });
  const client = createConsentClient(win, doc, options.config ?? {});
  return { win, doc, client, writes };
}
function choose(win: ReturnType<typeof setup>["win"], statistics: boolean) {
  win.Cookiebot = {
    consent: { statistics, marketing: false, preferences: false },
    renew: vi.fn(),
    withdraw: vi.fn(),
  };
  win.dispatchEvent(new Event("CookiebotOnConsentReady"));
}
// Local test fixture models the imported custom tag callback; not a live GTM claim.
function simulatedTag(win: ReturnType<typeof setup>["win"]) {
  const push = win.dataLayer.push.bind(win.dataLayer);
  win.dataLayer.push = (...entries) => {
    const result = push(...entries);
    for (const e of entries)
      if (
        ["purchase", "add_to_cart"].includes(e.event ?? "") &&
        win.Cookiebot?.consent.statistics
      ) {
        win.dispatchEvent(
          new CustomEvent("demo-tag-fired", { detail: "Consented shop event" }),
        );
      }
    return result;
  };
}

describe("single-container lifecycle", () => {
  it("fails closed without IDs or with an unapproved hostname", () => {
    for (const c of [
      {},
      { ...config, allowedHosts: ["elsewhere.com"] },
      { ...config, cookiebotId: "" },
      { ...config, gtmId: "" },
    ]) {
      const { client, doc, win } = setup({ config: c });
      client.connect({
        onConsent: vi.fn(),
        onReceipt: vi.fn(),
        onCookies: vi.fn(),
      });
      expect(doc.scripts.length).toBe(0);
      expect(win.dataLayer).toHaveLength(0);
    }
  });
  it("loads once even through StrictMode remounts and ignores obsolete URL modes", () => {
    for (const search of ["", "?mode=before", "?mode=after"]) {
      const { client, doc, win } = setup({ config, search });
      const view = render(
        <StrictMode>
          <App client={client}>
            <Storefront />
          </App>
        </StrictMode>,
      );
      expect(doc.scripts.length).toBe(0); // Next Script owns insertion, never the adapter.
      expect(win.dataLayer.filter((e) => e.event === "gtm.js")).toHaveLength(1);
      view.unmount();
    }
  });
  it("renders one Next Script after host validation, with afterInteractive loading", () => {
    const { client, win } = setup({ config });
    const view = render(
      <StrictMode>
        <App client={client} config={config}>
          <Storefront />
        </App>
      </StrictMode>,
    );
    const scripts = document.querySelectorAll("#fieldnotes-gtm");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute("data-src")).toBe(
      "https://www.googletagmanager.com/gtm.js?id=GTM-DEMO123",
    );
    expect(scripts[0].getAttribute("data-strategy")).toBe("afterInteractive");
    expect(win.dataLayer.filter((e) => e.event === "gtm.js")).toHaveLength(1);
    view.unmount();
    const denied = setup({ config: { ...config, allowedHosts: [] } });
    render(
      <App client={denied.client} config={config}>
        <Storefront />
      </App>,
    );
    expect(document.querySelectorAll("#fieldnotes-gtm")).toHaveLength(0);
  });
  it("keeps the loader and SDK connection alive when the page remounts", () => {
    const { client, win } = setup({ config });
    const connect = vi.spyOn(client, "connect");
    const tree = (pageKey: string) => (
      <DemoProvider client={client} config={config}>
        <GtmLoader gtmId={config.gtmId} />
        <ShopApp key={pageKey}>
          <Storefront />
        </ShopApp>
      </DemoProvider>
    );
    const view = render(tree("first-page"));
    const script = document.querySelector("#fieldnotes-gtm");
    act(() => choose(win, true));
    view.rerender(tree("second-page"));
    expect(document.querySelector("#fieldnotes-gtm")).toBe(script);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(win.dataLayer.filter((e) => e.event === "gtm.js")).toHaveLength(1);
    expect(
      screen.getByText(
        "Cookiebot connected. Consent shown below comes from the banner.",
      ),
    ).toBeTruthy();
  });
  it("removes external listeners on unmount and does not duplicate them on remount", () => {
    const { client, win } = setup();
    const onReceipt = vi.fn();
    const handlers = {
      onConsent: vi.fn(),
      onReceipt,
      onCookies: vi.fn(),
    };
    const stop = client.connect(handlers);
    stop();
    win.dispatchEvent(
      new CustomEvent("demo-tag-fired", { detail: "Statistics demo tag" }),
    );
    expect(onReceipt).not.toHaveBeenCalled();
    const stopAgain = client.connect(handlers);
    win.dispatchEvent(
      new CustomEvent("demo-tag-fired", { detail: "Statistics demo tag" }),
    );
    expect(onReceipt).toHaveBeenCalledTimes(1);
    stopAgain();
  });
});

describe("external SDK lifecycle", () => {
  it("reuses the declaration script and unsubscribes React callbacks", () => {
    const { client, doc } = setup({ config });
    const host = doc.createElement("div");
    const oldStatus = vi.fn();
    const stop = client.mountDeclaration(host, oldStatus);
    expect(host.querySelectorAll("script")).toHaveLength(1);
    stop();
    oldStatus.mockClear();
    const status = vi.fn();
    const stopAgain = client.mountDeclaration(host, status);
    expect(host.querySelectorAll("script")).toHaveLength(1);
    host.firstChild!.dispatchEvent(new Event("load"));
    expect(oldStatus).not.toHaveBeenCalled();
    expect(status).toHaveBeenLastCalledWith("");
    stopAgain();
  });
});

describe("React shop and consent state", () => {
  it("shows correct quantity totals and one purchase per completed cart", async () => {
    const { client, win } = setup();
    const user = userEvent.setup();
    render(
      <App client={client}>
        <Storefront />
      </App>,
    );
    await user.click(screen.getByRole("button", { name: "Add to bag +" }));
    await user.click(screen.getByRole("button", { name: "Add to bag +" }));
    await user.click(screen.getByRole("button", { name: "Bag 2" }));
    expect(document.getElementById("bag-total")!.textContent).toBe("£36.00");
    await user.click(
      screen.getByRole("button", { name: "Place demo order →" }),
    );
    expect(document.getElementById("order-total")!.textContent).toBe("£36.00");
    expect(
      screen.getByRole("heading", { name: /Thank you\.\s*Your ideas await\./ }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Place demo order →" }),
    ).toBeNull();
    let purchases = win.dataLayer.filter((e) => e.event === "purchase");
    expect(purchases).toHaveLength(1);
    expect(purchases[0].ecommerce!.items[0].quantity).toBe(2);
    await user.click(
      screen.getByRole("button", { name: "Continue shopping ↗" }),
    );
    await user.click(screen.getByRole("button", { name: "Add to bag +" }));
    await user.click(screen.getByRole("button", { name: "Bag 1" }));
    await user.click(
      screen.getByRole("button", { name: "Place demo order →" }),
    );
    purchases = win.dataLayer.filter((e) => e.event === "purchase");
    expect(purchases).toHaveLength(2);
    expect(purchases[0].ecommerce!.transaction_id).not.toBe(
      purchases[1].ecommerce!.transaction_id,
    );
    expect(document.getElementById("order-total")!.textContent).toBe("£18.00");
  });
  it("handles removal down to an empty cart without an empty purchase", () => {
    const { client, win } = setup();
    const { result } = renderHook(() => useDemo(client));
    act(() => result.current.add());
    act(() => result.current.remove());
    act(() => result.current.remove());
    act(() => result.current.purchase());
    expect(result.current.state.quantity).toBe(0);
    expect(win.dataLayer.filter((e) => e.event === "purchase")).toHaveLength(0);
  });
  it("prevents repeated submission before React commits the order", () => {
    const { client, win } = setup();
    const { result } = renderHook(() => useDemo(client));
    act(() => result.current.add());
    act(() => {
      result.current.purchase();
      result.current.purchase();
    });
    expect(win.dataLayer.filter((e) => e.event === "purchase")).toHaveLength(1);
  });
  it("requires receipts for tracking and correlates the purchase receipt", () => {
    const { client, win } = setup();
    simulatedTag(win);
    const { result } = renderHook(() => useDemo(client), {
      wrapper: StrictMode,
    });
    act(() => choose(win, false));
    act(() => result.current.add());
    act(() => result.current.purchase());
    expect(result.current.state.actions).toBe(2);
    expect(result.current.state.tracked).toBe(0);
    expect(result.current.state.order?.tracked).toBe(false);
    act(() =>
      win.dispatchEvent(
        new CustomEvent("demo-tag-fired", { detail: "Statistics demo tag" }),
      ),
    );
    expect(result.current.state.tracked).toBe(0);
    act(() => choose(win, true));
    act(() => result.current.add());
    act(() => result.current.purchase());
    expect(result.current.state.actions).toBe(4);
    expect(result.current.state.tracked).toBe(2);
    expect(result.current.state.order?.tracked).toBe(true);
    expect(
      result.current.state.events.some(
        (e) => e.label === "purchase tracking" && e.tagFired,
      ),
    ).toBe(true);
  });
  it("clears demo cookies and reloads when a granted category is withdrawn", () => {
    const { client, win, writes } = setup();
    client.connect({
      onConsent: vi.fn(),
      onReceipt: vi.fn(),
      onCookies: vi.fn(),
    });
    choose(win, true);
    choose(win, false);
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(3);
    expect(writes.every((v) => v.includes("Max-Age=0"))).toBe(true);
  });
  it("opens articles and allows the inspector to be closed and reopened", async () => {
    const { client } = setup();
    const user = userEvent.setup();
    render(
      <App client={client}>
        <Storefront />
      </App>,
    );
    await user.click(screen.getByRole("button", { name: "About this shop" }));
    expect(
      screen.getByRole("heading", {
        name: "A small shop, made for a demonstration.",
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Close article" }));
    await user.click(
      screen.getByRole("button", { name: "Close demo controls" }),
    );
    expect(document.getElementById("demo-dialog")!.hasAttribute("hidden")).toBe(
      true,
    );
    expect(document.activeElement?.id).toBe("open-demo");
    expect(document.body.className).toBe("");
    await user.click(screen.getByRole("button", { name: "Demo controls ↗" }));
    expect(document.getElementById("demo-dialog")!.hasAttribute("hidden")).toBe(
      false,
    );
  });
});

it("keeps the import gated and limits shop events to add_to_cart and purchase", () => {
  const c = JSON.parse(
    readFileSync("gtm/demo-basic-consent.import.json", "utf8"),
  ).containerVersion as {
    tag: {
      name: string;
      type: string;
      consentSettings: { consentStatus: string };
      tagFiringOption: string;
      parameter: { key: string; value: string }[];
    }[];
    trigger: { name: string }[];
  };
  expect(c.tag).toHaveLength(5);
  expect(
    c.tag.filter((t) => t.consentSettings.consentStatus === "NEEDED"),
  ).toHaveLength(4);
  expect(
    c.tag.every((t) => t.type === "html" || t.name === "Cookiebot - Demo CMP"),
  ).toBe(true);
  expect(
    JSON.stringify(c.trigger.find((t) => t.name === "Demo - Shop Events")),
  ).toContain("^(add_to_cart|purchase)$");
  for (const tag of c.tag.filter((t) =>
    /Demo - (Statistics|Marketing|Preferences) receipt/.test(t.name),
  )) {
    expect(tag.tagFiringOption).toBe("ONCE_PER_EVENT");
    const runs: unknown[] = [],
      writes: string[] = [];
    const context = {
      window: { dispatchEvent: (e: unknown) => runs.push(e) },
      document: {
        set cookie(v: string) {
          writes.push(v);
        },
      },
      CustomEvent: class {
        constructor(
          public name: string,
          public detail: unknown,
        ) {}
      },
    };
    const script = tag.parameter
      .find((p) => p.key === "html")!
      .value.slice(8, -9);
    vm.runInNewContext(script, context);
    vm.runInNewContext(script, context);
    expect(runs).toHaveLength(1);
    expect(writes).toHaveLength(1);
  }
});
