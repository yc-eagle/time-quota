import assert from 'node:assert/strict'
import { test } from 'node:test'
import { translations } from './translations.ts'

test('中英文文案键完全一致', () => {
  const zhKeys = Object.keys(translations.zh).sort()
  const enKeys = Object.keys(translations.en).sort()
  assert.deepEqual(enKeys, zhKeys)
})

test('所有文案非空', () => {
  for (const lang of ['zh', 'en'] as const) {
    for (const [key, value] of Object.entries(translations[lang])) {
      assert.ok(value.trim().length > 0, `${lang}.${key} 为空`)
    }
  }
})

test('两种语言均不残留未翻译的占位标记', () => {
  for (const lang of ['zh', 'en'] as const) {
    for (const value of Object.values(translations[lang])) {
      assert.ok(!value.includes('{missing'), `${lang}: ${value}`)
    }
  }
})
