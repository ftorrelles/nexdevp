// Root layout — minimal passthrough shell required by Next.js App Router.
// Actual locale-aware setup (html lang, fonts, i18n provider) lives in
// src/app/[locale]/layout.tsx.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
