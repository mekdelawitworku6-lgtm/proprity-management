import { useEffect, useMemo, useRef } from 'react'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const LOG_CHANNELS = {
  system: { label: 'SYSTEM', color: '#94a3b8' },
  auth: { label: 'AUTH', color: '#38bdf8' },
  navigation: { label: 'NAV', color: '#34d399' },
  data: { label: 'DATA', color: '#a78bfa' },
  actions: { label: 'ACTION', color: '#fbbf24' },
  modals: { label: 'MODAL', color: '#fb923c' },
  admin: { label: 'ADMIN', color: '#f472b6' },
  owner: { label: 'OWNER', color: '#60a5fa' },
  error: { label: 'ERROR', color: '#ef4444' },
} as const

export type LogChannel = keyof typeof LOG_CHANNELS

export interface LogEntry {
  id: number
  level: LogLevel
  channel: LogChannel
  scope: string
  message: string
  data?: unknown
  at: number
  durationMs?: number
}

export interface ChannelLogger {
  channel: LogChannel
  scope: string
  debug: (message: string, data?: unknown) => void
  info: (message: string, data?: unknown) => void
  warn: (message: string, data?: unknown) => void
  error: (message: string, data?: unknown) => void
  time: (label: string) => () => void
  section: (label: string) => ChannelLogger
}

const STORAGE_KEY = 'prop_platform_log_settings'
const MAX_ENTRIES_PER_CHANNEL = 300
const MAX_SERIALIZED_LENGTH = 600

const buffers = new Map<LogChannel, LogEntry[]>()
let sequence = 0
let globallyEnabled = true
let muted = new Set<LogChannel>()

function readMuted(): Set<LogChannel> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set<LogChannel>()
    const parsed: unknown = JSON.parse(raw)
    const list =
      parsed && typeof parsed === 'object' && 'muted' in parsed && Array.isArray(parsed.muted)
        ? (parsed.muted as LogChannel[])
        : []
    return new Set(list.filter((c): c is LogChannel => c in LOG_CHANNELS))
  } catch {
    return new Set<LogChannel>()
  }
}

function writeMuted(): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted: [...muted] }))
    return true
  } catch {
    return false
  }
}

muted = readMuted()

export function isChannelEnabled(channel: LogChannel): boolean {
  return globallyEnabled && !muted.has(channel)
}

export function setChannelEnabled(channel: LogChannel, enabled: boolean): void {
  if (enabled) muted.delete(channel)
  else muted.add(channel)
  writeMuted()
}

export function setLoggingEnabled(enabled: boolean): void {
  globallyEnabled = enabled
}

export function isLoggingEnabled(): boolean {
  return globallyEnabled
}

function badgeStyle(channel: LogChannel, level: LogLevel): string {
  const { color } = LOG_CHANNELS[channel]
  const text = level === 'error' ? '#ffffff' : '#0b1120'
  return `background:${color};color:${text};border-radius:3px;font-weight:700;padding:1px 5px`
}

function print(entry: LogEntry): void {
  const { label } = LOG_CHANNELS[entry.channel]
  const stamp = new Date(entry.at).toLocaleTimeString('en-GB')
  const head = `[${entry.scope}] ${entry.message}  ${stamp}`
  const args: unknown[] = [`%c ${label} `, badgeStyle(entry.channel, entry.level), head]
  if (entry.durationMs !== undefined) args.push({ durationMs: entry.durationMs })
  if (entry.data !== undefined) args.push(entry.data)
  if (entry.level === 'error') console.error(...args)
  else if (entry.level === 'warn') console.warn(...args)
  else console.log(...args)
}

function emit(
  level: LogLevel,
  channel: LogChannel,
  scope: string,
  message: string,
  data?: unknown,
  durationMs?: number
): void {
  if (!isChannelEnabled(channel)) return
  const entry: LogEntry = {
    id: ++sequence,
    level,
    channel,
    scope,
    message,
    data,
    at: Date.now(),
    durationMs,
  }
  const buffer = buffers.get(channel) ?? []
  buffer.push(entry)
  if (buffer.length > MAX_ENTRIES_PER_CHANNEL) {
    buffer.splice(0, buffer.length - MAX_ENTRIES_PER_CHANNEL)
  }
  buffers.set(channel, buffer)
  print(entry)
}

