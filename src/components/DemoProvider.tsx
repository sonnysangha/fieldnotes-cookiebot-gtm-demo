"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DemoConfig } from "../domain/types";
import type { ConsentClient } from "../integrations/consent-client";
import { useDemo } from "../hooks/useDemo";

const DemoContext = createContext<ReturnType<typeof useDemo> | null>(null);

/** Keep one SDK subscription and demo state alive across page navigation. */
export default function DemoProvider({
  children,
  config,
  client,
}: {
  children: ReactNode;
  config?: DemoConfig;
  client?: ConsentClient;
}) {
  const demo = useDemo(client, config);
  return <DemoContext value={demo}>{children}</DemoContext>;
}

export function useDemoContext() {
  const demo = useContext(DemoContext);
  if (!demo) throw new Error("Demo components must be inside DemoProvider.");
  return demo;
}
