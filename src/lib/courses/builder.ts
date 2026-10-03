// Builds an uploaded course file in the browser, with the same code as the
// site's content build. Loaded lazily (it pulls in the Markdown and KaTeX
// pipeline), only when a learner adds or updates a course.

import { parseCoursePack, type PackBlock } from '../../../scripts/lib/course-pack.ts'
import { buildCourse, type BuildError, type CourseBuild } from '../../../scripts/lib/course-build.ts'
import { interactiveIds } from '../interactives'
import type { ContentIndex } from '@/types/content'

export interface PreparedCourse {
  fileName: string
  text: string
  slug?: string
  title?: string
  errors: BuildError[]
  warnings: string[]
  build?: CourseBuild
  blocks: PackBlock[]
  counts?: { weeks: number; exercises: number; videos: number; lessons: number; templates: number; problems: number; challenges: number; glossary: number }
}

export function prepareCourse(text: string, fileName: string, index?: Pick<ContentIndex, 'interactives'>): PreparedCourse {
  const pack = parseCoursePack(text, fileName)
  const out: PreparedCourse = { fileName, text, errors: [...pack.errors], warnings: [...pack.warnings], blocks: pack.blocks, slug: pack.source?.slug, title: pack.source?.meta?.title }
  if (!pack.source || pack.errors.length) return out
  const interactiveMeta = new Map((index?.interactives || []).map((i) => [i.id, { title: i.title, intro: i.intro, course: i.course }] as const))
  const build = buildCourse(pack.source, { interactives: new Set(interactiveIds), interactiveMeta, sanitize: true })
  out.errors.push(...build.errors)
  out.warnings.push(...build.warnings)
  out.build = build
  const kind = (k: PackBlock['kind']) => pack.blocks.filter((b) => b.kind === k).length
  out.counts = {
    weeks: build.stats.weeks,
    exercises: build.stats.exercises,
    videos: build.stats.videos,
    lessons: kind('lesson'),
    templates: kind('opgaveskabelon'),
    problems: kind('problem'),
    challenges: kind('challenge'),
    glossary: build.course.glossary.length,
  }
  return out
}
