import React from 'react'

type ButtonVariant = 'primary' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  asChild?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-nex-green text-nex-black font-semibold hover:opacity-90 focus-visible:ring-2 focus-visible:ring-nex-green focus-visible:ring-offset-2 focus-visible:ring-offset-nex-black',
  ghost:
    'bg-transparent text-nex-white border border-nex-white/30 hover:border-nex-white/60 focus-visible:ring-2 focus-visible:ring-nex-white focus-visible:ring-offset-2 focus-visible:ring-offset-nex-black',
}

export function Button({
  variant = 'primary',
  asChild,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-md text-sm transition-all duration-150 outline-none focus-visible:outline-none'

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: [base, variantClasses[variant], className].filter(Boolean).join(' '),
    })
  }

  return (
    <button className={[base, variantClasses[variant], className].filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  )
}
