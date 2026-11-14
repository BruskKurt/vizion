import { test } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createRemoteServer } from './remote-config.mjs'

const publicKey = { kty: 'RSA', n: 'a'.repeat(342), e: 'AQAB' }
const metadata = { playlists: [{ id: 'old', name: 'Salon', kind: 'xtream', password: 'must-not-leak' }], liveId: 'old', vodId: 'old' }
const envelope = { key: 'a'.repeat(344), iv: 'a'.repeat(16), data: 'a'.repeat(40) }
async function withServer(run, options) {
  const server = createRemoteServer(options)
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}/api`
  async function request(path, token, body, method = body === undefined ? 'GET' : 'POST') {
    const res = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: res.status, body: await res.json() }
  }
  try { await run(request) } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
}
test('pair, transfer, acknowledge: role separation, no plaintext secrets, idempotent delivery', async () => withServer(async request => {
  const { body: s, status } = await request('/sessions', null, { publicKey, metadata })
  assert.equal(status, 201)
  const path = `/sessions/${s.id}`
  assert.equal((await request(path, 'wrong')).status, 403)
  const phone = await request(path, s.phoneToken)
  assert.equal(phone.body.metadata.playlists[0].password, undefined)
  assert.equal(phone.body.tvToken, undefined)
  assert.equal((await request('/claim', null, { code: s.code })).status, 404)
  assert.equal((await request(path + '/submit', s.tvToken, { submissionId: 'request-12345', envelope })).status, 403)
  assert.equal((await request(path + '/submit', s.phoneToken, { submissionId: 'request-12345', envelope })).status, 200)
  assert.equal((await request(path, s.phoneToken)).body.envelope, undefined)
  assert.deepEqual((await request(path, s.tvToken)).body.envelope, envelope)
  assert.equal((await request(path + '/submit', s.phoneToken, { submissionId: 'request-12345', envelope })).body.status, 'received')
  assert.equal((await request(path + '/submit', s.phoneToken, { submissionId: 'different-123', envelope })).status, 409)
  assert.equal((await request(path + '/ack', s.phoneToken, { submissionId: 'request-12345', status: 'applied' })).status, 403)
  await request(path + '/ack', s.tvToken, { submissionId: 'request-12345', status: 'applied' })
  const applied = await request(path, s.phoneToken)
  assert.equal(applied.body.status, 'applied')
  assert.equal(applied.body.metadata, undefined)
  assert.equal((await request(path, s.tvToken)).body.envelope, undefined)
  assert.equal((await request(path + '/submit', s.phoneToken, { submissionId: 'request-12345', envelope })).body.status, 'applied')
}))
test('a rejected configuration can be corrected, and sessions expire', async () => {
  let clock = 100
  await withServer(async request => {
    const { body: s } = await request('/sessions', null, { publicKey, metadata })
    const path = `/sessions/${s.id}`
    const claim = await request('/claim', null, { code: s.code })
    assert.equal(claim.body.phoneToken, s.phoneToken)
    assert.equal((await request('/claim', null, { code: s.code })).status, 404)
    await request(path + '/submit', s.phoneToken, { submissionId: 'request-12345', envelope })
    await request(path + '/ack', s.tvToken, { submissionId: 'request-12345', status: 'error' })
    assert.equal((await request(path, s.tvToken)).body.envelope, undefined)
    assert.equal((await request(path + '/submit', s.phoneToken, { submissionId: 'request-67890', envelope })).status, 200)
    clock = 1100
    assert.equal((await request(path, s.tvToken)).status, 410)
  }, { now: () => clock, ttl: 1000 })
})
test('claim brute force and invalid payloads are rejected', async () => withServer(async request => {
  const { body: s } = await request('/sessions', null, { publicKey, metadata })
  assert.equal((await request(`/sessions/${s.id}/submit`, s.phoneToken, { submissionId: 'request-12345', envelope: { data: 'plaintext' } })).status, 400)
  for (let i = 0; i < 5; i++) assert.equal((await request('/claim', null, { code: 'invalid' })).status, 404)
  assert.equal((await request('/claim', null, { code: s.code })).status, 429)
  await request(`/sessions/${s.id}`, s.tvToken, undefined, 'DELETE')
  assert.equal((await request(`/sessions/${s.id}`, s.phoneToken)).status, 410)
}))
