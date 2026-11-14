import type { EpgEntry } from '../data/models'

export function currentEntry(entries: EpgEntry[], nowSec: number): EpgEntry | null {
  return entries.find((e) => e.start <= nowSec && nowSec < e.end) ?? null
}

export function nextEntry(entries: EpgEntry[], nowSec: number): EpgEntry | null {
  return entries
    .filter((e) => e.start > nowSec)
    .sort((a, b) => a.start - b.start)[0] ?? null
}

export function progressPct(entry: EpgEntry, nowSec: number): number {
  if (entry.end <= entry.start) return 0
  const pct = ((nowSec - entry.start) / (entry.end - entry.start)) * 100
  return Math.max(0, Math.min(100, pct))
}
