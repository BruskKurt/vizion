import { useEffect } from 'preact/hooks'
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import { t } from '../i18n'

interface Props {
  onCancel: () => void
  onConfirm: () => void
}

function ActionButton(props: { focusKey: string; label: string; primary?: boolean; onPress: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: props.focusKey,
    onEnterPress: props.onPress,
  })
  return (
    <button
      ref={ref}
      type="button"
      onClick={props.onPress}
      style={{
        minWidth: 220,
        padding: '18px 28px',
        border: 0,
        borderRadius: 10,
        fontSize: 24,
        fontWeight: 800,
        cursor: 'pointer',
        color: 'var(--text)',
        background: focused ? 'var(--focus-bg)' : props.primary ? 'var(--active-bg)' : 'var(--surface)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        transition: 'background var(--dur) var(--ease), color var(--dur) var(--ease)',
      }}
    >
      {props.label}
    </button>
  )
}

export function ExitConfirm({ onCancel, onConfirm }: Props) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'exit-confirm',
    isFocusBoundary: true,
    preferredChildFocusKey: 'exit-cancel',
    saveLastFocusedChild: false,
  })

  useEffect(() => { setFocus('exit-cancel') }, [])

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          background: 'rgba(0,0,0,0.68)',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-title"
          style={{
            width: 'min(760px, 100%)',
            padding: '42px 46px',
            borderRadius: 12,
            border: '1px solid var(--hairline)',
            background: 'var(--panel)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.6)',
          }}
        >
          <h2 id="exit-title" style={{ fontSize: 36, lineHeight: 1.12, fontWeight: 850, marginBottom: 16 }}>
            {t('exit.title')}
          </h2>
          <p style={{ fontSize: 22, lineHeight: 1.4, color: 'var(--text-dim)', marginBottom: 34 }}>
            {t('exit.description')}
          </p>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'flex-end' }}>
            <ActionButton focusKey="exit-cancel" label={t('common.cancel')} primary onPress={onCancel} />
            <ActionButton focusKey="exit-confirm-ok" label={t('exit.quit')} onPress={onConfirm} />
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}
