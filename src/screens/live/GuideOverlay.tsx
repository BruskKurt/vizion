import { useFocusScroll } from '../../navigation/use-focus-scroll'
import { useEffect } from 'preact/hooks'
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import type { Channel } from '../../data/models'
import { t } from '../../i18n'

interface Props {
  channels: Channel[]
  currentId: string
  statsOn: boolean
  onToggleStats: () => void
  onSelect: (index: number) => void
}

function StatsButton(props: { statsOn: boolean; onToggle: () => void }) {
  const { ref, focused } = useFocusable({ focusKey: 'guide-stats', onEnterPress: props.onToggle })
  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={props.onToggle}
      style={{
        display: 'inline-block', padding: '12px 22px', borderRadius: 10, fontSize: 18, fontWeight: 700, cursor: 'pointer',
        background: focused ? 'var(--focus-bg)' : 'var(--surface)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease)',
      }}
    >
      {props.statsOn ? t('live.statsEnabled') : t('live.stats')}
    </div>
  )
}

function Tile(props: { channel: Channel; current: boolean; onSelect: () => void; focusKey: string }) {
  const { ref, focused } = useFocusable({ focusKey: props.focusKey, onEnterPress: props.onSelect })
  // Norigin ne défile pas tout seul : on amène la tuile focalisée dans la vue.
  useFocusScroll(ref, focused, 'center')
  return (
    <div
      ref={ref}
      data-focused={focused}
      onClick={props.onSelect}
      style={{
        minWidth: 240, padding: '18px 20px', borderRadius: 10, flexShrink: 0,
        background: focused ? 'var(--focus-bg)' : 'var(--surface)',
        color: 'var(--text)',
        boxShadow: focused ? 'var(--focus-glow)' : props.current ? 'inset 0 0 0 2px #fff' : 'none',
        transition: 'background var(--dur) var(--ease)',
      }}
    >
      <div style={{ fontSize: 21, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.channel.name}</div>
    </div>
  )
}

export function GuideOverlay({ channels, currentId, statsOn, onToggleStats, onSelect }: Props) {
  const { ref, focusKey } = useFocusable({ isFocusBoundary: true })
  const currentIndex = Math.max(0, channels.findIndex((c) => c.id === currentId))
  useEffect(() => { setFocus(`guide-${currentIndex}`) }, [focusKey, currentIndex])
  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '72px 48px 36px', background: 'linear-gradient(transparent, rgba(0,0,0,0.93))',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <StatsButton statsOn={statsOn} onToggle={onToggleStats} />
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
          {channels.map((c, i) => (
            <Tile key={c.id} channel={c} current={c.id === currentId} focusKey={`guide-${i}`} onSelect={() => onSelect(i)} />
          ))}
        </div>
      </div>
    </FocusContext.Provider>
  )
}
