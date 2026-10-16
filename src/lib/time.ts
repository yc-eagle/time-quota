import type { Language } from '../i18n/translations.ts'

const LOCALES: Record<Language, string> = { zh: 'zh-CN', en: 'en-US' }

/** 取整为非负秒数，挡掉 NaN / 负数 / 小数 */
export function toSeconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.floor(value)
}

/** 计时器显示：25:00 或 1:05:09 */
export function formatClock(totalSeconds: number): string {
  const total = toSeconds(totalSeconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 人类可读时长：1小时30分 / 1h 30m / 45秒 / 45s */
export function formatDuration(totalSeconds: number, lang: Language = 'zh'): string {
  const total = toSeconds(totalSeconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  const parts: string[] = []
  if (hours > 0) parts.push(lang === 'zh' ? `${hours}小时` : `${hours}h`)
  if (minutes > 0) parts.push(lang === 'zh' ? `${minutes}分` : `${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(lang === 'zh' ? `${seconds}秒` : `${seconds}s`)
  return parts.join(lang === 'zh' ? '' : ' ')
}

/** 紧凑时长：1h30m / 25m / 45s，用于按钮和列表 */
export function formatCompact(totalSeconds: number): string {
  const total = toSeconds(totalSeconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)
  return parts.join('')
}

/** 日期时间：09-21 14:30 */
export function formatDateTime(timestamp: number, lang: Language = 'zh'): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—'
  return new Intl.DateTimeFormat(LOCALES[lang], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

/** 相对时间：刚刚 / 5分钟前 / 2小时前 / 3天前 */
export function formatRelative(timestamp: number, now: number, lang: Language = 'zh'): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—'
  const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (diffSeconds < 60) return lang === 'zh' ? '刚刚' : 'just now'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return lang === 'zh' ? `${diffMinutes}分钟前` : `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return lang === 'zh' ? `${diffHours}小时前` : `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return lang === 'zh' ? `${diffDays}天前` : `${diffDays}d ago`

  return formatDateTime(timestamp, lang)
}

/** 把分钟输入换算成秒，非法输入归零 */
export function minutesToSeconds(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0
  return Math.round(minutes * 60)
}

export function secondsToMinutes(seconds: number): number {
  return Math.round(toSeconds(seconds) / 60)
}

/** 取百分比整数，用于进度条文案 */
export function toPercent(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0
  return Math.min(100, Math.max(0, Math.round(ratio * 100)))
}

export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}
