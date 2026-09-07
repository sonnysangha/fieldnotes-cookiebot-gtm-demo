export const cookieNames = [
  "demo_statistics",
  "demo_marketing",
  "demo_preferences",
];
const item = {
  item_id: "DEMO-NOTEBOOK",
  item_name: "Everyday Notebook",
  price: 18,
};
export const money = (value) => `£${value.toFixed(2)}`;
export function validConfig(config, hostname) {
  return (
    /^GTM-[A-Z0-9]+$/.test(config.gtmId || "") &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      config.cookiebotId || "",
    ) &&
    Array.isArray(config.allowedHosts) &&
    config.allowedHosts.includes(hostname)
  );
}

// One store per page; React subscribes to snapshots instead of mutating DOM nodes.
export function createDemoStore(win, doc, config = {}) {
  const valid = validConfig(config, win.location.hostname);
  let state = {
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
    connection: valid
      ? "Loading Google Tag Manager…"
      : "Demo connection not configured. No external tags are loaded.",
  };
  const subscribers = new Set();
  let previous,
    activeShopEvent,
    sequence = 0,
    connections = 0;
  const update = (patch) => {
    state = { ...state, ...patch };
    subscribers.forEach((fn) => fn());
  };
  const log = (label, tagFired = false) =>
    update({
      events: [
        {
          id: ++sequence,
          time: new Date().toLocaleTimeString(),
          label,
          tagFired,
        },
        ...state.events,
      ].slice(0, 30),
    });
  const readCookies = () =>
    update({
      cookies: (doc.cookie || "")
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter((k) => cookieNames.includes(k)),
    });
  const clearCookies = () => {
    cookieNames.forEach((k) => {
      doc.cookie = `${k}=; Max-Age=0; Path=/; SameSite=Lax`;
    });
    readCookies();
  };
  win.dataLayer ||= [];
  function consent() {
    const raw = win.Cookiebot?.consent;
    if (!raw) return;
    const next = {
      necessary: true,
      preferences: !!raw.preferences,
      statistics: !!raw.statistics,
      marketing: !!raw.marketing,
    };
    update({
      consent: next,
      connection:
        "Cookiebot connected. Consent shown below comes from the banner.",
    });
    log("Consent state updated");
    if (
      previous &&
      cookieNames.some((k) => previous[k.slice(5)] && !next[k.slice(5)])
    ) {
      clearCookies();
      win.location.reload();
    }
    previous = next;
  }
  function receipt(e) {
    let label = String(e.detail);
    if (label.toLowerCase().includes("shop event")) {
      if (activeShopEvent) label = `${activeShopEvent} tracking`;
      update({
        tracked: state.tracked + 1,
        lastTracked: true,
        ...(activeShopEvent === "purchase" && state.order
          ? { order: { ...state.order, tracked: true } }
          : {}),
      });
    }
    readCookies();
    update({ receipts: state.receipts + 1 });
    log(label, true);
  }
  function emit(event, ecommerce) {
    if (event === "add_to_cart" || event === "purchase")
      update({
        actions: state.actions + 1,
        lastAction: event,
        lastTracked: false,
      });
    win.dataLayer.push({ ecommerce: null });
    // The shipped GTM custom tag reports synchronously during this push.
    activeShopEvent = event;
    try {
      win.dataLayer.push({ event, demo_mode: true, ecommerce });
    } finally {
      activeShopEvent = undefined;
    }
    log(`${event} → dataLayer`);
  }
  const consentEvents = [
    "CookiebotOnConsentReady",
    "CookiebotOnAccept",
    "CookiebotOnDecline",
  ];
  return {
    config,
    valid,
    getSnapshot: () => state,
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    connect() {
      connections++;
      if (connections === 1) {
        consentEvents.forEach((e) => win.addEventListener(e, consent));
        win.addEventListener("demo-tag-fired", receipt);
        readCookies();
        consent();
        if (valid && !doc.querySelector("script[data-fieldnotes-gtm]")) {
          win.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
          const script = doc.createElement("script");
          script.dataset.fieldnotesGtm = config.gtmId;
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`;
          script.onerror = () =>
            update({
              connection:
                "GTM was blocked or could not load. Check your connection or extension settings.",
            });
          doc.head.append(script);
        }
      }
      let disconnected = false;
      return () => {
        if (disconnected) return;
        disconnected = true;
        if (--connections === 0) {
          consentEvents.forEach((e) => win.removeEventListener(e, consent));
          win.removeEventListener("demo-tag-fired", receipt);
        }
      };
    },
    add() {
      update({ quantity: state.quantity + 1, order: null });
      emit("add_to_cart", {
        currency: "GBP",
        value: 18,
        items: [{ ...item, quantity: 1 }],
      });
    },
    remove() {
      if (!state.quantity) return;
      update({ quantity: state.quantity - 1 });
      emit("remove_from_cart", {
        currency: "GBP",
        value: 18,
        items: [{ ...item, quantity: 1 }],
      });
    },
    purchase() {
      if (!state.quantity) return;
      const quantity = state.quantity,
        id = `DEMO-${win.crypto.randomUUID()}`;
      update({
        quantity: 0,
        order: { id, quantity, total: quantity * 18, tracked: false },
      });
      emit("purchase", {
        transaction_id: id,
        currency: "GBP",
        value: quantity * 18,
        items: [{ ...item, quantity }],
      });
    },
    renew: () => win.Cookiebot?.renew(),
    withdraw: () => win.Cookiebot?.withdraw(),
    clearCookies() {
      clearCookies();
      log(
        "Demo cookies cleared; consent unchanged. Reload to repeat page-load tags.",
      );
    },
    clearLog: () => update({ events: [] }),
    diagnostics() {
      const events = win.dataLayer
        .map(
          (e) =>
            e.event ||
            (e[0] === "consent" ? { command: e[1], state: e[2] } : null),
        )
        .filter(Boolean);
      const cookies = (doc.cookie || "")
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
      const resources = win.performance
        .getEntriesByType("resource")
        .map((r) => {
          const u = new URL(r.name);
          return (
            u.hostname +
            u.pathname +
            (u.pathname.endsWith("/gtm.js")
              ? "?id=" + u.searchParams.get("id")
              : "")
          );
        });
      return JSON.stringify(
        {
          containerId: config.gtmId,
          events,
          cookies,
          resources: [...new Set(resources)],
        },
        null,
        2,
      );
    },
  };
}
