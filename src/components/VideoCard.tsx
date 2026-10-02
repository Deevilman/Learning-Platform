import { useState } from 'react'
import type { VideoItem } from '@/types/content'
import { useCheck, useRecord, useStore } from '@/lib/store'
import { videoCheckId } from '@/lib/progress'

export function parseYoutubeId(input: string): string | null {
  const s = input.trim()
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(s)
  if (m) return m[1]
  return /^[\w-]{11}$/.test(s) ? s : null
}

/** Click-to-load embed: nothing is requested from YouTube until you press play. */
function YouTube({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false)
  if (!on)
    return (
      <button
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
        onClick={() => setOn(true)}
        aria-label={`Afspil video: ${title}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full text-xl text-white" style={{ background: '#dc2626' }}>
          ▶
        </span>
        <span className="max-w-[90%] truncate font-medium">{title}</span>
        <span className="muted text-xs">youtube-nocookie.com indlæses først, når du klikker</span>
      </button>
    )
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}

function Source({ course, itemId, index, source }: { course: string; itemId: string; index: number; source: VideoItem['sources'][number] }) {
  const store = useStore()
  const key = `${course}/${itemId}/${index}`
  const [override] = useRecord('videoIds', key)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const id = override?.youtube || source.youtube
  const label = `${source.title}${source.channel ? ` · ${source.channel}` : ''}`

  if (id && !editing)
    return (
      <div className="space-y-1">
        <YouTube id={id} title={source.title} />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="muted truncate">{label}</span>
          <a className="link" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
            Åbn på YouTube ↗
          </a>
          {override && (
            <button className="link" onClick={() => setEditing(true)}>
              Ret URL
            </button>
          )}
        </div>
      </div>
    )

  const search = source.search || source.title
  return (
    <div className="rounded-lg border border-dashed p-3 text-sm" style={{ borderColor: 'var(--warn)' }}>
      <div className="font-medium">Video mangler, indsæt URL</div>
      <div className="muted mb-2 text-xs">{label}</div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          const yt = parseYoutubeId(input)
          if (!yt) return setError('Det ligner ikke en YouTube-URL eller et video-ID.')
          setError('')
          setEditing(false)
          store.put('videoIds', { id: key, youtube: yt })
        }}
      >
        <input className="input" placeholder="https://www.youtube.com/watch?v=…" value={input} onChange={(e) => setInput(e.target.value)} aria-label={`YouTube-URL til ${source.title}`} />
        <button className="btn btn-primary shrink-0" type="submit">
          Gem
        </button>
        <a className="btn shrink-0" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(search)}`} target="_blank" rel="noopener noreferrer">
          Søg på YouTube ↗
        </a>
      </form>
      {error && <div className="mt-1 text-xs" style={{ color: 'var(--bad)' }}>{error}</div>}
    </div>
  )
}

export function VideoCard({ course, item }: { course: string; item: VideoItem }) {
  const [watched, setWatched] = useCheck(videoCheckId(course, item.id))
  return (
    <section id={`video-${item.id}`} className="card space-y-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
          checked={watched}
          onChange={(e) => setWatched(e.target.checked)}
          aria-label="Markér som set"
          id={`vchk-${item.id}`}
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={`vchk-${item.id}`} className="cursor-pointer">
            {item.key && <span className="chip mr-2 font-mono">{item.key}</span>}
            {item.optional && <span className="chip mr-2">valgfri</span>}
            <span className="prose-content" dangerouslySetInnerHTML={{ __html: item.title }} />
          </label>
          {item.focus && (
            <p className="mt-1 text-sm">
              <span className="font-semibold">Fokus: </span>
              <span className="prose-content" dangerouslySetInnerHTML={{ __html: item.focus }} />
            </p>
          )}
          {item.pause && (
            <p className="mt-1 rounded-md px-2 py-1 text-sm" style={{ background: 'var(--accent-soft)' }}>
              <span className="font-semibold">Pause og tænk: </span>
              <span className="prose-content" dangerouslySetInnerHTML={{ __html: item.pause }} />
            </p>
          )}
        </div>
      </div>
      {item.sources.length > 0 && (
        <div className={`grid gap-3 ${item.sources.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {item.sources.map((s, i) => (
            <Source key={i} course={course} itemId={item.id} index={i} source={s} />
          ))}
        </div>
      )}
      {item.links.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {item.links.map((l) => (
            <a key={l} className="btn" href={l} target="_blank" rel="noopener noreferrer">
              {new URL(l).hostname.replace('www.', '')} ↗
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
