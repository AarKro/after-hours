// Renders every animation in src/assets/animations to a GIF (deliverable, not used by the site).
// Each SVG is drawn in headless Chrome, stepped frame by frame via the SMIL timeline
// (pauseAnimations + setCurrentTime), screenshotted, and encoded with ffmpeg.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = new URL('../../', import.meta.url).pathname
const SRC = join(ROOT, 'src/assets/animations')
const OUT = new URL('../out/gifs/', import.meta.url).pathname
const FPS = 25
const BG = '#600cdf' // surface/default — the illustrations are white line art
const HOLD = 1.5 // seconds the last frame is held before a one-shot GIF loops

// width = output pixel width; loop = seamless loop without end hold
const ANIMATIONS = [
  { name: 'logo', width: 1088 },
  { name: 'bar-intro', width: 1024 },
  { name: 'bar-loop', width: 1024, loop: true },
  { name: 'button', width: 368 },
  { name: 'rocks-glass', width: 600 },
  { name: 'orange', width: 580 },
  { name: 'shaker', width: 480 },
]

/** Timeline length = max(begin + dur) over all animation elements. */
function durationOf(svg) {
  let max = 0
  for (const m of svg.matchAll(/<animate\w*\b[^>]*>/g)) {
    const dur = parseFloat(m[0].match(/\bdur="([\d.]+)s"/)?.[1] ?? '0')
    const begin = parseFloat(m[0].match(/\bbegin="([\d.]+)s"/)?.[1] ?? '0')
    max = Math.max(max, begin + dur)
  }
  return max
}

async function renderFrames(page, svg, width, dir, loop) {
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const height = Math.round((width * vh) / vw / 2) * 2
  await page.setViewportSize({ width, height })
  await page.setContent(
    `<style>html,body{margin:0;background:${BG}}svg{display:block;width:${width}px;height:${height}px}</style>${svg}`,
  )
  await page.evaluate(() => document.querySelector('svg').pauseAnimations())
  const total = Math.round(durationOf(svg) * FPS)
  const shots = []
  for (let f = 0; f <= total; f++) {
    await page.evaluate((t) => document.querySelector('svg').setCurrentTime(t), f / FPS)
    const buf = await page.screenshot({ type: 'png' })
    shots.push(buf)
  }
  // Comps are often longer than the motion — drop the identical tail.
  // Loops keep their full length (minus the closing frame, which equals frame 0).
  let last = loop ? shots.length - 2 : shots.length - 1
  while (!loop && last > 0 && shots[last].equals(shots[last - 1])) last--
  shots
    .slice(0, last + 1)
    .forEach((b, i) => writeFileSync(join(dir, `${String(i).padStart(4, '0')}.png`), b))
  return last + 1
}

function encodeGif(dir, out, loop) {
  // Hold the last frame (tpad), then build a palette from the whole clip.
  const hold = loop ? '' : `tpad=stop_mode=clone:stop_duration=${HOLD},`
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-framerate',
    String(FPS),
    '-i',
    join(dir, '%04d.png'),
    '-filter_complex',
    `[0]${hold}split[a][b];[a]palettegen=stats_mode=diff:max_colors=128[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`,
    '-loop',
    '0',
    out,
  ])
}

const frameDir = (name) => join(tmpdir(), `after-hours-gif-${name}`)

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ deviceScaleFactor: 1 })

for (const { name, width, loop } of ANIMATIONS) {
  const svg = readFileSync(join(SRC, `${name}.svg`), 'utf8')
  const dir = frameDir(name)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir)
  const frames = await renderFrames(page, svg, width, dir, loop)
  encodeGif(dir, join(OUT, `${name}.gif`), loop)
  console.log(`${name}.gif  ${frames} frames (${(frames / FPS).toFixed(2)}s)`)
}

// Hero as seen on the site: intro once, then straight into the loop (twice).
const list = ['bar-intro', 'bar-loop', 'bar-loop']
execFileSync('ffmpeg', [
  '-v',
  'error',
  '-y',
  ...list.flatMap((n) => ['-framerate', String(FPS), '-i', join(frameDir(n), '%04d.png')]),
  '-filter_complex',
  `${list.map((_, i) => `[${i}]`).join('')}concat=n=${list.length}:v=1,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=sierra2_4a`,
  '-loop',
  '0',
  join(OUT, 'bar-hero.gif'),
])
console.log('bar-hero.gif  intro + 2× loop')

await browser.close()
