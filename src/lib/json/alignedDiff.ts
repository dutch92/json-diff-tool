import type { DiffKind, JsonValue } from './types'

export type DiffLine = { text: string; number: number }
export type AlignedRow = {
  left?: DiffLine
  right?: DiffLine
  path: string
  kind?: DiffKind
}

const isContainer = (value: JsonValue | undefined): value is JsonValue[] | Record<string, JsonValue> =>
  value !== null && typeof value === 'object'

/** Canonical JSON: object order is ignored, array order is significant. */
export function buildAlignedRows(left: JsonValue, right: JsonValue): AlignedRow[] {
  const rows: AlignedRow[] = []
  let leftNumber = 0
  let rightNumber = 0
  const add = (a: string | undefined, b: string | undefined, path: string, kind?: DiffKind) => {
    rows.push({
      left: a === undefined ? undefined : { text: a, number: ++leftNumber },
      right: b === undefined ? undefined : { text: b, number: ++rightNumber },
      path, kind,
    })
  }
  const render = (value: JsonValue, depth: number, label: string, comma: boolean): string[] => {
    const indent = '  '.repeat(depth)
    if (!isContainer(value)) return [indent + label + JSON.stringify(value) + (comma ? ',' : '')]
    const keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value).sort()
    const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}']
    if (!keys.length) return [indent + label + open + close + (comma ? ',' : '')]
    return [indent + label + open, ...keys.flatMap((key, i) =>
      render((value as Record<string, JsonValue>)[key], depth + 1,
        Array.isArray(value) ? '' : JSON.stringify(key) + ': ', i < keys.length - 1)),
    indent + close + (comma ? ',' : '')]
  }
  const visit = (a: JsonValue | undefined, b: JsonValue | undefined, path: string,
    depth: number, label: string, commaA: boolean, commaB: boolean) => {
    const indent = '  '.repeat(depth)
    if (isContainer(a) && isContainer(b) && Array.isArray(a) === Array.isArray(b)) {
      const array = Array.isArray(a)
      const keysA = array ? a.map((_, i) => String(i)) : Object.keys(a).sort()
      const keysB = Array.isArray(b) ? b.map((_, i) => String(i)) : Object.keys(b).sort()
      const keys = array ? Array.from({ length: Math.max(keysA.length, keysB.length) }, (_, i) => String(i))
        : [...new Set([...keysA, ...keysB])].sort()
      const [open, close] = array ? ['[', ']'] : ['{', '}']
      if (!keys.length) {
        add(indent + label + open + close + (commaA ? ',' : ''), indent + label + open + close + (commaB ? ',' : ''), path)
        return
      }
      add(indent + label + open, indent + label + open, path)
      for (const key of keys) {
        visit(Object.hasOwn(a, key) ? (a as Record<string, JsonValue>)[key] : undefined,
          Object.hasOwn(b, key) ? (b as Record<string, JsonValue>)[key] : undefined,
          array ? `${path}[${key}]` : `${path}.${key}`, depth + 1,
          array ? '' : JSON.stringify(key) + ': ', key !== keysA.at(-1), key !== keysB.at(-1))
      }
      add(indent + close + (commaA ? ',' : ''), indent + close + (commaB ? ',' : ''), path)
      return
    }
    const kind = a === undefined ? 'added' : b === undefined ? 'removed' : a !== b ? 'changed' : undefined
    const linesA = a === undefined ? [] : render(a, depth, label, commaA)
    const linesB = b === undefined ? [] : render(b, depth, label, commaB)
    for (let i = 0; i < Math.max(linesA.length, linesB.length); i++) add(linesA[i], linesB[i], path, kind)
  }
  visit(left, right, 'root', 0, '', false, false)
  return rows
}

/** The smallest single span covering a line's changed characters. */
export function changedSpan(text: string, other: string): [number, number] {
  let start = 0
  while (start < text.length && start < other.length && text[start] === other[start]) start++
  let end = text.length
  let otherEnd = other.length
  while (end > start && otherEnd > start && text[end - 1] === other[otherEnd - 1]) { end--; otherEnd-- }
  return [start, end]
}

export type VisibleRow = { type: 'line'; index: number } | { type: 'fold'; start: number; end: number }

export function foldUnchanged(rows: AlignedRow[], context = 3): VisibleRow[] {
  const visible: VisibleRow[] = []
  for (let i = 0; i < rows.length;) {
    if (rows[i].kind) { visible.push({ type: 'line', index: i++ }); continue }
    let end = i
    while (end < rows.length && !rows[end].kind) end++
    const keepStart = i === 0 ? 0 : context
    const keepEnd = end === rows.length ? 0 : context
    if (end - i > keepStart + keepEnd + 2) {
      for (let j = i; j < i + keepStart; j++) visible.push({ type: 'line', index: j })
      visible.push({ type: 'fold', start: i + keepStart, end: end - keepEnd })
      for (let j = end - keepEnd; j < end; j++) visible.push({ type: 'line', index: j })
    } else for (let j = i; j < end; j++) visible.push({ type: 'line', index: j })
    i = end
  }
  return visible
}
