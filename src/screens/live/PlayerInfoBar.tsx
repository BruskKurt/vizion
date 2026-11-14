import type { Channel, EpgEntry } from '../../data/models'
import { currentEntry, progressPct } from '../../components/epg'

interface Props {
  channel: Channel
  epg: EpgEntry[]
  nowSec: number
  visible: boolean
}

export function PlayerInfoBar({ channel, epg, nowSec, visible }: Props) {
  const now = currentEntry(epg, nowSec)
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '64px 72px 46px', background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
        opacity: visible ? 1 : 0, transition: 'opacity var(--dur) var(--ease)', pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {channel.number != null && <span style={{ fontSize: 38, fontWeight: 850, color: 'var(--text-dim)' }}>{channel.number}</span>}
        <span style={{ fontSize: 40, fontWeight: 850 }}>{channel.name}</span>
      </div>
      {now && (
        <>
          <div style={{ fontSize: 24, marginTop: 10 }}>{now.title}</div>
          <div style={{ height: 7, width: 460, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 14 }}>
            <div style={{ height: '100%', width: `${progressPct(now, nowSec)}%`, background: '#fff', borderRadius: 4 }} />
          </div>
        </>
      )}
    </div>
  )
}
