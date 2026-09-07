import type { DemoState, ConsentState } from "../domain/types";
import { useState } from "react";

function Counter({ id, value }: { id: string; value: number }) {
  return (
    <strong
      id={id}
      key={value}
      className={value ? "counter-change" : undefined}
    >
      {value}
    </strong>
  );
}
export default function Inspector({
  state,
  onClearCookies,
  onClearLog,
  getDiagnostics,
  open,
  onClose,
  onSettings,
  onWithdraw,
}: {
  state: DemoState;
  onClearCookies: () => void;
  onClearLog: () => void;
  getDiagnostics: () => string;
  open: boolean;
  onClose: () => void;
  onSettings: () => void;
  onWithdraw: () => void;
}) {
  const [diagnostics, setDiagnostics] = useState("");
  const { consent, actions, tracked, receipts, events, cookies } = state;
  return (
    <aside
      id="demo-dialog"
      className="demo-drawer"
      aria-labelledby="demo-heading"
      hidden={!open}
    >
      <div className="drawer-heading">
        <h2 id="demo-heading">Behind the banner</h2>
        <button
          id="close-demo"
          aria-label="Close demo controls"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <section className="experiment" aria-label="How to test consent">
        <span className="eyebrow">ONE SITE. YOUR CHOICE.</span>
        <p>
          Use the cookie banner to deny or allow Statistics. Add a notebook and
          place a demo order to see whether its tracking tag runs.
        </p>
      </section>
      <button
        className="button dark"
        id="demo-cookie-settings"
        disabled={!consent}
        onClick={onSettings}
      >
        Open cookie settings ↗
      </button>
      <section className="tracking-proof" aria-label="Live tracking comparison">
        <p className="proof-heading">SHOP ANALYTICS</p>
        <div
          id="tracking-gate"
          className="tracking-gate"
          role="status"
          data-state={
            !consent ? "waiting" : consent.statistics ? "allowed" : "denied"
          }
        >
          {!consent
            ? "Waiting for Cookiebot"
            : consent.statistics
              ? "✓ Tracking allowed"
              : "✕ Tracking blocked"}
        </div>
        <div className="proof-counts">
          <div className="action-count">
            <span>Shop actions</span>
            <Counter id="action-count" value={actions} />
            <small>Added to bag / ordered</small>
          </div>
          <div className="tracking-count">
            <span>Tracked actions</span>
            <Counter id="shop-tag-count" value={tracked} />
            <small>Confirmed by the demo tag</small>
          </div>
        </div>
        <p id="last-action" role="status">
          {!state.lastAction
            ? "Try Add to bag on the shop."
            : state.lastAction === "purchase"
              ? "Latest shop action: sample order placed."
              : "Latest shop action: notebook added to bag."}
        </p>
        <p id="last-tracking" role="status">
          {consent && !consent.statistics
            ? "Shopping still works. Analytics tracking is blocked."
            : state.lastTracked
              ? "✓ Shop action tracked."
              : "No shop actions tracked yet. Try Add to bag."}
        </p>
        <p className="proof-note">
          These are local demo tags, not Google or Meta deliveries. Counts reset
          on page reload.
        </p>
      </section>
      <div className="inspector">
        <div className="panel-head">
          <span className="eyebrow">BEHIND THE BANNER</span>
          <span className="live-dot">LIVE INSPECTOR</span>
        </div>
        <h2>
          Your choice.
          <br />
          The actual state.
        </h2>
        <p className="muted" id="state-description">
          This panel reads Cookiebot’s real consent state. It does not grant
          consent itself.
        </p>
        <div id="connection" className="notice" role="status">
          {state.connection}
        </div>
        <div className="states">
          {(
            [
              "necessary",
              "preferences",
              "statistics",
              "marketing",
            ] as (keyof ConsentState)[]
          ).map((key) => (
            <div key={key}>
              <span>{key[0].toUpperCase() + key.slice(1)}</span>
              <strong id={key} data-value={String(consent?.[key])}>
                {!consent ? "Unknown" : consent[key] ? "Allowed" : "Denied"}
              </strong>
            </div>
          ))}
        </div>
        <div className="cookie-readout">
          <h3>Demo cookies on this page</h3>
          <p id="demo-cookies">
            {cookies.length ? cookies.join(" · ") : "None detected."}
          </p>
          <button id="clear-demo-cookies" onClick={onClearCookies}>
            Clear demo cookies
          </button>
          <p className="fine">
            Only the three named demo cookies are shown here. Use browser tools
            to inspect all storage and network requests.
          </p>
        </div>
        <div className="log-title">
          <h3>Detailed event log</h3>
          <button id="clear" onClick={onClearLog}>
            Clear log
          </button>
        </div>
        <ol id="events" aria-live="polite">
          {!events.length && (
            <li className="empty">Waiting for your first interaction.</li>
          )}
          {events.map((event) => (
            <li
              key={event.id}
              data-kind={event.tagFired ? "tag-fired" : undefined}
            >
              <time>{event.time}</time>
              {event.tagFired && (
                <span className="tag-fired-badge">✓ Tag fired</span>
              )}
              {event.label}
            </li>
          ))}
        </ol>
        <p className="fine" id="receipt">
          Local tag receipts: {receipts || "none"}. Demo receipts are not proof
          of Analytics delivery.
        </p>
        <button
          className="text-button"
          id="withdraw"
          disabled={!consent}
          onClick={onWithdraw}
        >
          Withdraw consent
        </button>
        <details>
          <summary>Technical diagnostics</summary>
          <button
            id="refresh-diagnostics"
            onClick={() => setDiagnostics(getDiagnostics())}
          >
            Refresh diagnostics
          </button>
          <pre
            id="diagnostics"
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontSize: 12,
            }}
          >
            {diagnostics}
          </pre>
        </details>
      </div>
    </aside>
  );
}
