import { useState } from 'react'
import barIntro from '@/assets/animations/bar-intro.svg?raw'
import barLoop from '@/assets/animations/bar-loop.svg?raw'
import { AnimatedSvg } from '@/components/AnimatedSvg/AnimatedSvg'

interface BarSceneProps {
  className?: string
}

/**
 * Hero illustration: the intro builds the bar once, then hands over to the idle loop.
 * The intro's last frame is identical to the loop's first, so the swap is seamless.
 */
export function BarScene({ className }: BarSceneProps) {
  const [phase, setPhase] = useState<'intro' | 'loop'>('intro')

  return phase === 'intro' ? (
    <AnimatedSvg markup={barIntro} onComplete={() => setPhase('loop')} className={className} />
  ) : (
    <AnimatedSvg markup={barLoop} loops className={className} />
  )
}
