import type { HTMLAttributes } from 'react'
import type { DiffKind } from '../../lib/json/types'
import './Badge.css'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone: DiffKind
}

export function Badge({ tone, className = '', ...props }: BadgeProps) {
  return <span className={`ui-badge ui-badge-${tone} ${className}`.trim()} {...props} />
}
