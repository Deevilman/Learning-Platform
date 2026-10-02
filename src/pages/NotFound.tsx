import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-xl font-bold">Siden findes ikke</h1>
      <p className="muted my-2">Linket er måske forældet.</p>
      <Link className="btn btn-primary" to="/">
        Til overblikket
      </Link>
    </div>
  )
}
