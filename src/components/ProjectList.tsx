import { useState } from 'react'
import { useLanguage } from '../i18n/context.ts'
import type { ToastTone } from '../hooks/useToasts.ts'
import { formatDuration } from '../lib/time.ts'
import type { Project, ProjectInput } from '../types/project.types.ts'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { PlusIcon } from './icons.tsx'
import { ProjectCard } from './ProjectCard.tsx'
import { ProjectForm } from './ProjectForm.tsx'

interface ProjectListProps {
  projects: Project[]
  activeProjectId: string | null
  runningProjectId: string | null
  now: number
  onSelect: (id: string) => void
  onStart: (project: Project, options?: { unlimited?: boolean }) => void
  onCreate: (input: ProjectInput) => Project
  onUpdate: (id: string, input: ProjectInput) => void
  onDelete: (id: string) => void
  onReset: (id: string) => void
  pushToast: (message: string, tone?: ToastTone) => void
}

type ConfirmKind = 'delete' | 'reset'

export function ProjectList({
  projects,
  activeProjectId,
  runningProjectId,
  now,
  onSelect,
  onStart,
  onCreate,
  onUpdate,
  onDelete,
  onReset,
  pushToast,
}: ProjectListProps) {
  const { t, language } = useLanguage()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; project: Project } | null>(null)

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSubmit = (input: ProjectInput) => {
    if (editing) {
      onUpdate(editing.id, input)
      pushToast(t('toastProjectUpdated', { name: input.name }), 'success')
    } else {
      onCreate(input)
      pushToast(t('toastProjectCreated', { name: input.name }), 'success')
    }
    closeForm()
  }

  const handleConfirm = () => {
    if (!confirm) return
    const { kind, project } = confirm
    if (kind === 'delete') {
      onDelete(project.id)
      pushToast(t('toastProjectDeleted', { name: project.name }), 'info')
    } else {
      onReset(project.id)
      pushToast(t('toastProjectReset', { name: project.name }), 'success')
    }
    setConfirm(null)
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">
          {t('projects')}
          {projects.length > 0 ? <span className="panel-count">{projects.length}</span> : null}
        </h2>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <PlusIcon width={15} height={15} />
          {t('addProject')}
        </button>
      </div>

      {formOpen || editing ? (
        <ProjectForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      {projects.length === 0 ? (
        <div className="empty">
          <p className="empty-title">{t('noProjects')}</p>
          <p className="empty-hint">{t('noProjectsHint')}</p>
        </div>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              now={now}
              isActive={project.id === activeProjectId || project.id === runningProjectId}
              onSelect={() => onSelect(project.id)}
              onStart={(options) => onStart(project, options)}
              onEdit={() => {
                setEditing(project)
                setFormOpen(false)
              }}
              onRequestReset={() => setConfirm({ kind: 'reset', project })}
              onRequestDelete={() => setConfirm({ kind: 'delete', project })}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        tone={confirm?.kind === 'delete' ? 'danger' : 'default'}
        title={confirm?.kind === 'delete' ? t('delete') : t('resetQuota')}
        message={
          confirm
            ? confirm.kind === 'delete'
              ? t('deleteConfirm', { name: confirm.project.name })
              : t('resetQuotaConfirm', {
                  name: confirm.project.name,
                  duration: formatDuration(confirm.project.totalDuration, language),
                })
            : ''
        }
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </section>
  )
}
