import { parseM3u, type M3uEntry } from './m3u-parser'
export async function parseM3uAsync(text: string): Promise<M3uEntry[]> {
  if (typeof Worker !== 'undefined' && text.length > 100_000) {
    let worker: Worker | undefined
    try {
      worker = new Worker(new URL('./parser.worker.ts', import.meta.url), { type: 'module' })
      return await new Promise<M3uEntry[]>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Parsing timeout')), 20000)
        worker!.onmessage = event => { clearTimeout(timer); resolve(event.data) }
        worker!.onerror = () => { clearTimeout(timer); reject(new Error('Worker unavailable')) }
        worker!.postMessage(text)
      })
    } catch { /* Older webOS engines use the cooperative parser below. */ }
    finally { worker?.terminate() }
  }
  // Split only at entry boundaries, preserving attributes/directives across chunks.
  const result: M3uEntry[] = []
  let start = 0
  while (start < text.length) {
    const next = text.indexOf('\n#EXTINF', start + 100_000)
    const end = next < 0 ? text.length : next + 1
    result.push(...parseM3u(text.slice(start, end)))
    start = end
    if (start < text.length) await new Promise(resolve => setTimeout(resolve, 0))
  }
  return result
}
