import { describe, it, expect, vi } from "vitest";
import { StrictMode } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import App from "./App";
import { createDemoStore } from "./lib/demo-store";

const config = {
  gtmId: "GTM-DEMO123",
  cookiebotId: "11111111-1111-4111-8111-111111111111",
  allowedHosts: ["localhost"],
};
function setup(options = {}) {
  const win = new EventTarget();
  Object.assign(win, {
    location: {
      hostname: "localhost",
      reload: vi.fn(),
      search: options.search || "",
    },
    crypto: window.crypto,
    dataLayer: [],
    performance: { getEntriesByType: () => [] },
  });
  const doc = document.implementation.createHTMLDocument();
  let cookies = "";
  const writes = [];
  Object.defineProperty(doc, "cookie", {
    get: () => cookies,
    set: (v) => {
      writes.push(v);
      cookies = v;
    },
  });
  const store = createDemoStore(win, doc, options.config ?? {});
  return { win, doc, store, writes };
}
function choose(win, statistics) {
  win.Cookiebot = {
    consent: { statistics, marketing: false, preferences: false },
  };
  win.dispatchEvent(new Event("CookiebotOnConsentReady"));
}
// Local test fixture models the imported custom tag callback; not a live GTM claim.
function simulatedTag(win) {
  const push = win.dataLayer.push.bind(win.dataLayer);
  win.dataLayer.push = (...entries) => {
    const result = push(...entries);
    for (const e of entries)
      if (
        ["purchase", "add_to_cart"].includes(e.event) &&
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
      const { store, doc, win } = setup({ config: c });
      store.connect();
      expect(doc.scripts.length).toBe(0);
      expect(win.dataLayer).toHaveLength(0);
    }
  });
  it("loads once even through StrictMode remounts and ignores obsolete URL modes", () => {
    for (const search of ["", "?mode=before", "?mode=after"]) {
      const { store, doc, win } = setup({ config, search });
      const view = render(
        <StrictMode>
          <App store={store} />
        </StrictMode>,
      );
      expect(doc.scripts.length).toBe(1);
      expect(doc.scripts[0].src).toBe(
        "https://www.googletagmanager.com/gtm.js?id=GTM-DEMO123",
      );
      expect(win.dataLayer.filter((e) => e.event === "gtm.js")).toHaveLength(1);
      view.unmount();
    }
  });
  it("removes external listeners on unmount and does not duplicate them on remount", () => {
    const { store, win } = setup();
    const stop = store.connect();
    stop();
    win.dispatchEvent(
      new CustomEvent("demo-tag-fired", { detail: "Statistics demo tag" }),
    );
    expect(store.getSnapshot().receipts).toBe(0);
    store.connect();
    win.dispatchEvent(
      new CustomEvent("demo-tag-fired", { detail: "Statistics demo tag" }),
    );
    expect(store.getSnapshot().receipts).toBe(1);
  });
});

describe("React shop and consent state", () => {
  it("shows correct quantity totals and one purchase per completed cart", async () => {
    const { store, win } = setup();
    const user = userEvent.setup();
    render(<App store={store} />);
    await user.click(screen.getByRole("button", { name: "Add to bag +" }));
    await user.click(screen.getByRole("button", { name: "Add to bag +" }));
    await user.click(screen.getByRole("button", { name: "Bag 2" }));
    expect(document.getElementById("bag-total").textContent).toBe("£36.00");
    await user.click(
      screen.getByRole("button", { name: "Place demo order →" }),
    );
    expect(document.getElementById("order-total").textContent).toBe("£36.00");
    expect(
      screen.getByRole("heading", { name: /Thank you\.\s*Your ideas await\./ }),
    ).toBeTruthy();
    act(() => store.purchase());
    let purchases = win.dataLayer.filter((e) => e.event === "purchase");
    expect(purchases).toHaveLength(1);
    expect(purchases[0].ecommerce.items[0].quantity).toBe(2);
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
    expect(purchases[0].ecommerce.transaction_id).not.toBe(
      purchases[1].ecommerce.transaction_id,
    );
    expect(document.getElementById("order-total").textContent).toBe("£18.00");
  });
  it("handles removal down to an empty cart without an empty purchase", () => {
    const { store, win } = setup();
    store.add();
    store.remove();
    store.remove();
    store.purchase();
    expect(store.getSnapshot().quantity).toBe(0);
    expect(win.dataLayer.filter((e) => e.event === "purchase")).toHaveLength(0);
  });
  it("requires receipts for tracking and labels the synchronous purchase receipt", () => {
    const { store, win } = setup();
    simulatedTag(win);
    render(
      <StrictMode>
        <App store={store} />
      </StrictMode>,
    );
    act(() => {
      choose(win, false);
      store.add();
      store.purchase();
    });
    expect(document.getElementById("action-count").textContent).toBe("2");
    expect(document.getElementById("shop-tag-count").textContent).toBe("0");
    expect(document.getElementById("order-tracking").textContent).toContain(
      "blocked",
    );
    act(() =>
      win.dispatchEvent(
        new CustomEvent("demo-tag-fired", { detail: "Statistics demo tag" }),
      ),
    );
    expect(document.getElementById("shop-tag-count").textContent).toBe("0");
    act(() => {
      choose(win, true);
      store.add();
      store.purchase();
    });
    expect(document.getElementById("action-count").textContent).toBe("4");
    expect(document.getElementById("shop-tag-count").textContent).toBe("2");
    expect(document.getElementById("order-tracking").textContent).toBe(
      "✓ Purchase tracking tag fired.",
    );
    expect(screen.getByText("purchase tracking")).toBeTruthy();
  });
  it("clears demo cookies and reloads when a granted category is withdrawn", () => {
    const { store, win, writes } = setup();
    store.connect();
    choose(win, true);
    choose(win, false);
    expect(win.location.reload).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(3);
    expect(writes.every((v) => v.includes("Max-Age=0"))).toBe(true);
  });
  it("opens articles and allows the inspector to be closed and reopened", async () => {
    const { store } = setup();
    const user = userEvent.setup();
    render(<App store={store} />);
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
    expect(document.getElementById("demo-dialog").hidden).toBe(true);
    await user.click(screen.getByRole("button", { name: "Demo controls ↗" }));
    expect(document.getElementById("demo-dialog").hidden).toBe(false);
  });
});

it("keeps the import gated and limits shop events to add_to_cart and purchase", () => {
  const c = JSON.parse(
    readFileSync("gtm/demo-basic-consent.import.json", "utf8"),
  ).containerVersion;
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
    const runs = [],
      writes = [];
    const context = {
      window: { dispatchEvent: (e) => runs.push(e) },
      document: {
        set cookie(v) {
          writes.push(v);
        },
      },
      CustomEvent: function (name, detail) {
        this.name = name;
        this.detail = detail;
      },
    };
    const script = tag.parameter
      .find((p) => p.key === "html")
      .value.slice(8, -9);
    vm.runInNewContext(script, context);
    vm.runInNewContext(script, context);
    expect(runs).toHaveLength(1);
    expect(writes).toHaveLength(1);
  }
});
