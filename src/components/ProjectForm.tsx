import { useState, type FormEvent } from 'react'
import { useLanguage } from '../i18n/context.ts'
import { minutesToSeconds, secondsToMinutes } from '../lib/time.ts'
import type { Project, ProjectInput } from '../types/project.types.ts'

interface ProjectFormProps {
  initial?: Project | null
  onSubmit: (input: ProjectInput) => void
  onCancel: () => void
}

interface FormErrors {
  name?: string
  duration?: string
  segment?: string
}

export function ProjectForm({ initial = null, onSubmit, onCancel }: ProjectFormProps) {
  const { t } = useLanguage()
  const [name, setName] = useState(() => initial?.name ?? '')
  const [totalMinutes, setTotalMinutes] = useState(() =>
    String(initial ? secondsToMinutes(initial.totalDuration) : 90),
  )
  const [segmentMinutes, setSegmentMinutes] = useState(() =>
    String(initial ? secondsToMinutes(initial.defaultSegment) : 15),
  )
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const totalValue = Number(totalMinutes)
    const segmentValue = Number(segmentMinutes)

    const nextErrors: FormErrors = {}
    if (!trimmedName) nextErrors.name = t('errorNameRequired')
    if (!Number.isFinite(totalValue) || totalValue <= 0) nextErrors.duration = t('errorDurationRequired')
    if (Number.isFinite(segmentValue) && Number.isFinite(totalValue) && segmentValue > totalValue) {
      nextErrors.segment = t('errorSegmentRange')
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      name: trimmedName,
      totalDuration: minutesToSeconds(totalValue),
      defaultSegment: minutesToSeconds(Math.max(0, segmentValue)),
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor="project-name">
          {t('projectName')}
        </label>
        <input
          id="project-name"
          className="field-input"
          type="text"
          value={name}
          maxLength={60}
          placeholder={t('projectNamePlaceholder')}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor="project-total">
            {t('totalDuration')}
          </label>
          <input
            id="project-total"
            className="field-input"
            type="number"
            min={1}
            step={1}
            value={totalMinutes}
            onChange={(event) => setTotalMinutes(event.target.value)}
          />
          {errors.duration ? <p className="field-error">{errors.duration}</p> : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="project-segment">
            {t('defaultSegment')}
          </label>
          <input
            id="project-segment"
            className="field-input"
            type="number"
            min={0}
            step={1}
            value={segmentMinutes}
            onChange={(event) => setSegmentMinutes(event.target.value)}
          />
          {errors.segment ? <p className="field-error">{errors.segment}</p> : null}
        </div>
      </div>

      <p className="field-hint">{t('segmentHint')}</p>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t('cancel')}
        </button>
        <button type="submit" className="btn btn-primary">
          {initial ? t('save') : t('create')}
        </button>
      </div>
    </form>
  )
}
