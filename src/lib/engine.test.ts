import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Project } from '../types/project.types.ts'
import {
  autoSettleReason,
  emptyEngineState,
  engineReducer,
  liveElapsedMs,
  selectLive,
  type EngineState,
} from './engine.ts'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: '日语',
    totalDuration: 3600,
    remainingDuration: 3600,
    defaultSegment: 1500,
    segments: [],
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  }
}

function withProjects(...projects: Project[]): EngineState {
  return { ...emptyEngineState, projects, activeProjectId: projects[0]?.id ?? null }
}

test('start 创建运行中的会话', () => {
  const state = withProjects(makeProject())
  const next = engineReducer(state, { type: 'start', projectId: 'p1', segmentLimit: 1500, now: 5_000 })
  assert.equal(next.run?.status, 'running')
  assert.equal(next.run?.segmentLimit, 1500)
  assert.equal(next.run?.startedAt, 5_000)
  assert.equal(next.activeProjectId, 'p1')
})

test('liveElapsedMs 运行中按挂钟推算，暂停后冻结', () => {
  const started = engineReducer(withProjects(makeProject()), { type: 'start', projectId: 'p1', segmentLimit: 0, now: 0 })
  assert.equal(liveElapsedMs(started.run, 10_000), 10_000)

  const paused = engineReducer(started, { type: 'pause', now: 10_000 })
  assert.equal(liveElapsedMs(paused.run, 99_000), 10_000)

  const resumed = engineReducer(paused, { type: 'resume', now: 20_000 })
  assert.equal(liveElapsedMs(resumed.run, 25_000), 15_000)
})

test('selectLive 剩余额度扣除进行中的消耗', () => {
  const state = withProjects(makeProject())
  const running = engineReducer(state, { type: 'start', projectId: 'p1', segmentLimit: 1500, now: 0 })
  const live = selectLive(running, 65_000)
  assert.equal(live.elapsedSeconds, 65)
  assert.equal(live.remainingSeconds, 3535)
  assert.equal(live.consumedSeconds, 65)
  assert.equal(live.isRunning, true)
})

test('autoSettleReason 到达单次上限返回 limit', () => {
  const state = withProjects(makeProject())
  const running = engineReducer(state, { type: 'start', projectId: 'p1', segmentLimit: 1500, now: 0 })
  assert.equal(autoSettleReason(running, 1_499_000), null)
  assert.equal(autoSettleReason(running, 1_500_000), 'limit')
})

test('autoSettleReason 额度用尽返回 exhausted', () => {
  const state = withProjects(makeProject({ remainingDuration: 100 }))
  const running = engineReducer(state, { type: 'start', projectId: 'p1', segmentLimit: 0, now: 0 })
  assert.equal(autoSettleReason(running, 100_000), 'exhausted')
})

test('settle 记账后结束会话', () => {
  const state = withProjects(makeProject())
  const running = engineReducer(state, { type: 'start', projectId: 'p1', segmentLimit: 0, now: 0 })
  const settled = engineReducer(running, { type: 'settle', reason: 'stopped', now: 120_000 })
  assert.equal(settled.run, null)
  const project = settled.projects[0]
  assert.equal(project.remainingDuration, 3480)
  assert.equal(project.segments.length, 1)
  assert.equal(project.segments[0].reason, 'stopped')
})

test('start 另一个项目会先结算当前会话', () => {
  const a = makeProject({ id: 'a' })
  const b = makeProject({ id: 'b' })
  let state = withProjects(a, b)
  state = engineReducer(state, { type: 'start', projectId: 'a', segmentLimit: 0, now: 0 })
  state = engineReducer(state, { type: 'start', projectId: 'b', segmentLimit: 0, now: 60_000 })
  const settledA = state.projects.find((project) => project.id === 'a')
  assert.equal(settledA?.remainingDuration, 3540)
  assert.equal(state.run?.projectId, 'b')
})

test('delete-project 同时清掉相关会话', () => {
  let state = withProjects(makeProject())
  state = engineReducer(state, { type: 'start', projectId: 'p1', segmentLimit: 0, now: 0 })
  state = engineReducer(state, { type: 'delete-project', id: 'p1', now: 0 })
  assert.equal(state.projects.length, 0)
  assert.equal(state.run, null)
  assert.equal(state.activeProjectId, null)
})

test('import-projects replace 与 merge', () => {
  const existing = makeProject({ id: 'a', name: '旧a' })
  const imported = makeProject({ id: 'a', name: '新a' })
  const fresh = makeProject({ id: 'z', name: '新z' })

  const replaced = engineReducer(withProjects(existing), {
    type: 'import-projects',
    projects: [imported, fresh],
    mode: 'replace',
  })
  assert.deepEqual(replaced.projects.map((project) => project.id).sort(), ['a', 'z'])

  const merged = engineReducer(withProjects(existing, makeProject({ id: 'b', name: '保留b' })), {
    type: 'import-projects',
    projects: [imported, fresh],
    mode: 'merge',
  })
  assert.deepEqual(merged.projects.map((project) => project.id).sort(), ['a', 'b', 'z'])
})

test('额度用尽后 start 不生效', () => {
  const state = withProjects(makeProject({ remainingDuration: 0 }))
  const next = engineReducer(state, { type: 'start', projectId: 'p1', segmentLimit: 0, now: 0 })
  assert.equal(next.run, null)
})
