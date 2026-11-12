// Builds a single self-contained HTML deck (fonts, SVGs, videos, screenshots inlined) so it runs
// offline from one file. Also writes the speaker notes as Markdown.
// Placeholders: {{video name frames [cols]}}, {{static name}}, {{svgfile path}}, {{img path}}, {{fonts}}, {{css}}, {{js}}, {{anims}}
// Usage: node scripts/build.mjs [lang]   → out/praesentation.<lang>.html, out/sprechnotizen.<lang>.md
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const lang = process.argv[2] ?? 'de'
const HERE = new URL('..', import.meta.url).pathname
const ROOT = join(HERE, '..')
const ASSETS = join(HERE, 'assets')
const OUT = join(HERE, 'out')
mkdirSync(OUT, { recursive: true })

const read = (p) => readFileSync(p, 'utf8')
const b64 = (p) => readFileSync(p).toString('base64')

const fonts = [400, 500, 700, 900]
  .map((w) => {
    const file = join(
      ROOT,
      `node_modules/@fontsource/poppins/files/poppins-latin-${w}-normal.woff2`,
    )
    return `@font-face{font-family:'Poppins';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64(file)}) format('woff2')}`
  })
  .join('\n')

// only the bar scene plays live; the other animations are shown as draft/final videos
const ANIM_NAMES = ['bar-intro', 'bar-loop']
const anims = Object.fromEntries(
  ANIM_NAMES.map((n) => [
    n,
    read(join(ROOT, 'src/assets/animations', `${n}.svg`)).replace(/<!--.*?-->/gs, ''),
  ]),
)

// libvpx is needed to decode VP9 with its alpha channel (ffmpeg's native decoder drops it)
const VP9_IN = ['-c:v', 'libvpx-vp9']

/** Evenly spaced stills from a video, used in print mode instead of the moving image. */
function stills(file, n) {
  const dur = parseFloat(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      file,
    ]).toString(),
  )
  return Array.from({ length: n }, (_, i) => {
    const t = Math.max(0, (dur * (i + 1)) / n - 0.08)
    // prettier-ignore
    const png = execFileSync('ffmpeg', ['-v', 'error', '-ss', t.toFixed(2), ...VP9_IN, '-i', file,
      '-frames:v', '1', '-vf', 'scale=640:-2', '-f', 'image2pipe', '-c:v', 'png', '-'])
    return `<img alt="" src="data:image/png;base64,${png.toString('base64')}">`
  }).join('')
}

/*
 * Draft and final of one illustration loop side by side, so both get the same length: the longer
 * one's frame count plus a one-second hold, padded by repeating the last frame (sources untouched).
 */
const FPS = 50
const HOLD_FRAMES = FPS
const PAIR = /-(v1|draft|ai-draft|final)$/
const frameCount = (file) =>
  +execFileSync('ffprobe', [
    '-v',
    'error',
    '-count_frames',
    '-select_streams',
    'v',
    '-show_entries',
    'stream=nb_read_frames',
    '-of',
    'csv=p=0',
    file,
  ]).toString()

function looped(name) {
  const dir = join(ASSETS, 'process')
  const file = join(dir, `${name}.webm`)
  if (!PAIR.test(name)) return file
  const base = name.replace(PAIR, '')
  const partners = readdirSync(dir).filter(
    (f) => f.endsWith('.webm') && f.replace(/\.webm$/, '').replace(PAIR, '') === base,
  )
  const target = Math.max(...partners.map((f) => frameCount(join(dir, f)))) + HOLD_FRAMES
  const out = join(tmpdir(), `after-hours-loop-${name}.webm`)
  // prettier-ignore
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...VP9_IN, '-i', file,
    '-vf', `tpad=stop=${target - frameCount(file)}:stop_mode=clone,format=yuva420p`,
    '-frames:v', String(target), '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0',
    '-b:v', '0', '-crf', '30', '-row-mt', '1', '-deadline', 'good', out])
  return out
}

