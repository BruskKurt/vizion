/// <reference lib="webworker" />
const indexes = new Map<string, string[]>()
self.onmessage = (event: MessageEvent<{ request: number; slot: string; names?: string[]; query: string; limit: number }>) => {
  const { request, slot, names, query, limit } = event.data
  if (names) indexes.set(slot, names.map(name => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()))
  const index = indexes.get(slot) ?? []
  const needle = query.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const matches: number[] = []
  for (let i = 0; i < index.length && matches.length < limit; i++) if (index[i].includes(needle)) matches.push(i)
  self.postMessage({ request, matches })
}
export {}
