import { getRealProjects, type RealProjectCategory } from '@/content/realProjects'

export interface RealProjectSelection {
  category: RealProjectCategory
  indices: Record<RealProjectCategory, number>
}

export type RealProjectSelectionAction =
  | { type: 'category'; category: RealProjectCategory }
  | { type: 'project'; index: number }
  | { type: 'step'; direction: -1 | 1 }
  | { type: 'advance' }

export function createRealProjectSelection(category: RealProjectCategory): RealProjectSelection {
  return { category, indices: { projects: 0, apps: 0, websites: 0 } }
}

export function realProjectSelectionReducer(state: RealProjectSelection, action: RealProjectSelectionAction): RealProjectSelection {
  if (action.type === 'category') return { ...state, category: action.category }
  if (action.type === 'advance') {
    const count = getRealProjects(state.category).length
    const index = (state.indices[state.category] + 1) % count
    return { ...state, indices: { ...state.indices, [state.category]: index } }
  }
  const requested = action.type === 'step' ? state.indices[state.category] + action.direction : action.index
  if (!Number.isFinite(requested)) return state
  const last = getRealProjects(state.category).length - 1
  const index = Math.max(0, Math.min(last, Math.trunc(requested)))
  return { ...state, indices: { ...state.indices, [state.category]: index } }
}
