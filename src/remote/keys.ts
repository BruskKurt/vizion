export type RemoteAction =
  | { type: 'back' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'fastforward' }
  | { type: 'rewind' }
  | { type: 'digit'; value: number }

export function mapKeyCode(keyCode: number): RemoteAction | null {
  // Back : 461 (webOS), 8 (Backspace desktop), 27 (Escape desktop)
  if (keyCode === 461 || keyCode === 8 || keyCode === 27) return { type: 'back' }

  // Touches média webOS
  if (keyCode === 415) return { type: 'play' }
  if (keyCode === 19) return { type: 'pause' }
  if (keyCode === 413) return { type: 'stop' }
  if (keyCode === 417) return { type: 'fastforward' }
  if (keyCode === 412) return { type: 'rewind' }

  // Chiffres rangée principale (48–57)
  if (keyCode >= 48 && keyCode <= 57) return { type: 'digit', value: keyCode - 48 }
  // Chiffres pavé numérique (96–105)
  if (keyCode >= 96 && keyCode <= 105) return { type: 'digit', value: keyCode - 96 }

  // Flèches (37–40) et OK (13) : gérés par Norigin, pas ici
  return null
}
