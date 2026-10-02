import { useState } from 'react'
import { Widget, Buttons, NumberInput, fmt } from './_ui'

export const meta = { title: 'Ordrebog og matching', course: 'quant' }

interface Order {
  id: number
  side: 'buy' | 'sell'
  price: number
  qty: number
}
interface Trade {
  price: number
  qty: number
  aggressor: 'buy' | 'sell'
}

const INITIAL: Order[] = [
  { id: 1, side: 'sell', price: 100.3, qty: 300 },
  { id: 2, side: 'sell', price: 100.2, qty: 200 },
  { id: 3, side: 'sell', price: 100.2, qty: 100 },
  { id: 4, side: 'sell', price: 100.5, qty: 500 },
  { id: 5, side: 'buy', price: 100.0, qty: 400 },
  { id: 6, side: 'buy', price: 99.9, qty: 200 },
  { id: 7, side: 'buy', price: 99.9, qty: 300 },
  { id: 8, side: 'buy', price: 99.7, qty: 600 },
]

/** Price–time priority matching. */
function submit(book: Order[], o: Omit<Order, 'id'> & { market: boolean }, nextId: number): { book: Order[]; trades: Trade[] } {
  const b = book.map((x) => ({ ...x }))
  const trades: Trade[] = []
  let left = o.qty
  const opp = b.filter((x) => x.side !== o.side).sort((x, y) => (o.side === 'buy' ? x.price - y.price : y.price - x.price) || x.id - y.id)
  for (const r of opp) {
    if (!left) break
    const crosses = o.market || (o.side === 'buy' ? r.price <= o.price : r.price >= o.price)
    if (!crosses) break
    const q = Math.min(left, r.qty)
    trades.push({ price: r.price, qty: q, aggressor: o.side })
    r.qty -= q
    left -= q
  }
  const rest = b.filter((x) => x.qty > 0)
  if (left && !o.market) rest.push({ id: nextId, side: o.side, price: o.price, qty: left })
  return { book: rest, trades }
}

export default function OrderBook() {
  const [book, setBook] = useState(INITIAL)
  const [log, setLog] = useState<Trade[][]>([])
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [kind, setKind] = useState<'market' | 'limit'>('market')
  const [qty, setQty] = useState(250)
  const [price, setPrice] = useState(100.25)
  const [nextId, setNextId] = useState(100)
  const asks = book.filter((o) => o.side === 'sell').sort((a, b) => b.price - a.price || a.id - b.id)
  const bids = book.filter((o) => o.side === 'buy').sort((a, b) => b.price - a.price || a.id - b.id)
  const bestAsk = Math.min(...asks.map((a) => a.price))
  const bestBid = Math.max(...bids.map((a) => a.price))
  const maxQty = Math.max(...book.map((o) => o.qty), 1)
  const go = () => {
    const res = submit(book, { side, price, qty, market: kind === 'market' }, nextId)
    setBook(res.book)
    setLog([res.trades, ...log].slice(0, 6))
    setNextId(nextId + 1)
  }
  const row = (o: Order) => (
    <div key={o.id} className="grid items-center gap-2 text-sm" style={{ gridTemplateColumns: '4.5rem 1fr 3.5rem' }}>
      <span className="text-right font-mono" style={{ color: o.side === 'sell' ? 'var(--bad)' : 'var(--ok)' }}>
        {fmt(o.price, 2)}
      </span>
      <span className="h-4 rounded" style={{ width: `${(o.qty / maxQty) * 100}%`, background: o.side === 'sell' ? 'var(--bad-soft)' : 'var(--ok-soft)' }} />
      <span className="text-right font-mono">{o.qty}</span>
    </div>
  )
  return (
    <Widget title="Ordrebog: pris–tid-prioritet" icon="📒">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="space-y-1">
            <div className="muted grid text-xs" style={{ gridTemplateColumns: '4.5rem 1fr 3.5rem' }}>
              <span className="text-right">pris</span>
              <span />
              <span className="text-right">antal</span>
            </div>
            {asks.map(row)}
            <div className="muted border-y py-1 text-center text-xs" style={{ borderColor: 'var(--border)' }}>
              spread {Number.isFinite(bestAsk) && Number.isFinite(bestBid) ? fmt(bestAsk - bestBid, 2) : '—'} · mid {Number.isFinite(bestAsk) && Number.isFinite(bestBid) ? fmt((bestAsk + bestBid) / 2, 3) : '—'}
            </div>
            {bids.map(row)}
          </div>
        </div>
        <div className="space-y-2">
          <Buttons options={[{ id: 'buy', label: 'Køb' }, { id: 'sell', label: 'Sælg' }]} value={side} onChange={setSide} />
          <Buttons options={[{ id: 'market', label: 'Markedsordre' }, { id: 'limit', label: 'Limitordre' }]} value={kind} onChange={setKind} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Antal" value={qty} step={50} min={1} onChange={setQty} />
            {kind === 'limit' && <NumberInput label="Limitpris" value={price} step={0.05} onChange={setPrice} />}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={go} disabled={qty <= 0}>
              Send ordre
            </button>
            <button className="btn" onClick={() => (setBook(INITIAL), setLog([]))}>
              Nulstil
            </button>
          </div>
          <div className="space-y-1 text-sm">
            {log.map((ts, i) => (
              <div key={i} className={i ? 'muted' : ''}>
                {ts.length
                  ? `${ts.map((t) => `${t.qty} @ ${fmt(t.price, 2)}`).join(', ')} — gns. ${fmt(ts.reduce((s, t) => s + t.price * t.qty, 0) / ts.reduce((s, t) => s + t.qty, 0), 3)}`
                  : 'Ingen handel — ordren hviler i bogen.'}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="muted text-sm">En markedsordre "går gennem bogen" og betaler spreadet (og mere, hvis den er stor). En limitordre, der ikke krydser, lægger sig i køen bagest ved sin pris.</p>
    </Widget>
  )
}
