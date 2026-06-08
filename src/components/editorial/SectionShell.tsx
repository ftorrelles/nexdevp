import React from 'react'

interface SectionShellProps {
  eyebrow?: string
  heading?: string
  children: React.ReactNode
  className?: string
}

export function SectionShell({ eyebrow, heading, children, className = '' }: SectionShellProps) {
  return (
    <section className={['py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto', className].filter(Boolean).join(' ')}>
      {(eyebrow || heading) && (
        <div className="mb-12">
          {eyebrow && (
            <p className="text-accent font-dm-mono text-xs uppercase tracking-widest mb-3">
              {eyebrow}
            </p>
          )}
          {heading && (
            <h2 className="font-cormorant text-4xl sm:text-5xl text-cream leading-tight">
              {heading}
            </h2>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
