// Builds a single self-contained HTML deck (fonts, SVGs, videos, screenshots inlined) so it runs
// offline from one file. Also writes the speaker notes as Markdown.
// Placeholders: {{video name frames [cols]}}, {{svgfile path}}, {{img path}}, {{fonts}}, {{css}}, {{js}}, {{anims}}
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
    const jpg = execFileSync('ffmpeg', [
      '-v',
      'error',
      '-ss',
      t.toFixed(2),
      '-i',
      file,
      '-frames:v',
      '1',
      '-vf',
      'scale=640:-2',
      '-f',
      'image2pipe',
      '-c:v',
      'mjpeg',
      '-q:v',
      '3',
      '-',
    ])
    return `<img alt="" src="data:image/jpeg;base64,${jpg.toString('base64')}">`
  }).join('')
}

/*
 * Draft and final of one illustration loop side by side, so both get the same length: the longer
 * one's frame count plus a one-second hold, padded by repeating the last frame (sources untouched).
 */
const HOLD_FRAMES = 25
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
  const file = join(dir, `${name}.mp4`)
  if (!PAIR.test(name)) return file
  const base = name.replace(PAIR, '')
  const partners = readdirSync(dir).filter(
    (f) => f.endsWith('.mp4') && f.replace(/\.mp4$/, '').replace(PAIR, '') === base,
  )
  const target = Math.max(...partners.map((f) => frameCount(join(dir, f)))) + HOLD_FRAMES
  const out = join(tmpdir(), `after-hours-loop-${name}.mp4`)
  // prettier-ignore
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file,
    '-vf', `tpad=stop=${target - frameCount(file)}:stop_mode=clone,setsar=1`,
    '-frames:v', String(target), '-c:v', 'libx264', '-crf', '20',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', out])
  return out
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
    return `<video class="live" muted playsinline preload="auto" src="data:video/mp4;base64,${b64(file)}"></video><div class="strip" style="--cols:${cols}">${stills(file, +n)}</div>`
  })
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
