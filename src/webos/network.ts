/**
 * Récupère l'adresse IP locale de la TV via le service réseau webOS (luna).
 * No-op hors webOS (navigateur / tests) — le callback n'est alors jamais appelé.
 */
export function getLocalIp(onIp: (ip: string) => void): void {
  const Bridge = (window as unknown as { PalmServiceBridge?: new () => PalmBridge }).PalmServiceBridge
  if (!Bridge) return
  try {
    const bridge = new Bridge()
    bridge.onservicecallback = (raw: string) => {
      try {
        const res = JSON.parse(raw) as {
          wired?: { ipAddress?: string }
          wifi?: { ipAddress?: string }
        }
        const ip = res.wired?.ipAddress || res.wifi?.ipAddress
        if (ip) onIp(ip)
      } catch {
        /* réponse inattendue : ignorée */
      }
    }
    bridge.call('luna://com.webos.service.connectionmanager/getStatus', '{}')
  } catch {
    /* service indisponible : ignoré */
  }
}

interface PalmBridge {
  onservicecallback: (raw: string) => void
  call(uri: string, params: string): void
}
