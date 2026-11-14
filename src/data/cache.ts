/** Bounded promise cache. Expired values may be served once while refreshing. */
export class DataCache {
  private entries = new Map<string, { promise: Promise<unknown>; expires: number; weight: number; settled: boolean }>()
  constructor(private maxEntries = 48, private maxWeight = 50000) {}

  get<T>(key: string, load: () => Promise<T>, ttl = 5 * 60_000, stale = true): Promise<T> {
    const old = this.entries.get(key)
    if (old) {
      this.entries.delete(key)
      this.entries.set(key, old)
      if (!old.settled || old.expires > Date.now()) return old.promise as Promise<T>
    }
    const entry = { promise: null as unknown as Promise<T>, expires: Infinity, weight: 1, settled: false }
    entry.promise = Promise.resolve().then(load).then(value => {
      entry.expires = Date.now() + ttl
      entry.settled = true
      entry.weight = Array.isArray(value) ? Math.max(1, value.length) : 1
      this.trim()
      return value
    }).catch(error => {
      if (this.entries.get(key) === entry) this.entries.delete(key)
      throw error
    })
    this.entries.set(key, entry)
    this.trim()
    if (old && stale) {
      void entry.promise.catch(() => {})
      return old.promise as Promise<T>
    }
    return entry.promise
  }

  private trim() {
    let weight = [...this.entries.values()].reduce((sum, e) => sum + e.weight, 0)
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= this.maxEntries && weight <= this.maxWeight) break
      // Retain the newest entry, even when a single provider catalogue exceeds the budget.
      if (this.entries.size === 1) break
      this.entries.delete(key)
      weight -= entry.weight
    }
  }
}
