import { useState } from 'react'
import { useLanguage } from '../i18n/context.ts'
import type { LiveView } from '../lib/engine.ts'
import { formatClock, formatCompact, formatDuration, toPercent } from '../lib/time.ts'
import type { Project } from '../types/project.types.ts'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { FlagIcon, PauseIcon, PlayIcon, TrashIcon } from './icons.tsx'

interface TimerDisplayProps {
  live: LiveView
  onToggle: () => void
  onFinish: () => void
  onDiscard: () => void
  onStart: (project: Project, options?: { unlimited?: boolean }) => void
}

export function TimerDisplay({ live, onToggle, onFinish, onDiscard, onStart }: TimerDisplayProps) {
  const { t, language } = useLanguage()
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const { project, status, elapsedSeconds, remainingSeconds, limitSeconds, progress } = live
  const statusLabel = t(status === 'running' ? 'timerRunning' : status === 'paused' ? 'timerPaused' : 'timerIdle')

  return (
    <section className="panel timer-panel" aria-live="off">
      <div className="timer-top">
        <div>
          <p className="panel-eyebrow">{t('sessionElapsed')}</p>
          <h2 className="timer-project">{project ? project.name : t('noProjectSelected')}</h2>
        </div>
        <span className={`status-pill status-${status}`}>{statusLabel}</span>
      </div>

      {project ? (
        <>
          <div className="timer-clock-block">
            <p className="metric-label">{t('remainingQuota')}</p>
            <p className="timer-clock">{formatClock(remainingSeconds)}</p>
            <div className="timer-sub">
              <span>
                {t('sessionElapsed')} <strong>{formatClock(elapsedSeconds)}</strong>
              </span>
              <span className="dot-sep" aria-hidden="true">
                ·
              </span>
              <span>
                {t('segmentLimit')}{' '}
                <strong>{limitSeconds > 0 ? formatDuration(limitSeconds, language) : t('unlimited')}</strong>
              </span>
            </div>
          </div>

          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={toPercent(progress)}>
            <div className="progress-fill" style={{ width: `${toPercent(progress)}%` }} />
          </div>
          <div className="progress-meta">
            <span>
              {t('consumedQuota')} {formatDuration(live.consumedSeconds, language)}
            </span>
            <span>{toPercent(progress)}%</span>
            <span>
              {t('totalQuota')} {formatDuration(live.totalSeconds, language)}
            </span>
          </div>

          <div className="timer-controls">
            {status === 'idle' ? (
              <>
                {project.defaultSegment > 0 && project.remainingDuration > 0 ? (
                  <button type="button" className="btn btn-primary" onClick={() => onStart(project)}>
                    <PlayIcon width={16} height={16} />
                    {t('startWithSegment', { duration: formatCompact(project.defaultSegment) })}
                  </button>
                ) : null}
                {project.remainingDuration > 0 ? (
                  <button
                    type="button"
                    className={project.defaultSegment > 0 ? 'btn btn-ghost' : 'btn btn-primary'}
                    onClick={() => onStart(project, { unlimited: true })}
                  >
                    {t('freeWithdrawal')}
                  </button>
                ) : (
                  <span className="chip chip-warn">{t('exhaustedBadge')}</span>
                )}
              </>
            ) : (
              <>
                <button type="button" className={status === 'running' ? 'btn btn-ghost' : 'btn btn-primary'} onClick={onToggle}>
                  {status === 'running' ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
                  {status === 'running' ? t('pause') : t('resume')}
                </button>
                <button type="button" className="btn btn-primary" onClick={onFinish}>
                  <FlagIcon width={16} height={16} />
                  {t('finish')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDiscard(true)}>
                  <TrashIcon width={16} height={16} />
                  {t('discard')}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <p className="empty-hint">{t('pickProjectHint')}</p>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        tone="danger"
        title={t('discard')}
        message={t('discardConfirm', { duration: formatDuration(elapsedSeconds, language) })}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false)
          onDiscard()
        }}
      />
    </section>
  )
}
