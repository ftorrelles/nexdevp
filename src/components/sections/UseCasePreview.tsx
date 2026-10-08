'use client'

import type { ReactElement } from 'react'
import { ConstructionPreview } from './ConstructionPreview'
import { EducationPreview } from './EducationPreview'
import { FoodPreview } from './FoodPreview'
import type { UseCaseId } from './useCaseSimulation'

export function UseCasePreview({ caseId }: { caseId: Exclude<UseCaseId, 'research'> }): ReactElement {
  if (caseId === 'construction') return <ConstructionPreview />
  if (caseId === 'education') return <EducationPreview />
  return <FoodPreview />
}
