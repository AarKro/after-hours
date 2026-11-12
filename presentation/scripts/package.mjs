// Collects the deliverables into out/abgabe/ and zips them: PDF, GIFs, link, speaker notes.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = new URL('../out/', import.meta.url).pathname
const DIR = join(OUT, 'abgabe')
rmSync(DIR, { recursive: true, force: true })
mkdirSync(join(DIR, 'GIFs'), { recursive: true })

cpSync(join(OUT, 'After-Hours_Praesentation.pdf'), join(DIR, 'After-Hours_Praesentation.pdf'))
cpSync(join(OUT, 'praesentation.de.html'), join(DIR, 'After-Hours_Praesentation.html'))
cpSync(join(OUT, 'gifs'), join(DIR, 'GIFs'), { recursive: true })
cpSync(join(OUT, 'sprechnotizen.de.md'), join(DIR, 'Sprechnotizen.md'))
writeFileSync(
  join(DIR, 'Website.txt'),
  'After Hours – Website\nhttps://aarkro.github.io/after-hours/\n\nQuellcode: https://github.com/AarKro/after-hours\n',
)
rmSync(join(OUT, 'After-Hours_Abgabe.zip'), { force: true })
execFileSync('zip', ['-rq', join(OUT, 'After-Hours_Abgabe.zip'), '.', '-x', '.*'], { cwd: DIR })
console.log(DIR)
