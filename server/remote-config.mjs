import http from 'node:http'
import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const token = () => randomBytes(32).toString('base64url')
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const TTL = 10 * 60_000
const validEnvelope = e => e && ['key', 'iv', 'data'].every(k => typeof e[k] === 'string' && /^[A-Za-z0-9+/=]+$/.test(e[k])) && e.key.length === 344 && e.iv.length === 16 && e.data.length <= 48000

/** Single-process, ephemeral relay. No credentials or payloads are logged or written to disk. */
export function createRemoteServer({ ttl = TTL, dist = resolve('dist'), now = Date.now, maxSessions = 1000, trustProxy = false } = {}) {
  const sessions = new Map()
  const rates = new Map()
  function prune() {
    for (const [id, s] of sessions) if (s.expiresAt <= now()) sessions.delete(id)
    for (const [key, r] of rates) if (r.until <= now()) rates.delete(key)
  }
  function limited(key, limit) {
    let r = rates.get(key)
    if (!r || r.until <= now()) { r = { count: 0, until: now() + 60_000 }; rates.set(key, r) }
    return ++r.count > limit
  }
  const janitor = setInterval(prune, 30_000)
  janitor.unref()
  const server = http.createServer(async (req, res) => {
    const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" }
    const send = (status, body) => { res.writeHead(status, { ...headers, 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
    try {
      prune()
      const url = new URL(req.url, 'http://localhost')
      if (req.method === 'OPTIONS') { res.writeHead(204, headers); res.end(); return }
      if (url.pathname === '/health') { send(200, { ok: true }); return }
      if (!url.pathname.startsWith('/api/')) {
        const path = url.pathname === '/' || url.pathname === '/remote.html' ? '/remote.html' : url.pathname
        if (!/^\/(remote\.html|icon\.png|assets\/[\w.-]+)$/.test(path)) { send(404, {}); return }
        const data = await readFile(resolve(dist, '.' + path))
        res.writeHead(200, { ...headers, 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(path)] ?? 'application/octet-stream' })
        res.end(data); return
      }
      // Trust forwarded addresses only behind the private reverse proxy (never expose that port).
      const forwarded = req.headers['x-forwarded-for']
      const peer = trustProxy && typeof forwarded === 'string' ? forwarded.split(',').at(-1).trim() : req.socket.remoteAddress ?? 'unknown'
      if (limited(`all:${peer}`, 240)) { send(429, {}); return }
      let body
      if (req.method === 'POST') {
        let size = 0; const chunks = []
        for await (const chunk of req) {
          size += chunk.length
          if (size > 65536) { send(413, {}); return }
          chunks.push(chunk)
        }
        try { body = JSON.parse(Buffer.concat(chunks).toString()) } catch { send(400, {}); return }
      }
      if (url.pathname === '/api/sessions' && req.method === 'POST') {
        if (limited(`create:${peer}`, 10) || sessions.size >= maxSessions) { send(429, {}); return }
        if (body?.publicKey?.kty !== 'RSA' || body.publicKey.d || typeof body.publicKey.n !== 'string' || body.publicKey.n.length !== 342 || body.publicKey.e !== 'AQAB' || !Array.isArray(body.metadata?.playlists) || body.metadata.playlists.length > 20) { send(400, {}); return }
        // Whitelist metadata. Secrets can only travel inside the encrypted envelope.
        const playlists = body.metadata.playlists.map(p => ({ id: String(p.id).slice(0,100), name: String(p.name).slice(0,100), kind: p.kind === 'm3u' ? 'm3u' : 'xtream' }))
        const id = token(); const tvToken = token(); const phoneToken = token()
        let code
        do { code = String(randomInt(0, 100000000)).padStart(8, '0') } while ([...sessions.values()].some(s => s.code === code))
        const s = { id, tvToken, phoneToken, code, expiresAt: now() + ttl, status: 'waiting', publicKey: { kty: 'RSA', n: body.publicKey.n, e: 'AQAB', alg: 'RSA-OAEP-256', ext: true }, metadata: { playlists, liveId: body.metadata.liveId, vodId: body.metadata.vodId }, claimed: false }
        sessions.set(id, s)
        send(201, { id, tvToken, phoneToken, code, expiresAt: s.expiresAt }); return
      }
      if (url.pathname === '/api/claim' && req.method === 'POST') {
        if (limited(`claim:${peer}`, 5)) { send(429, {}); return }
        const s = [...sessions.values()].find(s => equal(s.code, body?.code) && !s.claimed && s.status === 'waiting')
        if (!s) { send(404, {}); return }
        s.claimed = true
        send(200, { id: s.id, phoneToken: s.phoneToken }); return
      }
      const match = url.pathname.match(/^\/api\/sessions\/([\w-]+)(?:\/(submit|ack))?$/)
      if (!match) { send(404, {}); return }
      const s = sessions.get(match[1])
      if (!s) { send(410, {}); return }
      const auth = req.headers.authorization?.replace(/^Bearer /, '')
      const tv = equal(auth, s.tvToken)
      const phone = equal(auth, s.phoneToken)
      if (!tv && !phone) { send(403, {}); return }
      if (req.method === 'DELETE' && tv) { sessions.delete(s.id); send(200, {}); return }
      if (req.method === 'GET' && !match[2]) {
        if (phone) s.claimed = true
        send(200, { status: s.status, submissionId: s.submissionId, expiresAt: s.expiresAt,
          ...(tv ? { envelope: s.envelope } : { publicKey: s.publicKey, metadata: s.metadata }) }); return
      }
      if (match[2] === 'submit' && req.method === 'POST' && phone) {
        if (typeof body?.submissionId !== 'string' || !/^[\w-]{10,100}$/.test(body.submissionId) || !validEnvelope(body.envelope)) { send(400, {}); return }
        if (s.submissionId === body.submissionId) { send(200, { status: s.status }); return }
        if (s.status === 'received' || s.status === 'applied') { send(409, {}); return }
        s.submissionId = body.submissionId; s.envelope = body.envelope; s.status = 'received'; s.claimed = true
        send(200, { status: s.status }); return
      }
      if (match[2] === 'ack' && req.method === 'POST' && tv) {
        if (body?.submissionId !== s.submissionId || !['applied','error'].includes(body.status)) { send(400, {}); return }
        if (s.status === 'received') {
          s.status = body.status
          delete s.envelope
          if (s.status === 'applied') { delete s.publicKey; delete s.metadata }
        }
        send(200, { status: s.status }); return
      }
      send(403, {})
    } catch (error) { if (!res.headersSent) send(error?.code === 'ENOENT' ? 404 : 500, {}) }
  })
  server.requestTimeout = 15000
  server.headersTimeout = 10000
  server.on('close', () => clearInterval(janitor))
  return server
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8789)
  createRemoteServer({ trustProxy: process.env.TRUST_PROXY === '1' }).listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`Vizion remote setup listening on port ${port}`))
}
