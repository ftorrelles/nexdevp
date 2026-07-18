import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "nex-black": "rgb(var(--nex-black) / <alpha-value>)",
        "nex-dark": "rgb(var(--nex-dark) / <alpha-value>)",
        "nex-grey": "rgb(var(--nex-grey) / <alpha-value>)",
        "nex-white": "rgb(var(--nex-white) / <alpha-value>)",
        "nex-green": "rgb(var(--nex-green) / <alpha-value>)",
        "nex-ink": "rgb(var(--nex-ink) / <alpha-value>)",
      },
      fontFamily: {
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
        "dm-mono": ["var(--font-dm-mono)", "monospace"],
        jost: ["var(--font-jost)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
