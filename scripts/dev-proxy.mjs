// Proxy CORS local pour tester l'app hors TV (navigateur / simulateur webOS),
// où le CORS bloque les appels Xtream/M3U directs.
//
// Usage : node scripts/dev-proxy.mjs   (puis build avec VITE_PROXY=http://localhost:8788/)
// Forwarde toute URL passée après le « / » : GET http://localhost:8788/http://hote/...
import http from 'node:http'
import { Readable } from 'node:stream'

const PORT = Number(process.env.PROXY_PORT) || 8788

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const target = decodeURIComponent(req.url.slice(1))
  if (!/^https?:\/\//.test(target)) { res.writeHead(400); res.end('cible invalide'); return }

  try {
    const headers = {}
    if (req.headers.range) headers.range = req.headers.range
    const upstream = await fetch(target, { method: req.method, headers, redirect: 'follow' })
    res.statusCode = upstream.status
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase()
      if (k === 'content-encoding' || k === 'access-control-allow-origin' || k === 'transfer-encoding') return
      res.setHeader(key, value)
    })
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (upstream.body) Readable.fromWeb(upstream.body).pipe(res)
    else res.end()
  } catch (err) {
    res.writeHead(502)
    res.end('proxy error: ' + err.message)
  }
})

server.listen(PORT, () => console.log(`Vizion dev proxy → http://localhost:${PORT}`))
