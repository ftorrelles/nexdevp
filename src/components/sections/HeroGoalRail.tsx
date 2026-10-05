'use client'

import { useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'

const goals = ['time', 'control', 'idea'] as const
type HeroGoal = typeof goals[number]

export function HeroGoalRail(): ReactElement {
  const t = useTranslations('hero.solutionFirst.goals')
  const [selectedGoal, setSelectedGoal] = useState<HeroGoal>('time')

  return (
    <div className="mt-9 border-t border-nex-ink/15 pt-4 sm:mt-10">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <p id="hero-goal-label" className="font-dm-mono text-[11px] uppercase tracking-[0.1em] text-nex-white/70">
          {t('question')}
        </p>
        <div role="group" aria-labelledby="hero-goal-label" className="flex flex-wrap gap-x-5 gap-y-1 sm:gap-x-8">
          {goals.map((goal) => (
            <button
              key={goal}
              type="button"
              aria-pressed={selectedGoal === goal}
              aria-controls="hero-goal-explanation"
              onClick={() => setSelectedGoal(goal)}
              className={`inline-flex min-h-11 items-center gap-2 border-b-2 py-2 font-jost text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green ${
                selectedGoal === goal
                  ? 'border-nex-green text-nex-white'
                  : 'border-transparent text-nex-white/70 hover:border-nex-white/40 hover:text-nex-white'
              }`}
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${selectedGoal === goal ? 'bg-nex-green' : 'bg-nex-white/30'}`} />
              {t(`${goal}.label`)}
            </button>
          ))}
        </div>
      </div>
      <p id="hero-goal-explanation" role="status" aria-live="polite" aria-atomic="true" className="mt-4 min-h-24 font-jost text-sm leading-relaxed text-nex-white/70 sm:min-h-12 lg:min-h-6">
        <strong className="font-medium text-nex-white">{t(`${selectedGoal}.problem`)}</strong>
        <span aria-hidden="true" className="px-2 text-nex-green">→</span>
        {t(`${selectedGoal}.possibility`)}
      </p>
    </div>
  )
}
