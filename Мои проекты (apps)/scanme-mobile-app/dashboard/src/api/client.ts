import { getAdminToken } from '../features/auth/session'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body
    if (
      body &&
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error?: { code?: string; message?: string } }).error === 'object'
    ) {
      const apiErr = (body as { error: { code?: string; message?: string } }).error
      const code = apiErr.code ?? 'UNKNOWN'
      const message = apiErr.message ?? ''
      return `HTTP ${error.status}: ${code}${message ? ` — ${message}` : ''}`
    }
    if (typeof body === 'string' && body.length > 0) {
      return `HTTP ${error.status}: ${body}`
    }
    return `HTTP ${error.status}: ${JSON.stringify(body)}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  const method = (init.method ?? 'GET').toUpperCase()
  if (
    (method === 'POST' || method === 'PUT' || method === 'PATCH') &&
    init.body != null
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAdminToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status, body)
  }

  return body as TResponse
}
