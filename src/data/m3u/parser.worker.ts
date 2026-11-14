import { parseM3u } from './m3u-parser'
self.onmessage = (event: MessageEvent<string>) => { self.postMessage(parseM3u(event.data)) }
