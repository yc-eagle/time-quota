/**
 * 国际化文案。zh 为基准语言，en 使用 Record<TranslationKey, string> 约束，
 * 因此漏翻或键名写错会在 `npm run typecheck` 阶段直接编译失败。
 */

export type Language = 'zh' | 'en'

const zh = {
  appName: '时间额度支取器',
  tagline: '把时间当作可随时支取的额度，而不是必须连续偿还的债务',
  footerNote: '所有数据只保存在你的浏览器本地（localStorage），不会上传到任何服务器。',

  // 计时面板
  timerIdle: '等待支取',
  timerRunning: '支取中',
  timerPaused: '已暂停',
  noProjectSelected: '还没有选中项目',
  pickProjectHint: '从右侧列表中选择一个项目，或先创建一个属于你的时间额度。',
  sessionElapsed: '本次已支取',
  segmentLimit: '单次上限',
  unlimited: '不限',
  remainingQuota: '剩余额度',
  consumedQuota: '已支取',
  totalQuota: '额度总量',
  start: '开始',
  pause: '暂停',
  resume: '继续支取',
  finish: '结束并记账',
  discard: '放弃本次',
  resetQuota: '重置额度',
  exhaustedBadge: '额度已用尽',
  freeWithdrawal: '不限时支取',
  startWithSegment: '支取 {duration}',

  // 项目
  projects: '我的时间额度',
  addProject: '新建额度',
  editProject: '编辑额度',
  projectName: '项目名称',
  projectNamePlaceholder: '例如：日语精读',
  totalDuration: '额度总量（分钟）',
  defaultSegment: '默认单次支取（分钟）',
  segmentHint: '填 0 表示不限时，直到你手动结束为止。',
  create: '创建',
  save: '保存',
  cancel: '取消',
  edit: '编辑',
  delete: '删除',
  remaining: '剩余',
  consumed: '已支取',
  progress: '进度',
  segmentsCount: '{count} 次支取',
  lastUsed: '最近支取 {time}',
  neverUsed: '尚未支取',
  noProjects: '还没有任何时间额度',
  noProjectsHint: '点击右上角「新建额度」，先给想做的事划出一段时间。',
  deleteConfirm: '确定删除「{name}」吗？该项目的额度与支取记录会一并移除。',
  resetQuotaConfirm: '把「{name}」的剩余额度恢复到 {duration}？已记录的支取流水不会删除。',
  discardConfirm: '放弃本次支取吗？这一段的 {duration} 不会计入额度消耗。',

  // 校验
  errorNameRequired: '请填写项目名称',
  errorDurationRequired: '额度总量需要大于 0 分钟',
  errorSegmentRange: '单次支取不能大于额度总量',

  // 支取记录
  history: '支取流水',
  historyHint: '最近 {count} 条',
  noHistory: '还没有支取记录，开始第一次支取吧。',
  clearHistory: '清空流水',
  clearHistoryConfirm: '确定清空全部支取流水吗？额度余额不会变化。',
  reasonLimit: '达到单次上限',
  reasonExhausted: '额度用尽',
  reasonStopped: '提前结束',

  // 数据管理
  data: '数据',
  dataHint: '导出的 JSON 可以备份或换设备继续用。',
  exportData: '导出 JSON',
  importData: '导入 JSON',
  importModeMerge: '合并导入',
  importModeReplace: '覆盖导入',
  clearAll: '清空全部数据',
  clearAllConfirm: '确定清空所有项目、额度与支取流水吗？此操作不可撤销。',

  // 帮助
  help: '使用说明',
  helpTitle: '使用说明',
  helpStep1: '先给一件事划出一段时间，例如「日语精读 90 分钟」。',
  helpStep2: '把默认单次支取设为 15 分钟，碎片时间也能随手支取一段。',
  helpStep3: '点「支取」开始计时，达到单次上限会自动结算，不会逼你连续做完。',
  helpStep4: '中途有事就暂停或结束，已用时间实时从额度里扣掉。',
  helpStep5: '额度用尽的项目会自动停下，进度条记录你真实的投入。',
  helpStep6: '数据存在本地，支持导出 JSON 备份、中英文切换与深色模式。',
  shortcuts: '快捷键',
  shortcutToggle: '开始 / 暂停当前支取',
  shortcutClose: '关闭弹窗或取消操作',
  shortcutHint: '在输入框中输入时快捷键不会生效。',

  // 设置
  theme: '主题',
  toDark: '切换到深色模式',
  toLight: '切换到浅色模式',
  language: '语言',
  sound: '提示音',
  soundOn: '开启提示音',
  soundOff: '关闭提示音',
  notify: '系统通知',
  notifyOn: '开启系统通知',
  notifyOff: '关闭系统通知',
  notifyDenied: '浏览器拒绝了通知权限，可在站点设置里重新允许。',
  notifySegmentTitle: '本次支取完成',
  notifyQuotaTitle: '额度已用尽',

  // 提示
  toastProjectCreated: '已创建「{name}」',
  toastProjectUpdated: '已更新「{name}」',
  toastProjectDeleted: '已删除「{name}」',
  toastProjectReset: '已重置「{name}」的额度',
  toastSegmentRecorded: '本次支取 {duration} 已记账',
  toastQuotaExhausted: '「{name}」的额度已用尽',
  toastDiscarded: '已放弃本次支取，未计入额度',
  toastHistoryCleared: '已清空支取流水',
  toastAllCleared: '已清空全部数据',
  toastExported: '已导出 {count} 个项目的备份',
  toastImported: '已导入 {count} 个项目',
  toastImportFailed: '导入失败：文件格式不正确',

  confirm: '确定',
  close: '关闭',
} as const

