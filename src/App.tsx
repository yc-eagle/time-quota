import { useCallback, useEffect, useRef, useState } from 'react'
import { DataPanel, type ImportMode } from './components/DataPanel.tsx'
import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { HelpGuide } from './components/HelpGuide.tsx'
import { HistoryPanel } from './components/HistoryPanel.tsx'
import { ProjectList } from './components/ProjectList.tsx'
import { TimerDisplay } from './components/TimerDisplay.tsx'
import { ToastStack } from './components/ToastStack.tsx'
import { usePreferences } from './hooks/usePreferences.ts'
import { useTheme } from './hooks/useTheme.ts'
import { useTimeQuota } from './hooks/useTimeQuota.ts'
import { useToasts } from './hooks/useToasts.ts'
import { useLanguage } from './i18n/context.ts'
import { playChime, sendNotification } from './lib/notify.ts'
import { formatClock, formatDuration } from './lib/time.ts'
import type { Project, ProjectInput } from './types/project.types.ts'

function App() {
  const { t, language } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { soundEnabled, notifyEnabled, toggleSound, toggleNotify } = usePreferences()
  const { toasts, push, dismiss } = useToasts()
  const {
    state,
    live,
    now,
    autoSettle,
    startProject,
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
  } = useTimeQuota()

  const [helpOpen, setHelpOpen] = useState(false)

  // 标签页标题实时反映剩余额度，切到别的标签也能瞄一眼
  useEffect(() => {
    if (live.run && live.project) {
      document.title = `${formatClock(live.remainingSeconds)} · ${live.project.name} · ${t('appName')}`
    } else {
      document.title = t('appName')
    }
  }, [live.run, live.project, live.remainingSeconds, t])

  // 自动结算（到点 / 额度用尽）时给出提示音、系统通知与气泡。
  // 这些值通过 ref 读取，让 effect 只随 autoSettle 触发，避免切换语言时重复提示。
  const settleCtxRef = useRef({ soundEnabled, notifyEnabled, language, t, push })
  useEffect(() => {
    settleCtxRef.current = { soundEnabled, notifyEnabled, language, t, push }
  })

  useEffect(() => {
    if (!autoSettle) return

    const { soundEnabled: sound, notifyEnabled: notify, language: lang, t: translate, push: toast } = settleCtxRef.current
    const exhausted = autoSettle.reason === 'exhausted'
    const duration = formatDuration(autoSettle.seconds, lang)

    if (sound) playChime(exhausted ? 'quota' : 'segment')
    if (notify) {
      sendNotification(
        translate(exhausted ? 'notifyQuotaTitle' : 'notifySegmentTitle'),
        `${autoSettle.projectName} · ${duration}`,
      )
    }

    toast(
      exhausted
        ? translate('toastQuotaExhausted', { name: autoSettle.projectName })
        : translate('toastSegmentRecorded', { duration }),
      exhausted ? 'warning' : 'success',
    )
  }, [autoSettle])

  // 空格键开始 / 暂停当前支取
  useEffect(() => {
    const hasRun = Boolean(live.run)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return
      if (!hasRun) return
      event.preventDefault()
      toggleTimer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [live.run, toggleTimer])

  const handleStart = useCallback(
    (project: Project, options?: { unlimited?: boolean }) => {
      selectProject(project.id)
      startProject(project, options)
    },
    [selectProject, startProject],
  )

  const handleFinish = useCallback(() => {
    const settled = finish()
    if (settled) {
      push(t('toastSegmentRecorded', { duration: formatDuration(settled.seconds, language) }), 'success')
    }
  }, [finish, push, t, language])

  const handleDiscard = useCallback(() => {
    discard()
    push(t('toastDiscarded'), 'info')
  }, [discard, push, t])

  const handleCreate = useCallback((input: ProjectInput) => addProject(input), [addProject])

  const handleUpdate = useCallback(
    (id: string, input: ProjectInput) => updateProject(id, input),
    [updateProject],
  )

  const handleExport = useCallback(() => {
    const json = exportJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `time-quota-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    push(t('toastExported', { count: state.projects.length }), 'success')
  }, [exportJson, push, t, state.projects.length])

  const handleImport = useCallback(
    (text: string, mode: ImportMode) => {
      try {
        const projects = importJson(text, mode)
        push(t('toastImported', { count: projects.length }), 'success')
      } catch {
        push(t('toastImportFailed'), 'warning')
      }
    },
    [importJson, push, t],
  )

  const handleClearAll = useCallback(() => {
    clearAll()
    push(t('toastAllCleared'), 'info')
  }, [clearAll, push, t])

  const handleClearHistory = useCallback(() => {
    clearSegments()
    push(t('toastHistoryCleared'), 'info')
  }, [clearSegments, push, t])

  const handleToggleNotify = useCallback(async () => {
    const result = await toggleNotify()
    if (result === 'denied') push(t('notifyDenied'), 'warning')
  }, [toggleNotify, push, t])

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        notifyEnabled={notifyEnabled}
        onToggleSound={toggleSound}
        onToggleNotify={handleToggleNotify}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <main className="app-main">
        <div className="layout">
          <div className="layout-main">
            <TimerDisplay
              live={live}
              onToggle={toggleTimer}
              onFinish={handleFinish}
              onDiscard={handleDiscard}
              onStart={handleStart}
            />
            <DataPanel
              projectCount={state.projects.length}
              onExport={handleExport}
              onImport={handleImport}
              onClearAll={handleClearAll}
            />
          </div>

          <div className="layout-side">
            <ProjectList
              projects={state.projects}
              activeProjectId={state.activeProjectId}
              runningProjectId={live.run?.projectId ?? null}
              now={now}
              onSelect={selectProject}
              onStart={handleStart}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onDelete={deleteProject}
              onReset={resetProject}
              pushToast={push}
            />
            <HistoryPanel projects={state.projects} now={now} onClear={handleClearHistory} />
          </div>
        </div>
      </main>

      <Footer />
      <HelpGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

export default App
