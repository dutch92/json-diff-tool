import type { JsonValue, ParseResult } from './types'

export function normalizeJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(normalizeJson)
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
      .sort()
      .reduce<{ [key: string]: JsonValue }>((accumulator, key) => {
        accumulator[key] = normalizeJson(value[key])
        return accumulator
      }, {})
  }

  return value
}

export function formatJson(value: JsonValue) {
  return JSON.stringify(normalizeJson(value), null, 2)
}

export function parseInput(source: string): ParseResult {
  try {
    return {
      value: JSON.parse(source) as JsonValue,
      error: null,
      isValid: true,
    }
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      isValid: false,
    }
  }
}

export function previewValue(value: JsonValue | undefined) {
  if (value === undefined) {
    return '-'
  }

  const raw = JSON.stringify(value)
  return raw.length > 120 ? `${raw.slice(0, 117)}...` : raw
}
