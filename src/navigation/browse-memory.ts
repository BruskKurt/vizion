/** Small, session-only navigation memory; never stores provider credentials. */
export interface BrowsePosition { id?: string; index: number; scrollTop: number; sort?: number; query?: string }
const positions = new Map<string, BrowsePosition>()
export function readPosition(key: string): BrowsePosition { return positions.get(key) ?? { index: 0, scrollTop: 0 } }
export function savePosition(key: string, position: BrowsePosition) {
  positions.delete(key)
  positions.set(key, position)
  if (positions.size > 64) positions.delete(positions.keys().next().value!)
}
