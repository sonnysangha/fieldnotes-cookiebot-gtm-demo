import { useEffect, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import Storefront from "./components/Storefront";
import Bag from "./components/Bag";
import Inspector from "./components/Inspector";
import Declaration from "./components/Declaration";
import Dialog from "./components/Dialog";
import { articles } from "./lib/articles";

export default function App({ store }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [bagOpen, setBagOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [article, setArticle] = useState(null);
  const [declarationOpen, setDeclarationOpen] = useState(false);
  useEffect(() => store.connect(), [store]);
  useEffect(() => {
    document.body.classList.toggle("inspector-open", inspectorOpen);
    return () => document.body.classList.remove("inspector-open");
  }, [inspectorOpen]);
  function cookieAction(action) {
    // Close native top-layer dialogs before showing the vendor banner.
    flushSync(() => {
      setBagOpen(false);
      setArticle(null);
    });
    action();
  }
  return (
    <>
      <Storefront
        state={state}
        store={store}
        onBag={() => setBagOpen(true)}
        onSettings={() => cookieAction(store.renew)}
        onDeclaration={() => cookieAction(() => setDeclarationOpen((v) => !v))}
        onArticle={(key) => setArticle(articles[key])}
        onInspector={() => setInspectorOpen(true)}
        inspectorOpen={inspectorOpen}
      />
      <Declaration store={store} open={declarationOpen} />
      <Bag
        state={state}
        store={store}
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
        store={store}
        open={inspectorOpen}
        onClose={() => {
          setInspectorOpen(false);
          document.getElementById("open-demo")?.focus({ preventScroll: true });
        }}
        onSettings={() => cookieAction(store.renew)}
        onWithdraw={() => cookieAction(store.withdraw)}
      />
    </>
  );
}
