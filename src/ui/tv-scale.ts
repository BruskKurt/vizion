const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080
const MIN_SCALE = 1.2

function applyScale(root: HTMLElement): void {
  const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT)
  if (scale < MIN_SCALE) {
    root.style.width = '100%'
    root.style.height = '100%'
    root.style.transform = ''
    root.style.transformOrigin = ''
    return
  }

  root.style.width = `${window.innerWidth / scale}px`
  root.style.height = `${window.innerHeight / scale}px`
  root.style.transform = `scale(${scale})`
  root.style.transformOrigin = 'top left'
}

export function setupTvViewportScale(root: HTMLElement): void {
  applyScale(root)
  window.addEventListener('resize', () => applyScale(root))
}
