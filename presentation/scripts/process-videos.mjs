// Turns PNG sequences rendered from After Effects (see ae/render-all-50fps.jsx) into transparent
// 50 fps WebM (VP9 with alpha) for the draft/final slides. The box colour comes from CSS, so a
// video can never render a slightly different purple than its card.
// Usage: node scripts/process-videos.mjs <framesDir> [--full=<width>] [--in-fps=<fps>]
// --full keeps the whole comp canvas instead of cropping to the artwork (for scenes like the bar),
// scaled to <width> px. --in-fps for sequences rendered at a lower rate (frames are repeated).
import { execFileSync, spawnSync } from 'node:child_process'
import { readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const framesDir = process.argv[2]
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const full = Number(arg('full') ?? 0)
if (!framesDir) throw new Error('usage: process-videos.mjs <framesDir>')
const outDir = new URL('../assets/process/', import.meta.url).pathname
mkdirSync(outDir, { recursive: true })

const FPS = 50
const IN_FPS = Number(arg('in-fps') ?? FPS)
const SIZE = 720
const PAD = 0.12 // breathing room around the artwork, relative to its size
// VP9 with alpha: alt-ref frames must be off for the alpha channel to survive
const VP9 = ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0']
const VP9_QUALITY = ['-b:v', '0', '-crf', '30', '-row-mt', '1', '-deadline', 'good']

// Union of the alpha bounding boxes of every frame, so the crop doesn't jump.
function contentBox(dir) {
  const log = spawnSync('ffmpeg', [
    '-hide_banner',
    '-i',
    join(dir, '%04d.png'),
    '-vf',
    'alphaextract,bbox=min_val=8',
    '-f',
    'null',
    '-',
  ]).stderr.toString()
  let [x1, y1, x2, y2] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const m of log.matchAll(/x1:(\d+) x2:(\d+) y1:(\d+) y2:(\d+)/g)) {
    x1 = Math.min(x1, +m[1])
    x2 = Math.max(x2, +m[2])
    y1 = Math.min(y1, +m[3])
    y2 = Math.max(y2, +m[4])
  }
  return { x1, y1, x2, y2 }
}

/**
 * Number of frames up to the last one with any visible pixel. AE renders the frame at the comp's
 * exact end empty when a layer ends there; padding would repeat that blank frame, so drop it.
 */
function visibleFrames(dir) {
  const log = spawnSync('ffmpeg', [
    '-hide_banner',
    '-i',
    join(dir, '%04d.png'),
    '-vf',
    'alphaextract,signalstats,metadata=print:key=lavfi.signalstats.YMAX',
    '-f',
    'null',
    '-',
  ]).stderr.toString()
  const ymax = [...log.matchAll(/YMAX=(\d+)/g)].map((m) => +m[1])
  let n = ymax.length
  while (n > 1 && ymax[n - 1] === 0) n--
  return n
}

for (const name of readdirSync(framesDir)) {
  const dir = join(framesDir, name)
  if (!readdirSync(dir).some((f) => f.endsWith('.png'))) continue
  const frames = ['-frames:v', String(Math.round((visibleFrames(dir) * FPS) / IN_FPS))]
  let vf
  if (full) {
    vf = `scale=${full}:-2:flags=lanczos,setsar=1`
  } else {
    const { x1, y1, x2, y2 } = contentBox(dir)
    const side = Math.round(Math.max(x2 - x1, y2 - y1) * (1 + 2 * PAD))
    const x = Math.round((x1 + x2) / 2 - side / 2)
    const y = Math.round((y1 + y2) / 2 - side / 2)
    // pad first so the square crop never leaves the canvas
    vf = [
      `pad=iw+${2 * side}:ih+${2 * side}:${side}:${side}:color=black@0`,
      `crop=${side}:${side}:${x + side}:${y + side}`,
      `scale=${SIZE}:${SIZE}:flags=lanczos,setsar=1`,
    ].join(',')
  }
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-framerate',
    String(IN_FPS),
    '-i',
    join(dir, '%04d.png'),
    '-vf',
    `${vf},fps=${FPS},format=yuva420p`,
    ...frames,
    ...VP9,
    ...VP9_QUALITY,
    join(outDir, `${name}.webm`),
  ])
  console.log(name, full ? 'full canvas' : 'cropped')
}
