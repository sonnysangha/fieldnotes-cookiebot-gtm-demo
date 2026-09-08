"use client";
import type { ReactNode } from "react";
import { ShopContext } from "./components/shop-context";
import { useRef, useState } from "react";
import { useDemoContext } from "./components/DemoProvider";
import Bag from "./components/Bag";
import Inspector from "./components/Inspector";
import Declaration from "./components/Declaration";
import Dialog from "./components/Dialog";
import { articles } from "./lib/articles";

export default function App({ children }: { children: ReactNode }) {
  const {
    state,
    add,
    remove,
    purchase,
    clearCookies,
    clearLog,
    renew,
    withdraw,
    diagnostics,
    mountDeclaration,
  } = useDemoContext();
  const inspectorTrigger = useRef<HTMLButtonElement>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [article, setArticle] = useState<
    (typeof articles)[keyof typeof articles] | null
  >(null);
  const [declarationOpen, setDeclarationOpen] = useState(false);
  function cookieAction(action: () => void) {
    setBagOpen(false);
    setArticle(null);
    action();
  }
  return (
    <ShopContext
      value={{
        state,
        add,
        openBag: () => setBagOpen(true),
        openSettings: () => cookieAction(renew),
        toggleDeclaration: () => setDeclarationOpen((v) => !v),
        openArticle: (key) => setArticle(articles[key]),
        openInspector: () => setInspectorOpen(true),
        inspectorOpen,
        inspectorTrigger,
      }}
    >
      <div className={`app-shell${inspectorOpen ? " inspector-open" : ""}`}>
        {children}
        <Declaration mount={mountDeclaration} open={declarationOpen} />
        <Bag
          state={state}
          onRemove={remove}
          onPurchase={purchase}
          open={bagOpen}
          onClose={() => setBagOpen(false)}
        />
        <Dialog
          id="article-dialog"
          aria-labelledby="article-title"
          open={!!article}
          onClose={() => setArticle(null)}
        >
          <button
            className="article-close"
            aria-label="Close article"
            onClick={() => setArticle(null)}
          >
            ×
          </button>
          <p className="eyebrow">THE FIELDNOTES JOURNAL</p>
          <h2 id="article-title">{article?.title}</h2>
          <div id="article-content">
            {article?.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Dialog>
        <Inspector
          state={state}
          onClearCookies={clearCookies}
          onClearLog={clearLog}
          getDiagnostics={diagnostics}
          open={inspectorOpen}
          onClose={() => {
            setInspectorOpen(false);
            inspectorTrigger.current?.focus({ preventScroll: true });
          }}
          onSettings={() => cookieAction(renew)}
          onWithdraw={() => cookieAction(withdraw)}
        />
      </div>
    </ShopContext>
  );
}