export function createLogger(channel: LogChannel, scope = 'app'): ChannelLogger {
  return {
    channel,
    scope,
    debug: (message, data) => emit('debug', channel, scope, message, data),
    info: (message, data) => emit('info', channel, scope, message, data),
    warn: (message, data) => emit('warn', channel, scope, message, data),
    error: (message, data) => emit('error', channel, scope, message, data),
    time: (label) => {
      const start = performance.now()
      emit('info', channel, scope, `${label} started`)
      return () => {
        const durationMs = Math.round((performance.now() - start) * 100) / 100
        emit('info', channel, scope, `${label} finished`, undefined, durationMs)
      }
    },
    section: (label) => {
      emit('info', channel, scope, `--- ${label} ---`)
      return createLogger(channel, label)
    },
  }
}

export function useLogger(channel: LogChannel, scope = 'app'): ChannelLogger {
  return useMemo(() => createLogger(channel, scope), [channel, scope])
}

function signature(values: readonly unknown[]): string {
  try {
    const json = JSON.stringify(values, (_key, value) => {
      if (typeof value === 'function') return '[fn]'
      if (value instanceof Map) return `[Map ${value.size}]`
      if (value instanceof Set) return `[Set ${value.size}]`
      return value
    })
    if (json === undefined) return 'undefined'
    return json.length > MAX_SERIALIZED_LENGTH ? `${json.slice(0, MAX_SERIALIZED_LENGTH)}…` : json
  } catch {
    return `[unserializable ${values.length} values]`
  }
}

export function useLogEffect(
  channel: LogChannel,
  label: string,
  values: readonly unknown[] = []
): void {
  const logger = useLogger(channel, label)
  const latest = useRef(values)
  const key = signature(values)
  useEffect(() => {
    latest.current = values
  })
  useEffect(() => {
    const current = latest.current
    logger.debug('state changed', current.length > 0 ? { values: current } : undefined)
  }, [logger, key])
}

export function getEntries(channel: LogChannel): LogEntry[] {
  return [...(buffers.get(channel) ?? [])]
}

export function getCounts(): Record<LogChannel, number> {
  const counts = {} as Record<LogChannel, number>
  for (const channel of Object.keys(LOG_CHANNELS) as LogChannel[]) {
    counts[channel] = buffers.get(channel)?.length ?? 0
  }
  return counts
}

export function dumpLogs(channel?: LogChannel): void {
  const targets = channel ? [channel] : (Object.keys(LOG_CHANNELS) as LogChannel[])
  for (const target of targets) {
    const entries = buffers.get(target) ?? []
    const { label, color } = LOG_CHANNELS[target]
    console.group(
      `%c ${label} %c ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`,
      badgeStyle(target, 'info'),
      `color:${color};font-weight:600`
    )
    if (entries.length === 0) console.log('(nothing logged yet)')
    else for (const entry of entries) print(entry)
    console.groupEnd()
  }
}

export function clearLogs(channel?: LogChannel): void {
  if (channel) buffers.delete(channel)
  else buffers.clear()
}

let errorHooked = false

function hookGlobalErrors(): void {
  if (errorHooked) return
  errorHooked = true
  const logger = createLogger('error', 'window')
  window.addEventListener('error', (event) => {
    logger.error('uncaught error', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined,
    })
  })
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('unhandled promise rejection', { reason: event.reason })
  })
}

export function installLogger(): void {
  const system = createLogger('system', 'bootstrap')
  hookGlobalErrors()
  system.info('logger ready — channels:', Object.keys(LOG_CHANNELS))
  system.info(`muted channels: ${muted.size > 0 ? [...muted].join(', ') : 'none'}`)
  ;(window as unknown as Record<string, unknown>).__log = {
    channels: LOG_CHANNELS,
    counts: getCounts,
    entries: getEntries,
    dump: dumpLogs,
    clear: clearLogs,
    mute: (channel: LogChannel) => setChannelEnabled(channel, false),
    unmute: (channel: LogChannel) => setChannelEnabled(channel, true),
    on: (channel: LogChannel) => setChannelEnabled(channel, true),
    off: (channel: LogChannel) => setChannelEnabled(channel, false),
    scope: (channel: LogChannel, scope: string) => createLogger(channel, scope),
  }
}
