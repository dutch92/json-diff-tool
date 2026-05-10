import type { DiffEntry, JsonValue } from './types'

function getValueType(value: JsonValue) {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return 'array'
  }

  return typeof value
}

function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function areEqual(left: JsonValue, right: JsonValue): boolean {
  if (left === right) {
    return true
  }

  if (getValueType(left) !== getValueType(right)) {
    return false
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false
    }

    return left.every((item, index) => areEqual(item, right[index]))
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left).sort()
    const rightKeys = Object.keys(right).sort()

    if (
      leftKeys.length !== rightKeys.length ||
      leftKeys.some((key, index) => key !== rightKeys[index])
    ) {
      return false
    }

    return leftKeys.every((key) => areEqual(left[key], right[key]))
  }

  return false
}

function joinPath(basePath: string, key: string | number) {
  if (typeof key === 'number') {
    return `${basePath}[${key}]`
  }

  return basePath ? `${basePath}.${key}` : key
}

export function diffJson(left: JsonValue, right: JsonValue, path = 'root'): DiffEntry[] {
  if (areEqual(left, right)) {
    return []
  }

  const leftType = getValueType(left)
  const rightType = getValueType(right)

  if (leftType !== rightType) {
    return [{ path, kind: 'changed', before: left, after: right }]
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const diff: DiffEntry[] = []
    const maxLength = Math.max(left.length, right.length)

    for (let index = 0; index < maxLength; index += 1) {
      const nextPath = joinPath(path, index)

      if (index >= left.length) {
        diff.push({ path: nextPath, kind: 'added', after: right[index] })
        continue
      }

      if (index >= right.length) {
        diff.push({ path: nextPath, kind: 'removed', before: left[index] })
        continue
      }

      diff.push(...diffJson(left[index], right[index], nextPath))
    }

    return diff
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const diff: DiffEntry[] = []
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])

    for (const key of [...keys].sort()) {
      const nextPath = joinPath(path, key)

      if (!(key in left)) {
        diff.push({ path: nextPath, kind: 'added', after: right[key] })
        continue
      }

      if (!(key in right)) {
        diff.push({ path: nextPath, kind: 'removed', before: left[key] })
        continue
      }

      diff.push(...diffJson(left[key], right[key], nextPath))
    }

    return diff
  }

  return [{ path, kind: 'changed', before: left, after: right }]
}
