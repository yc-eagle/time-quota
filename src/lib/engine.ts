import type { Project, RunState, SettleReason, TimerStatus } from '../types/project.types.ts'
import { applyPatch, resetQuota, settleSegment, sortProjects } from './quota.ts'

export const STATE_VERSION = 1

/** 全局状态：项目列表 + 当前选中的项目 + 正在进行的支取会话 */
export interface EngineState {
  projects: Project[]
  activeProjectId: string | null
  run: RunState | null
}

export const emptyEngineState: EngineState = {
  projects: [],
  activeProjectId: null,
  run: null,
}

export type ProjectPatch = Partial<Pick<Project, 'name' | 'totalDuration' | 'defaultSegment'>>

export type EngineAction =
  | { type: 'replace'; state: EngineState }
  | { type: 'create-project'; project: Project }
  | { type: 'update-project'; id: string; patch: ProjectPatch; now: number }
  | { type: 'delete-project'; id: string; now: number }
  | { type: 'select-project'; id: string }
  | { type: 'start'; projectId: string; segmentLimit: number; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'settle'; reason: SettleReason; now: number }
  | { type: 'discard'; now: number }
  | { type: 'reset-project'; id: string; now: number }
  | { type: 'clear-segments' }
  | { type: 'import-projects'; projects: Project[]; mode: 'merge' | 'replace' }
  | { type: 'clear-all' }

export function findProject(state: EngineState, id: string | null): Project | null {
  if (!id) return null
  return state.projects.find((project) => project.id === id) ?? null
}

/** 会话累计运行毫秒数（运行中按挂钟时间实时推算，不受标签页节流影响） */
export function liveElapsedMs(run: RunState | null, now: number): number {
  if (!run) return 0
  if (run.status === 'running' && run.startedAt !== null) {
    return run.elapsedMs + Math.max(0, now - run.startedAt)
  }
  return run.elapsedMs
}

function replaceProject(state: EngineState, project: Project): Project[] {
  return state.projects.map((item) => (item.id === project.id ? project : item))
}

/** 结算当前会话：扣除额度、写入流水、结束会话 */
function settleCurrentRun(state: EngineState, reason: SettleReason, now: number): EngineState {
  const run = state.run
  if (!run) return state

  const project = findProject(state, run.projectId)
  if (!project) return { ...state, run: null }

  const { project: settled } = settleSegment(
    project,
    {
      startedAt: run.sessionStartedAt,
      endedAt: now,
      elapsedMs: liveElapsedMs(run, now),
      segmentLimit: run.segmentLimit,
      reason,
    },
    now,
  )

  return {
    ...state,
    projects: replaceProject(state, settled),
    activeProjectId: settled.id,
    run: null,
  }
}

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'replace':
      return action.state

    case 'create-project':
      return {
        ...state,
        projects: sortProjects([...state.projects, action.project]),
        activeProjectId: action.project.id,
      }

    case 'update-project': {
      const project = findProject(state, action.id)
      if (!project) return state
      const updated = applyPatch(project, action.patch, action.now)
      if (updated.totalDuration <= 0 || !updated.name) return state
      return { ...state, projects: replaceProject(state, updated) }
    }

    case 'delete-project': {
      const projects = state.projects.filter((project) => project.id !== action.id)
      const run = state.run?.projectId === action.id ? null : state.run
      const activeProjectId =
        state.activeProjectId === action.id ? (projects[0]?.id ?? null) : state.activeProjectId
      return { ...state, projects, run, activeProjectId }
    }

    case 'select-project':
      return findProject(state, action.id) ? { ...state, activeProjectId: action.id } : state

    case 'start': {
      // 同一时间只允许一个会话：先结算正在进行的支取
      const base = state.run ? settleCurrentRun(state, 'stopped', action.now) : state
      const project = findProject(base, action.projectId)
      if (!project || project.remainingDuration <= 0) return base

      const segmentLimit =
        action.segmentLimit > 0 ? Math.min(action.segmentLimit, project.remainingDuration) : 0

      return {
        ...base,
        activeProjectId: project.id,
        run: {
          projectId: project.id,
          status: 'running',
          segmentLimit,
          startedAt: action.now,
          elapsedMs: 0,
          sessionStartedAt: action.now,
        },
      }
    }

    case 'pause': {
      const run = state.run
      if (!run || run.status !== 'running') return state
      return {
        ...state,
        run: { ...run, status: 'paused', startedAt: null, elapsedMs: liveElapsedMs(run, action.now) },
      }
    }

    case 'resume': {
      const run = state.run
      if (!run || run.status !== 'paused') return state
      return { ...state, run: { ...run, status: 'running', startedAt: action.now } }
    }

    case 'settle':
      return settleCurrentRun(state, action.reason, action.now)

    case 'discard':
      return state.run ? { ...state, activeProjectId: state.run.projectId, run: null } : state

    case 'reset-project': {
      const project = findProject(state, action.id)
      if (!project) return state
      return { ...state, projects: replaceProject(state, resetQuota(project, action.now)) }
    }

    case 'clear-segments':
      return {
        ...state,
        projects: state.projects.map((project) => ({ ...project, segments: [] })),
      }

    case 'import-projects': {
      const projects =
        action.mode === 'replace'
          ? sortProjects(action.projects)
          : sortProjects([
              ...state.projects.filter(
                (project) => !action.projects.some((imported) => imported.id === project.id),
              ),
              ...action.projects,
            ])
      const run = state.run && projects.some((project) => project.id === state.run?.projectId) ? state.run : null
      const activeProjectId =
        state.activeProjectId && projects.some((project) => project.id === state.activeProjectId)
          ? state.activeProjectId
          : (projects[0]?.id ?? null)
      return { projects, run, activeProjectId }
    }

    case 'clear-all':
      return emptyEngineState

    default:
      return state
  }
}