/*
 * Static illustration from a Figma SVG export: keeps only the component's group and the gradient
 * defs (Figma also exports the canvas and section backgrounds around it) and prefixes the IDs,
 * because several exports reuse the same gradient names.
 */
const STATIC_GROUP = {
  'rocks-glass': 'illustration-rocks-glass',
  orange: 'illustration-citrus',
  shaker: 'illustration-shaker',
  logo: 'logo-full',
  button: 'button-reserve',
}
function staticSvg(name) {
  const src = read(join(ASSETS, 'static', `${name}.svg`))
  const viewBox = src.match(/viewBox="([^"]+)"/)[1]
  const open = `<g id="${STATIC_GROUP[name]}">`
  const start = src.indexOf(open)
  // find the matching </g> for the group
  let depth = 0
  let i = start
  const tag = /<(\/?)g\b[^>]*?(\/?)>/g
  tag.lastIndex = start
  for (let m; (m = tag.exec(src));) {
    if (m[2]) continue
    depth += m[1] ? -1 : 1
    if (depth === 0) {
      i = m.index + m[0].length
      break
    }
  }
  const defs = src.match(/<defs>[\s\S]*<\/defs>/)?.[0] ?? ''
  const svg = `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${src.slice(start, i)}${defs}</svg>`
  return svg.replace(/(id="|url\(#)([\w-]+)/g, (_, pre, id) => `${pre}static-${name}-${id}`)
}

const mime = { jpg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml' }

let html = read(join(HERE, `src/slides.${lang}.html`))
html = html
  .replace('{{fonts}}', () => fonts)
  .replace('{{css}}', () => read(join(HERE, 'src/deck.css')))
  .replace('{{js}}', () => read(join(HERE, 'src/deck.js')))
  .replace('{{anims}}', () => JSON.stringify(anims).replace(/<\/script/g, '<\\/script'))
  .replace(/\{\{video ([\w-]+) (\d+)(?: (\d+))?\}\}/g, (_, name, n, cols = n) => {
    const file = looped(name)
    return `<video class="live" muted playsinline preload="auto" src="data:video/webm;base64,${b64(file)}"></video><div class="strip" style="--cols:${cols}">${stills(file, +n)}</div>`
  })
  .replace(/\{\{static ([\w-]+)\}\}/g, (_, name) => staticSvg(name))
  .replace(/\{\{svgfile ([\w/.-]+)\}\}/g, (_, p) =>
    read(join(ASSETS, p))
      .replace(/\s(width|height)="[^"]*"/, '')
      .replace(/\s(width|height)="[^"]*"/, ''),
  )
  .replace(
    /\{\{img ([\w/.-]+)\}\}/g,
    (_, p) => `data:${mime[p.split('.').pop()]};base64,${b64(join(ASSETS, p))}`,
  )

const leftover = html.match(/\{\{[^}]+\}\}/)
if (leftover) throw new Error(`unresolved placeholder ${leftover[0]}`)

const deckFile = join(OUT, `praesentation.${lang}.html`)
writeFileSync(deckFile, html)

// Speaker notes: one section per slide, titled by its <h1>/<h2>.
const notes = [...html.matchAll(/<section class="slide[^"]*">([\s\S]*?)<\/section>/g)].map(
  (m, i) => {
    const title = (m[1].match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/)?.[1] ?? '').replace(/<[^>]+>/g, '')
    const note = (m[1].match(/<aside class="notes">([\s\S]*?)<\/aside>/)?.[1] ?? '').trim()
    return `## ${i + 1}. ${title || 'Titel'}\n\n${note}\n`
  },
)
writeFileSync(join(OUT, `sprechnotizen.${lang}.md`), `# Sprechnotizen\n\n${notes.join('\n')}`)

console.log(`${deckFile}  ${(html.length / 1024 / 1024).toFixed(1)} MB, ${notes.length} slides`)
