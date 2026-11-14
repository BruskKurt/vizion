import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { continueWatchingStore } from '../../profiles/continue-watching'
import { profileStore } from '../../profiles/store'
import { playItem } from '../../screens/player/playback'
import { focusIfExists } from '../../navigation/focus'
import { posterItemKey, CONTINUE_ROW } from './media-focus-keys'
import { PosterTile } from './PosterTile'
import { t } from '../../i18n'

interface Props {
  /** Clé de focus du rail de navigation latéral (pour la flèche gauche sur la première tuile). */
  railTarget: string
}

/** Rangée horizontale « Continuer à regarder » partagée Films + Séries.
 *  Se cache automatiquement si aucune entrée n'existe pour le profil actif. */
export function ContinueRow({ railTarget }: Props) {
  const profileId = profileStore.vodProfileId.value

  // Lecture explicite du signal → le composant se réabonne et se rerender après save().
  void continueWatchingStore.all.value

  const entries = profileId ? continueWatchingStore.list(profileId) : []

  const { ref, focusKey } = useFocusable({
    focusKey: CONTINUE_ROW,
    saveLastFocusedChild: true,
    trackChildren: true,
  })

  // Rangée masquée si vide.
  if (entries.length === 0) return <div ref={ref} style={{ display: 'none' }} />

  return (
    <div style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 14px 0',
          paddingLeft: 4,
        }}
      >
        {t('common.continueWatching')}
      </h2>
      <FocusContext.Provider value={focusKey}>
        <div
          ref={ref}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            overflowX: 'hidden',
          }}
        >
          {entries.map((entry, idx) => (
            <PosterTile
              key={entry.item.id}
              focusKey={posterItemKey(entry.item.id, `${railTarget}:continue:${entry.item.kind}`)}
              item={{ id: entry.item.id, name: entry.item.name, poster: entry.item.poster }}
              onSelect={() => playItem({ ...entry.item, startPosition: entry.position })}
              onArrowPress={(direction) => {
                // Flèche gauche sur la première tuile → retour au rail de navigation.
                if (direction === 'left' && idx === 0) {
                  return !focusIfExists(railTarget)
                }
                return true
              }}
            />
          ))}
        </div>
      </FocusContext.Provider>
    </div>
  )
}
