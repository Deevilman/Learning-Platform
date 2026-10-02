import { useEffect, useMemo, useState } from 'react'
import { Widget, Buttons } from './_ui'

export const meta = { title: 'Turing-maskine-simulator', course: 'foundations' }

type Rule = { write: string; move: -1 | 0 | 1; next: string }
interface Machine {
  name: string
  start: string
  accept: string[]
  input: string
  desc: string
  rules: Record<string, Record<string, Rule>> // state → symbol → rule
}
const B = '␣'
const R = (write: string, move: -1 | 0 | 1, next: string): Rule => ({ write, move, next })

const MACHINES: Record<string, Machine> = {
  inc: {
    name: 'Binær +1',
    start: 'R',
    accept: ['H'],
    input: '1011',
    desc: 'Løb til højre til enden, og læg så 1 til med mente på vej tilbage.',
    rules: {
      R: { '0': R('0', 1, 'R'), '1': R('1', 1, 'R'), [B]: R(B, -1, 'C') },
      C: { '1': R('0', -1, 'C'), '0': R('1', 0, 'H'), [B]: R('1', 0, 'H') },
    },
  },
  unary: {
    name: 'Unær addition',
    start: 'A',
    accept: ['H'],
    input: '111+11',
    desc: 'Erstat + med 1, og slet det sidste 1-tal: 111+11 bliver 11111.',
    rules: {
      A: { '1': R('1', 1, 'A'), '+': R('1', 1, 'E') },
      E: { '1': R('1', 1, 'E'), [B]: R(B, -1, 'D') },
      D: { '1': R(B, 0, 'H') },
    },
  },
  pal: {
    name: 'Palindrom (0/1)',
    start: 'S',
    accept: ['JA'],
    input: '0110',
    desc: 'Slet første symbol, husk det, løb til enden, og tjek at sidste symbol er det samme. Gentag.',
    rules: {
      S: { '0': R(B, 1, 'H0'), '1': R(B, 1, 'H1'), [B]: R(B, 0, 'JA') },
      H0: { '0': R('0', 1, 'H0'), '1': R('1', 1, 'H0'), [B]: R(B, -1, 'T0') },
      H1: { '0': R('0', 1, 'H1'), '1': R('1', 1, 'H1'), [B]: R(B, -1, 'T1') },
      T0: { '0': R(B, -1, 'L'), '1': R('1', 0, 'NEJ'), [B]: R(B, 0, 'JA') },
      T1: { '1': R(B, -1, 'L'), '0': R('0', 0, 'NEJ'), [B]: R(B, 0, 'JA') },
      L: { '0': R('0', -1, 'L'), '1': R('1', -1, 'L'), [B]: R(B, 1, 'S') },
    },
  },
  busy: {
    name: 'Busy beaver (3 tilstande)',
    start: 'A',
    accept: ['H'],
    input: '',
    desc: 'Den 3-tilstands-maskine, der skriver flest 1-taller og stopper: 6 ét-taller på 14 skridt (Σ(3) = 6).',
    rules: {
      A: { [B]: R('1', 1, 'B'), '1': R('1', 0, 'H') },
      B: { [B]: R(B, 1, 'C'), '1': R('1', 1, 'B') },
      C: { [B]: R('1', -1, 'C'), '1': R('1', -1, 'A') },
    },
  },
}

interface Config {
  tape: Map<number, string>
  head: number
  state: string
  steps: number
}

const init = (m: Machine, input: string): Config => ({ tape: new Map([...input].map((c, i) => [i, c])), head: 0, state: m.start, steps: 0 })

function step(m: Machine, c: Config): Config | null {
  const sym = c.tape.get(c.head) ?? B
  const rule = m.rules[c.state]?.[sym]
  if (!rule) return null
  const tape = new Map(c.tape)
  if (rule.write === B) tape.delete(c.head)
  else tape.set(c.head, rule.write)
  return { tape, head: c.head + rule.move, state: rule.next, steps: c.steps + 1 }
}

