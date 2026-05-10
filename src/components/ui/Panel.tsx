import type { HTMLAttributes } from 'react'
import './Panel.css'

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section'
  variant?: 'default' | 'soft' | 'hero'
}

export function Panel({
  as: Component = 'section',
  variant = 'default',
  className = '',
  ...props
}: PanelProps) {
  return (
    <Component
      className={`ui-panel ui-panel-${variant} ${className}`.trim()}
      {...props}
    />
  )
}
