import { useEffect, useState, type RefObject } from 'react'

/** Share of the element that must be visible before it counts as "in view". */
const VISIBLE_THRESHOLD = 0.35

/** Becomes true the first time the element scrolls into view, then stays true. */
export function useInViewOnce(ref: RefObject<Element | null>, enabled = true): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!enabled || inView || !element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: VISIBLE_THRESHOLD },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled, inView])

  return inView
}
