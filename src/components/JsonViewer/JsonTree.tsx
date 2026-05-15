import { useEffect, useRef, useState } from 'react'
import { getDiffMarker } from '../../lib/json/diffMarkers'
import type { DiffKind, JsonValue } from '../../lib/json/types'

type JsonTreeProps = {
  value: JsonValue
  diffStatuses: Map<string, DiffKind>
  activePath?: string
}

type JsonNodeProps = {
  label?: string
  path: string
  value: JsonValue
  diffStatuses: Map<string, DiffKind>
  activePath?: string
  collapsedPaths: Set<string>
  expandedPaths: Set<string>
  onTogglePath: (path: string) => void
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

function JsonNode({
  label,
  path,
  value,
  diffStatuses,
  activePath,
  collapsedPaths,
  expandedPaths,
  onTogglePath,
}: JsonNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const diffStatus = diffStatuses.get(path)
  const statusClass = diffStatus ? ` json-node-${diffStatus}` : ''
  const marker = diffStatus ? getDiffMarker(diffStatus) : null
  const isActive = activePath === path && Boolean(diffStatus)
  const activeClass = isActive ? ' json-node-active' : ''
  const isArray = Array.isArray(value)
  const isObject = typeof value === 'object' && value !== null && !isArray
  const isContainer = isArray || isObject
  const isCollapsed = collapsedPaths.has(path) && !expandedPaths.has(path)

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

  if (!isContainer) {
    return (
      <div ref={nodeRef} className={`json-node${statusClass}${activeClass}`}>
        {marker ? (
          <span className="json-node__marker" aria-label={marker.label}>
            {marker.symbol}
          </span>
        ) : null}
        {label ? <span className="json-key">{JSON.stringify(label)}: </span> : null}
        <span className={getValueClassName(value)}>{formatPrimitive(value)}</span>
      </div>
    )
  }

  const entries = isArray
    ? value.map((item, index) => [index, item] as const)
    : Object.keys(value)
        .sort()
        .map((key) => [key, value[key]] as const)
  const opening = isArray ? '[' : '{'
  const closing = isArray ? ']' : '}'

  return (
    <div ref={nodeRef} className={`json-node${statusClass}${activeClass}`}>
      {marker ? (
        <span className="json-node__marker" aria-label={marker.label}>
          {marker.symbol}
        </span>
      ) : null}
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

      {!isCollapsed ? (
        <>
          <div className="json-node__children">
            {entries.map(([key, childValue]) => (
              <JsonNode
                key={String(key)}
                label={typeof key === 'string' ? key : undefined}
                path={joinPath(path, key)}
                value={childValue}
                diffStatuses={diffStatuses}
                activePath={activePath}
                collapsedPaths={collapsedPaths}
                expandedPaths={expandedPaths}
                onTogglePath={onTogglePath}
              />
            ))}
          </div>
          <div className="json-node json-node__closing">{closing}</div>
        </>
      ) : null}
    </div>
  )
}

export function JsonTree({ value, diffStatuses, activePath }: JsonTreeProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set())
  const expandedPaths = activePath ? new Set(getAncestorPaths(activePath)) : new Set<string>()

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
    <JsonNode
      path="root"
      value={value}
      diffStatuses={diffStatuses}
      activePath={activePath}
      collapsedPaths={collapsedPaths}
      expandedPaths={expandedPaths}
      onTogglePath={handleTogglePath}
    />
  )
}
