import type { MetadataRoute } from "next";

// T-07: Web app manifest for favicon/PWA metadata.
// theme_color matches --color-black brand token.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nexdevp",
    short_name: "nexdevp",
    description: "Digital systems that grow your business.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      {
        src: "/brand/logo-dark.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/logo-dark.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
