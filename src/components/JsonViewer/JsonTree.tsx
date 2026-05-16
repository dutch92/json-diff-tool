import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { getDiffMarker } from '../../lib/json/diffMarkers'
import { parseJsonLiteral } from '../../lib/json/editValue'
import type { DiffKind, JsonValue } from '../../lib/json/types'

type JsonTreeProps = {
  value: JsonValue
  diffStatuses: Map<string, DiffKind>
  activePath?: string
  onChangeValue: (path: string, value: JsonValue) => void
}

type JsonNodeProps = {
  label?: string
  path: string
  value: JsonValue
  depth: number
  lineNumbers: LineNumbersByPath
  diffStatuses: Map<string, DiffKind>
  activePath?: string
  collapsedPaths: Set<string>
  expandedPaths: Set<string>
  onChangeValue: (path: string, value: JsonValue) => void
  onTogglePath: (path: string) => void
}

type JsonNodeLineNumbers = {
  opening: number
  closing: number | null
}

type LineNumbersByPath = Map<string, JsonNodeLineNumbers>

type LineNumberEntry = [string, JsonNodeLineNumbers]

type LineNumberResult = {
  entries: LineNumberEntry[]
  nextLineNumber: number
}

type JsonRowProps = {
  children: ReactNode
  className: string
  depth: number
  lineNumber: number
  marker: ReturnType<typeof getDiffMarker> | null
  nodeRef?: RefObject<HTMLDivElement | null>
}

function JsonRow({ children, className, depth, lineNumber, marker, nodeRef }: JsonRowProps) {
  return (
    <div ref={nodeRef} className={className}>
      <span className="json-node__line-number" aria-hidden="true">
        {lineNumber}
      </span>
      <span className="json-node__marker" aria-label={marker?.label ?? undefined}>
        {marker?.symbol ?? ''}
      </span>
      <span
        className="json-node__content"
        style={{ '--json-node-depth': depth } as CSSProperties}
      >
        {children}
      </span>
    </div>
  )
}

function joinPath(basePath: string, key: string | number) {
  if (typeof key === 'number') {
    return `${basePath}[${key}]`
  }

  return `${basePath}.${key}`
}

function getAncestorPaths(path: string) {
  const ancestors: string[] = []
  let current = 'root'
  let index = current.length

  while (index < path.length) {
    if (path[index] === '.') {
      const nextDot = path.indexOf('.', index + 1)
      const nextBracket = path.indexOf('[', index + 1)
      const candidates = [nextDot, nextBracket].filter((item) => item !== -1)
      const nextIndex = candidates.length > 0 ? Math.min(...candidates) : path.length

      current += path.slice(index, nextIndex)
      ancestors.push(current)
      index = nextIndex
      continue
    }

    if (path[index] === '[') {
      const closeIndex = path.indexOf(']', index)

      if (closeIndex === -1) {
        break
      }

      current += path.slice(index, closeIndex + 1)
      ancestors.push(current)
      index = closeIndex + 1
      continue
    }

    index += 1
  }

  return ancestors.slice(0, -1)
}

function getValueClassName(value: JsonValue) {
  if (value === null) {
    return 'json-null'
  }

  if (typeof value === 'string') {
    return 'json-string'
  }

  if (typeof value === 'number') {
    return 'json-number'
  }

  if (typeof value === 'boolean') {
    return 'json-boolean'
  }

  return ''
}

function formatPrimitive(value: JsonValue) {
  return typeof value === 'string' ? JSON.stringify(value) : String(value)
}

function getArrayLabel(length: number) {
  const lastDigit = length % 10
  const lastTwoDigits = length % 100

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${length} элемент`
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${length} элемента`
  }

  return `${length} элементов`
}

function getContainerEntries(value: JsonValue) {
  if (Array.isArray(value)) {
    return value.map((item, index) => [index, item] as const)
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
      .sort()
      .map((key) => [key, value[key]] as const)
  }

  return []
}

function collectVisibleLineNumbers(
  value: JsonValue,
  path: string,
  collapsedPaths: Set<string>,
  expandedPaths: Set<string>,
  lineNumber: number,
): LineNumberResult {
  const isArray = Array.isArray(value)
  const isObject = typeof value === 'object' && value !== null && !isArray
  const isContainer = isArray || isObject
  const isCollapsed = collapsedPaths.has(path) && !expandedPaths.has(path)

  if (!isContainer || isCollapsed) {
    return {
      entries: [[path, { opening: lineNumber, closing: null }]],
      nextLineNumber: lineNumber + 1,
    }
  }

  const childrenResult = getContainerEntries(value).reduce<LineNumberResult>(
    (result, [key, childValue]) => {
      const childResult = collectVisibleLineNumbers(
        childValue,
        joinPath(path, key),
        collapsedPaths,
        expandedPaths,
        result.nextLineNumber,
      )

      return {
        entries: [...result.entries, ...childResult.entries],
        nextLineNumber: childResult.nextLineNumber,
      }
    },
    { entries: [], nextLineNumber: lineNumber + 1 },
  )

  return {
    entries: [
      [path, { opening: lineNumber, closing: childrenResult.nextLineNumber }],
      ...childrenResult.entries,
    ],
    nextLineNumber: childrenResult.nextLineNumber + 1,
  }
}

function getVisibleLineNumbers(
  value: JsonValue,
  collapsedPaths: Set<string>,
  expandedPaths: Set<string>,
) {
  return new Map(collectVisibleLineNumbers(value, 'root', collapsedPaths, expandedPaths, 1).entries)
}

