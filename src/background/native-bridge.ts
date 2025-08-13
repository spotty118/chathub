import Browser from 'webextension-polyfill'
import { NMMessage } from '~types/messaging'
import { routeOpenAICompatible } from '~services/openai-compatible-router'

let nativePort: chrome.runtime.Port | null = null

function ensurePort() {
  if (nativePort) return nativePort
  nativePort = chrome.runtime.connectNative('com.chathub.proxy')
  nativePort.onDisconnect.addListener(() => {
    nativePort = null
  })
  nativePort.onMessage.addListener(onNativeMessage)
  return nativePort
}

const inflight = new Map<string, AbortController>()

function uint8ToBase64(u8: Uint8Array) {
  let s = ''
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i])
  return btoa(s)
}

async function onNativeMessage(msg: NMMessage) {
  const port = ensurePort()
  if (!port) return
  if (msg.type === 'PING') {
    port.postMessage({ type: 'PONG' } as NMMessage)
    return
  }
  if (msg.type === 'ABORT') {
    const ac = inflight.get(msg.id)
    if (ac) {
      ac.abort()
      inflight.delete(msg.id)
    }
    return
  }
  if (msg.type === 'HTTP_REQUEST') {
    const ac = new AbortController()
    inflight.set(msg.id, ac)
    try {
      const res = await routeOpenAICompatible({
        method: msg.method,
        url: msg.url,
        headers: msg.headers || {},
        bodyBase64: msg.bodyBase64,
        signal: ac.signal,
      })
      port.postMessage({
        type: 'HTTP_RESPONSE_META',
        id: msg.id,
        status: res.status,
        statusText: res.statusText,
        headers: res.responseHeaders,
      } as NMMessage)
      for await (const chunk of res.stream) {
        port.postMessage({
          type: 'HTTP_RESPONSE_BODY',
          id: msg.id,
          chunkBase64: uint8ToBase64(chunk),
          done: false,
        } as NMMessage)
      }
      port.postMessage({ type: 'HTTP_RESPONSE_BODY', id: msg.id, done: true } as NMMessage)
    } catch (e: any) {
      port.postMessage({
        type: 'HTTP_RESPONSE_BODY',
        id: msg.id,
        done: true,
        error: e?.message || String(e),
      } as NMMessage)
    } finally {
      inflight.delete(msg.id)
    }
    return
  }
}

export function startNativeBridge() {
  ensurePort()
}

startNativeBridge()
