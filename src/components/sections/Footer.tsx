import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { WHATSAPP_NUMBER } from '@/lib/constants'

interface FooterProps {
  locale: Locale
}

export function Footer({ locale }: FooterProps) {
  const year = new Date().getFullYear()

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/#pilares', label: 'Servicios' },
    { href: '#demo', label: 'Demo' },
    { href: '/#casos', label: 'Casos' },
    { href: '/#portfolio', label: locale === 'es' ? 'Proyectos' : 'Projects' },
  ]

  return (
    <footer className="bg-nex-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">

        {/* Top row */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">

          {/* Brand */}
          <div className="flex flex-col items-center gap-4 w-full lg:w-64 text-center">
            <Link href="/" className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-dark.svg"
                alt="nexdevp"
                style={{ height: '52px', width: 'auto' }}
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
                  href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
            <LocaleSwitcher locale={locale} />
          </div>
        </div>

        {/* Bottom bar — extra bottom padding on mobile so the floating WhatsApp button doesn't cover the text */}
        <div className="mt-12 pt-6 pb-20 sm:pb-0 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
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
