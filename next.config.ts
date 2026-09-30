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

// No Content-Security-Policy yet: it needs its own pass (Meta Pixel, Cal.com,
// inline theme/JSON-LD scripts) and should not ride along with these headers.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Brand and OG images are not fingerprinted, so keep them revalidatable.
const staticAssetCache = [
  { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
];

const nextConfig: NextConfig = {
  // Static export — enable when ready for deployment
  // output: 'export',
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/brand/:path*", headers: staticAssetCache },
      { source: "/og/:path*", headers: staticAssetCache },
    ];
  },
};

export default withNextIntl(nextConfig);
