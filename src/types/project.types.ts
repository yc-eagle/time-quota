/**
 * 领域模型：一个「项目」就是一笔时间额度账户。
 * 所有时长字段统一使用「秒」，所有时间戳统一使用「毫秒 Unix 时间戳」，
 * 这样 JSON 序列化/反序列化后类型不会漂移（旧版本用 Date 对象序列化后会变成字符串）。
 */

/** 一次支取结束的原因 */
export type SettleReason = 'limit' | 'exhausted' | 'stopped'

/** 一条支取记录（一次「开始 → 暂停/结束」的完整消耗） */
export interface SegmentRecord {
  id: string
  /** 本次支取开始的时间戳（毫秒） */
  startedAt: number
  /** 本次支取落账的时间戳（毫秒） */
  endedAt: number
  /** 实际扣减的秒数 */
  seconds: number
  /** 结束原因：达到分段上限 / 额度用尽 / 手动提前结束 */
  reason: SettleReason
}

export interface Project {
  id: string
  name: string
  /** 额度总量（秒） */
  totalDuration: number
  /** 剩余额度（秒） */
  remainingDuration: number
  /** 默认单次支取时长（秒），0 表示不限 */
  defaultSegment: number
  /** 支取记录，最新的在前 */
  segments: SegmentRecord[]
  createdAt: number
  updatedAt: number
}

/** 新建/编辑项目时的输入 */
export interface ProjectInput {
  name: string
  /** 秒 */
  totalDuration: number
  /** 秒，0 表示不限 */
  defaultSegment: number
}

export type RunStatus = 'running' | 'paused'

/** 当前正在进行的支取会话 */
export interface RunState {
  projectId: string
  status: RunStatus
  /** 本次支取的分段上限（秒），0 表示不限 */
  segmentLimit: number
  /** 当前这一段运行的起点；暂停时为 null */
  startedAt: number | null
  /** 已经累计的运行毫秒数（包含本次运行之前的片段） */
  elapsedMs: number
  /** 本次支取会话开始的时间戳（毫秒） */
  sessionStartedAt: number
}

/** 计时器在界面上呈现的状态 */
export type TimerStatus = 'idle' | RunStatus

/** 持久化到 localStorage 的结构 */
export interface PersistedState {
  version: number
  projects: Project[]
  activeProjectId: string | null
  run: RunState | null
}
