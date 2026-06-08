'use client'

import { useReducedMotion, motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'

type HeadingTag = 'h1' | 'h2' | 'h3'

interface KineticHeadingProps {
  as?: HeadingTag
  children: string
  className?: string
}

export function KineticHeading({ as: Tag = 'h2', children, className }: KineticHeadingProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <Tag className={className}>{children}</Tag>
  }

  const words = children.split(' ')

  const MotionTag = motion[Tag] as typeof motion.h2

  return (
    <MotionTag
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={fadeUp}
          className="inline-block mr-[0.25em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </MotionTag>
  )
}
