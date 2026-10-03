// Shared content model: produced by scripts/build-content.ts, consumed by the app.

export type Difficulty = 1 | 2 | 3

export type ExerciseKind =
  | 'compute'
  | 'proof'
  | 'code'
  | 'explain'
  | 'interview'
  | 'selftest'
  | 'project'

export type AutoCheck =
  | { type: 'numeric'; answer: number; tolerance?: number; relative?: boolean; unit?: string }
  | { type: 'numeric-list'; answers: number[]; tolerance?: number; ordered?: boolean }
  | { type: 'choice'; options: string[]; correct: number }
  | { type: 'text'; answers: string[]; caseSensitive?: boolean }
  | { type: 'output'; expected: string }

export interface Topic {
  id: string
  name: string
  weeks: number[]
}

export interface CourseMeta {
  slug: string
  title: string
  short: string
  color: string
  icon: string
  level: string
  estimated_weeks: number
  prerequisites: string[] // "requires" in a course file
  recommendedBefore: string[] // nice to have first, never required
  next: string[]
  topics: Topic[]
  disclaimer?: string
  lang: 'da' | 'en'
  track?: string // groups courses on the course map
  exam?: 'htx' | 'olympiade'
  /** Uploaded by the learner (not part of the site's own content). */
  uploaded?: boolean
}

export interface VideoItem {
  id: string // "<week>.<n>", unique within the course
  key: string // playlist key from the plan, e.g. "P1" or "Q3.2"
  title: string // HTML
  optional: boolean
  added: boolean
  focus?: string // HTML
  pause?: string // HTML
  sources: VideoSource[] // one item in the plan can cover several YouTube videos
  links: string[] // non-YouTube URLs (PDFs, the Natural Number Game, …)
}

export interface VideoSource {
  title: string
  channel?: string
  youtube?: string // YouTube video ID; missing → the app asks for a URL
  search?: string // YouTube search query used when the ID is unknown
  embed?: false // the uploader has turned off playback on other sites
  access?: 'steady' // only for the creator's paying supporters: never embedded or linked by ID
  url?: string // where supporters can watch it (access: steady)
}

export interface ExerciseSummary {
  id: string // "<course>/<week>/<number>" or "<course>/selftest/<n>" …
  course: string
  week: number // 0 for course-level sets (self-test, interview, project)
  number: string
  topics: string[]
  difficulty: Difficulty
  kind: ExerciseKind
  hasHint: boolean // the plan has its own hint (every exercise gets a hint ladder)
  hasCheck: boolean
  hasChoices: boolean // a multiple-choice question exists (generator, choice check or quiz)
  set: 'week' | 'selftest' | 'interview' | 'extra'
  title: string // plain-text excerpt for lists and search
}

export interface Exercise extends ExerciseSummary {
  prompt: string // HTML
  hints: string[] // HTML, shown one step at a time; the solution comes last
  solution: string // HTML
  check?: AutoCheck
  quiz?: Quiz
  source: 'bank' | 'generated'
}

/** A short auto-checked question tied to a bank exercise (from overrides.yaml). */
export interface Quiz {
  question: string // HTML
  check?: AutoCheck // typed answer, when the answer is a number or a word
  choices?: { options: string[]; correct: number } // options in mini-Markdown
  explain?: string // HTML
}

export interface Week {
  course: string
  number: number
  title: string
  goals?: string // HTML
  time?: string // HTML
  prereq?: string // HTML
  videos: VideoItem[]
  videosIntro?: string // HTML before the list
  notes: string // HTML
  exercisesIntro?: string // HTML
  exercises: Exercise[]
  connection?: string // HTML
  checkpointIntro?: string // HTML
  checkpoint: string[] // HTML items
  extraSections: { title: string; html: string }[]
}

export interface WeekSummary {
  number: number
  title: string
  videoCount: number
  exerciseCount: number
  checkpointCount: number
  topics: string[]
}

export interface InfoPage {
  slug: string
  title: string
  html: string
}

export interface ProjectPart {
  id: string // "A", "B", …
  title: string
  html: string
  checklist: string[]
}

export interface Project {
  title: string
  introHtml: string
  parts: ProjectPart[]
  outroHtml?: string
}

export interface ExerciseSet {
  slug: 'selftest' | 'interview'
  title: string
  introHtml: string
  exercises: Exercise[]
}

export interface GlossaryEntry {
  course: string
  da: string
  en: string
  week?: string
}

export interface CourseData {
  meta: CourseMeta
  titleHtml: string
  subtitleHtml?: string
  weeks: WeekSummary[]
  info: InfoPage[]
  project?: Project
  sets: { slug: string; title: string; count: number }[]
  glossary: GlossaryEntry[]
  counts: { weeks: number; exercises: number; solutions: number; videos: number; videosMissing: number }
  /** "Prøv selv": the interactive components in this course's notes. */
  tryIt: { id: string; title: string; intro?: string; week: number }[]
}

export interface SearchDoc {
  id: string
  type: 'exercise' | 'note' | 'glossary' | 'info' | 'video'
  course: string
  week?: number
  title: string
  text: string
  href: string
}

export interface ContentIndex {
  generatedAt: string
  courses: CourseMeta[]
  exercises: ExerciseSummary[]
  interactives: { id: string; title: string; intro?: string; course?: string }[]
}