function JsonNode({
  label,
  path,
  value,
  depth,
  lineNumbers,
  diffStatuses,
  activePath,
  collapsedPaths,
  expandedPaths,
  onChangeValue,
  onTogglePath,
}: JsonNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const diffStatus = diffStatuses.get(path)
  const statusClass = diffStatus ? ` json-node-${diffStatus}` : ''
  const marker = diffStatus ? getDiffMarker(diffStatus) : null
  const isActive = activePath === path && Boolean(diffStatus)
  const activeClass = isActive ? ' json-node-active' : ''
  const isArray = Array.isArray(value)
  const isObject = typeof value === 'object' && value !== null && !isArray
  const isContainer = isArray || isObject
  const isCollapsed = collapsedPaths.has(path) && !expandedPaths.has(path)
  const [draftValue, setDraftValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditingValue, setIsEditingValue] = useState(false)

  useEffect(() => {
    if (!isActive || !nodeRef.current) {
      return
    }

    nodeRef.current.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'smooth',
    })
  }, [isActive])

  useEffect(() => {
    if (isEditingValue) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [isEditingValue])

  const startEditingValue = () => {
    setDraftValue(JSON.stringify(value))
    setEditError(null)
    setIsEditingValue(true)
  }

  const cancelEditingValue = () => {
    setDraftValue('')
    setEditError(null)
    setIsEditingValue(false)
  }

  const applyEditingValue = () => {
    const parsed = parseJsonLiteral(draftValue)

    if (!parsed.isValid) {
      setEditError('Введите JSON-значение')
      return
    }

    onChangeValue(path, parsed.value)
    setEditError(null)
    setIsEditingValue(false)
  }

  const nodeLineNumbers = lineNumbers.get(path)
  const lineNumber = nodeLineNumbers?.opening ?? 0

  if (!isContainer) {
    return (
      <JsonRow
        className={`json-node${statusClass}${activeClass}`}
        depth={depth}
        lineNumber={lineNumber}
        marker={marker}
        nodeRef={nodeRef}
      >
        {label ? <span className="json-key">{JSON.stringify(label)}: </span> : null}
        {isEditingValue ? (
          <span className="json-node__edit-wrap">
            <input
              ref={editInputRef}
              className="json-node__edit-input"
              aria-label={`${label ?? path}: JSON-значение`}
              value={draftValue}
              onBlur={applyEditingValue}
              onChange={(event) => {
                setDraftValue(event.target.value)
                setEditError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyEditingValue()
                }

                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelEditingValue()
                }
              }}
            />
            {editError ? <span className="json-node__edit-error">{editError}</span> : null}
          </span>
        ) : (
          <button
            className={`json-node__value ${getValueClassName(value)}`.trim()}
            type="button"
            aria-label={`Редактировать ${label ?? path}`}
            onClick={startEditingValue}
          >
            {formatPrimitive(value)}
          </button>
        )}
      </JsonRow>
    )
  }

  const entries = getContainerEntries(value)
  const opening = isArray ? '[' : '{'
  const closing = isArray ? ']' : '}'

  return (
    <div className="json-node__group">
      <JsonRow
        className={`json-node${statusClass}${activeClass}`}
        depth={depth}
        lineNumber={lineNumber}
        marker={marker}
        nodeRef={nodeRef}
      >
        <button
          className="json-node__toggle"
          type="button"
          aria-expanded={!isCollapsed}
          onClick={() => onTogglePath(path)}
        >
          <svg
            className="json-node__chevron"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M5.75 3.5 10.25 8l-4.5 4.5" />
          </svg>
          {label ? <span className="json-key">{JSON.stringify(label)}: </span> : null}
          <span>{opening}</span>
          {isCollapsed ? (
            <>
              <span className="json-node__ellipsis">...</span>
              <span>{closing}</span>
              {isArray ? (
                <span className="json-node__meta">{getArrayLabel(value.length)}</span>
              ) : null}
            </>
          ) : null}
        </button>
      </JsonRow>

      {!isCollapsed ? (
        <>
          <div className="json-node__children">
            {entries.map(([key, childValue]) => (
              <JsonNode
                key={String(key)}
                label={typeof key === 'string' ? key : undefined}
                path={joinPath(path, key)}
                value={childValue}
                depth={depth + 1}
                lineNumbers={lineNumbers}
                diffStatuses={diffStatuses}
                activePath={activePath}
                collapsedPaths={collapsedPaths}
                expandedPaths={expandedPaths}
                onChangeValue={onChangeValue}
                onTogglePath={onTogglePath}
              />
            ))}
          </div>
          <JsonRow
            className="json-node json-node__closing"
            depth={depth}
            lineNumber={nodeLineNumbers?.closing ?? 0}
            marker={null}
          >
            {closing}
          </JsonRow>
        </>
      ) : null}
    </div>
  )
}

export function JsonTree({ value, diffStatuses, activePath, onChangeValue }: JsonTreeProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set())
  const expandedPaths = useMemo(
    () => (activePath ? new Set(getAncestorPaths(activePath)) : new Set<string>()),
    [activePath],
  )
  const lineNumbers = useMemo(
    () => getVisibleLineNumbers(value, collapsedPaths, expandedPaths),
    [value, collapsedPaths, expandedPaths],
  )

  const handleTogglePath = (path: string) => {
    setCollapsedPaths((current) => {
      const next = new Set(current)

      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }

      return next
    })
  }

  return (
    <div className="json-tree">
      <JsonNode
        path="root"
        value={value}
        depth={0}
        lineNumbers={lineNumbers}
        diffStatuses={diffStatuses}
        activePath={activePath}
        collapsedPaths={collapsedPaths}
        expandedPaths={expandedPaths}
        onChangeValue={onChangeValue}
        onTogglePath={handleTogglePath}
      />
    </div>
  )
}
