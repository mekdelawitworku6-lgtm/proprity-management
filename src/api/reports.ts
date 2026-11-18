import { API_BASE_URL } from '../lib/env'
import type { QueryValue } from './client'
import { getAccessToken, refreshAccessToken } from './tokenStore'

export interface ReportDownloadOptions {
  path: string
  query?: Record<string, QueryValue>
  fileName?: string
}

function buildReportUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function fetchReport(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
  }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response = await fetch(url, { headers })
  if (response.status !== 401) return response
  if (!(await refreshAccessToken())) return response

  const refreshed = getAccessToken()
  if (refreshed) headers.Authorization = `Bearer ${refreshed}`
  response = await fetch(url, { headers })
  return response
}

/**
 * Downloads a server-generated report. The JWT cannot go in the URL, so the
 * file is fetched with the auth header and handed to the browser as a blob.
 */
export async function downloadReport({ path, query, fileName }: ReportDownloadOptions): Promise<void> {
  const response = await fetchReport(buildReportUrl(path, query))

  if (!response.ok) {
    let message = `Could not export report (${response.status})`
    try {
      const body = (await response.json()) as { message?: string }
      if (typeof body.message === 'string') message = body.message
    } catch {
      /* non-JSON error body — keep the status-based message */
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') ?? ''
  const fromHeader = /filename="?([^";]+)"?/.exec(disposition)?.[1]
  const name = fileName ?? fromHeader ?? 'proprity-report'

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
