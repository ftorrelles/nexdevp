import '@/styles/globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { fontVariables } from '@/lib/fonts'

// Runs before hydration so the light theme (authed areas only) doesn't flash.
// String.raw keeps the regex escapes (\/) intact in the emitted script.
const THEME_INIT_SCRIPT = String.raw`
(function() {
  try {
    var p = window.location.pathname;
    var authed = p.indexOf('/admin') === 0 || /^\/(es|en)\/proyecto(\/|$)/.test(p) || /^\/(es|en)\/careers\/portal(\/|$)/.test(p);
    if (authed && localStorage.getItem('nex-theme') === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`

interface DocumentShellProps {
  lang: string
  children: React.ReactNode
}

// Shared <html>/<body> for every route tree. The root layout only passes
// children through so `[locale]` can set <html lang> statically per locale.
export function DocumentShell({ lang, children }: DocumentShellProps): React.JSX.Element {
  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-nex-black text-nex-white antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
