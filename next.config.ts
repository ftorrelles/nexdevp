import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { validateLaunchRequirements } from "./src/lib/launch-gate";

// Warn about placeholder values — does NOT fail the build.
const _launchErrors = validateLaunchRequirements();
if (_launchErrors.length > 0) {
  console.warn("\n[nexdevp launch-gate] Placeholder values detected:");
  for (const e of _launchErrors) {
    console.warn(`  [warn] ${e.field}: ${e.message}`);
  }
  console.warn("");
}


const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Static export — enable when ready for deployment
  // output: 'export',
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
