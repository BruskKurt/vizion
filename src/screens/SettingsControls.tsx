import type { ComponentChildren } from 'preact'
import { useLayoutEffect } from 'preact/hooks'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useFocusScroll } from '../navigation/use-focus-scroll'

export function Card(props: {
  focusKey: string
  label: string
  sub?: string
  right?: ComponentChildren
  selected?: boolean
  compact?: boolean
  danger?: boolean
  onPress: () => void
  onArrowPress?: (direction: string) => boolean
}) {
  const { ref, focused, focusSelf } = useFocusable({
    focusKey: props.focusKey,
    onEnterPress: props.onPress,
    onArrowPress: props.onArrowPress,
  })

  useLayoutEffect(() => {
    if (focused) (ref.current as HTMLElement | null)?.focus({ preventScroll: true })
  }, [focused])
  useFocusScroll(ref, focused)

  return (
    <button
      ref={ref}
      type="button"
      className={`settings-card${props.compact ? ' compact' : ''}${props.danger ? ' danger' : ''}`}
      data-focused={focused}
      data-focus-key={props.focusKey}
      aria-pressed={props.selected}
      onFocus={() => { if (!focused) focusSelf() }}
      onClick={() => { focusSelf(); props.onPress() }}
    >
      <span className="settings-card-copy">
        <span className="settings-card-label">{props.label}</span>
        {props.sub && <span className="settings-card-sub">{props.sub}</span>}
      </span>
      {props.right && <span className="settings-card-right">{props.right}</span>}
    </button>
  )
}

export function Section(props: { title: string; meta?: string; children: ComponentChildren }) {
  return (
    <section className="settings-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 18,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 30, lineHeight: 1.12, fontWeight: 850 }}>{props.title}</h2>
        {props.meta && (
          <div className="section-label" style={{ whiteSpace: 'nowrap' }}>
            {props.meta}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gap: 14 }}>
        {props.children}
      </div>
    </section>
  )
}

export function Pill({ children, active = false }: { children: ComponentChildren; active?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 34,
        padding: '7px 12px',
        borderRadius: 8,
        border: '1px solid var(--hairline)',
        background: active ? 'var(--accent-soft)' : 'rgba(255,255,255,0.06)',
        color: active ? 'var(--text)' : 'var(--text-dim)',
        fontSize: 15,
        fontWeight: 800,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

