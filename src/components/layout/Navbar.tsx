import { Link } from '@/i18n/navigation'
import { BookingDialog } from '@/components/cta/BookingDialog'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#services', label: 'Servicios' },
  { href: '/casos', label: 'Casos' },
  { href: '/#about', label: 'Nosotros' },
]

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-nex-black border-b border-white/5">
      <div className="px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="nexdevp home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-dark.svg" alt="nexdevp" style={{ height: '32px', width: 'auto' }} />
        </Link>

        {/* Center nav links (hidden on mobile) */}
        <ul className="hidden md:flex items-center gap-8">
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

        {/* Right CTA */}
        <BookingDialog triggerLabel="Agendar Demo ↗" variant="primary" />
      </div>
    </nav>
  )
}
