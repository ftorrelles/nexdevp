interface OffscreenSectionProps {
  /**
   * Tailwind classes setting `contain-intrinsic-size` (use the `auto <length>`
   * form) to the section's approximate height per breakpoint. Once the browser
   * has rendered the section it remembers the real height instead, so these
   * only need to be roughly right.
   */
  sizeClass: string
  children: React.ReactNode
}

// Lets the browser skip layout and paint of a below-the-fold section until it
// nears the viewport. The wrapper is the only element that changes: section
// markup, ids and IntersectionObserver targets stay exactly as they were.
// Anchor navigation is kept exact by OffscreenAnchors / `lib/offscreen`.
export function OffscreenSection({ sizeClass, children }: OffscreenSectionProps): React.JSX.Element {
  return (
    <div data-offscreen="" className={`[content-visibility:auto] ${sizeClass}`}>
      {children}
    </div>
  )
}
