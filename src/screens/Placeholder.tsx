import { t } from '../i18n'

export function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: '72px 80px' }}>
      <h1 style={{ fontSize: 52, fontWeight: 850 }}>{title}</h1>
      <p style={{ marginTop: 18, color: 'var(--text-dim)', fontSize: 24 }}>{t('placeholder.comingSoon')}</p>
    </div>
  )
}
