export interface ParsedRoute {
  path: string
  segments: string[]
}

export function parseHash(hash: string): ParsedRoute {
  const raw = hash.replace(/^#/, '')
  const segments = raw.split('/').filter((s) => s.length > 0)
  return { path: '/' + segments.join('/'), segments }
}
