import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { encryptConfiguration, randomId, type Envelope } from './crypto'
import { remoteRequest, type SetupState } from './api'
import { validateConfiguration, type PlaylistDraft, type SetupMetadata } from './configuration'
import './mobile.css'

type Connection = { id: string; phoneToken: string }
const base = import.meta.env.DEV ? 'http://localhost:8789' : location.origin
function fromHash(): Connection | null {
  const [id, phoneToken] = location.hash.slice(1).split('/')
  return /^[\w-]{43}$/.test(id ?? '') && /^[\w-]{43}$/.test(phoneToken ?? '') ? { id, phoneToken } : null
}
const emptyPlaylist = (): PlaylistDraft => ({ id: randomId(), name: '', kind: 'xtream', host: '', username: '', password: '', m3uUrl: '' })

function MobileSetup() {
  const [connection, setConnection] = useState<Connection | null>(fromHash)
  const [code, setCode] = useState('')
  const [playlists, setPlaylists] = useState<PlaylistDraft[]>([])
  const [liveId, setLiveId] = useState('')
  const [vodId, setVodId] = useState('')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [expiresAt, setExpiresAt] = useState(0)
  const [remaining, setRemaining] = useState(600)
  const publicKey = useRef<JsonWebKey | null>(null)
  const payload = useRef<{ submissionId: string; envelope: Envelope } | null>(null)
  const initialized = useRef(false)
  const lastSeenSubmission = useRef('')
  const sending = useRef(false)
  const locked = ['sending','received','applied','expired','uncertain'].includes(status)

  function initialize(metadata: SetupMetadata) {
    const drafts: PlaylistDraft[] = metadata.playlists.map(p => ({ ...p, existingId: p.id, keep: true }))
    if (!drafts.length) drafts.push(emptyPlaylist())
    setPlaylists(drafts)
    setLiveId(metadata.liveId ?? drafts[0].id)
    setVodId(metadata.vodId ?? drafts[0].id)
  }
  useEffect(() => {
    if (!connection) return
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    async function poll() {
      try {
        const state = await remoteRequest<SetupState>(base, `/sessions/${connection!.id}`, connection!.phoneToken, undefined, 'GET', controller.signal)
        if (!alive) return
        setExpiresAt(state.expiresAt)
        if (state.publicKey) publicKey.current = state.publicKey
        if (!initialized.current && state.metadata) { initialize(state.metadata); initialized.current = true; setStatus(state.status === 'error' ? 'editing' : state.status === 'waiting' ? 'editing' : state.status) }
        if (state.status === 'applied') { setStatus('applied'); setMessage(''); setPlaylists([]); payload.current = null; return }
        if (state.status === 'received') setStatus('received')
        if (state.status === 'error' && lastSeenSubmission.current !== state.submissionId) {
          lastSeenSubmission.current = state.submissionId ?? ''
          payload.current = null
          setStatus('editing'); setMessage('La TV n’a pas pu valider ou enregistrer ces sources. Vérifiez les identifiants. Les playlists précédentes sont conservées.')
        }
      } catch (error) {
        if (!alive) return
        if ((error as Error).message === 'expired') { setStatus('expired'); setPlaylists([]); payload.current = null; return }
        if (!initialized.current) setMessage('Connexion au service impossible. Nouvelle tentative en cours…')
      }
      if (alive) timer = setTimeout(poll, 2000)
    }
    void poll()
    return () => { alive = false; controller.abort(); clearTimeout(timer) }
  }, [connection])
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => setRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
    tick(); const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])
  async function claim(event: Event) {
    event.preventDefault(); setMessage(''); setClaiming(true)
    try {
      const next = await remoteRequest<Connection>(base, '/claim', undefined, { code: code.replace(/\s/g, '') })
      history.replaceState(null, '', `#${next.id}/${next.phoneToken}`)
      setConnection(next)
    } catch (error) { setMessage((error as Error).message === 'rate-limit' ? 'Trop de tentatives. Réessayez dans une minute.' : 'Code invalide, déjà utilisé ou expiré. Générez un nouveau QR code sur la TV.') }
    finally { setClaiming(false) }
  }
  function update(id: string, patch: Partial<PlaylistDraft>) {
    setPlaylists(current => current.map(p => p.id === id ? { ...p, ...patch } : p))
  }
  function remove(id: string) {
    const next = playlists.filter(p => p.id !== id)
    setPlaylists(next)
    if (liveId === id) setLiveId(next[0]?.id ?? '')
    if (vodId === id) setVodId(next[0]?.id ?? '')
  }
  async function save(event: Event) {
    event.preventDefault()
    if (!connection || !publicKey.current || sending.current) return
    sending.current = true; setMessage(''); setStatus('sending')
    try {
      if (!payload.current) {
        const configuration = { playlists, liveId, vodId }
        validateConfiguration(configuration)
        payload.current = { submissionId: randomId(), envelope: await encryptConfiguration(publicKey.current, configuration) }
      }
      await remoteRequest(base, `/sessions/${connection.id}/submit`, connection.phoneToken, payload.current)
      setStatus('received')
    } catch (error) {
      setStatus(payload.current ? 'uncertain' : 'editing')
      setMessage(payload.current ? 'Envoi non confirmé. Vous pouvez renvoyer la même configuration sans créer de doublon.' : 'Complétez les champs et utilisez une adresse http:// ou https:// valide.')
    } finally { sending.current = false }
  }
  const field = (p: PlaylistDraft, key: 'name' | 'host' | 'username' | 'password' | 'm3uUrl', label: string, type = 'text', placeholder = '') => <label>{label}<input required maxLength={key === 'name' ? 100 : key === 'password' || key === 'username' ? 512 : 4096} type={type} value={p[key] ?? ''} placeholder={placeholder} autoCapitalize="none" autoCorrect="off" spellcheck={false} autoComplete={key === 'password' ? 'new-password' : 'off'} onInput={e => update(p.id, { [key]: e.currentTarget.value })} /></label>

  return <main className="mobile-shell"><header><a className="wordmark" href="/remote.html">VIZION</a><span>Configuration TV</span></header>
    {!connection ? <section className="intro"><span className="eyebrow">VOTRE TÉLÉPHONE, VOTRE CLAVIER</span><h1>Vos playlists.<br />Sur grand écran.</h1><p>Ouvrez « Configurer à distance » sur votre TV, puis entrez le code affiché.</p><form onSubmit={claim}><label>Code de la TV<input className="code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{8,9}" required maxLength={9} placeholder="1234 5678" value={code} onInput={e => setCode(e.currentTarget.value)} /></label><button className="primary" disabled={claiming}>{claiming ? 'Connexion…' : 'Connecter ma TV'}</button></form></section>
    : status === 'applied' ? <section className="result" role="status"><span className="success-mark">✓</span><h1>Votre TV est prête.</h1><p>Vos playlists ont été vérifiées et enregistrées sur la TV. Vous pouvez fermer cette page.</p></section>
    : status === 'expired' ? <section className="result" role="status"><h1>Cette session est terminée.</h1><p>Générez un nouveau QR code depuis votre TV pour continuer.</p><a className="button" href="/remote.html">Entrer un nouveau code</a></section>
    : <><div className="page-heading"><span className="eyebrow">CONNECTÉ À VOTRE TV</span><h1>Configurer mes playlists</h1><p>Ajoutez vos sources, choisissez où les utiliser, puis enregistrez. Gardez l’écran de configuration ouvert sur la TV.</p>{expiresAt > 0 && <small>Session valable encore {Math.floor(remaining / 60)} min {remaining % 60} s</small>}</div>
      {!initialized.current ? <p role="status">Connexion à la TV…</p> : <form onSubmit={save}>
        <fieldset disabled={locked}><legend>Vos playlists</legend>
          {playlists.map((p, index) => <article className="playlist-card" key={p.id}><div className="card-heading"><h2>{p.keep ? p.name : `Playlist ${index + 1}`}</h2><button type="button" className="text-button" onClick={() => remove(p.id)} aria-label={`Retirer ${p.name || `playlist ${index + 1}`}`}>Retirer</button></div>
            {p.keep ? <><p className="muted">{p.kind === 'xtream' ? 'Xtream' : 'M3U'} · Déjà enregistrée sur la TV</p><button type="button" className="secondary" onClick={() => update(p.id, { keep: false })}>Modifier les identifiants</button></>
            : <>{field(p, 'name', 'Nom de la playlist', 'text', 'Ex. Salon')}<label>Type de source<select value={p.kind} onChange={e => update(p.id, { kind: e.currentTarget.value as 'xtream' | 'm3u' })}><option value="xtream">Xtream Codes</option><option value="m3u">Lien M3U</option></select></label>
              {p.existingId && <p className="muted">Saisissez à nouveau les identifiants. Les mots de passe enregistrés restent sur la TV.</p>}
              {p.kind === 'xtream' ? <>{field(p, 'host', 'Adresse du serveur', 'url', 'https://serveur.exemple:8080')}<div className="credentials">{field(p, 'username', 'Nom d’utilisateur')}{field(p, 'password', 'Mot de passe', 'password')}</div></> : field(p, 'm3uUrl', 'Adresse de la playlist M3U', 'url', 'https://…/playlist.m3u')}
            </>}
          </article>)}
          <button type="button" className="secondary add-playlist" disabled={playlists.length >= 20} onClick={() => { const next = emptyPlaylist(); setPlaylists([...playlists, next]); if (!playlists.length) { setLiveId(next.id); setVodId(next.id) } }}>+ Ajouter une playlist</button>
          <section className="source-selection"><h2>Utiliser mes sources pour…</h2><div className="credentials"><label>Direct<select required value={liveId} onChange={e => setLiveId(e.currentTarget.value)}>{playlists.map((p,i) => <option value={p.id}>{p.name || `Playlist ${i+1}`}</option>)}</select></label><label>Films et séries<select required value={vodId} onChange={e => setVodId(e.currentTarget.value)}>{playlists.map((p,i) => <option value={p.id}>{p.name || `Playlist ${i+1}`}</option>)}</select></label></div><p className="muted">Les sources M3U sont actuellement disponibles pour le Direct uniquement.</p></section>
        </fieldset>
        <div className="save-bar"><p role="status">{status === 'received' ? 'La TV vérifie et enregistre vos playlists…' : status === 'sending' ? 'Envoi sécurisé…' : 'Les changements seront appliqués après validation sur la TV.'}</p><button className="primary" disabled={['sending','received'].includes(status) || !playlists.length}>{status === 'uncertain' ? 'Renvoyer la configuration' : 'Enregistrer sur la TV'}</button></div>
      </form>}
    </>}
    {message && <p className="error" role="alert">{message}</p>}
    <footer>Transfert chiffré · Aucun compte Vizion nécessaire</footer>
  </main>
}
render(<MobileSetup />, document.getElementById('remote-app')!)
