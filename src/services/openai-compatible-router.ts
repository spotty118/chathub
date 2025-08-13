import { streamAsyncIterable } from '~utils/stream-async-iterable'
import { getUserConfig } from '~services/user-config'

type RouteInput = {
  method: string
  url: string
  headers: Record<string, string>
  bodyBase64?: string
  signal?: AbortSignal
}

type RouteOutput = {
  status: number
  statusText: string
  responseHeaders: Record<string, string>
  stream: AsyncIterable<Uint8Array>
}

function textStream(s: string): AsyncIterable<Uint8Array> {
  return (async function* () {
    yield new TextEncoder().encode(s)
  })()
}

function getHeader(h: Record<string, string>, k: string) {
  const e = Object.entries(h)
  const f = e.find(([kk]) => kk.toLowerCase() === k.toLowerCase())
  return f ? f[1] : undefined
}

export async function routeOpenAICompatible(input: RouteInput): Promise<RouteOutput> {
  const u = new URL(input.url, 'http://localhost')
  const path = u.pathname
  const method = input.method.toUpperCase()
  const bodyStr = input.bodyBase64 ? atob(input.bodyBase64) : undefined
  const cfg = await getUserConfig()

  if (path === '/v1/models' && method === 'GET') {
    const data = { data: [{ id: 'gpt-3.5-turbo' }, { id: 'gpt-4o-mini' }] }
    const body = JSON.stringify(data)
    return {
      status: 200,
      statusText: 'OK',
      responseHeaders: { 'content-type': 'application/json' },
      stream: textStream(body),
    }
  }

  if (path === '/v1/chat/completions' && method === 'POST') {
    const payload = bodyStr ? JSON.parse(bodyStr) : {}
    const auth = getHeader(input.headers, 'authorization')
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (cfg.openaiApiKey || token) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: auth || `Bearer ${cfg.openaiApiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: input.signal,
      })
      const responseHeaders = Object.fromEntries(resp.headers.entries())
      const status = resp.status
      const statusText = resp.statusText
      const body = resp.body ? streamAsyncIterable(resp.body) : textStream('')
      return { status, statusText, responseHeaders, stream: body }
    }
    const err = JSON.stringify({ error: { message: 'No provider configured for chat.completions' } })
    return { status: 400, statusText: 'Bad Request', responseHeaders: { 'content-type': 'application/json' }, stream: textStream(err) }
  }

  if (path === '/v1/embeddings' && method === 'POST') {
    const auth = getHeader(input.headers, 'authorization')
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (cfg.openaiApiKey || token) {
      const resp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          authorization: auth || `Bearer ${cfg.openaiApiKey}`,
          'content-type': 'application/json',
        },
        body: bodyStr || '',
        signal: input.signal,
      })
      const responseHeaders = Object.fromEntries(resp.headers.entries())
      const status = resp.status
      const statusText = resp.statusText
      const body = resp.body ? streamAsyncIterable(resp.body) : textStream('')
      return { status, statusText, responseHeaders, stream: body }
    }
    const err = JSON.stringify({ error: { message: 'Embeddings not configured' } })
    return { status: 400, statusText: 'Bad Request', responseHeaders: { 'content-type': 'application/json' }, stream: textStream(err) }
  }

  const notFound = JSON.stringify({ error: { message: 'Not Found' } })
  return { status: 404, statusText: 'Not Found', responseHeaders: { 'content-type': 'application/json' }, stream: textStream(notFound) }
}
