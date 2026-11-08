import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './Button.module.scss'

type Variant = 'secondary' | 'secondary-outlined'

interface CommonProps {
  variant?: Variant
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

type ButtonProps = CommonProps &
  (
    | ({ to: string } & Omit<ButtonHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>)
    | ({ to?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
  )

export function Button({
  variant = 'secondary',
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ')

  if (rest.to !== undefined) {
    const { to, ...anchorProps } = rest
    return (
      <Link to={to} className={classes} {...anchorProps}>
        {children}
      </Link>
    )
  }

  const { type = 'button', ...buttonProps } = rest
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
