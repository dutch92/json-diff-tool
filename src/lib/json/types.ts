export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

export type DiffKind = 'added' | 'removed' | 'changed'

export type DiffEntry = {
  path: string
  kind: DiffKind
  before?: JsonValue
  after?: JsonValue
}

export type ParseResult = {
  value: JsonValue
  error: string | null
  isValid: boolean
}
