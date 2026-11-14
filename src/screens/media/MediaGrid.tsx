import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'
import type { Category } from '../../data/models'
import { profileStore } from '../../profiles/store'
import { focusIfExists } from '../../navigation/focus'
import { readPosition, savePosition } from '../../navigation/browse-memory'
import { posterItemKey, MEDIA_GRID } from './media-focus-keys'
import { PosterTile, type PosterItem } from './PosterTile'
import { ActionButton } from '../../components/ActionButton'
import { t } from '../../i18n'

const COLS = 6
const ROW_H = 333
const WINDOW = 3
interface Props {
  catId: string
  load: (catId: string) => Promise<PosterItem[]>
  categories: () => Promise<Category[]>
  fallbackTitle?: string
  navRailKey?: string
  onOpen: (item: PosterItem) => void
}
export function MediaGrid({ catId, load, categories, fallbackTitle, navRailKey, onOpen }: Props) {
  const memoryKey = `${profileStore.vodProfileId.value}:${navRailKey}:${catId}`
  const [items, setItems] = useState<PosterItem[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, retry] = useState(0)
  const [sort, setSort] = useState(() => readPosition(memoryKey).sort ?? 0)
  const [centerRow, setCenterRow] = useState(() => Math.floor(readPosition(memoryKey).index / COLS))
  const sorted = useMemo(() => sort ? [...items].sort((a, b) => (sort === 1 ? 1 : -1) * a.name.localeCompare(b.name)) : items, [items, sort])
  const { ref, focusKey } = useFocusable({ focusKey: MEDIA_GRID, saveLastFocusedChild: true, trackChildren: true })
  const scrollRef = useRef<HTMLDivElement>(null)
  const restore = useRef(true)
  useEffect(() => {
    let alive = true
    setLoading(true); setError(false); restore.current = true
    const position = readPosition(memoryKey)
    setSort(position.sort ?? 0)
    setCenterRow(Math.floor(position.index / COLS))
    Promise.all([load(catId), categories()]).then(([next, nextCats]) => {
      if (!alive) return
      const ordered = position.sort ? [...next].sort((a,b) => (position.sort === 1 ? 1 : -1) * a.name.localeCompare(b.name)) : next
      const index = Math.max(0, ordered.findIndex(item => item.id === position.id))
      setCenterRow(Math.floor(index / COLS))
      setItems(next); setCats(nextCats); setLoading(false)
    }).catch(() => { if (alive) { setError(true); setLoading(false) } })
    return () => { alive = false }
  }, [memoryKey, attempt])
  useEffect(() => {
    if (loading || !sorted.length || !restore.current) return
    const timer = setTimeout(() => {
      const position = readPosition(memoryKey)
      const item = sorted.find(item => item.id === position.id) ?? sorted[0]
      focusIfExists(posterItemKey(item.id))
      if (scrollRef.current && position.id === item.id) scrollRef.current.scrollTop = position.scrollTop
      restore.current = false
    }, 0)
    return () => clearTimeout(timer)
  }, [loading, sorted, memoryKey])
  function remember(item: PosterItem, index: number) {
    setCenterRow(Math.floor(index / COLS))
    savePosition(memoryKey, { id: item.id, index, scrollTop: scrollRef.current?.scrollTop ?? 0, sort })
  }
  const totalRows = Math.ceil(sorted.length / COLS)
  const start = Math.max(0, centerRow - WINDOW)
  const end = Math.min(totalRows, centerRow + WINDOW + 1)
  const title = cats.find(c => c.id === catId)?.name ?? fallbackTitle ?? t('common.noContent')
  return <div ref={ref} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '28px 48px 16px', flexShrink: 0 }}>
      <h1 style={{ fontSize: 30, marginBottom: 16 }}>{title}</h1>
      <ActionButton onPress={() => {
        const nextSort = (sort + 1) % 3
        setSort(nextSort); setCenterRow(0)
        savePosition(memoryKey, { index: 0, scrollTop: 0, sort: nextSort })
        if (scrollRef.current) scrollRef.current.scrollTop = 0
      }}>{t(sort === 0 ? 'catalogue.order' : sort === 1 ? 'catalogue.az' : 'catalogue.za')}</ActionButton>
    </div>
    {loading && <p role="status" style={{ padding: '16px 48px' }}>{t('common.loading')}</p>}
    {error && <div role="alert" style={{ padding: '16px 48px' }}><p>{t('common.loadError')}</p><ActionButton onPress={() => retry(n => n + 1)}>{t('common.retry')}</ActionButton></div>}
    {!loading && !error && !sorted.length && <p style={{ padding: '16px 48px' }}>{t('common.noContent')}</p>}
    {!loading && !error && sorted.length > 0 && <FocusContext.Provider value={focusKey}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowAnchor: 'none', padding: '0 48px 48px' }} onScroll={() => {
        const position = readPosition(memoryKey)
        savePosition(memoryKey, { ...position, scrollTop: scrollRef.current?.scrollTop ?? 0, sort })
      }}>
        <div style={{ height: start * ROW_H }} />
        {Array.from({ length: end - start }, (_, row) => {
          const offset = (start + row) * COLS
          return <div key={start + row} style={{ display: 'flex', gap: 16, marginBottom: 24, height: ROW_H - 24 }}>
            {sorted.slice(offset, offset + COLS).map((item, col) => <PosterTile key={item.id} item={item} focusKey={posterItemKey(item.id)}
              onFocus={() => remember(item, offset + col)} onSelect={() => { remember(item, offset + col); onOpen(item) }}
              onArrowPress={direction => {
                if (direction === 'left' && col === 0 && navRailKey) return !focusIfExists(navRailKey)
                return true
              }} />)}
          </div>
        })}
        <div style={{ height: Math.max(0, (totalRows - end) * ROW_H) }} />
      </div>
    </FocusContext.Provider>}
  </div>
}
