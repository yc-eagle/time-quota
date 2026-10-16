import type { Project, ProjectInput, SegmentRecord, SettleReason } from '../types/project.types.ts'
import { toSeconds } from './time.ts'

/** 每个项目最多保留的支取记录条数，避免 localStorage 无限膨胀 */
export const MAX_SEGMENT_RECORDS = 100

export function createId(prefix = 'p'): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${random}`
}

/** 把任意值安全地解析成时间戳（兼容旧数据的 ISO 字符串） */
export function toTimestamp(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function createProject(input: ProjectInput, now: number, id: string = createId('p')): Project {
  const totalDuration = toSeconds(input.totalDuration)
  const defaultSegment = Math.min(toSeconds(input.defaultSegment), totalDuration)
  return {
    id,
    name: input.name.trim(),
    totalDuration,
    remainingDuration: totalDuration,
    defaultSegment,
    segments: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** 已支取的秒数 */
export function consumedSeconds(project: Project): number {
  return Math.max(0, project.totalDuration - project.remainingDuration)
}

export function progressRatio(project: Project): number {
  if (project.totalDuration <= 0) return 0
  return clamp(consumedSeconds(project) / project.totalDuration, 0, 1)
}

export function isExhausted(project: Project): boolean {
  return project.remainingDuration <= 0
}

/** 下一次支取的默认上限：默认分段与剩余额度取小；0 表示不限 */
export function segmentLimitFor(project: Project): number {
  if (project.defaultSegment <= 0) return 0
  return Math.min(project.defaultSegment, project.remainingDuration)
}

export interface SettleInput {
  startedAt: number
  endedAt: number
  /** 本次支取累计运行的毫秒数 */
  elapsedMs: number
  /** 计划的分段上限（秒），0 表示不限 */
  segmentLimit: number
  reason: SettleReason
}

export interface SettleResult {
  project: Project
  /** 本次是否真的产生了消耗（不足 1 秒或额度已空时返回 null） */
  record: SegmentRecord | null
}

/**
 * 计算本次支取应该扣减的秒数：先按分段上限截断，再按剩余额度截断。
 * UI 预览与最终结算共用同一套算法，避免「显示」与「记账」不一致。
 */
export function settleSecondsFor(project: Project, elapsedMs: number, segmentLimit: number): number {
  let seconds = toSeconds(elapsedMs / 1000)
  if (segmentLimit > 0) seconds = Math.min(seconds, segmentLimit)
  return Math.min(seconds, project.remainingDuration)
}

/**
 * 结算一次支取：把实际消耗的秒数从剩余额度中扣除，并写入一条支取记录。
 * 纯函数，方便单测覆盖额度扣减、上限截断与额度用尽的边界。
 */
export function settleSegment(project: Project, input: SettleInput, now: number): SettleResult {
  const seconds = settleSecondsFor(project, input.elapsedMs, input.segmentLimit)

  if (seconds <= 0) {
    return { project: { ...project, updatedAt: now }, record: null }
  }

  const record: SegmentRecord = {
    id: createId('s'),
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    seconds,
    reason: input.reason,
  }

  return {
    project: {
      ...project,
      remainingDuration: Math.max(0, project.remainingDuration - seconds),
      segments: [record, ...project.segments].slice(0, MAX_SEGMENT_RECORDS),
      updatedAt: now,
    },
    record,
  }
}

/** 修改额度总量时保持「已支取」不变，避免进度条突然归零 */
export function applyPatch(
  project: Project,
  patch: { name?: string; totalDuration?: number; defaultSegment?: number },
  now: number,
): Project {
  const consumed = consumedSeconds(project)
  const totalDuration = patch.totalDuration === undefined ? project.totalDuration : toSeconds(patch.totalDuration)
  const remainingDuration = Math.max(0, totalDuration - consumed)
  const defaultSegment = clamp(
    patch.defaultSegment === undefined ? project.defaultSegment : toSeconds(patch.defaultSegment),
    0,
    totalDuration,
  )

  return {
    ...project,
    name: patch.name === undefined ? project.name : patch.name.trim(),
    totalDuration,
    remainingDuration,
    defaultSegment,
    updatedAt: now,
  }
}

export function resetQuota(project: Project, now: number): Project {
  return { ...project, remainingDuration: project.totalDuration, updatedAt: now }
}

export interface ProjectSummary {
  consumed: number
  sessionCount: number
  lastUsedAt: number | null
}

export function summarize(project: Project): ProjectSummary {
  const lastUsedAt = project.segments.length > 0 ? project.segments[0].endedAt : null
  return { consumed: consumedSeconds(project), sessionCount: project.segments.length, lastUsedAt }
}

function normalizeSegment(raw: unknown): SegmentRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const seconds = toSeconds(typeof value.seconds === 'number' ? value.seconds : Number(value.seconds))
  if (seconds <= 0) return null

  const reason: SettleReason =
    value.reason === 'limit' || value.reason === 'exhausted' || value.reason === 'stopped'
      ? value.reason
      : value.completed === true
        ? 'limit'
        : 'stopped'

  const endedAt = toTimestamp(value.endedAt, Date.now())
  const startedAt = toTimestamp(value.startedAt, endedAt - seconds * 1000)

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId('s'),
    startedAt,
    endedAt,
    seconds,
    reason,
  }
}

/**
 * 把外部数据（导入的 JSON、旧版本 localStorage）规范化成当前模型。
 * 无法修复的条目返回 null，由调用方过滤。
 */
export function normalizeProject(raw: unknown, now: number): Project | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>

  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const totalDuration = toSeconds(Number(value.totalDuration))
  if (!name || totalDuration <= 0) return null

  const remainingRaw = value.remainingDuration === undefined ? totalDuration : toSeconds(Number(value.remainingDuration))
  const defaultSegment = Math.min(toSeconds(Number(value.defaultSegment)), totalDuration)
  const segments = Array.isArray(value.segments)
    ? value.segments
        .map(normalizeSegment)
        .filter((segment): segment is SegmentRecord => segment !== null)
        .slice(0, MAX_SEGMENT_RECORDS)
    : []

  const createdAt = toTimestamp(value.createdAt, now)
  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId('p'),
    name,
    totalDuration,
    remainingDuration: Math.min(remainingRaw, totalDuration),
    defaultSegment,
    segments,
    createdAt,
    updatedAt: toTimestamp(value.updatedAt, createdAt),
  }
}

export function normalizeProjects(raw: unknown, now: number): Project[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => normalizeProject(item, now))
    .filter((project): project is Project => project !== null)
}

/** 列表顺序：按创建时间倒序，最新的额度排在最前面 */
export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => b.createdAt - a.createdAt)
}
