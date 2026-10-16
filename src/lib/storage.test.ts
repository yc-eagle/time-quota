import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Project } from '../types/project.types.ts'
import type { EngineState } from './engine.ts'
import {
  buildExport,
  hydrateState,
  LEGACY_PROJECTS_KEY,
  loadState,
  migrateLegacyState,
  parseImport,
  saveState,
  STORAGE_KEY,
  type StorageLike,
} from './storage.ts'

function makeStorage(seed: Record<string, string> = {}): StorageLike {
  const map = new Map<string, string>(Object.entries(seed))
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: '日语',
    totalDuration: 3600,
    remainingDuration: 3000,
    defaultSegment: 1500,
    segments: [{ id: 's1', startedAt: 1, endedAt: 2, seconds: 600, reason: 'stopped' }],
    createdAt: 1_000,
    updatedAt: 2_000,
    ...overrides,
  }
}

test('saveState / loadState 往返一致', () => {
  const storage = makeStorage()
  const state: EngineState = { projects: [makeProject()], activeProjectId: 'p1', run: null }
  saveState(state, storage)
  const loaded = loadState(123, storage)
  assert.equal(loaded.projects.length, 1)
  assert.equal(loaded.projects[0].remainingDuration, 3000)
  assert.equal(loaded.projects[0].segments[0].seconds, 600)
  assert.equal(loaded.activeProjectId, 'p1')
})

test('loadState 优先读取新版键', () => {
  const storage = makeStorage({
    [STORAGE_KEY]: JSON.stringify({ version: 1, projects: [makeProject()], activeProjectId: 'p1', run: null }),
    [LEGACY_PROJECTS_KEY]: JSON.stringify([makeProject({ id: 'old', name: '旧' })]),
  })
  const loaded = loadState(1, storage)
  assert.equal(loaded.projects[0].name, '日语')
})

test('migrateLegacyState 迁移旧键且幂等', () => {
  const legacy = {
    id: 'p1',
    name: '旧项目',
    totalDuration: 1800,
    remainingDuration: 900,
    defaultSegment: 300,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
  const storage = makeStorage({ [LEGACY_PROJECTS_KEY]: JSON.stringify([legacy]) })
  const first = migrateLegacyState(100, storage)
  assert.equal(first.projects.length, 1)
  assert.equal(first.projects[0].remainingDuration, 900)

  const second = migrateLegacyState(200, storage)
  assert.equal(second.projects.length, 1)
})

test('hydrateState 丢弃指向不存在项目的 run', () => {
  const state = hydrateState({ version: 1, projects: [makeProject()], activeProjectId: 'p1', run: { projectId: 'missing', status: 'running', segmentLimit: 0, startedAt: 1, elapsedMs: 0, sessionStartedAt: 1 } }, 1)
  assert.equal(state.run, null)
})

test('buildExport / parseImport 往返', () => {
  const state: EngineState = { projects: [makeProject()], activeProjectId: 'p1', run: null }
  const text = buildExport(state, 5_000)
  const projects = parseImport(text, 9_000)
  assert.equal(projects.length, 1)
  assert.equal(projects[0].name, '日语')
  assert.equal(projects[0].segments.length, 1)
})

test('parseImport 也接受裸数组', () => {
  const projects = parseImport(JSON.stringify([makeProject()]), 1)
  assert.equal(projects.length, 1)
})

test('parseImport 非法内容抛错', () => {
  assert.throws(() => parseImport('{not json', 1))
  assert.throws(() => parseImport('[]', 1))
  assert.throws(() => parseImport(JSON.stringify({ projects: [{ name: 'x' }] }), 1))
})
