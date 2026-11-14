import { useState } from 'preact/hooks'
import { ActionButton } from '../components/ActionButton'
import { performanceSnapshot } from './performance'
import { t } from '../i18n'
export function PerformancePanel() {
  const [snapshot, setSnapshot] = useState<ReturnType<typeof performanceSnapshot> | null>(null)
  const labels: Record<string, string> = { startup: t('perf.startup'), navigation: t('perf.navigation'), search: t('nav.search'), playback: t('settings.playback') }
  return <section style={{ marginTop: 32 }}><h2 style={{ fontSize: 30, marginBottom: 16 }}>{t('perf.title')}</h2>
    <ActionButton onPress={() => setSnapshot(performanceSnapshot())}>{t('perf.measure')}</ActionButton>
    {snapshot && <><p style={{ margin: '16px 0' }}>{t('perf.local')}</p><table style={{ width: '100%', fontSize: 20, textAlign: 'left' }}><thead><tr><th>{t('perf.action')}</th><th>{t('perf.last')}</th><th>P95</th></tr></thead><tbody>
      {Object.entries(snapshot).map(([name, metric]) => <tr key={name}><td style={{ padding: '10px 0' }}>{labels[name]}</td><td>{metric.lastMs === null ? '—' : `${metric.lastMs} ms`}</td><td>{metric.p95Ms === null ? '—' : `${metric.p95Ms} ms`}</td></tr>)}
    </tbody></table></>}
  </section>
}
