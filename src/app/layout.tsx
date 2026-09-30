// Pass-through root layout. Each route tree owns its own <html>/<body> via
// DocumentShell: `[locale]` (so <html lang> is static per locale), `admin`,
// `auth` and `not-found`. Keeping this layout free of request APIs is what
// lets the public `[locale]` pages be prerendered.
export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return children
}
