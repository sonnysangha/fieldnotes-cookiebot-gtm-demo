import type { Metadata } from "next";
import type { ReactNode } from "react";
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
      <body>{children}</body>
    </html>
  );
}
