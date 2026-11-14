export interface M3uEntry {
  name: string
  url: string
  attrs: Record<string, string>
}

const ATTR_RE = /([\w-]+)="([^"]*)"/g

function parseExtinf(line: string): { name: string; attrs: Record<string, string> } {
  // Convention m3u_plus : le nom est après la DERNIÈRE virgule. Limite connue : un nom
  // contenant une virgule sera tronqué (rare ; les groupes sont séparés par « | »).
  const commaIdx = line.lastIndexOf(',')
  const name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : ''
  const head = commaIdx >= 0 ? line.slice(0, commaIdx) : line
  const attrs: Record<string, string> = {}
  let m: RegExpExecArray | null
  ATTR_RE.lastIndex = 0
  while ((m = ATTR_RE.exec(head)) !== null) {
    attrs[m[1]] = m[2]
  }
  return { name, attrs }
}

export function parseM3u(text: string): M3uEntry[] {
  const lines = text.split(/\r?\n/)
  const entries: M3uEntry[] = []
  let pending: { name: string; attrs: Record<string, string> } | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) continue
    if (line.startsWith('#EXTINF')) {
      pending = parseExtinf(line)
    } else if (line.startsWith('#')) {
      // autre directive (#EXTM3U, #EXTGRP, …) : ignorée
      continue
    } else if (pending) {
      entries.push({ name: pending.name, url: line, attrs: pending.attrs })
      pending = null
    }
  }
  return entries
}
