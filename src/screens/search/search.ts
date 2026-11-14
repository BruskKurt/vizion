import { recordMetric } from '../../diagnostics/performance'
import type { Channel, Movie, Series } from '../../data/models'
import { liveSession } from '../../data/session-instance'
import { vodSession } from '../../data/vod-session-instance'
import { seriesSession } from '../../data/series-session-instance'

function normalize(s: string): string { return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() }
const normalized = new WeakMap<object, string>()
function nameOf(item: { name: string }) {
  let value = normalized.get(item)
  if (value === undefined) { value = normalize(item.name); normalized.set(item, value) }
  return value
}
export function filterByName<T extends { name: string }>(items: T[], query: string, limit: number): T[] {
  if (!query.trim()) return []
  const needle = normalize(query.trim())
  const matched: T[] = []
  for (const item of items) {
    if (matched.length >= limit) break
    if (nameOf(item).includes(needle)) matched.push(item)
  }
  return matched
}
export interface SearchResults { channels: Channel[]; movies: Movie[]; series: Series[] }
let worker: Worker | undefined
let unavailable = false
let sequence = 0
const slots = new Map<string, object>()
const pending = new Map<number, { resolve: (indexes: number[]) => void; reject: () => void }>()
function stopWorker() {
  worker?.terminate(); worker = undefined; unavailable = true; slots.clear()
  for (const job of pending.values()) job.reject()
  pending.clear()
}
async function search<T extends { name: string }>(slot: string, items: T[], query: string, limit: number): Promise<T[]> {
  if (!query.trim()) return []
  if (!unavailable && typeof Worker !== 'undefined') {
    try {
      if (!worker) {
        worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = event => {
          const job = pending.get(event.data.request)
          pending.delete(event.data.request)
          job?.resolve(event.data.matches)
        }
        worker.onerror = stopWorker
      }
      const request = ++sequence
      const matches = await new Promise<number[]>((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(request); reject(new Error('Worker timeout')); stopWorker() }, 10000)
        pending.set(request, { resolve: value => { clearTimeout(timer); resolve(value) }, reject: () => { clearTimeout(timer); reject(new Error('Worker unavailable')) } })
        worker!.postMessage({ request, slot, names: slots.get(slot) === items ? undefined : items.map(i => i.name), query, limit })
        slots.set(slot, items)
      })
      return matches.map(i => items[i])
    } catch { stopWorker() }
  }
  // Older TV engines: yield between small batches so the remote remains responsive.
  const matches: T[] = []
  const needle = normalize(query.trim())
  for (let start = 0; start < items.length && matches.length < limit; start += 500) {
    if (start) await new Promise(resolve => setTimeout(resolve, 0))
    for (const item of items.slice(start, start + 500)) {
      if (matches.length >= limit) break
      if (nameOf(item).includes(needle)) matches.push(item)
    }
  }
  return matches
}

/** Each catalogue publishes independently; no slow provider holds back the others. */
export async function searchAll(query: string, limit = 30, onUpdate?: (results: SearchResults) => void, onError?: () => void): Promise<SearchResults> {
  const started = performance.now()
  const result: SearchResults = { channels: [], movies: [], series: [] }
  async function run<K extends keyof SearchResults>(key: K, load: () => Promise<SearchResults[K]>) {
    try {
      const items = await load()
      result[key] = await search(key, items, query, limit) as SearchResults[K]
      onUpdate?.({ ...result })
    } catch { onError?.() }
  }
  await Promise.all([run('channels', () => liveSession.channels('')), run('movies', () => vodSession.streams('')), run('series', () => seriesSession.list(''))])
  recordMetric('search', performance.now() - started)
  return result
}
