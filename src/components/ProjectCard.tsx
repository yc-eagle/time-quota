import { useLanguage } from '../i18n/context.ts'
import { consumedSeconds, isExhausted, progressRatio, segmentLimitFor, summarize } from '../lib/quota.ts'
import { formatCompact, formatDuration, formatRelative, toPercent } from '../lib/time.ts'
import type { Project } from '../types/project.types.ts'
import { PencilIcon, PlayIcon, ResetIcon, TrashIcon } from './icons.tsx'

interface ProjectCardProps {
  project: Project
  isActive: boolean
  now: number
  onSelect: () => void
  onStart: (options?: { unlimited?: boolean }) => void
  onEdit: () => void
  onRequestReset: () => void
  onRequestDelete: () => void
}

export function ProjectCard({
  project,
  isActive,
  now,
  onSelect,
  onStart,
  onEdit,
  onRequestReset,
  onRequestDelete,
}: ProjectCardProps) {
  const { t, language } = useLanguage()

  const exhausted = isExhausted(project)
  const consumed = consumedSeconds(project)
  const percent = toPercent(progressRatio(project))
  const limit = segmentLimitFor(project)
  const { sessionCount, lastUsedAt } = summarize(project)
  const hasSession = sessionCount > 0

  return (
    <article className={isActive ? 'project-card is-active' : 'project-card'}>
      <div className="project-head">
        <button type="button" className="project-name" onClick={onSelect} title={project.name}>
          {project.name}
        </button>
        {exhausted ? <span className="chip chip-warn">{t('exhaustedBadge')}</span> : null}
      </div>

      <div className="project-chips">
        <span className="chip">
          {t('remaining')} {formatDuration(project.remainingDuration, language)}
        </span>
        <span className="chip">
          {t('consumed')} {formatDuration(consumed, language)}
        </span>
        <span className="chip">{t('segmentsCount', { count: sessionCount })}</span>
      </div>

      <div className="progress progress-sm">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="project-meta">
        <span>{hasSession && lastUsedAt ? t('lastUsed', { time: formatRelative(lastUsedAt, now, language) }) : t('neverUsed')}</span>
        <span>
          {t('progress')} {percent}%
        </span>
      </div>

      <div className="project-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onStart()}
          disabled={exhausted || project.defaultSegment <= 0}
        >
          <PlayIcon width={14} height={14} />
          {limit > 0 ? t('startWithSegment', { duration: formatCompact(limit) }) : t('freeWithdrawal')}
        </button>

        {project.defaultSegment > 0 && !exhausted ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStart({ unlimited: true })}>
            {t('freeWithdrawal')}
          </button>
        ) : null}

        <div className="project-actions-icons">
          <button type="button" className="icon-btn icon-btn-sm" onClick={onEdit} title={t('edit')} aria-label={t('edit')}>
            <PencilIcon width={15} height={15} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={onRequestReset}
            title={t('resetQuota')}
            aria-label={t('resetQuota')}
            disabled={consumed <= 0}
          >
            <ResetIcon width={15} height={15} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-sm is-danger"
            onClick={onRequestDelete}
            title={t('delete')}
            aria-label={t('delete')}
          >
            <TrashIcon width={15} height={15} />
          </button>
        </div>
      </div>
    </article>
  )
}
