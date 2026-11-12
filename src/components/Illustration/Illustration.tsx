import orange from '@/assets/animations/orange.svg?raw'
import rocksGlass from '@/assets/animations/rocks-glass.svg?raw'
import shaker from '@/assets/animations/shaker.svg?raw'
import { AnimatedSvg } from '@/components/AnimatedSvg/AnimatedSvg'
import styles from './Illustration.module.scss'

export type IllustrationName = 'rocks-glass' | 'orange' | 'shaker'

/**
 * The After Effects comps use larger canvases than the Figma symbols they replace.
 * Each viewBox reframes the final frame so the artwork sits in its square box at the
 * same size and position as the static Figma illustration (measured from both files).
 */
const illustrations: Record<IllustrationName, { markup: string; viewBox: string }> = {
  'rocks-glass': { markup: rocksGlass, viewBox: '9 55 541 541' },
  orange: { markup: orange, viewBox: '-59 -40 680 680' },
  shaker: { markup: shaker, viewBox: '73 298 634 634' },
}

interface IllustrationProps {
  name: IllustrationName
  /** Play the animation when scrolled into view; otherwise show the final frame as a still. */
  animated?: boolean
  className?: string
}

export function Illustration({ name, animated = false, className }: IllustrationProps) {
  const { markup, viewBox } = illustrations[name]
  return (
    <AnimatedSvg
      markup={markup}
      viewBox={viewBox}
      playOn={animated ? 'view' : 'never'}
      overflowVisible
      className={[styles.illustration, className].filter(Boolean).join(' ')}
    />
  )
}
