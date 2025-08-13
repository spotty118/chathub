#!/usr/bin/env node
const http = require('http')

const PORT = process.env.CHATHUB_PROXY_PORT || 4891

const pending = new Map()

function writeNative(obj) {
  const json = Buffer.from(JSON.stringify(obj), 'utf8')
  const header = Buffer.alloc(4)
  header.writeUInt32LE(json.length, 0)
  process.stdout.write(header)
  process.stdout.write(json)
}

function onNativeMessage(obj) {
  if (obj.type === 'HTTP_RESPONSE_META') {
    const p = pending.get(obj.id)
    if (!p) return
    const { res } = p
    const status = obj.status || 200
    const headers = obj.headers || {}
    res.writeHead(status, obj.statusText || undefined, headers)
  } else if (obj.type === 'HTTP_RESPONSE_BODY') {
    const p = pending.get(obj.id)
    if (!p) return
    const { res } = p
    if (obj.error) {
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: { message: obj.error } }))
      pending.delete(obj.id)
      return
    }
    if (obj.done) {
      res.end()
      pending.delete(obj.id)
      return
    }
    if (obj.chunkBase64) {
      const chunk = Buffer.from(obj.chunkBase64, 'base64')
      res.write(chunk)
    }
  }
}

function readLoop() {
  let buf = Buffer.alloc(0)
  process.stdin.on('readable', () => {
    let chunk
    while ((chunk = process.stdin.read()) !== null) {
      buf = Buffer.concat([buf, chunk])
      while (buf.length >= 4) {
        const len = buf.readUInt32LE(0)
        if (buf.length < 4 + len) break
        const json = buf.slice(4, 4 + len).toString('utf8')
        buf = buf.slice(4 + len)
        try {
          onNativeMessage(JSON.parse(json))
        } catch (_) {}
      }
    }
  })
}

function genId() {
  return Math.random().toString(36).slice(2)
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  const id = genId()
  pending.set(id, { res })
  req.on('close', () => {
    writeNative({ type: 'ABORT', id })
  })
  const chunks = []
  req.on('data', (d) => chunks.push(d))
  req.on('end', () => {
    const body = Buffer.concat(chunks)
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [String(k), Array.isArray(v) ? v.join(',') : String(v || '')]),
    )
    const msg = {
      type: 'HTTP_REQUEST',
      id,
      method: req.method || 'GET',
      url: req.url || '/',
      headers,
      bodyBase64: body.length ? body.toString('base64') : undefined,
    }
    writeNative(msg)
  })
})

server.listen(PORT, () => {
  writeNative({ type: 'PING' })
})

readLoop()
