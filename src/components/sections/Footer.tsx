import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'

interface FooterProps {
  locale: Locale
}

export function Footer({ locale }: FooterProps) {
  const year = new Date().getFullYear()

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/#pilares', label: 'Servicios' },
    { href: '#demo', label: 'Demo' },
    { href: locale === 'es' ? '/casos/cocinerhosp' : '/casos/cocinerhosp', label: 'Casos' },
  ]

  return (
    <footer className="bg-nex-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">

        {/* Top row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-light.svg"
                alt="nexdevp"
                style={{ height: '36px', width: 'auto' }}
              />
            </Link>
            <p className="font-jost text-sm text-nex-grey max-w-xs leading-relaxed">
              Consultoría tecnológica especializada en software a medida e ingeniería de ventas con IA.
            </p>
          </div>

          {/* Nav links */}
          <nav>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-4">Navegación</p>
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-4">Contacto</p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="https://wa.me/549XXXXXXXXXX"
                  className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors flex items-center gap-2"
                >
                  <span className="text-nex-green">↗</span> WhatsApp
                </a>
              </li>
              <li>
                <span className="font-jost text-sm text-nex-grey">
                  nexdevp.com
                </span>
              </li>
            </ul>
          </div>

          {/* Locale switcher */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-4">Idioma</p>
            <div className="flex gap-3">
              <Link
                href="/"
                locale="es"
                className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                  locale === 'es'
                    ? 'border-nex-green text-nex-green bg-nex-green/10'
                    : 'border-white/10 text-nex-grey hover:border-white/30 hover:text-nex-white'
                }`}
              >
                ES
              </Link>
              <Link
                href="/"
                locale="en"
                className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                  locale === 'en'
                    ? 'border-nex-green text-nex-green bg-nex-green/10'
                    : 'border-white/10 text-nex-grey hover:border-white/30 hover:text-nex-white'
                }`}
              >
                EN
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-nex-grey">
            © {year} nexdevp — Todos los derechos reservados
          </p>
          <p className="font-mono text-xs text-nex-grey/40">
            Construido con Next.js · Desplegado con Hostinger
          </p>
        </div>

      </div>
    </footer>
  )
}
