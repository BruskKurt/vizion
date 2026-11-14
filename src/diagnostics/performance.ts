export type Metric = 'startup' | 'navigation' | 'search' | 'playback'
const samples: Record<Metric, number[]> = { startup: [], navigation: [], search: [], playback: [] }
export function recordMetric(name: Metric, duration: number) {
  if (!Number.isFinite(duration) || duration < 0) return
  samples[name].push(Math.round(duration))
  if (samples[name].length > 120) samples[name].shift()
}
export function performanceSnapshot() {
  return Object.fromEntries(Object.entries(samples).map(([name, values]) => {
    const sorted = [...values].sort((a,b) => a-b)
    return [name, { count: sorted.length, lastMs: values[values.length - 1] ?? null, p95Ms: sorted[Math.max(0, Math.ceil(sorted.length * .95) - 1)] ?? null }]
  }))
}
export function observeNavigationLatency() {
  let pending = false
  window.addEventListener('keydown', event => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(event.key) || pending) return
    pending = true
    const start = performance.now()
    requestAnimationFrame(() => { recordMetric('navigation', performance.now() - start); pending = false })
  }, true)
}
