import { useEffect, useRef, useState } from "react";

// The SDK receives one isolated host. All surrounding UI is rendered by React.
export default function Declaration({
  open,
  mount,
}: {
  open: boolean;
  mount: (
    host: HTMLElement,
    onStatus: (status: string) => void,
  ) => (() => void) | undefined;
}) {
  const section = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading the Cookiebot declaration…");
  useEffect(() => {
    if (!open || !host.current) return;
    section.current?.scrollIntoView({ block: "start" });
    return mount(host.current, setStatus);
  }, [open, mount]);
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
