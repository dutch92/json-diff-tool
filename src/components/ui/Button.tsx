import type { ButtonHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import './Button.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

type FileButtonProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode
}

export function Button({ className = '', ...props }: ButtonProps) {
  return <button className={`ui-button ${className}`.trim()} type="button" {...props} />
}

export function FileButton({ className = '', ...props }: FileButtonProps) {
  return <label className={`ui-button ${className}`.trim()} {...props} />
}
