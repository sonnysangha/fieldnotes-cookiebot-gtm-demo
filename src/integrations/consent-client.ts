import type {
  ConsentState,
  DemoConfig,
  ShopEvent,
  TagReceipt,
} from "../domain/types";
import type { ecommerceItem } from "../domain/shop";

type Ecommerce = ReturnType<typeof ecommerceItem> & { transaction_id?: string };
type LayerEntry =
  | {
      event?: string;
      ecommerce?: Ecommerce | null;
      demo_mode?: boolean;
      "gtm.start"?: number;
    }
  | IArguments;
export interface ConsentWindow extends EventTarget {
  location: Pick<Location, "hostname" | "reload">;
  crypto: Pick<Crypto, "randomUUID">;
  performance: Pick<Performance, "getEntriesByType">;
  dataLayer?: LayerEntry[];
  Cookiebot?: {
    consent: Partial<ConsentState>;
    renew: () => void;
    withdraw: () => void;
  };
}
interface Listeners {
  onConsent: (consent: ConsentState) => void;
  onReceipt: (receipt: TagReceipt, cookies: string[]) => void;
  onCookies: (cookies: string[]) => void;
}
interface DeclarationRecord {
  script: HTMLScriptElement;
  status: string;
  listeners: Set<(status: string) => void>;
}
export const cookieNames = [
  "demo_statistics",
  "demo_marketing",
  "demo_preferences",
];
const consentEvents = [
  "CookiebotOnConsentReady",
  "CookiebotOnAccept",
  "CookiebotOnDecline",
];

export function validConfig(config: Partial<DemoConfig>, hostname: string) {
  return (
    /^GTM-[A-Z0-9]+$/.test(config.gtmId || "") &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      config.cookiebotId || "",
    ) &&
    Array.isArray(config.allowedHosts) &&
    config.allowedHosts.includes(hostname)
  );
}

/** Browser boundary for GTM/Cookiebot. It owns no cart state or React UI. */
export function createConsentClient(
  win: ConsentWindow,
  doc: Document,
  config: Partial<DemoConfig> = {},
) {
  const valid = validConfig(config, win.location.hostname);
  const initialConnection = valid
    ? "Loading Google Tag Manager…"
    : "Demo connection not configured. No external tags are loaded.";
  let activeEvent: { event: ShopEvent; transactionId?: string } | undefined;
  const declarations = new WeakMap<HTMLElement, DeclarationRecord>();
  const dataLayer = (win.dataLayer ??= []);

  function readCookies() {
    return (doc.cookie || "")
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter((name) => cookieNames.includes(name));
  }
  function clearCookies() {
    for (const name of cookieNames)
      doc.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    return readCookies();
  }
  function readConsent() {
    const raw = win.Cookiebot?.consent;
    return raw
      ? {
          necessary: true,
          preferences: !!raw.preferences,
          statistics: !!raw.statistics,
          marketing: !!raw.marketing,
        }
      : null;
  }
  function connect({ onConsent, onReceipt, onCookies }: Listeners) {
    let previous: ConsentState | null = null;
    let reloading = false;
    function consentChanged() {
      const next = readConsent();
      if (!next || JSON.stringify(next) === JSON.stringify(previous)) return;
      const revoked =
        previous &&
        cookieNames.some(
          (name) =>
            previous?.[name.slice(5) as keyof ConsentState] &&
            !next[name.slice(5) as keyof ConsentState],
        );
      previous = next;
      onConsent(next);
      if (revoked && !reloading) {
        // Demo policy: unload already initialized scripts after withdrawing a grant.
        // GTM's consent gate stops future firing, but cannot undo executed scripts.
        reloading = true;
        onCookies(clearCookies());
        win.location.reload();
      }
    }
    function tagFired(event: Event) {
      const label = String((event as CustomEvent<unknown>).detail);
      // The imported Custom HTML shop tag dispatches its receipt inside dataLayer.push.
      const shopEvent = /shop event/i.test(label) ? activeEvent : null;
      onReceipt(
        {
          label: shopEvent ? `${shopEvent.event} tracking` : label,
          event: shopEvent?.event,
          transactionId: shopEvent?.transactionId,
        },
        readCookies(),
      );
    }
    consentEvents.forEach((name) => win.addEventListener(name, consentChanged));
    win.addEventListener("demo-tag-fired", tagFired);
    onCookies(readCookies());
    consentChanged();

    // Next Script owns the script element. Initialize once before React renders it.
    if (
      valid &&
      !dataLayer.some((entry) => "event" in entry && entry.event === "gtm.js")
    ) {
      dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    }
    return () => {
      consentEvents.forEach((name) =>
        win.removeEventListener(name, consentChanged),
      );
      win.removeEventListener("demo-tag-fired", tagFired);
    };
  }

  return {
    valid,
    initialConnection,
    connect,
    clearCookies,
    createId: () => `DEMO-${win.crypto.randomUUID()}`,
    renew: () => win.Cookiebot?.renew(),
    withdraw: () => win.Cookiebot?.withdraw(),
    emit(event: ShopEvent, ecommerce: Ecommerce) {
      dataLayer.push({ ecommerce: null });
      activeEvent = { event, transactionId: ecommerce.transaction_id };
      try {
        dataLayer.push({ event, demo_mode: true, ecommerce });
      } finally {
        activeEvent = undefined;
      }
    },
    mountDeclaration(host: HTMLElement, onStatus: (status: string) => void) {
      if (!valid) return () => {};
      // Cookiebot renders into this dedicated host, never into React-owned children.
      let record = declarations.get(host);
      if (!record) {
        const script = doc.createElement("script");
        script.id = "CookieDeclaration";
        script.async = true;
        script.src = `https://consent.cookiebot.com/${config.cookiebotId}/cd.js`;
        record = {
          script,
          status: "Loading the Cookiebot declaration…",
          listeners: new Set(),
        };
        const notify = (status: string) => {
          record!.status = status;
          record!.listeners.forEach((listener) => listener(status));
        };
        script.addEventListener("load", () => notify(""), { once: true });
        script.addEventListener(
          "error",
          () =>
            notify(
              "The declaration could not be loaded. Check the domain registration and network.",
            ),
          { once: true },
        );
        declarations.set(host, record);
        host.append(script);
      }
      record.listeners.add(onStatus);
      onStatus(record.status);
      return () => record.listeners.delete(onStatus);
    },
    diagnostics() {
      const events = dataLayer
        .map(
          (e) =>
            ("event" in e ? e.event : undefined) ||
            ("0" in e && e[0] === "consent"
              ? { command: e[1], state: e[2] }
              : null),
        )
        .filter(Boolean);
      const cookies = (doc.cookie || "")
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean);
      const resources = win.performance
        .getEntriesByType("resource")
        .flatMap((resource) => {
          try {
            const url = new URL(resource.name);
            return [
              url.hostname +
                url.pathname +
                (url.pathname.endsWith("/gtm.js")
                  ? "?id=" + url.searchParams.get("id")
                  : ""),
            ];
          } catch {
            return [];
          }
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

export type ConsentClient = ReturnType<typeof createConsentClient>;