export interface LiveView {
  project: Project | null
  run: RunState | null
  status: TimerStatus
  /** 本次支取已运行毫秒数 */
  elapsedMs: number
  elapsedSeconds: number
  /** 本次支取上限（秒），0 表示不限 */
  limitSeconds: number
  /** 扣除进行中消耗后的剩余额度（秒） */
  remainingSeconds: number
  totalSeconds: number
  consumedSeconds: number
  progress: number
  isRunning: boolean
}

/** 派生视图：把状态与当前时间换算成界面需要的数值 */
export function selectLive(state: EngineState, now: number): LiveView {
  const run = state.run
  const project = findProject(state, run?.projectId ?? state.activeProjectId)
  const elapsedMs = liveElapsedMs(run, now)
  const elapsedSeconds = Math.floor(elapsedMs / 1000)

  const totalSeconds = project?.totalDuration ?? 0
  const baseRemaining = project?.remainingDuration ?? 0
  const remainingSeconds = Math.max(0, baseRemaining - elapsedSeconds)
  const consumedSeconds = Math.max(0, totalSeconds - remainingSeconds)
  const limitSeconds = run ? run.segmentLimit : (project?.defaultSegment ?? 0)

  return {
    project,
    run,
    status: run ? run.status : 'idle',
    elapsedMs,
    elapsedSeconds,
    limitSeconds,
    remainingSeconds,
    totalSeconds,
    consumedSeconds,
    progress: totalSeconds > 0 ? Math.min(1, consumedSeconds / totalSeconds) : 0,
    isRunning: run?.status === 'running',
  }
}

/**
 * 判断当前会话是否应该自动结算：
 * 达到单次上限 -> limit；额度用尽 -> exhausted。
 */
export function autoSettleReason(state: EngineState, now: number): SettleReason | null {
  const run = state.run
  if (!run || run.status !== 'running') return null

  const project = findProject(state, run.projectId)
  if (!project) return null

  const elapsedSeconds = Math.floor(liveElapsedMs(run, now) / 1000)
  if (run.segmentLimit > 0 && elapsedSeconds >= run.segmentLimit) return 'limit'
  if (elapsedSeconds >= project.remainingDuration) return 'exhausted'
  return null
}

/** 当前会话的结束时间点（毫秒时间戳，不含暂停），用于进度条预测 */
export function sessionDeadline(state: EngineState, now: number): number | null {
  const run = state.run
  if (!run || run.status !== 'running') return null
  const project = findProject(state, run.projectId)
  if (!project) return null

  const remainingMs = run.segmentLimit > 0
    ? run.segmentLimit * 1000 - liveElapsedMs(run, now)
    : project.remainingDuration * 1000 - liveElapsedMs(run, now)
  return now + Math.max(0, remainingMs)
}
