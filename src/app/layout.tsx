import type { Metadata } from "next";
import type { ReactNode } from "react";
import DemoProvider from "../components/DemoProvider";
import GtmLoader from "../components/GtmLoader";
import { demoConfig } from "../config/demo";
import "../style.css";

export const metadata: Metadata = {
  title: "Fieldnotes — Make room for your ideas",
  description:
    "Thoughtfully simple notebooks for everyday ideas. Explore the Fieldnotes Everyday Notebook.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoProvider config={demoConfig}>
          {/* <script
            id="Cookiebot"
            src="https://consent.cookiebot.com/uc.js"
            data-cbid="ba4ebbcb-df61-4020-8ac5-b9638ea18c08"
            data-blockingmode="auto"
            type="text/javascript"
          ></script> */}
          <GtmLoader gtmId={demoConfig.gtmId} />
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
