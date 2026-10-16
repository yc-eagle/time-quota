import { useRef, useState, type ChangeEvent } from 'react'
import { useLanguage } from '../i18n/context.ts'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { DownloadIcon, TrashIcon, UploadIcon } from './icons.tsx'

export type ImportMode = 'merge' | 'replace'

interface DataPanelProps {
  projectCount: number
  onExport: () => void
  onImport: (text: string, mode: ImportMode) => void
  onClearAll: () => void
}

export function DataPanel({ projectCount, onExport, onImport, onClearAll }: DataPanelProps) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [confirmClear, setConfirmClear] = useState(false)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 立即清空，保证同一个文件可以重复导入
    event.target.value = ''
    if (!file) return
    onImport(await file.text(), mode)
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{t('data')}</h2>
      </div>

      <p className="empty-hint">{t('dataHint')}</p>

      <div className="data-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExport} disabled={projectCount === 0}>
          <DownloadIcon width={15} height={15} />
          {t('exportData')}
        </button>

        <label className="data-mode">
          <span className="sr-only">{t('importData')}</span>
          <select className="lang-select" value={mode} onChange={(event) => setMode(event.target.value as ImportMode)}>
            <option value="merge">{t('importModeMerge')}</option>
            <option value="replace">{t('importModeReplace')}</option>
          </select>
        </label>

        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
          <UploadIcon width={15} height={15} />
          {t('importData')}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm is-danger"
          onClick={() => setConfirmClear(true)}
          disabled={projectCount === 0}
        >
          <TrashIcon width={15} height={15} />
          {t('clearAll')}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleFile}
        tabIndex={-1}
      />

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        title={t('clearAll')}
        message={t('clearAllConfirm')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false)
          onClearAll()
        }}
      />
    </section>
  )
}
