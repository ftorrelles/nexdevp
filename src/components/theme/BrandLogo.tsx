// Two logo variants: logo-dark.svg (light-colored mark, for the default dark
// theme) and logo-light.svg (dark-colored mark, for the light theme). Both
// render and CSS toggles which one shows based on the [data-theme] attribute
// on <html> — no JS/hooks needed, so there's no hydration mismatch.
export function BrandLogo({ className = 'h-9' }: { className?: string }) {
  return (
    <span className="inline-flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-dark.svg"
        alt="nexdevp"
        className={`w-auto ${className} [html[data-theme=light]_&]:hidden`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-light.svg"
        alt="nexdevp"
        className={`w-auto ${className} hidden [html[data-theme=light]_&]:block`}
      />
    </span>
  )
}
