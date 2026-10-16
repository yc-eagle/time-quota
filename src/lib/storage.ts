import type { Language } from '../i18n/translations.ts'
import type { PersistedState, Project, RunState } from '../types/project.types.ts'
import { emptyEngineState, STATE_VERSION, type EngineState } from './engine.ts'
import { normalizeProjects, sortProjects, toTimestamp } from './quota.ts'

export const STORAGE_KEY = 'time-quota:v1'
/** 旧版本（v0.1）使用的键，读取时做一次性迁移 */
export const LEGACY_PROJECTS_KEY = 'timeQuotaProjects'

export const LANGUAGE_KEY = 'time-quota:language'
export const THEME_KEY = 'time-quota:theme'
export const SOUND_KEY = 'time-quota:sound'
export const NOTIFY_KEY = 'time-quota:notify'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** 浏览器环境下取 localStorage；隐私模式 / 服务端渲染下可能不可用 */
export function getDefaultStorage(): StorageLike | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage
  } catch {
    return null
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function validateRun(raw: unknown, projects: Project[]): RunState | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const projectId = typeof value.projectId === 'string' ? value.projectId : ''
  if (!projectId || !projects.some((project) => project.id === projectId)) return null

  const status = value.status === 'paused' ? 'paused' : 'running'
  const elapsedMs = typeof value.elapsedMs === 'number' && Number.isFinite(value.elapsedMs) && value.elapsedMs > 0
    ? value.elapsedMs
    : 0
  const startedAt = typeof value.startedAt === 'number' && Number.isFinite(value.startedAt) ? value.startedAt : null
  const sessionStartedAt = toTimestamp(value.sessionStartedAt, Date.now())
  const segmentLimit =
    typeof value.segmentLimit === 'number' && Number.isFinite(value.segmentLimit) && value.segmentLimit > 0
      ? Math.floor(value.segmentLimit)
      : 0

  return {
    projectId,
    status,
    segmentLimit,
    // 运行中但缺少起点时按暂停处理，避免刷新后凭空消耗额度
    startedAt: status === 'running' && startedAt === null ? null : startedAt,
    elapsedMs,
    sessionStartedAt,
  }
}

/** 把任意持久化数据还原成合法的引擎状态 */
export function hydrateState(raw: unknown, now: number): EngineState {
  if (!raw || typeof raw !== 'object') return emptyEngineState
  const value = raw as Partial<PersistedState>

  const projects = sortProjects(normalizeProjects(value.projects, now))
  const activeProjectId =
    typeof value.activeProjectId === 'string' && projects.some((project) => project.id === value.activeProjectId)
      ? value.activeProjectId
      : (projects[0]?.id ?? null)

  let run = validateRun(value.run, projects)
  // 运行中却没有起点，说明数据异常：直接降级为暂停
  if (run && run.status === 'running' && run.startedAt === null) {
    run = { ...run, status: 'paused' }
  }

  return { projects, activeProjectId, run }
}

export function loadState(now: number, storage: StorageLike | null = getDefaultStorage()): EngineState {
  if (!storage) return emptyEngineState

  const raw = storage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = safeParse(raw)
    if (parsed) return hydrateState(parsed, now)
  }

  return migrateLegacyState(now, storage)
}

/** 迁移 v0.1 的数据（键名 timeQuotaProjects，时间为 ISO 字符串） */
export function migrateLegacyState(now: number, storage: StorageLike | null = getDefaultStorage()): EngineState {
  if (!storage) return emptyEngineState

  const raw = storage.getItem(LEGACY_PROJECTS_KEY)
  if (!raw) return emptyEngineState

  const projects = sortProjects(normalizeProjects(safeParse(raw), now))
  if (projects.length === 0) return emptyEngineState

  const state: EngineState = { projects, activeProjectId: projects[0].id, run: null }
  saveState(state, storage)
  // 刻意不删除旧键：重复迁移是幂等的，删掉反而可能在某些渲染时序里丢数据
  return state
}

export function saveState(state: EngineState, storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return
  const payload: PersistedState = {
    version: STATE_VERSION,
    projects: state.projects,
    activeProjectId: state.activeProjectId,
    run: state.run,
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 存储配额用尽或隐私模式：静默降级，内存中的状态仍然可用
  }
}

export interface ExportPayload {
  app: 'time-quota'
  version: number
  exportedAt: string
  projects: Project[]
}

export function buildExport(state: EngineState, now: number): string {
  const payload: ExportPayload = {
    app: 'time-quota',
    version: STATE_VERSION,
    exportedAt: new Date(now).toISOString(),
    projects: state.projects,
  }
  return JSON.stringify(payload, null, 2)
}

/** 解析导入文件：接受导出格式，也接受裸数组；无有效项目时抛错 */
export function parseImport(text: string, now: number): Project[] {
  const parsed = safeParse(text)
  if (parsed === null) throw new Error('INVALID_JSON')

  const source = Array.isArray(parsed) ? parsed : (parsed as { projects?: unknown }).projects
  const projects = normalizeProjects(source, now)
  if (projects.length === 0) throw new Error('NO_VALID_PROJECTS')
  return sortProjects(projects)
}

export type ThemeName = 'light' | 'dark'

export function readTheme(storage: StorageLike | null = getDefaultStorage()): ThemeName {
  const raw = storage?.getItem(THEME_KEY)
  if (raw === 'dark' || raw === 'light') return raw
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function writeTheme(theme: ThemeName, storage: StorageLike | null = getDefaultStorage()): void {
  try {
    storage?.setItem(THEME_KEY, theme)
  } catch {
    /* 忽略写入失败 */
  }
}

export function readLanguage(storage: StorageLike | null = getDefaultStorage()): Language {
  const raw = storage?.getItem(LANGUAGE_KEY)
  return raw === 'en' ? 'en' : 'zh'
}

export function writeLanguage(language: Language, storage: StorageLike | null = getDefaultStorage()): void {
  try {
    storage?.setItem(LANGUAGE_KEY, language)
  } catch {
    /* 忽略写入失败 */
  }
}

export function readFlag(key: string, fallback: boolean, storage: StorageLike | null = getDefaultStorage()): boolean {
  const raw = storage?.getItem(key)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

export function writeFlag(key: string, value: boolean, storage: StorageLike | null = getDefaultStorage()): void {
  try {
    storage?.setItem(key, String(value))
  } catch {
    /* 忽略写入失败 */
  }
}
