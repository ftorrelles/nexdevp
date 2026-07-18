import '@/styles/globals.css'
import { getLocale } from 'next-intl/server'
import { Cormorant_Garamond, DM_Mono, Jost } from 'next/font/google'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

// Applies the stored theme before hydration, only within logged-in areas,
// to avoid a flash of the wrong theme. Mirrors the scope check in ThemeProvider.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var p = window.location.pathname;
    var authed = p.indexOf('/admin') === 0 || /^\\/(es|en)\\/proyecto(\\/|$)/.test(p) || /^\\/(es|en)\\/careers\\/portal(\\/|$)/.test(p);
    if (authed && localStorage.getItem('nex-theme') === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`

const META_PIXEL_ID = '1018345797219731'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-dm-mono',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-jost',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`${cormorant.variable} ${dmMono.variable} ${jost.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-nex-black text-nex-white antialiased">
        <ThemeProvider>{children}</ThemeProvider>

        {/* Meta Pixel — carga después de que la página es interactiva */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        {/* Fallback para navegadores sin JavaScript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </body>
    </html>
  )
}
