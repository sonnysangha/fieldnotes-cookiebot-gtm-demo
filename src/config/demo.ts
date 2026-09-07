import type { DemoConfig } from "../domain/types";

// These are public browser identifiers, never secrets. Blank IDs fail closed.
export const demoConfig: DemoConfig = {
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
  cookiebotId: process.env.NEXT_PUBLIC_COOKIEBOT_ID ?? "",
  allowedHosts: (process.env.NEXT_PUBLIC_ALLOWED_HOSTS ?? "localhost,127.0.0.1")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
};
