"use client";
import type { ReactNode } from "react";
import { useShop, type ArticleKey } from "./shop-context";

export function BagButton() {
  const { state, openBag } = useShop();
  return (
    <button className="bag-button" id="open-bag" onClick={openBag}>
      Bag <span id="bag-count">{state.quantity}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14l1 14H4L5 7Zm4 0V5a3 3 0 0 1 6 0v2" />
      </svg>
    </button>
  );
}
export function AddToBag() {
  const { state, add } = useShop();
  return (
    <>
      <button className="button dark" id="add" onClick={add}>
        Add to bag <span>+</span>
      </button>
      <p className="product-note" id="added-notice" role="status">
        {state.quantity
          ? "Added to your bag. A little possibility, ready to go."
          : "A considered little addition to your everyday."}
      </p>
    </>
  );
}
export function ArticleButton({
  article,
  children,
  className,
  id,
}: {
  article: ArticleKey;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const { openArticle } = useShop();
  return (
    <button className={className} id={id} onClick={() => openArticle(article)}>
      {children}
    </button>
  );
}
export function ConsentLinks() {
  const { state, openSettings, toggleDeclaration } = useShop();
  return (
    <>
      <button id="settings" disabled={!state.consent} onClick={openSettings}>
        Cookie settings ↗
      </button>
      <button
        id="declaration-toggle"
        disabled={!state.configured}
        onClick={toggleDeclaration}
      >
        Cookie declaration ↗
      </button>
    </>
  );
}
export function InspectorButton() {
  const { inspectorOpen, inspectorTrigger, openInspector } = useShop();
  return (
    <button
      id="open-demo"
      ref={inspectorTrigger}
      onClick={openInspector}
      aria-controls="demo-dialog"
      aria-expanded={inspectorOpen}
    >
      Demo controls ↗
    </button>
  );
}
