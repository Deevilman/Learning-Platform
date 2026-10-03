// Pluggable code runners. Add a language by adding an entry to RUNNERS in
// index.ts that lazily returns a CodeRunner; exercise code never changes.

export interface RunResult {
  stdout: string
  stderr: string
  error?: string
  timedOut?: boolean
  ms: number
}

export interface RunOptions {
  timeoutMs?: number
  /** Text the program reads from standard input. */
  stdin?: string
  onStatus?: (s: string) => void
}

export interface CodeRunner {
  language: string
  label: string
  run(code: string, opts?: RunOptions): Promise<RunResult>
}
