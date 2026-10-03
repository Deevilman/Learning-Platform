import { Link } from 'react-router-dom'
import { useT } from '@/i18n'

export default function NotFound() {
  const t = useT()
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-xl font-bold">{t('notFound.title')}</h1>
      <p className="muted my-2">{t('notFound.text')}</p>
      <Link className="btn btn-primary" to="/">
        {t('notFound.home')}
      </Link>
    </div>
  )
}
