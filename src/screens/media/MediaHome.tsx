import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { Category } from '../../data/models'
import { profileStore } from '../../profiles/store'
import { focusIfExists } from '../../navigation/focus'
import { readPosition, savePosition } from '../../navigation/browse-memory'
import { navigate } from '../../router/router'
import { ActionButton } from '../../components/ActionButton'
import { GenreRow } from './GenreRow'
import { ContinueRow } from './ContinueRow'
import { posterItemKey } from './media-focus-keys'
import type { PosterItem } from './PosterTile'
import { t } from '../../i18n'

function CategoryFilter({ value, onInput }: { value: string; onInput: (value: string) => void }) {
  const { ref, focused } = useFocusable()
  useEffect(() => { if (focused) ref.current?.focus() }, [focused])
  return <input ref={ref} className="action-button" type="search" aria-label={t('catalogue.filter')} placeholder={t('catalogue.filter')} value={value} onInput={e => onInput(e.currentTarget.value)} />
}

export function MediaHome({ section, categories: loadCategories, load, onOpen }: {
  section: 'films' | 'series'; categories: () => Promise<Category[]>; load: (id: string) => Promise<PosterItem[]>; onOpen: (item: PosterItem) => void
}) {
  const key = `${profileStore.vodProfileId.value}:${section}:home`
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attempt, retry] = useState(0)
  const [browsing, setBrowsing] = useState(() => readPosition(key).index === 1)
  const [query, setQuery] = useState(() => readPosition(key).query ?? '')
  const [alphabetical, setAlphabetical] = useState(false)
  const restored = useRef(false)
  const { ref, focusKey } = useFocusable({ focusKey: `home-${section}`, saveLastFocusedChild: true, trackChildren: true })
  useEffect(() => {
    let alive = true
    setLoading(true); setError(false)
    loadCategories().then(cats => { if (alive) { setCategories(cats); setLoading(false) } }).catch(() => { if (alive) { setError(true); setLoading(false) } })
    return () => { alive = false }
  }, [key, attempt])
  useEffect(() => {
    if (!loading && ref.current) {
      ref.current.scrollTop = readPosition(key).scrollTop
      const timer = setTimeout(restoreFocus, 0)
      return () => clearTimeout(timer)
    }
  }, [loading])
  function restoreFocus() {
    const position = readPosition(key)
    if (!restored.current && position.id && focusIfExists(position.id)) {
      restored.current = true
      if (ref.current) ref.current.scrollTop = position.scrollTop
    }
  }
  function remember(id: string) {
    savePosition(key, { id, index: browsing ? 1 : 0, scrollTop: ref.current?.scrollTop ?? 0, query })
  }
  const filtered = useMemo(() => {
    const result = categories.filter(c => c.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    return alphabetical ? result.sort((a,b) => a.name.localeCompare(b.name)) : result
  }, [categories, query, alphabetical])
  return <FocusContext.Provider value={focusKey}><div ref={ref} style={{ height: '100%', overflowY: 'auto', padding: '28px 48px', boxSizing: 'border-box' }}>
    <div className="catalogue-toolbar">
      <ActionButton focusKey={`browse-${section}`} onPress={() => { setBrowsing(!browsing); savePosition(key, { index: browsing ? 0 : 1, scrollTop: 0, query }) }}>{t('catalogue.browse')}</ActionButton>
      {browsing && <><CategoryFilter value={query} onInput={setQuery} /><ActionButton onPress={() => setAlphabetical(!alphabetical)}>{t(alphabetical ? 'catalogue.az' : 'catalogue.order')}</ActionButton></>}
    </div>
    {loading && <p role="status">{t('common.loading')}</p>}
    {error && <div role="alert"><p>{t('common.loadError')}</p><ActionButton onPress={() => retry(n => n + 1)}>{t('common.retry')}</ActionButton></div>}
    {!error && !loading && browsing && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
      {filtered.map(cat => <ActionButton key={cat.id} focusKey={`category-${section}-${cat.id}`} onPress={() => { remember(`category-${section}-${cat.id}`); navigate(`/${section}/g/${encodeURIComponent(cat.id)}`) }}>{cat.name}</ActionButton>)}
      {!filtered.length && <p>{t('common.noResults')}</p>}
    </div>}
    {!browsing && <><ContinueRow railTarget={`nav-/${section}`} />{categories.map(cat => <GenreRow key={cat.id} category={cat} load={load} navRailKey={`nav-/${section}`} onReady={restoreFocus}
      onOpen={item => { remember(posterItemKey(item.id, `nav-/${section}:${cat.id}`)); onOpen(item) }}
      onSeeMore={id => { remember(`browse-${section}`); navigate(`/${section}/g/${encodeURIComponent(id)}`) }} />)}</>}
  </div></FocusContext.Provider>
}
