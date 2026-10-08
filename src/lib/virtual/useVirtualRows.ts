import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { RowHeights } from './RowHeights'

const overscan = 12
const topPadding = 8

export function useVirtualRows(estimates: number[]) {
  const viewport = useRef<HTMLDivElement>(null)
  const heights = useMemo(() => new RowHeights(estimates), [estimates])
  const [position, setPosition] = useState({ top: 0, height: 700 })
  const [, measured] = useReducer(value => value + 1, 0)
  const start = Math.max(0, heights.indexAt(Math.max(0, position.top - topPadding)) - overscan)
  const end = Math.min(estimates.length, heights.indexAt(position.top + position.height) + overscan + 1)

  const readPosition = useCallback(() => {
    const pane = viewport.current
    if (!pane) return
    setPosition(current => current.top === pane.scrollTop && current.height === pane.clientHeight
      ? current : { top: pane.scrollTop, height: pane.clientHeight })
  }, [])

  useLayoutEffect(() => {
    const pane = viewport.current
    if (!pane) return
    let frame = 0
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; readPosition() })
    }
    let previousWidth = pane.clientWidth
    const resize = new ResizeObserver(() => {
      if (pane.clientWidth !== previousWidth) {
        previousWidth = pane.clientWidth
        const anchor = heights.indexAt(Math.max(0, pane.scrollTop - topPadding))
        const withinRow = pane.scrollTop - heights.offset(anchor)
        heights.reset(estimates)
        pane.querySelectorAll<HTMLElement>('[data-virtual-index]').forEach(element => {
          heights.update(Number(element.dataset.virtualIndex), element.getBoundingClientRect().height)
        })
        pane.scrollTop = heights.offset(anchor) + withinRow
        measured()
      }
      readPosition()
    })
    resize.observe(pane)
    pane.addEventListener('scroll', onScroll, { passive: true })
    readPosition()
    return () => { resize.disconnect(); pane.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [readPosition, heights, estimates])

  useLayoutEffect(() => {
    const pane = viewport.current
    if (!pane) return
    const observer = new ResizeObserver(entries => {
      const anchor = heights.indexAt(Math.max(0, pane.scrollTop - topPadding))
      const previousOffset = heights.offset(anchor)
      let changed = false
      for (const entry of entries) {
        const index = Number((entry.target as HTMLElement).dataset.virtualIndex)
        changed = heights.update(index, entry.borderBoxSize[0]?.blockSize ?? entry.target.getBoundingClientRect().height) || changed
      }
      if (changed) {
        // Preserve the visible row when overscan rows above it change height.
        pane.scrollTop += heights.offset(anchor) - previousOffset
        readPosition()
        measured()
      }
    })
    pane.querySelectorAll('[data-virtual-index]').forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [heights, start, end, readPosition])

  const scrollToIndex = useCallback((index: number) => {
    const pane = viewport.current
    if (!pane || index < 0) return
    pane.scrollTop = Math.max(0, topPadding + heights.offset(index) - pane.clientHeight / 2 + 12)
    readPosition()
  }, [heights, readPosition])

  return { viewport, start, end, offset: heights.offset(start), bottom: heights.offset(estimates.length) - heights.offset(end), scrollToIndex }
}
