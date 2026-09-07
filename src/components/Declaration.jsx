import { useEffect, useRef, useState } from "react";

// Cookiebot owns only the empty host node. React owns the heading and status.
export default function Declaration({ open, store }) {
  const section = useRef(null),
    host = useRef(null);
  const [status, setStatus] = useState("Loading the Cookiebot declaration…");
  useEffect(() => {
    if (!open || !store.valid) return;
    section.current?.scrollIntoView({ block: "start" });
    let script = host.current.querySelector("#CookieDeclaration");
    if (!script) {
      script = document.createElement("script");
      script.id = "CookieDeclaration";
      script.async = true;
      script.src = `https://consent.cookiebot.com/${store.config.cookiebotId}/cd.js`;
      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "true";
          setStatus("");
        },
        { once: true },
      );
      script.addEventListener(
        "error",
        () =>
          setStatus(
            "The declaration could not be loaded. Check the domain registration and network.",
          ),
        { once: true },
      );
      host.current.append(script);
    }
  }, [open, store]);
  return (
    <section id="declaration" ref={section} hidden={!open} className="section">
      <h2>Cookie declaration</h2>
      {status && (
        <p id="declaration-status" role="status">
          {status}
        </p>
      )}
      <div ref={host} />
    </section>
  );
}
