export type RequestInitSubset = {
  method?: string
  body?: string
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface ProxyFetchRequestMessage {
  url: string
  options?: RequestInitSubset
}

export interface ProxyFetchResponseMetadata {
  status?: number
  statusText?: string
  headers?: Record<string, string>
}

export interface ProxyFetchResponseMetadataMessage {
  type: 'PROXY_RESPONSE_METADATA'
  metadata: ProxyFetchResponseMetadata
}

export type ProxyFetchResponseBodyChunkMessage = {
  type: 'PROXY_RESPONSE_BODY_CHUNK'
} & ({ done: true } | { done: false; value: string })

export type NMMessage =
  | { type: 'PING' }
  | { type: 'PONG' }
  | {
      type: 'HTTP_REQUEST'
      id: string
      method: string
      url: string
      headers?: Record<string, string>
      bodyBase64?: string
      query?: Record<string, string | number | boolean>
    }
  | {
      type: 'HTTP_RESPONSE_META'
      id: string
      status: number
      statusText?: string
      headers?: Record<string, string>
    }
  | {
      type: 'HTTP_RESPONSE_BODY'
      id: string
      chunkBase64?: string
      done: boolean
      error?: string
    }
  | { type: 'ABORT'; id: string }
