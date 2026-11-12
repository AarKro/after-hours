// Screenshots of the live site for the slides.
// reducedMotion: 'reduce' makes every illustration render its final frame, so shots are stable.
// Usage: node scripts/screenshots.mjs [baseUrl]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'https://aarkro.github.io/after-hours').replace(/\/$/, '')
const OUT = new URL('../assets/screens/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
}

// [file, device, path, fullPage]
const SHOTS = [
  ['home-desktop', 'desktop', '/', false],
  ['home-desktop-full', 'desktop', '/', true],
  ['recipes-desktop', 'desktop', '/recipes', false],
  ['recipe-desktop', 'desktop', '/recipes/old-fashioned', false],
  ['contact-desktop', 'desktop', '/contact?intent=reservation', false],
  ['home-mobile', 'mobile', '/', false],
  ['recipe-mobile', 'mobile', '/recipes/espresso-martini', false],
  ['contact-mobile', 'mobile', '/contact', false],
]

const browser = await chromium.launch({ channel: 'chrome' })
for (const [file, device, path, fullPage] of SHOTS) {
  const context = await browser.newContext({ ...DEVICES[device], reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  if (fullPage) {
    // scroll through once so in-view triggers fire for every section
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 60))
      }
      window.scrollTo(0, 0)
    })
  }
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}${file}.jpg`, type: 'jpeg', quality: 85, fullPage })
  console.log(file)
  await context.close()
}
await browser.close()
