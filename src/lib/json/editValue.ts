import type { JsonValue } from './types'

type PathSegment = string | number

type ParseJsonLiteralResult =
  | {
      isValid: true
      value: JsonValue
    }
  | {
      error: string
      isValid: false
      value: null
    }

function parsePath(path: string): PathSegment[] {
  if (path === 'root') {
    return []
  }

  const segments: PathSegment[] = []
  let index = 'root'.length

  while (index < path.length) {
    if (path[index] === '.') {
      const nextDot = path.indexOf('.', index + 1)
      const nextBracket = path.indexOf('[', index + 1)
      const candidates = [nextDot, nextBracket].filter((item) => item !== -1)
      const nextIndex = candidates.length > 0 ? Math.min(...candidates) : path.length

      segments.push(path.slice(index + 1, nextIndex))
      index = nextIndex
      continue
    }

    if (path[index] === '[') {
      const closeIndex = path.indexOf(']', index)

      if (closeIndex === -1) {
        break
      }

      segments.push(Number(path.slice(index + 1, closeIndex)))
      index = closeIndex + 1
      continue
    }

    index += 1
  }

  return segments
}

function updateAtSegments(value: JsonValue, segments: PathSegment[], nextValue: JsonValue): JsonValue {
  if (segments.length === 0) {
    return nextValue
  }

  const [segment, ...rest] = segments

  if (Array.isArray(value) && typeof segment === 'number') {
    return value.map((item, index) =>
      index === segment ? updateAtSegments(item, rest, nextValue) : item,
    )
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof segment === 'string') {
    return {
      ...value,
      [segment]: updateAtSegments(value[segment], rest, nextValue),
    }
  }

  return value
}

export function parseJsonLiteral(source: string): ParseJsonLiteralResult {
  try {
    return {
      isValid: true,
      value: JSON.parse(source) as JsonValue,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Invalid JSON',
      isValid: false,
      value: null,
    }
  }
}

export function updateJsonValueAtPath(value: JsonValue, path: string, nextValue: JsonValue): JsonValue {
  return updateAtSegments(value, parsePath(path), nextValue)
}
