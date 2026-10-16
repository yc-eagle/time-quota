import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { Project, ProjectInput, SettleReason } from '../types/project.types.ts'
import {
  autoSettleReason,
  engineReducer,
  liveElapsedMs,
  selectLive,
  type EngineState,
  type LiveView,
  type ProjectPatch,
} from '../lib/engine.ts'
import { createProject, segmentLimitFor, settleSecondsFor } from '../lib/quota.ts'
import { buildExport, loadState, parseImport, saveState } from '../lib/storage.ts'

/** 界面刷新间隔：只影响渲染频率，实际消耗始终按挂钟时间计算 */
export const TICK_INTERVAL_MS = 250

export interface SettledInfo {
  projectId: string
  projectName: string
  seconds: number
  reason: SettleReason
}

export interface AutoSettleEvent extends SettledInfo {
  sessionStartedAt: number
  at: number
}

export interface UseTimeQuotaResult {
  state: EngineState
  live: LiveView
  /** 最近一次渲染所用的时间基准，可用于相对时间等展示 */
  now: number
  /** 最近一次「自动结算」（到点或额度用尽），供 UI 弹提示、播放提示音 */
  autoSettle: AutoSettleEvent | null
  startProject: (project: Project, options?: { unlimited?: boolean }) => void
  pause: () => void
  resume: () => void
  toggleTimer: () => void
  /** 结束并记账，返回本次实际的扣减结果 */
  finish: () => SettledInfo | null
  /** 放弃本次，不扣减额度 */
  discard: () => void
  addProject: (input: ProjectInput) => Project
  updateProject: (id: string, patch: ProjectPatch) => void
  deleteProject: (id: string) => void
  resetProject: (id: string) => void
  selectProject: (id: string) => void
  clearSegments: () => void
  clearAll: () => void
  exportJson: () => string
  importJson: (text: string, mode?: 'merge' | 'replace') => Project[]
}

/**
 * 时间额度引擎。核心规则：
 * 1. 同一时间只允许一个支取会话；
 * 2. 消耗按挂钟时间计算（不累加 tick），标签页被节流也不会丢时间；
 * 3. 达到单次上限或额度用尽时自动结算并落账。
 */
export function useTimeQuota(): UseTimeQuotaResult {
  const [state, dispatch] = useReducer(engineReducer, undefined, () => loadState(Date.now()))
  const [now, setNow] = useState(() => Date.now())
  const [autoSettle, setAutoSettle] = useState<AutoSettleEvent | null>(null)

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const status = state.run?.status ?? 'idle'
  const runningProjectId = state.run?.projectId ?? null

  // 运行中持续推进「现在」，让倒计时平滑走动
  useEffect(() => {
    if (status !== 'running') return

    const tick = () => setNow(Date.now())
    tick()

    const timer = window.setInterval(tick, TICK_INTERVAL_MS)
    // 从后台切回来时立即校正读数
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [status, runningProjectId])

  // 自动结算：到达单次上限或额度用尽
  const lastSettledRef = useRef<string | null>(null)
  useEffect(() => {
    if (status !== 'running') return

    const run = state.run
    if (!run) return

    const reason = autoSettleReason(state, now)
    if (!reason) return

    const project = state.projects.find((item) => item.id === run.projectId)
    const seconds = project ? settleSecondsFor(project, liveElapsedMs(run, now), run.segmentLimit) : 0

    dispatch({ type: 'settle', reason, now })

    const sessionKey = `${run.projectId}:${run.sessionStartedAt}`
    if (project && seconds > 0 && lastSettledRef.current !== sessionKey) {
      lastSettledRef.current = sessionKey
      setAutoSettle({
        projectId: project.id,
        projectName: project.name,
        seconds,
        reason,
        sessionStartedAt: run.sessionStartedAt,
        at: now,
      })
    }
  }, [now, state, status])

  // 每次状态变化都落盘；run 的状态也一并保存，刷新后可继续
  useEffect(() => {
    saveState(state)
  }, [state])

  const live = useMemo(() => selectLive(state, now), [state, now])

  const startProject = useCallback((project: Project, options?: { unlimited?: boolean }) => {
    const limit = options?.unlimited ? 0 : segmentLimitFor(project)
    dispatch({ type: 'start', projectId: project.id, segmentLimit: limit, now: Date.now() })
  }, [])

  const pause = useCallback(() => {
    dispatch({ type: 'pause', now: Date.now() })
  }, [])

  const resume = useCallback(() => {
    dispatch({ type: 'resume', now: Date.now() })
  }, [])

  const toggleTimer = useCallback(() => {
    const run = stateRef.current.run
    if (!run) return
    dispatch({ type: run.status === 'running' ? 'pause' : 'resume', now: Date.now() })
  }, [])

  const finish = useCallback((): SettledInfo | null => {
    const current = stateRef.current
    const run = current.run
    if (!run) return null

    const timestamp = Date.now()
    const project = current.projects.find((item) => item.id === run.projectId) ?? null
    const seconds = project ? settleSecondsFor(project, liveElapsedMs(run, timestamp), run.segmentLimit) : 0

    dispatch({ type: 'settle', reason: 'stopped', now: timestamp })

    if (!project || seconds <= 0) return null
    return { projectId: project.id, projectName: project.name, seconds, reason: 'stopped' }
  }, [])

  const discard = useCallback(() => {
    dispatch({ type: 'discard', now: Date.now() })
  }, [])

  const addProject = useCallback((input: ProjectInput): Project => {
    const project = createProject(input, Date.now())
    dispatch({ type: 'create-project', project })
    return project
  }, [])

  const updateProject = useCallback((id: string, patch: ProjectPatch) => {
    dispatch({ type: 'update-project', id, patch, now: Date.now() })
  }, [])

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: 'delete-project', id, now: Date.now() })
  }, [])

  const resetProject = useCallback((id: string) => {
    dispatch({ type: 'reset-project', id, now: Date.now() })
  }, [])

  const selectProject = useCallback((id: string) => {
    dispatch({ type: 'select-project', id })
  }, [])

  const clearSegments = useCallback(() => {
    dispatch({ type: 'clear-segments' })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'clear-all' })
  }, [])

  const exportJson = useCallback(() => buildExport(stateRef.current, Date.now()), [])

  const importJson = useCallback((text: string, mode: 'merge' | 'replace' = 'merge'): Project[] => {
    const projects = parseImport(text, Date.now())
    dispatch({ type: 'import-projects', projects, mode })
    return projects
  }, [])

  return {
    state,
    live,
    now,
    autoSettle,
    startProject,
    pause,
    resume,
    toggleTimer,
    finish,
    discard,
    addProject,
    updateProject,
    deleteProject,
    resetProject,
    selectProject,
    clearSegments,
    clearAll,
    exportJson,
    importJson,
  }
}
