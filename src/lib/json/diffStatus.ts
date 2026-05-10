import type { DiffEntry, DiffKind } from './types'

export function buildDiffStatusMap(
  diffs: DiffEntry[],
  side: 'left' | 'right',
): Map<string, DiffKind> {
  const statuses = new Map<string, DiffKind>()

  for (const diff of diffs) {
    if (diff.kind === 'added' && side === 'right') {
      statuses.set(diff.path, diff.kind)
    }

    if (diff.kind === 'removed' && side === 'left') {
      statuses.set(diff.path, diff.kind)
    }

    if (diff.kind === 'changed') {
      statuses.set(diff.path, diff.kind)
    }
  }

  return statuses
}