export type TranslationKey = keyof typeof zh

const en: Record<TranslationKey, string> = {
  appName: 'Time Quota Tracker',
  tagline: 'Treat time as withdrawable quota, not debt you must repay in a row',
  footerNote: 'Everything is stored locally in your browser (localStorage). Nothing is uploaded.',

  timerIdle: 'Ready to withdraw',
  timerRunning: 'Withdrawing',
  timerPaused: 'Paused',
  noProjectSelected: 'No project selected yet',
  pickProjectHint: 'Pick a project on the right, or create a new time quota first.',
  sessionElapsed: 'This session',
  segmentLimit: 'Segment limit',
  unlimited: 'Unlimited',
  remainingQuota: 'Remaining',
  consumedQuota: 'Consumed',
  totalQuota: 'Total quota',
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  finish: 'Finish & log',
  discard: 'Discard session',
  resetQuota: 'Reset quota',
  exhaustedBadge: 'Quota used up',
  freeWithdrawal: 'Withdraw without limit',
  startWithSegment: 'Withdraw {duration}',

  projects: 'My time quotas',
  addProject: 'New quota',
  editProject: 'Edit quota',
  projectName: 'Project name',
  projectNamePlaceholder: 'e.g. Japanese intensive reading',
  totalDuration: 'Total quota (minutes)',
  defaultSegment: 'Default segment (minutes)',
  segmentHint: 'Use 0 for unlimited: the timer runs until you stop it.',
  create: 'Create',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  remaining: 'Remaining',
  consumed: 'Consumed',
  progress: 'Progress',
  segmentsCount: '{count} sessions',
  lastUsed: 'Last used {time}',
  neverUsed: 'Not used yet',
  noProjects: 'No time quota yet',
  noProjectsHint: 'Click "New quota" and set aside some time for what matters.',
  deleteConfirm: 'Delete "{name}"? Its quota and session history will be removed.',
  resetQuotaConfirm: 'Restore "{name}" to {duration}? Logged sessions are kept.',
  discardConfirm: 'Discard this session? The {duration} will not be deducted from the quota.',

  errorNameRequired: 'Please enter a project name',
  errorDurationRequired: 'Total quota must be greater than 0 minutes',
  errorSegmentRange: 'Segment cannot exceed the total quota',

  history: 'Session log',
  historyHint: 'Latest {count}',
  noHistory: 'No sessions logged yet. Start your first withdrawal.',
  clearHistory: 'Clear log',
  clearHistoryConfirm: 'Clear the whole session log? Quota balances stay unchanged.',
  reasonLimit: 'Segment limit reached',
  reasonExhausted: 'Quota exhausted',
  reasonStopped: 'Ended early',

  data: 'Data',
  dataHint: 'Export a JSON backup or move your data to another device.',
  exportData: 'Export JSON',
  importData: 'Import JSON',
  importModeMerge: 'Merge',
  importModeReplace: 'Replace',
  clearAll: 'Clear all data',
  clearAllConfirm: 'Clear every project, quota and session log? This cannot be undone.',

  help: 'How it works',
  helpTitle: 'How it works',
  helpStep1: 'Reserve a block of time for one thing, e.g. "90 minutes of Japanese".',
  helpStep2: 'Set a default segment of 15 minutes so odd gaps in the day still count.',
  helpStep3: 'Hit withdraw to start. The session auto-settles at the segment limit.',
  helpStep4: 'Pause or finish any time. Used time is deducted from the quota instantly.',
  helpStep5: 'Projects stop automatically when their quota runs out, keeping the bar honest.',
  helpStep6: 'Data stays local, with JSON backup, EN/ZH switching and dark mode.',
  shortcuts: 'Shortcuts',
  shortcutToggle: 'Start / pause the current session',
  shortcutClose: 'Close a dialog or cancel',
  shortcutHint: 'Shortcuts are ignored while typing in a field.',

  theme: 'Theme',
  toDark: 'Switch to dark mode',
  toLight: 'Switch to light mode',
  language: 'Language',
  sound: 'Sound',
  soundOn: 'Enable sound',
  soundOff: 'Disable sound',
  notify: 'Notifications',
  notifyOn: 'Enable notifications',
  notifyOff: 'Disable notifications',
  notifyDenied: 'The browser blocked notifications. Allow them in site settings.',
  notifySegmentTitle: 'Session complete',
  notifyQuotaTitle: 'Quota exhausted',

  toastProjectCreated: 'Created "{name}"',
  toastProjectUpdated: 'Updated "{name}"',
  toastProjectDeleted: 'Deleted "{name}"',
  toastProjectReset: 'Quota of "{name}" was reset',
  toastSegmentRecorded: 'Logged {duration} to the quota',
  toastQuotaExhausted: '"{name}" has no quota left',
  toastDiscarded: 'Session discarded, nothing was deducted',
  toastHistoryCleared: 'Session log cleared',
  toastAllCleared: 'All data cleared',
  toastExported: 'Exported a backup of {count} projects',
  toastImported: 'Imported {count} projects',
  toastImportFailed: 'Import failed: unsupported file format',

  confirm: 'Confirm',
  close: 'Close',
}

export const translations: Record<Language, Record<TranslationKey, string>> = { zh, en }

export const languageNames: Record<Language, string> = { zh: '中文', en: 'English' }

/** 支持 {name} 形式的占位符插值 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key]
    return value === undefined ? match : String(value)
  })
}
