import { useEffect, useRef } from "react";
import Dialog from "./Dialog";
import { money } from "../lib/demo-store";

export default function Bag({ state, store, open, onClose }) {
  const { quantity, order, consent } = state;
  const thanks = useRef(null);
  useEffect(() => {
    if (order && open) thanks.current?.focus();
  }, [order?.id, open]);
  return (
    <Dialog
      id="bag-dialog"
      className="drawer"
      aria-labelledby="bag-heading"
      open={open}
      onClose={onClose}
    >
      <div className="drawer-heading">
        <h2 id="bag-heading">{order ? "Order confirmed" : "Your bag"}</h2>
        <button onClick={onClose} aria-label="Close bag">
          ×
        </button>
      </div>
      {order ? (
        <section id="order-confirmation" aria-labelledby="order-thanks">
          <span className="order-check">✓</span>
          <p className="eyebrow">SAMPLE ORDER COMPLETE</p>
          <h3 id="order-thanks" tabIndex={-1} ref={thanks}>
            Thank you.
            <br />
            Your ideas await.
          </h3>
          <p id="order-items">
            {order.quantity} Everyday Notebook{order.quantity > 1 ? "s" : ""} ·
            Sage · £18 each
          </p>
          <p className="bag-total">
            Order total <strong id="order-total">{money(order.total)}</strong>
          </p>
          <p className="order-reference" id="order-reference">
            Order reference: {order.id}
          </p>
          <p id="order-tracking" className="notice" role="status">
            {order.tracked
              ? "✓ Purchase tracking tag fired."
              : consent?.statistics
                ? "Order complete. Waiting for a tracking receipt."
                : "Order complete. Purchase tracking is blocked by your consent choice."}
          </p>
          <p className="fine">
            This was a demonstration. No payment was taken and no product will
            be shipped.
          </p>
          <button className="button dark" onClick={onClose}>
            Continue shopping <span>↗</span>
          </button>
        </section>
      ) : (
        <div id="bag-contents">
          <div className="bag-line">
            <div className="mini-book">fieldnotes</div>
            <div>
              <h3>The Everyday Notebook</h3>
              <p>Sage / £18 each</p>
              <p id="cart" role="status">
                {quantity
                  ? `${quantity} notebook${quantity > 1 ? "s" : ""} · ${money(quantity * 18)}`
                  : "Your bag is empty."}
              </p>
              <button
                className="remove-item"
                id="remove-item"
                disabled={!quantity}
                onClick={store.remove}
              >
                Remove one
              </button>
            </div>
          </div>
          <div className="bag-bottom">
            <p className="bag-total">
              Subtotal <strong id="bag-total">{money(quantity * 18)}</strong>
            </p>
            <button
              className="button dark"
              id="purchase"
              disabled={!quantity}
              onClick={store.purchase}
            >
              Place demo order <span>→</span>
            </button>
            <p className="fine">
              This is a sample order. No payment will be taken and no product
              will be shipped.
            </p>
            <button className="text-link" onClick={onClose}>
              Continue exploring ↗
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
