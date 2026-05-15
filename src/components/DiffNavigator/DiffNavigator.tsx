import './DiffNavigator.css'

type DiffNavigatorProps = {
  activeDiffIndex: number
  diffCount: number
  activeDiffPath?: string
  onPreviousDiff: () => void
  onNextDiff: () => void
}

export function DiffNavigator({
  activeDiffIndex,
  diffCount,
  activeDiffPath,
  onPreviousDiff,
  onNextDiff,
}: DiffNavigatorProps) {
  const canNavigate = diffCount > 0
  const displayPath = activeDiffPath?.replace(/^root\.?/, '') || activeDiffPath

  return (
    <nav className="diff-navigator" aria-label="Навигация по отличиям">
      <button
        className="diff-navigator__button"
        type="button"
        aria-label="Предыдущее отличие"
        onClick={onPreviousDiff}
        disabled={!canNavigate}
      >
          <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 10 8 5.5 12.5 10" />
        </svg>
      </button>
      <span className="diff-navigator__count">
        {canNavigate ? `${activeDiffIndex + 1} / ${diffCount}` : '0 / 0'}
      </span>
      {displayPath ? (
        <span className="diff-navigator__path">{displayPath}</span>
      ) : null}
      <button
        className="diff-navigator__button"
        type="button"
        aria-label="Следующее отличие"
        onClick={onNextDiff}
        disabled={!canNavigate}
      >
          <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 6 8 10.5 12.5 6" />
        </svg>
      </button>
    </nav>
  )
}
