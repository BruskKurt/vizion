import { expect, it } from 'vitest'
import { parseM3uAsync } from './parse-async'
import { parseM3u } from './m3u-parser'
it('preserves entries across cooperative parsing boundaries', async () => {
  const text = '#EXTM3U\r\n' + Array.from({length:3000}, (_,i) => `#EXTINF:-1 tvg-id="${i}" group-title="Actualités",Chaîne ${i}\r\n#EXTVLCOPT:http-referrer=test\r\nhttps://stream.test/${i}\r\n`).join('')
  expect(await parseM3uAsync(text)).toEqual(parseM3u(text))
})
