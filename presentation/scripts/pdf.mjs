// Prints the built deck to a 16:9 PDF (one slide per page; motion becomes frame strips).
// Usage: node scripts/pdf.mjs [lang]
import { chromium } from 'playwright-core'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const lang = process.argv[2] ?? 'de'
const OUT = new URL('../out/', import.meta.url).pathname
const name =
  { de: 'After-Hours_Praesentation', en: 'After-Hours_Presentation' }[lang] ?? `After-Hours_${lang}`

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(`${pathToFileURL(join(OUT, `praesentation.${lang}.html`))}?print`)
await page.waitForSelector('html[data-ready]')
await page.waitForTimeout(500)
await page.pdf({
  path: join(OUT, `${name}.pdf`),
  width: '1920px',
  height: '1080px',
  printBackground: true,
})
await browser.close()
console.log(join(OUT, `${name}.pdf`))
