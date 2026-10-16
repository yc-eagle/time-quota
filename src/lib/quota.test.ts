import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Project } from '../types/project.types.ts'
import {
  applyPatch,
  consumedSeconds,
  createProject,
  normalizeProject,
  progressRatio,
  resetQuota,
  segmentLimitFor,
  settleSecondsFor,
  settleSegment,
  sortProjects,
} from './quota.ts'

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

test('createProject 初始化额度', () => {
  const project = createProject({ name: ' 阅读 ', totalDuration: 5400, defaultSegment: 1800 }, 123, 'p9')
  assert.equal(project.name, '阅读')
  assert.equal(project.remainingDuration, 5400)
  assert.equal(project.defaultSegment, 1800)
})

test('defaultSegment 不会超过总量', () => {
  const project = createProject({ name: 'a', totalDuration: 600, defaultSegment: 3600 }, 1)
  assert.equal(project.defaultSegment, 600)
})

test('segmentLimitFor 与剩余额度取小；不限时为 0', () => {
  assert.equal(segmentLimitFor(makeProject({ remainingDuration: 1000, defaultSegment: 1500 })), 1000)
  assert.equal(segmentLimitFor(makeProject({ defaultSegment: 0 })), 0)
})

test('settleSecondsFor 先按上限再按额度截断', () => {
  assert.equal(settleSecondsFor(makeProject(), 1_600_000, 1500), 1500)
  assert.equal(settleSecondsFor(makeProject({ remainingDuration: 300 }), 1_600_000, 1500), 300)
  assert.equal(settleSecondsFor(makeProject(), 1_600_000, 0), 1600)
})

test('settleSegment 扣减额度并写入记录', () => {
  const { project, record } = settleSegment(
    makeProject(),
    { startedAt: 1000, endedAt: 1_501_000, elapsedMs: 1_500_000, segmentLimit: 1500, reason: 'limit' },
    1_501_000,
  )
  assert.equal(project.remainingDuration, 2100)
  assert.equal(consumedSeconds(project), 1500)
  assert.ok(record)
  assert.equal(record.seconds, 1500)
  assert.equal(record.reason, 'limit')
  assert.equal(project.segments.length, 1)
  assert.equal(project.segments[0].id, record.id)
})

test('settleSegment 额度用尽时截断', () => {
  const { project, record } = settleSegment(
    makeProject({ remainingDuration: 90 }),
    { startedAt: 0, endedAt: 120_000, elapsedMs: 120_000, segmentLimit: 0, reason: 'exhausted' },
    120_000,
  )
  assert.equal(project.remainingDuration, 0)
  assert.equal(record?.seconds, 90)
})

test('不足 1 秒不产生记录', () => {
  const { project, record } = settleSegment(
    makeProject(),
    { startedAt: 0, endedAt: 400, elapsedMs: 400, segmentLimit: 1500, reason: 'stopped' },
    400,
  )
  assert.equal(project.remainingDuration, 3600)
  assert.equal(record, null)
})

test('applyPatch 缩小总量时保留已支取', () => {
  const project = makeProject({ remainingDuration: 2000 })
  const updated = applyPatch(project, { totalDuration: 3000 }, 9)
  assert.equal(updated.totalDuration, 3000)
  assert.equal(consumedSeconds(updated), 1600)
  assert.equal(updated.remainingDuration, 1400)
})

test('applyPatch 放大总量时剩余随之增加', () => {
  const project = makeProject({ remainingDuration: 2000 })
  const updated = applyPatch(project, { totalDuration: 7200 }, 9)
  assert.equal(updated.remainingDuration, 5600)
})

test('resetQuota 恢复额度且保留流水', () => {
  const project = makeProject({ remainingDuration: 500, segments: [{ id: 's1', startedAt: 1, endedAt: 2, seconds: 100, reason: 'stopped' }] })
  const reset = resetQuota(project, 9)
  assert.equal(reset.remainingDuration, 3600)
  assert.equal(reset.segments.length, 1)
})

test('progressRatio 与 consumedSeconds', () => {
  const project = makeProject({ remainingDuration: 900 })
  assert.equal(consumedSeconds(project), 2700)
  assert.equal(progressRatio(project), 0.75)
})

test('normalizeProject 兼容旧版 ISO 时间戳', () => {
  const legacy = {
    id: 'p1',
    name: '旧项目',
    totalDuration: 1800,
    remainingDuration: 1200,
    defaultSegment: 600,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
  const project = normalizeProject(legacy, 999)
  assert.ok(project)
  assert.equal(project.createdAt, Date.parse('2024-01-01T00:00:00.000Z'))
  assert.equal(project.segments.length, 0)
})

test('normalizeProject 过滤非法条目', () => {
  assert.equal(normalizeProject(null, 1), null)
  assert.equal(normalizeProject({ name: '无额度' }, 1), null)
  assert.equal(normalizeProject({ name: '   ' }, 1), null)
})

test('sortProjects 按创建时间倒序', () => {
  const a = makeProject({ id: 'a', createdAt: 100 })
  const b = makeProject({ id: 'b', createdAt: 300 })
  const c = makeProject({ id: 'c', createdAt: 200 })
  assert.deepEqual(sortProjects([a, b, c]).map((project) => project.id), ['b', 'c', 'a'])
})
