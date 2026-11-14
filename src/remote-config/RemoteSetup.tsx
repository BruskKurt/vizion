import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { FocusContext, useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation'
import QRCode from 'qrcode'
import { ActionButton } from '../components/ActionButton'
import { useBackHandler } from '../navigation/back-handlers'
import { profileStore } from '../profiles/store'
import { providerForProfile } from '../data/provider-factory'
import { nowPlaying } from '../screens/live/now-playing'
import { prepareConfiguration, setupMetadata } from './configuration'
import { createReceiver, decryptConfiguration } from './crypto'
import { REMOTE_URL, remoteRequest, type Pairing, type SetupState } from './api'
import { t } from '../i18n'

export function RemoteSetup({ onClose }: { onClose: () => void }) {
  const { ref, focusKey } = useFocusable({ focusKey: 'remote-setup', isFocusBoundary: true })
  const [pairing, setPairing] = useState<Pairing | null>(null)
  const [qr, setQr] = useState('')
  const [attempt, renew] = useState(0)
  const [status, setStatus] = useState<'loading' | 'waiting' | 'received' | 'applied' | 'error' | 'unavailable' | 'expired'>('loading')
  const [seconds, setSeconds] = useState(600)
  const busy = useRef(false)
  const close = useCallback(() => { if (!busy.current) onClose() }, [onClose])
  useBackHandler(useCallback(() => { close(); return true }, [close]))
  useEffect(() => { setFocus('remote-close') }, [])
  useEffect(() => {
    let alive = true
    let session: Pairing | null = null
    let timer: ReturnType<typeof setTimeout>
    let receipt: { submissionId: string; status: 'applied' | 'error' } | null = null
    let completed = false
    const controller = new AbortController()
    setStatus('loading'); setPairing(null); setQr('')
    async function start() {
      if (!REMOTE_URL) { setStatus('unavailable'); return }
      try {
        const receiver = await createReceiver()
        session = await remoteRequest<Pairing>(REMOTE_URL, '/sessions', undefined, { publicKey: receiver.publicKey, metadata: setupMetadata(profileStore) }, 'POST', controller.signal)
        if (!alive) { void remoteRequest(REMOTE_URL, `/sessions/${session.id}`, session.tvToken, undefined, 'DELETE').catch(() => {}); return }
        setPairing(session)
        setQr(await QRCode.toDataURL(`${REMOTE_URL}/remote.html#${session.id}/${session.phoneToken}`, { width: 640, margin: 4, errorCorrectionLevel: 'M' }))
        setStatus('waiting')
        async function poll() {
          if (!alive || !session) return
          if (Date.now() >= session.expiresAt) { busy.current = false; setStatus('expired'); return }
          try {
            const state = await remoteRequest<SetupState>(REMOTE_URL, `/sessions/${session.id}`, session.tvToken, undefined, 'GET', controller.signal)
            if (!alive) return
            if (state.status === 'received' && state.envelope && state.submissionId) {
              busy.current = true; setStatus('received')
              if (receipt?.submissionId !== state.submissionId) {
                try {
                  const original = profileStore.profiles.value
                  const originalLive = profileStore.liveProfileId.value
                  const originalVod = profileStore.vodProfileId.value
                  const config = await decryptConfiguration(receiver.privateKey, state.envelope)
                  const next = await prepareConfiguration(config, original, providerForProfile)
                  if (!alive) return
                  if (Date.now() >= session!.expiresAt) throw new Error('Session expired')
                  if (original !== profileStore.profiles.value || originalLive !== profileStore.liveProfileId.value || originalVod !== profileStore.vodProfileId.value) throw new Error('Configuration changed')
                  profileStore.replaceConfiguration(next)
                  nowPlaying.value = null
                  receipt = { submissionId: state.submissionId, status: 'applied' }
                  completed = true
                } catch {
                  receipt = { submissionId: state.submissionId, status: 'error' }
                }
              }
              // Retries only this acknowledgement if the network drops after a durable save.
              await remoteRequest(REMOTE_URL, `/sessions/${session.id}/ack`, session.tvToken, receipt, 'POST', controller.signal)
              busy.current = false
              setStatus(receipt.status === 'applied' ? 'applied' : 'error')
              if (receipt.status === 'applied') return
            }
          } catch (error) {
            if (!alive) return
            if ((error as Error).message === 'expired') { busy.current = false; setStatus('expired'); return }
            // Transient failures retry until expiry; a saved submission is never reapplied.
          }
          if (alive) timer = setTimeout(poll, 2000)
        }
        void poll()
      } catch { if (alive) setStatus('unavailable') }
    }
    void start()
    return () => {
      alive = false; busy.current = false; controller.abort(); clearTimeout(timer)
      if (session && !completed) void remoteRequest(REMOTE_URL, `/sessions/${session.id}`, session.tvToken, undefined, 'DELETE').catch(() => {})
    }
  }, [attempt])
  useEffect(() => {
    if (!pairing) return
    const update = () => setSeconds(Math.max(0, Math.ceil((pairing.expiresAt - Date.now()) / 1000)))
    update(); const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [pairing])
  const message = status === 'loading' ? t('common.loading') : status === 'error' ? t('remote.failed') : t(`remote.${status}`)
  return <FocusContext.Provider value={focusKey}><div ref={ref} className="remote-setup">
    <div className="section-label">VIZION</div><h1>{t('remote.title')}</h1>
    {pairing && qr && !['applied','expired'].includes(status) && <>
      <p>{t('remote.intro')}</p>
      <div className="remote-setup-content"><img className="remote-qr" src={qr} alt="QR code" /><div>
        <p>{t('remote.or')}</p><p>{REMOTE_URL}/remote.html</p>
        <div className="remote-code">{pairing.code.slice(0,4)} {pairing.code.slice(4)}</div>
        <p>{t('remote.expires', { seconds })}</p>
      </div></div>
    </>}
    <p role="status" aria-live="polite">{message}</p>
    <div className="remote-actions">
      <ActionButton focusKey="remote-close" onPress={close} disabled={status === 'received'}>{t('common.close')}</ActionButton>
      {['expired','unavailable'].includes(status) && <ActionButton onPress={() => renew(n => n + 1)}>{t('remote.renew')}</ActionButton>}
    </div>
  </div></FocusContext.Provider>
}
