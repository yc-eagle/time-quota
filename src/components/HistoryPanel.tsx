import { useMemo, useState } from 'react'
import { useLanguage } from '../i18n/context.ts'
import type { TranslationKey } from '../i18n/translations.ts'
import { formatDateTime, formatDuration, formatRelative } from '../lib/time.ts'
import type { Project, SettleReason } from '../types/project.types.ts'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { TrashIcon } from './icons.tsx'

interface HistoryPanelProps {
  projects: Project[]
  now: number
  onClear: () => void
}

const MAX_ROWS = 12
const REASON_KEYS: Record<SettleReason, TranslationKey> = {
  limit: 'reasonLimit',
  exhausted: 'reasonExhausted',
  stopped: 'reasonStopped',
}

interface Row {
  id: string
  projectName: string
  seconds: number
  reason: SettleReason
  endedAt: number
}

export function HistoryPanel({ projects, now, onClear }: HistoryPanelProps) {
  const { t, language } = useLanguage()
  const [confirmClear, setConfirmClear] = useState(false)

  const rows = useMemo<Row[]>(
    () =>
      projects
        .flatMap((project) =>
          project.segments.map((segment) => ({
            id: segment.id,
            projectName: project.name,
            seconds: segment.seconds,
            reason: segment.reason,
            endedAt: segment.endedAt,
          })),
        )
        .sort((a, b) => b.endedAt - a.endedAt)
        .slice(0, MAX_ROWS),
    [projects],
  )

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">
          {t('history')}
          {rows.length > 0 ? <span className="panel-count">{t('historyHint', { count: rows.length })}</span> : null}
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirmClear(true)}
          disabled={rows.length === 0}
        >
          <TrashIcon width={15} height={15} />
          {t('clearHistory')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="empty-hint">{t('noHistory')}</p>
      ) : (
        <ul className="history-list">
          {rows.map((row) => (
            <li key={row.id} className="history-item">
              <div className="history-main">
                <span className="history-project">{row.projectName}</span>
                <span className={`chip chip-reason reason-${row.reason}`}>{t(REASON_KEYS[row.reason])}</span>
              </div>
              <div className="history-meta">
                <span className="history-duration">{formatDuration(row.seconds, language)}</span>
                <span title={formatDateTime(row.endedAt, language)}>{formatRelative(row.endedAt, now, language)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        title={t('clearHistory')}
        message={t('clearHistoryConfirm')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false)
          onClear()
        }}
      />
    </section>
  )
}
