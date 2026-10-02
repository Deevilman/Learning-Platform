// Interactive components: one file per component in content/interactives/<id>.tsx,
// default-exporting a React component that receives the directive's
// attributes as string props. Registered automatically (lazy-loaded).

import type { ComponentType } from 'react'

export type InteractiveProps = { props: Record<string, string> }
export interface InteractiveModule {
  default: ComponentType<InteractiveProps>
  meta?: { title: string; description?: string; course?: string }
}

const modules = import.meta.glob('../../content/interactives/*.tsx') as Record<string, () => Promise<InteractiveModule>>

export const interactiveLoaders = new Map(
  Object.entries(modules)
    .filter(([p]) => !p.split('/').pop()!.startsWith('_'))
    .map(([p, load]) => [p.split('/').pop()!.replace(/\.tsx$/, ''), load] as const),
)

export const interactiveIds = [...interactiveLoaders.keys()].sort()
