const DEFAULT_API_BASE_URL = 'http://localhost:4100/api/v1'

const raw = import.meta.env.VITE_API_URL

export const API_BASE_URL: string = typeof raw === 'string' && raw.length > 0 ? raw : DEFAULT_API_BASE_URL

export const API_TIMEOUT_MS = 15_000
