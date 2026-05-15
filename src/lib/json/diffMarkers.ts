import type { DiffKind } from './types'

const diffMarkers: Record<DiffKind, { symbol: string; label: string }> = {
  added: { symbol: '+', label: 'Добавлено' },
  removed: { symbol: '-', label: 'Удалено' },
  changed: { symbol: '~', label: 'Изменено' },
}

export function getDiffMarker(kind: DiffKind) {
  return diffMarkers[kind]
}
