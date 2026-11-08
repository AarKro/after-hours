import { useRef } from 'react'
import { Link } from 'react-router'
import buttonSvg from '@/assets/animations/button.svg?raw'
import { AnimatedSvg, type AnimatedSvgHandle } from '@/components/AnimatedSvg/AnimatedSvg'
import { paths } from '@/routes'
import styles from './ReserveButton.module.scss'

const LABEL = 'reserve a table'

interface ReserveButtonProps {
  /** Stretch to the container width on mobile (desktop always uses the animated pill). */
  fullWidthOnMobile?: boolean
  className?: string
}

/**
 * "reserve a table" CTA. Desktop: the animated SVG pill, played on hover/focus.
 * Mobile: a regular secondary button.
 */
export function ReserveButton({ fullWidthOnMobile = false, className }: ReserveButtonProps) {
  const animation = useRef<AnimatedSvgHandle>(null)
  const play = () => animation.current?.play()
  const reset = () => animation.current?.reset()

  const classes = [styles.reserve, fullWidthOnMobile && styles.fullWidthOnMobile, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Link
      to={paths.reserve}
      className={classes}
      onMouseEnter={play}
      onFocus={play}
      onMouseLeave={reset}
      onBlur={reset}
    >
      <span className={styles.label}>{LABEL}</span>
      <AnimatedSvg ref={animation} markup={buttonSvg} playOn="manual" className={styles.svg} />
    </Link>
  )
}
