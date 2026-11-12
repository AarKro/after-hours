// Turns PNG sequences rendered from old After Effects auto-saves (see ae/render-frames.jsx)
// into cropped, square MP4s on the brand background for the "v1 vs. final" slides.
// Usage: node scripts/process-videos.mjs <framesDir> [--full=<width>] [--bg=<0xrrggbb>]
// --full keeps the whole comp canvas instead of cropping to the artwork (for scenes like the bar),
// scaled to <width> px.
import { execFileSync, spawnSync } from 'node:child_process'
import { readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const framesDir = process.argv[2]
const full = Number(process.argv.find((a) => a.startsWith('--full='))?.split('=')[1] ?? 0)
if (!framesDir) throw new Error('usage: process-videos.mjs <framesDir>')
const outDir = new URL('../assets/process/', import.meta.url).pathname
mkdirSync(outDir, { recursive: true })

// Browsers assume BT.709 for untagged video; encode and tag it so brand colours stay exact.
const BT709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
const SIZE = 720
const PAD = 0.12 // breathing room around the artwork, relative to its size
// surface/raised, the box the site puts illustrations in. --bg=0x600cdf for artwork that is drawn
// for the page background (the button's negative stars are filled with surface/default).
const BG = process.argv.find((a) => a.startsWith('--bg='))?.split('=')[1] ?? '0x772ce8'

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
  const frames = ['-frames:v', String(visibleFrames(dir))]
  if (full) {
    const filter = `color=c=${BG}:r=25[c];[c][0]scale2ref[bg][fg];[bg][fg]overlay=shortest=1,scale=${full}:-2:flags=lanczos,setsar=1,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-framerate',
      '25',
      '-i',
      join(dir, '%04d.png'),
      '-filter_complex',
      filter,
      ...frames,
      '-c:v',
      'libx264',
      ...BT709,
      '-crf',
      '20',
      '-movflags',
      '+faststart',
      join(outDir, `${name}.mp4`),
    ])
    console.log(name, 'full canvas')
    continue
  }
  const { x1, y1, x2, y2 } = contentBox(dir)
  const side = Math.round(Math.max(x2 - x1, y2 - y1) * (1 + 2 * PAD))
  const cx = (x1 + x2) / 2,
    cy = (y1 + y2) / 2
  const x = Math.round(cx - side / 2),
    y = Math.round(cy - side / 2)
  // pad first so the square crop never leaves the canvas
  const vf = [
    `pad=iw+${2 * side}:ih+${2 * side}:${side}:${side}:color=black@0`,
    `crop=${side}:${side}:${x + side}:${y + side}`,
    `scale=${SIZE}:${SIZE}:flags=lanczos,setsar=1`,
  ].join(',')
  const filter = `color=c=${BG}:s=${SIZE}x${SIZE}:r=25[bg];[0]${vf}[fg];[bg][fg]overlay=shortest=1,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`
  execFileSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-framerate',
    '25',
    '-i',
    join(dir, '%04d.png'),
    '-filter_complex',
    filter,
    ...frames,
    '-c:v',
    'libx264',
    ...BT709,
    '-crf',
    '20',
    '-movflags',
    '+faststart',
    join(outDir, `${name}.mp4`),
  ])
  console.log(name, { x1, y1, x2, y2, side })
}
