export const LIVE_CATEGORIES = 'live-categories'
export const LIVE_CHANNELS = 'live-channels'
export const LIVE_PREVIEW = 'live-preview'
export const CATEGORY_EDIT = 'live-category-edit'
export const CATEGORY_EDIT_DONE = 'live-category-edit-done'
export const CATEGORY_EDIT_RESET = 'live-category-edit-reset'
export const PREVIEW_PLAY = 'preview-play'
export const PREVIEW_FAVORITE = 'preview-favorite'

function focusId(id: string): string {
  return encodeURIComponent(id)
}

export function categoryFocusKey(id: string): string {
  return `cat-${focusId(id)}`
}

export function categoryEditFocusKey(id: string): string {
  return `cat-edit-${focusId(id)}`
}

export function channelFocusKey(id: string): string {
  return `chan-${focusId(id)}`
}
