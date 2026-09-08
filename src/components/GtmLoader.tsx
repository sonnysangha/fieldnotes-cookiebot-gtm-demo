"use client";

import Script from "next/script";
import { useDemoContext } from "./DemoProvider";

/** Mounted once by the root layout; initialization runs before Script renders. */
export default function GtmLoader({ gtmId }: { gtmId: string }) {
  const { state, scriptFailed } = useDemoContext();
  if (!state.configured) return null;

  return (
    <Script
      id="fieldnotes-gtm"
      src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
      strategy="afterInteractive"
      onError={scriptFailed}
    />
  );
}
