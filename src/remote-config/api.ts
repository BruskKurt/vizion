import type { Envelope } from './crypto'
import type { SetupMetadata } from './configuration'
export interface Pairing { id: string; tvToken: string; phoneToken: string; code: string; expiresAt: number }
export interface SetupState { status: 'waiting' | 'received' | 'applied' | 'error'; submissionId?: string; envelope?: Envelope; publicKey?: JsonWebKey; metadata?: SetupMetadata; expiresAt: number }
export const REMOTE_URL = (import.meta.env.VITE_REMOTE_CONFIG_URL as string | undefined)?.replace(/\/$/, '') ?? (import.meta.env.DEV ? 'http://localhost:8789' : '')
export async function remoteRequest<T>(base: string, path: string, token?: string, body?: unknown, method = body === undefined ? 'GET' : 'POST', signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  const timer = setTimeout(abort, 12000)
  try {
    const res = await fetch(`${base}/api${path}`, { method, signal: controller.signal,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'omit',
    })
    if (!res.ok) throw new Error(res.status === 404 || res.status === 410 ? 'expired' : res.status === 429 ? 'rate-limit' : 'request-failed')
    return await res.json() as T
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}
