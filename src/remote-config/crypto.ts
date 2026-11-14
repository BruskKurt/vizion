/** Hybrid RSA-OAEP / AES-GCM: only the TV holds the private key. */
export interface Envelope { key: string; iv: string; data: string }
const encode = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
const decode = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value), c => c.charCodeAt(0))
export async function createReceiver() {
  if (!globalThis.crypto?.subtle) throw new Error('Secure crypto unavailable')
  const pair = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['encrypt', 'decrypt'])
  return { privateKey: pair.privateKey, publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey) }
}
export async function encryptConfiguration(publicKey: JsonWebKey, value: unknown): Promise<Envelope> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const receiver = await crypto.subtle.importKey('jwk', publicKey, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  return {
    key: encode(await crypto.subtle.encrypt('RSA-OAEP', receiver, await crypto.subtle.exportKey('raw', key))),
    iv: encode(iv.buffer),
    data: encode(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value)))),
  }
}
export async function decryptConfiguration(privateKey: CryptoKey, envelope: Envelope): Promise<unknown> {
  const raw = await crypto.subtle.decrypt('RSA-OAEP', privateKey, decode(envelope.key))
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.data))
  return JSON.parse(new TextDecoder().decode(plain))
}

/** Compatible with older TV engines that lack crypto.randomUUID(). */
export function randomId(): string { return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('') }
