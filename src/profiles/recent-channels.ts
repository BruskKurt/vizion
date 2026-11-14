import { signal } from '@preact/signals'
import type { Channel } from '../data/models'
import * as storage from './storage'
interface RecentChannel { channel: Channel; categoryId: string }
const recent = signal(storage.load<Record<string, RecentChannel[]>>('recent-channels', {}))
export function rememberChannel(profileId: string, channel: Channel, categoryId: string) {
  const previous = recent.value[profileId] ?? []
  const next = [{ channel, categoryId }, ...previous.filter(item => item.channel.id !== channel.id)].slice(0, 8)
  recent.value = { ...recent.value, [profileId]: next }
  storage.save('recent-channels', recent.value)
}
export function recentChannels(profileId: string) { return recent.value[profileId] ?? [] }
