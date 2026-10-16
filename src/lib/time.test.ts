import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clampRatio, formatClock, formatCompact, formatDuration, minutesToSeconds, secondsToMinutes, toPercent, toSeconds } from './time.ts'

test('toSeconds 过滤非法输入', () => {
  assert.equal(toSeconds(-5), 0)
  assert.equal(toSeconds(0), 0)
  assert.equal(toSeconds(7.9), 7)
  assert.equal(toSeconds(Number.NaN), 0)
})

test('formatClock 输出 mm:ss 或 h:mm:ss', () => {
  assert.equal(formatClock(0), '00:00')
  assert.equal(formatClock(65), '01:05')
  assert.equal(formatClock(600), '10:00')
  assert.equal(formatClock(3661), '1:01:01')
})

test('formatDuration 中英文输出', () => {
  assert.equal(formatDuration(0, 'zh'), '0秒')
  assert.equal(formatDuration(45, 'zh'), '45秒')
  assert.equal(formatDuration(90, 'zh'), '1分30秒')
  assert.equal(formatDuration(5400, 'zh'), '1小时30分')
  assert.equal(formatDuration(90, 'en'), '1m 30s')
  assert.equal(formatDuration(5400, 'en'), '1h 30m')
})

test('formatCompact 紧凑输出', () => {
  assert.equal(formatCompact(5400), '1h30m')
  assert.equal(formatCompact(1500), '25m')
  assert.equal(formatCompact(45), '45s')
})

test('分钟与秒互转', () => {
  assert.equal(minutesToSeconds(25), 1500)
  assert.equal(minutesToSeconds(0), 0)
  assert.equal(secondsToMinutes(1500), 25)
  assert.equal(secondsToMinutes(1545), 26)
})

test('百分比与比例夹紧', () => {
  assert.equal(toPercent(0.5), 50)
  assert.equal(toPercent(1.5), 100)
  assert.equal(toPercent(-0.2), 0)
  assert.equal(clampRatio(1.2), 1)
  assert.equal(clampRatio(-0.1), 0)
})
