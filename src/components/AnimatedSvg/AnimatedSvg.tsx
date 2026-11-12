import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type Ref,
} from 'react'
import { useInViewOnce } from '@/hooks/useInView'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { getSmilDurationMs, scopeSvgIds } from '@/lib/smil'
import styles from './AnimatedSvg.module.scss'

export interface AnimatedSvgHandle {
  /** Restart the animation from the first frame. */
  play: () => void
  /** Stop and rewind to the first frame. */
  reset: () => void
}

interface AnimatedSvgProps {
  /** Raw SVG markup (import with `?raw`). */
  markup: string
  /**
   * `view`: play once when scrolled into view. `manual`: only via the ref handle.
   * `never`: render as a still, frozen on the final frame.
   */
  playOn?: 'view' | 'manual' | 'never'
  /** The SVG repeats on its own; reduced motion shows its first frame instead of the last. */
  loops?: boolean
  /** Override the root viewBox to reframe the artwork. */
  viewBox?: string
  /**
   * Draw outside the viewBox. Needed when a reframed viewBox is tighter than the motion;
   * off by default so artwork that enters from off-canvas (bar scene glass) stays hidden.
   */
  overflowVisible?: boolean
  onComplete?: () => void
  className?: string
  ref?: Ref<AnimatedSvgHandle>
}

/**
 * Inline SMIL SVG whose timeline we control. Each instance scopes its ids,
 * starts paused on the first frame and only runs when asked to.
 */
export function AnimatedSvg({
  markup,
  playOn = 'view',
  loops = false,
  viewBox,
  overflowVisible = false,
  onComplete,
  className,
  ref,
}: AnimatedSvgProps) {
  const hostRef = useRef<HTMLSpanElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const durationRef = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)
  const onCompleteRef = useRef(onComplete)
  const reducedMotion = usePrefersReducedMotion()
  const scope = useId().replace(/[^\w-]/g, '')

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const html = useMemo(() => scopeSvgIds(markup, `${scope}-`), [markup, scope])

  const showFinalFrame = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.pauseAnimations()
    svg.setCurrentTime(loops ? 0 : durationRef.current / 1000)
  }, [loops])

  const reset = useCallback(() => {
    window.clearTimeout(timerRef.current)
    const svg = svgRef.current
    if (!svg) return
    svg.pauseAnimations()
    svg.setCurrentTime(0)
  }, [])

  const play = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    window.clearTimeout(timerRef.current)

    if (reducedMotion) {
      showFinalFrame()
      onCompleteRef.current?.()
      return
    }

    svg.setCurrentTime(0)
    svg.unpauseAnimations()
    if (loops) return

    timerRef.current = window.setTimeout(() => {
      svg.pauseAnimations()
      onCompleteRef.current?.()
    }, durationRef.current)
  }, [loops, reducedMotion, showFinalFrame])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  // Grab the inlined <svg>, freeze it on frame 0 before the first paint.
  useLayoutEffect(() => {
    const svg = hostRef.current?.querySelector('svg') ?? null
    svgRef.current = svg
    if (!svg) return
    if (viewBox) {
      // Keep the intrinsic aspect ratio (from width/height) in sync with the new framing.
      const [, , width, height] = viewBox.split(/\s+/)
      svg.setAttribute('viewBox', viewBox)
      svg.setAttribute('width', width)
      svg.setAttribute('height', height)
    }
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    durationRef.current = getSmilDurationMs(svg)
    if (playOn === 'never') {
      showFinalFrame()
    } else {
      svg.pauseAnimations()
      svg.setCurrentTime(0)
    }
    return () => window.clearTimeout(timerRef.current)
  }, [html, viewBox, playOn, showFinalFrame])

  const inView = useInViewOnce(hostRef, playOn === 'view')
  useEffect(() => {
    if (inView) play()
  }, [inView, play])

  const classes = [styles.host, overflowVisible && styles.overflowVisible, className]
    .filter(Boolean)
    .join(' ')
  return <span ref={hostRef} className={classes} dangerouslySetInnerHTML={{ __html: html }} />
}
