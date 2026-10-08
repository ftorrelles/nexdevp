import { REAL_PROJECTS, type RealProjectCategory } from '@/content/realProjects'

export interface RealProjectSelection {
  index: number
}

export type RealProjectSelectionAction =
  | { type: 'category'; category: RealProjectCategory }
  | { type: 'step'; direction: -1 | 1 }
  | { type: 'project'; index: number }
  | { type: 'advance' }

export function createRealProjectSelection(): RealProjectSelection {
  return { index: 0 }
}

export function firstIndexForCategory(category: RealProjectCategory): number {
  return REAL_PROJECTS.findIndex((project) => project.category === category)
}

export function realProjectSelectionReducer(state: RealProjectSelection, action: RealProjectSelectionAction): RealProjectSelection {
  const count = REAL_PROJECTS.length
  if (action.type === 'category') {
    const index = firstIndexForCategory(action.category)
    return { index: index < 0 ? state.index : index }
  }
  if (action.type === 'project') {
    if (!Number.isFinite(action.index)) return state
    return { index: Math.min(count - 1, Math.max(0, Math.trunc(action.index))) }
  }
  if (action.type === 'advance') {
    return { index: (state.index + 1) % count }
  }
  return { index: (state.index + action.direction + count) % count }
}
