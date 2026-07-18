// The logo asset is a light-colored mark meant for a dark background. In light
// theme it would blend into the page, so we give it a small dark pill behind it
// whenever the light theme is active — a plain CSS rule, no JS needed.
export function BrandLogo({ className = 'h-9' }: { className?: string }) {
  return (
    <span className="inline-flex items-center rounded-lg [html[data-theme=light]_&]:bg-nex-black [html[data-theme=light]_&]:px-2.5 [html[data-theme=light]_&]:py-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-dark.svg" alt="nexdevp" className={`w-auto ${className}`} />
    </span>
  )
}