export default function TuringMachine({ props }: { props: Record<string, string> }) {
  const [which, setWhich] = useState<string>(props.machine && MACHINES[props.machine] ? props.machine : 'inc')
  const m = MACHINES[which]
  const [input, setInput] = useState(m.input)
  const [cfg, setCfg] = useState<Config>(() => init(m, m.input))
  const [running, setRunning] = useState(false)
  useEffect(() => {
    setInput(m.input)
    setCfg(init(m, m.input))
    setRunning(false)
  }, [which]) // eslint-disable-line react-hooks/exhaustive-deps
  const halted = useMemo(() => step(m, cfg) === null, [m, cfg])
  useEffect(() => {
    if (!running) return
    if (halted || cfg.steps > 500) return setRunning(false)
    const t = setTimeout(() => setCfg((c) => step(m, c) || c), 250)
    return () => clearTimeout(t)
  }, [running, cfg, halted, m])
  const keys = [...cfg.tape.keys(), cfg.head]
  const lo = Math.min(...keys, 0) - 2
  const hi = Math.max(...keys, input.length) + 2
  const cells = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  const sym = cfg.tape.get(cfg.head) ?? B
  const rule = m.rules[cfg.state]?.[sym]
  return (
    <Widget title="Turing-maskine-simulator" icon="⚙">
      <Buttons options={Object.entries(MACHINES).map(([id, x]) => ({ id, label: x.name }))} value={which} onChange={setWhich} />
      <p className="muted text-sm">{m.desc}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          Input
          <input className="input mt-1 font-mono" value={input} onChange={(e) => setInput(e.target.value.replace(/\s/g, ''))} />
        </label>
        <button className="btn" onClick={() => (setCfg(init(m, input)), setRunning(false))}>
          Nulstil med input
        </button>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-0.5 font-mono">
          {cells.map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="grid h-9 w-9 place-items-center rounded border text-base"
                style={{ borderColor: i === cfg.head ? 'var(--accent)' : 'var(--border)', borderWidth: i === cfg.head ? 2 : 1, background: i === cfg.head ? 'var(--accent-soft)' : 'var(--surface)' }}
              >
                {cfg.tape.get(i) ?? <span className="muted">{B}</span>}
              </div>
              <div className="h-4 text-xs" style={{ color: 'var(--accent)' }}>
                {i === cfg.head ? '▲' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          Tilstand: <b className="font-mono">{cfg.state}</b>
        </span>
        <span>Skridt: {cfg.steps}</span>
        {halted ? (
          <b style={{ color: m.accept.includes(cfg.state) ? 'var(--ok)' : 'var(--bad)' }}>Stoppet{m.accept.includes(cfg.state) ? ' (accepterer)' : ' (afviser)'}</b>
        ) : (
          rule && (
            <span className="muted font-mono">
              δ({cfg.state}, {sym}) = ({rule.write}, {rule.move < 0 ? '←' : rule.move > 0 ? '→' : '–'}, {rule.next})
            </span>
          )
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => setCfg((c) => step(m, c) || c)} disabled={halted}>
          Ét skridt
        </button>
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)} disabled={halted}>
          {running ? 'Pause' : 'Kør'}
        </button>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Overgangstabel</summary>
        <table className="md-table mt-2 font-mono" style={{ display: 'table' }}>
          <thead>
            <tr>
              <th>tilstand</th>
              <th>læser</th>
              <th>skriver</th>
              <th>flyt</th>
              <th>ny</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(m.rules).flatMap(([s, rs]) =>
              Object.entries(rs).map(([r, x]) => (
                <tr key={s + r} style={s === cfg.state && r === sym && !halted ? { background: 'var(--accent-soft)' } : undefined}>
                  <td>{s}</td>
                  <td>{r}</td>
                  <td>{x.write}</td>
                  <td>{x.move < 0 ? '←' : x.move > 0 ? '→' : '–'}</td>
                  <td>{x.next}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </details>
    </Widget>
  )
}
