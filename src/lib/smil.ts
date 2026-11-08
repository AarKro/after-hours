/**
 * Helpers for the SMIL SVGs exported from After Effects (better-lottie).
 */

const ID_ATTRIBUTE = /\bid="([^"]+)"/g
const SECONDS = /^([\d.]+)s$/
const MS_PER_SECOND = 1000

/**
 * Prefix every id in the markup (and every reference to it) so several copies of the
 * same SVG can live in one document without their gradients/clip paths colliding.
 */
export function scopeSvgIds(markup: string, prefix: string): string {
  const ids = new Set<string>()
  for (const match of markup.matchAll(ID_ATTRIBUTE)) ids.add(match[1])

  let scoped = markup
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    scoped = scoped
      .replace(new RegExp(`\\bid="${escaped}"`, 'g'), `id="${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${escaped}\\)`, 'g'), `url(#${prefix}${id})`)
      .replace(new RegExp(`href="#${escaped}"`, 'g'), `href="#${prefix}${id}"`)
  }
  return scoped
}

/** Read the total running time (ms) of a one-shot SMIL animation: the latest `begin + dur`. */
export function getSmilDurationMs(svg: SVGSVGElement): number {
  let longest = 0
  for (const node of svg.querySelectorAll('animate, animateTransform, animateMotion, set')) {
    const begin = parseSeconds(node.getAttribute('begin'))
    const duration = parseSeconds(node.getAttribute('dur'))
    longest = Math.max(longest, begin + duration)
  }
  return longest * MS_PER_SECOND
}

function parseSeconds(value: string | null): number {
  const match = value?.trim().match(SECONDS)
  return match ? Number(match[1]) : 0
}
