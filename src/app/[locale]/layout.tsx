import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Jost } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/styles/globals.css";

// T-05: Self-hosted fonts via next/font/google (auto self-hosted at build time,
// zero requests to fonts.googleapis.com at runtime).
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-dm-mono",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-jost",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// T-04: generateStaticParams — tell Next.js which locale segments to pre-render.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "nexdevp",
  description: "Digital systems that grow your business.",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale against supported list; 404 for unknown segments.
  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound();
  }

  // Required for static rendering with next-intl.
  setRequestLocale(locale);

  // Fetch locale messages to provide to client components.
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${dmMono.variable} ${jost.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
