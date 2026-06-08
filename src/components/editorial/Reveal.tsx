'use client'

import { useReducedMotion, motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'

interface RevealProps {
  children: React.ReactNode
  className?: string
}

export function Reveal({ children, className }: RevealProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}
