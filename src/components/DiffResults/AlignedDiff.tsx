import { memo, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { buildAlignedRows, changedSpan, foldUnchanged, type AlignedRow, type DiffLine } from '../../lib/json/alignedDiff'
import { highlightJsonText } from '../../lib/json/highlight'
import type { DiffEntry, JsonValue } from '../../lib/json/types'
import { useVirtualRows } from '../../lib/virtual/useVirtualRows'
import './AlignedDiff.css'

const CodeLine = memo(function CodeLine({ line, other, changed }: { line?: DiffLine; other?: DiffLine; changed: boolean }) {
  if (!line) return <span className="aligned-diff__blank" aria-label="No corresponding line" />
  const [start, end] = changed && other ? changedSpan(line.text, other.text) : [0, 0]
  return <>
    <span className="aligned-diff__number" aria-hidden="true">{line.number}</span>
    <code className="aligned-diff__code">
      {end > start ? <>{line.text.slice(0, start)}<mark>{line.text.slice(start, end)}</mark>{line.text.slice(end)}</>
        : <span dangerouslySetInnerHTML={{ __html: highlightJsonText(line.text) }} />}
    </code>
  </>
})

type Props = {
  left: JsonValue
  right: JsonValue
  diffs: DiffEntry[]
  activeIndex: number
  onSelect: (index: number) => void
  hideUnchanged: boolean
  unified: boolean
}

export function AlignedDiff({ left, right, diffs, activeIndex, onSelect, hideUnchanged, unified }: Props) {
  const rows = useMemo(() => buildAlignedRows(left, right), [left, right])
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())
  const activePath = diffs[activeIndex]?.path
  const diffIndices = useMemo(() => new Map(diffs.map((diff, index) => [diff.path, index])), [diffs])
  const visible = useMemo(() => {
    const items = hideUnchanged ? foldUnchanged(rows) : rows.map((_, index) => ({ type: 'line' as const, index }))
    return items.flatMap(item => item.type === 'fold' && expanded.has(item.start)
      ? Array.from({ length: item.end - item.start }, (_, offset) => ({ type: 'line' as const, index: item.start + offset }))
      : [item])
  }, [rows, hideUnchanged, expanded])
  const estimates = useMemo(() => visible.map(item => item.type === 'fold' ? 32
    : unified && rows[item.index].kind && rows[item.index].left && rows[item.index].right ? 48 : 24), [visible, rows, unified])
  const { viewport, start, end, offset, bottom, scrollToIndex } = useVirtualRows(estimates)
  const activeRow = useMemo(() => visible.findIndex(item => item.type === 'line' && rows[item.index].kind && rows[item.index].path === activePath), [visible, rows, activePath])

  const revealActiveRow = useEffectEvent(() => scrollToIndex(activeRow))
  useEffect(() => { revealActiveRow() }, [activePath, rows, hideUnchanged, unified])

  const renderRow = (row: AlignedRow, index: number) => {
    const active = Boolean(row.kind && row.path === activePath)
    const selectedIndex = row.kind ? diffIndices.get(row.path) : undefined
    const side = (which: 'left' | 'right') => <div className={`aligned-diff__cell ${!row[which] ? 'is-blank' : ''}`}>
      <CodeLine line={row[which]} other={row[which === 'left' ? 'right' : 'left']} changed={row.kind === 'changed'} />
    </div>
    return <div key={index} className={`aligned-diff__row ${row.kind ? `is-${row.kind}` : ''} ${active ? 'is-active' : ''}`}
      data-active={active} data-row={index}>
      {unified ? <>
        {row.left && <div className="aligned-diff__unified-line"><span className="aligned-diff__sign">{row.kind ? '−' : ' '}</span>{side('left')}</div>}
        {row.kind && row.right && <div className="aligned-diff__unified-line"><span className="aligned-diff__sign">+</span>{side('right')}</div>}
      </> : <>{side('left')}<div className="aligned-diff__gutter">
        {selectedIndex !== undefined && rows[index - 1]?.path !== row.path ? <button type="button"
          aria-label={`Select difference: ${row.path}`} title={row.path} aria-pressed={active}
          onClick={() => onSelect(selectedIndex)}>{row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : '≠'}</button> : null}
      </div>{side('right')}</>}
    </div>
  }
  return <section className={`aligned-diff ${unified ? 'is-unified' : ''}`} aria-label="Aligned JSON comparison">
    <div className="aligned-diff__head"><span>Left JSON <small>Original</small></span>{!unified && <span aria-hidden="true" />}
      <span>Right JSON <small>Modified</small></span></div>
    <div ref={viewport} className="aligned-diff__viewport" tabIndex={0} aria-label="Comparison code, synchronized scrolling">
      <div className="aligned-diff__lines" style={{ paddingTop: 8 + offset, paddingBottom: 48 + bottom }}>
        {visible.slice(start, end).map((item, localIndex) => <div
          key={item.type === 'line' ? `line-${item.index}` : `fold-${item.start}`}
          data-virtual-index={start + localIndex}>
          {item.type === 'line' ? renderRow(rows[item.index], item.index)
            : <button className="aligned-diff__fold" type="button"
              onClick={() => setExpanded(current => new Set([...current, item.start]))}>
              ··· Show {item.end - item.start} unchanged lines ···
            </button>}
        </div>)}
      </div>
    </div>
    <footer className="aligned-diff__footer"><span>{diffs.length ? `${diffs.length} differences` : 'JSON values are identical'}</span>
      <span>Formatted JSON · Keys sorted · Arrays by index</span><span>F7 next · ⇧ F7 previous</span></footer>
  </section>
}
