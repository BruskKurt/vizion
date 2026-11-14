import { useCallback, useEffect } from 'preact/hooks'
import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useBackHandler } from '../navigation/back-handlers'
import { t } from '../i18n'

const DONATE_URL = 'https://nowave.io/vizion/donate'
const DONATE_DISPLAY_URL = 'nowave.io/vizion/donate'
const DONATE_CLOSE = 'donate-close'

function DonateQr() {
  return (
    <svg
      aria-label={DONATE_DISPLAY_URL}
      role="img"
      viewBox="0 0 37 37"
      shapeRendering="crispEdges"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    >
      <title>{DONATE_URL}</title>
      <path fill="#ffffff" d="M0 0h37v37H0z" />
      <path
        stroke="#000000"
        d="M4 4.5h7m2 0h1m5 0h6m1 0h7M4 5.5h1m5 0h1m4 0h1m5 0h1m2 0h1m1 0h1m5 0h1M4 6.5h1m1 0h3m1 0h1m1 0h1m5 0h1m1 0h1m5 0h1m1 0h3m1 0h1M4 7.5h1m1 0h3m1 0h1m1 0h1m7 0h2m1 0h1m2 0h1m1 0h3m1 0h1M4 8.5h1m1 0h3m1 0h1m1 0h3m2 0h3m1 0h4m1 0h1m1 0h3m1 0h1M4 9.5h1m5 0h1m1 0h3m1 0h6m4 0h1m5 0h1M4 10.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M12 11.5h2m1 0h3m1 0h1m2 0h2M4 12.5h1m1 0h5m2 0h3m2 0h2m1 0h4m1 0h5M6 13.5h1m1 0h2m1 0h3m1 0h1m3 0h6m1 0h3m3 0h1M4 14.5h5m1 0h1m10 0h1m2 0h1m2 0h2M4 15.5h4m4 0h1m1 0h2m2 0h1m1 0h1m4 0h2m1 0h2m1 0h1M5 16.5h1m2 0h1m1 0h2m3 0h1m4 0h2m1 0h1m5 0h2M6 17.5h1m1 0h1m3 0h1m1 0h2m1 0h3m2 0h7m3 0h1M4 18.5h1m1 0h1m2 0h3m1 0h1m1 0h1m1 0h4m6 0h1m1 0h2M4 19.5h3m1 0h1m2 0h1m1 0h2m2 0h1m1 0h1m2 0h3m2 0h2m2 0h1M4 20.5h1m1 0h1m1 0h4m3 0h2m1 0h2m1 0h1m2 0h2m1 0h1m1 0h2M4 21.5h1m1 0h1m5 0h1m1 0h1m4 0h10m1 0h1m1 0h1M4 22.5h1m3 0h1m1 0h1m5 0h1m4 0h1m2 0h1m1 0h2m2 0h1M4 23.5h1m1 0h2m5 0h4m1 0h1m1 0h1m2 0h5m3 0h1M4 24.5h1m3 0h1m1 0h3m2 0h1m5 0h1m1 0h6m1 0h3M12 25.5h2m1 0h1m1 0h3m1 0h2m1 0h1m3 0h5M4 26.5h7m4 0h7m1 0h2m1 0h1m1 0h3M4 27.5h1m5 0h1m1 0h2m2 0h2m1 0h2m1 0h1m1 0h1m3 0h1m3 0h1M4 28.5h1m1 0h3m1 0h1m1 0h1m2 0h1m2 0h2m1 0h1m2 0h5m1 0h1m1 0h1M4 29.5h1m1 0h3m1 0h1m1 0h2m1 0h1m1 0h1m2 0h1m1 0h3m4 0h2M4 30.5h1m1 0h3m1 0h1m1 0h1m1 0h2m1 0h1m1 0h1m2 0h10M4 31.5h1m5 0h1m2 0h2m1 0h1m1 0h3m3 0h3m2 0h1m1 0h1M4 32.5h7m1 0h1m1 0h2m1 0h1m1 0h3m1 0h1m3 0h1m2 0h1"
      />
    </svg>
  )
}

function CloseButton(props: { onPress: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: DONATE_CLOSE,
    onEnterPress: props.onPress,
  })

  return (
    <button
      ref={ref}
      type="button"
      onClick={props.onPress}
      style={{
        minWidth: 190,
        minHeight: 62,
        padding: '16px 28px',
        border: 0,
        borderRadius: 10,
        cursor: 'pointer',
        background: focused ? 'var(--focus-bg)' : 'var(--active-bg)',
        boxShadow: focused ? 'var(--focus-glow)' : 'none',
        color: 'var(--text)',
        fontSize: 22,
        fontWeight: 850,
        transition: 'background var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
      }}
    >
      {t('common.close')}
    </button>
  )
}

export function DonateDialog({ onClose }: { onClose: () => void }) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'donate-dialog',
    isFocusBoundary: true,
    preferredChildFocusKey: DONATE_CLOSE,
    saveLastFocusedChild: false,
  })
  const close = useCallback(() => onClose(), [onClose])

  useBackHandler(useCallback(() => {
    close()
    return true
  }, [close]))

  useEffect(() => {
    const id = setTimeout(() => setFocus(DONATE_CLOSE), 0)
    return () => clearTimeout(id)
  }, [])

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
          background: 'rgba(0,0,0,0.72)',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-title"
          style={{
            width: 'min(860px, 100%)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
            gap: 34,
            alignItems: 'center',
            padding: 42,
            borderRadius: 12,
            border: '1px solid var(--hairline)',
            background: 'var(--panel)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.65)',
          }}
        >
          <div
            style={{
              width: 'min(260px, 100%)',
              aspectRatio: '1 / 1',
              padding: 14,
              borderRadius: 8,
              background: '#ffffff',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
            }}
          >
            <DonateQr />
          </div>
          <div>
            <h2 id="donate-title" style={{ fontSize: 38, lineHeight: 1.08, fontWeight: 880, marginBottom: 16 }}>
              {t('donate.title')}
            </h2>
            <p style={{ fontSize: 22, lineHeight: 1.42, color: 'var(--text-dim)', marginBottom: 22 }}>
              {t('donate.description')}
            </p>
            <div
              style={{
                display: 'inline-flex',
                maxWidth: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--hairline)',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text)',
                fontSize: 18,
                fontWeight: 750,
                overflowWrap: 'anywhere',
              }}
            >
              {DONATE_DISPLAY_URL}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 34 }}>
              <CloseButton onPress={close} />
            </div>
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}
