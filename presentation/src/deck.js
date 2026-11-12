// Deck runtime. window.ANIMS = { name: svgMarkup } is injected by scripts/build.mjs.
// Present mode: arrow keys / space / clicker, F = fullscreen. ?print renders every slide for the PDF.
;(() => {
  const ANIMS = window.ANIMS
  const PRINT = new URLSearchParams(location.search).has('print')
  if (PRINT) document.documentElement.classList.add('print')

  const slides = [...document.querySelectorAll('.slide')]

  // ---------- motion hooks (styles in deck.css) ----------
  // Headline words rise one after another, like the letters of the logo.
  document.querySelectorAll('.slide h1, .slide h2').forEach((h) => {
    let i = 0
    h.innerHTML = h.textContent
      .split(/(\s+)/)
      .map((t) => (t.trim() ? `<span class="w" style="--w:${i++}">${t}</span>` : t))
      .join('')
  })
  // Content plops in with a stagger, in reading order.
  const REVEAL =
    '.flow > *, .code, .brief > *, .hero-live, .shots img, .live-link > *, .links li, .byline'
  slides.forEach((s) =>
    s.querySelectorAll(REVEAL).forEach((el, n) => {
      el.classList.add('rv')
      el.style.setProperty('--n', n)
    }),
  )
  // The illustrations' four-point star, added where data-spark is set (value = start time in s).
  const STAR =
    '<svg viewBox="-4 -4 8 8" aria-hidden="true"><path d="M0-4L1.12-1.12L4 0L1.12 1.12L0 4L-1.12 1.12L-4 0L-1.12-1.12Z"/></svg>'
  // Several start times (space separated) add several stars.
  document.querySelectorAll('[data-spark]').forEach((el) => {
    for (const at of (el.dataset.spark || '').split(/\s+/)) {
      const star = document.createElement('span')
      star.className = 'spark'
      star.innerHTML = STAR
      if (at) star.style.setProperty('--spark-at', `${at}s`)
      el.append(star)
    }
  })
  const progress = document.querySelector('.progress')

  // ---------- SVG helpers (same idea as the site's <AnimatedSvg>) ----------
  let uid = 0
  const durations = {}
  function durationOf(name) {
    if (durations[name] != null) return durations[name]
    let max = 0
    for (const m of ANIMS[name].matchAll(/<animate\w*\b[^>]*>/g)) {
      const dur = parseFloat(m[0].match(/\bdur="([\d.]+)s"/)?.[1] ?? '0')
      const begin = parseFloat(m[0].match(/\bbegin="([\d.]+)s"/)?.[1] ?? '0')
      max = Math.max(max, begin + dur)
    }
    return (durations[name] = max)
  }
  /** Inline a copy of the SVG with unique IDs (gradients/clipPaths would collide otherwise). */
  function mount(el, name) {
    const markup = ANIMS[name]
    const prefix = markup.match(/\bid="([A-Za-z0-9]+-)/)?.[1]
    el.innerHTML = prefix ? markup.split(prefix).join(`${prefix}i${++uid}-`) : markup
    const svg = el.querySelector('svg')
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    svg.setAttribute('aria-hidden', 'true')
    svg.pauseAnimations()
    svg.setCurrentTime(0)
    return svg
  }

  // ---------- animations: data-anim="name" data-play="once|repeat|bar" data-print="final|strip" ----------
  const anims = [...document.querySelectorAll('[data-anim]')].map((el) => {
    const name = el.dataset.anim
    const state = { el, name, mode: el.dataset.play ?? 'once', timers: [] }
    if (PRINT) {
      renderPrint(el, name, el.dataset.print ?? 'final', +(el.dataset.frames ?? 5))
    } else {
      state.svg = mount(el, state.mode === 'bar' ? 'bar-intro' : name)
    }
    return state
  })

  function renderPrint(el, name, how, n) {
    const src = name === 'bar' ? 'bar-intro' : name
    const dur = durationOf(src)
    if (how === 'final') {
      mount(el, src).setCurrentTime(dur)
      return
    }
    el.classList.add('strip', 'anim-strip')
    if (el.dataset.vertical != null) el.classList.add('vertical')
    el.style.setProperty('--cols', el.dataset.cols ?? n)
    for (let i = 0; i < n; i++) {
      const cell = document.createElement('div')
      el.append(cell)
      // skip t=0 (often empty); end exactly on the final frame
      mount(cell, src).setCurrentTime((dur * (i + 1)) / n)
    }
  }

  function stop(a) {
    a.timers.forEach(clearTimeout)
    a.timers = []
  }
  function start(a) {
    stop(a)
    if (a.mode === 'bar') {
      a.svg = mount(a.el, 'bar-intro')
      a.svg.unpauseAnimations()
      a.timers.push(
        setTimeout(
          () => (a.svg = mount(a.el, 'bar-loop')).unpauseAnimations(),
          durationOf('bar-intro') * 1000,
        ),
      )
      return
    }
    const run = () => {
      a.svg.setCurrentTime(0)
      a.svg.unpauseAnimations()
      if (a.mode === 'repeat') a.timers.push(setTimeout(run, (durationOf(a.name) + 2) * 1000))
    }
    a.timers.push(setTimeout(run, +(a.el.dataset.delay ?? 300)))
  }
  function reset(a) {
    stop(a)
    if (a.mode === 'bar') a.svg = mount(a.el, 'bar-intro')
    a.svg.pauseAnimations()
    a.svg.setCurrentTime(0)
  }

  // ---------- videos ----------
  // Pairs are built to the same length with the end hold baked in (scripts/build.mjs). The browser's
  // own loop wraps without a gap. A watchdog only re-aligns a video that has drifted from the lead.
  const DRIFT = 0.12
  function loop(v, from = 0) {
    v.loop = true
    v.currentTime = from
    v.play()
  }
  function freeze(v) {
    v.pause()
    v.currentTime = Math.max(0, v.duration - 0.05) // the held last frame
  }
  function keepInStep(slide, vids) {
    cancelAnimationFrame(slide._raf)
    const [lead, ...rest] = vids
    const watch = () => {
      for (const v of rest) {
        const d = Math.abs(v.currentTime - lead.currentTime)
        // ignore the moment one has wrapped and the other hasn't yet
        if (d > DRIFT && d < lead.duration - DRIFT) v.currentTime = lead.currentTime
      }
      slide._raf = requestAnimationFrame(watch)
    }
    watch()
  }
  function stopVideos(slide) {
    clearTimeout(slide._vt)
    cancelAnimationFrame(slide._raf)
    slide.querySelectorAll('video').forEach((v) => {
      v.pause()
      v.currentTime = 0
    })
  }

  // ---------- comparison slides build up one card at a time ----------
  // Step k (1..n): card k plays (or, for the static illustration, shows) alone, centred and 20%
  // bigger on surface/raised; earlier cards wait at half size on the side, drafts frozen on their
  // last frame. Step n + 1: all cards in their place, videos looping in sync.
  const FEATURE = 1.2 // scale of the card in focus
  const ASIDE = 0.5 // scale of the cards already shown
  const GAP = 40
  const isCompare = (slide) => !!slide.querySelector('.compare')
  const itemsOf = (slide) => [...slide.querySelectorAll('.compare .item')]
  const stepsOf = (slide) => itemsOf(slide).length + 1
  /** Translate + scale that move an item's centre to (cx, cy) at scale s. */
  function place(item, cx, cy, s) {
    item.style.setProperty('--tx', `${cx - (item.offsetLeft + item.offsetWidth / 2)}px`)
    item.style.setProperty('--ty', `${cy - (item.offsetTop + item.offsetHeight / 2)}px`)
    item.style.setProperty('--s', s)
  }
  const centreOf = (item) => [
    item.offsetLeft + item.offsetWidth / 2,
    item.offsetTop + item.offsetHeight / 2,
  ]
  function layout(slide, step) {
    const compare = slide.querySelector('.compare')
    const items = itemsOf(slide)
    const focus = step - 1 // index of the featured card; items.length on the last step
    items.forEach((item, i) => {
      item.classList.toggle('featured', i === focus)
      item.classList.toggle('shown', i <= focus)
      item.classList.toggle('waiting', i > focus)
    })
    for (const item of items) place(item, ...centreOf(item), 1)
    if (focus >= items.length) return
    // the full content width of the slide, and the comparison's height plus most of the bottom padding
    const css = getComputedStyle(slide)
    const padX = parseFloat(css.paddingLeft)
    const area = {
      x: padX,
      y: compare.offsetTop,
      w: slide.clientWidth - 2 * padX,
      h: compare.offsetHeight + parseFloat(css.paddingBottom) - 16,
    }
    // the waiting row keeps to the regular content edge, not the bottom padding
    const bottom = compare.offsetTop + compare.offsetHeight
    const w = items[0].offsetWidth
    const h = items[0].offsetHeight
    // cards in one row wait in a column on the left; stacked rows wait in a row along the bottom,
    // away from the title
    const sideBySide = items[0].offsetTop === items[1].offsetTop
    const aside = items.slice(0, focus)
    const sw = w * ASIDE
    const sh = h * ASIDE
    let used = 0 // width (side by side) or height (stacked) taken by the waiting cards
    if (aside.length) {
      if (sideBySide) {
        const total = aside.length * sh + (aside.length - 1) * GAP
        aside.forEach((item, i) =>
          place(
            item,
            area.x + sw / 2,
            area.y + (area.h - total) / 2 + i * (sh + GAP) + sh / 2,
            ASIDE,
          ),
        )
        used = sw + GAP
      } else {
        aside.forEach((item, i) =>
          place(item, area.x + i * (sw + GAP) + sw / 2, bottom - sh / 2, ASIDE),
        )
        used = sh + GAP
      }
    }
    const free = sideBySide ? { w: area.w - used, h: area.h } : { w: area.w, h: area.h - used }
    const big = Math.min(FEATURE, free.w / w, free.h / h)
    // centre of the slide area, nudged out of the waiting cards' way when they would overlap
    const cx = sideBySide
      ? Math.max(area.x + area.w / 2, area.x + used + (w * big) / 2)
      : area.x + area.w / 2
    const cy = sideBySide
      ? area.y + area.h / 2
      : Math.min(area.y + area.h / 2, bottom - used - (h * big) / 2)
    place(items[focus], cx, cy, big)
  }
  // safety net: re-measure if a video's size arrives while its slide is on screen
  document.querySelectorAll('.compare video').forEach((v) =>
    v.addEventListener('loadedmetadata', () => {
      const slide = v.closest('.slide')
      if (slide.classList.contains('active') && slide._step) layout(slide, slide._step)
    }),
  )
  function setStep(slide, step, instant) {
    layout(slide, step)
    if (instant) {
      slide.classList.add('no-move')
      requestAnimationFrame(() => requestAnimationFrame(() => slide.classList.remove('no-move')))
    }
    slide.dataset.step = step
    slide._step = step
    clearTimeout(slide._vt)
    cancelAnimationFrame(slide._raf)
    const delay = instant ? 300 : 200
    const items = itemsOf(slide)
    const focus = step - 1
    const videos = items.map((item) => item.querySelector('video'))
    if (focus >= items.length) {
      const all = videos.filter(Boolean)
      slide._vt = setTimeout(() => {
        all.forEach((v) => loop(v))
        keepInStep(slide, all)
      }, delay)
      return
    }
    videos.forEach((v, i) => {
      if (!v) return
      if (i < focus) freeze(v)
      else if (i > focus) {
        v.pause()
        v.currentTime = 0
      }
    })
    if (videos[focus]) slide._vt = setTimeout(() => loop(videos[focus]), delay)
  }
  function playVideos(slide, fromEnd) {
    if (isCompare(slide)) return setStep(slide, fromEnd ? stepsOf(slide) : 1, true)
    const vids = [...slide.querySelectorAll('video')]
    if (!vids.length) return
    slide._vt = setTimeout(() => {
      vids.forEach((v) => loop(v))
      keepInStep(slide, vids)
    }, 300)
  }

  // ---------- navigation ----------
  let current = -1
  function go(i, fromEnd = false) {
    i = Math.max(0, Math.min(slides.length - 1, i))
    if (i === current) return
    if (current >= 0) {
      const prev = slides[current]
      prev.classList.remove('active')
      anims.filter((a) => prev.contains(a.el)).forEach(reset)
      stopVideos(prev)
    }
    current = i
    const s = slides[i]
    s.classList.add('active')
    anims.filter((a) => s.contains(a.el)).forEach(start)
    playVideos(s, fromEnd)
    progress.style.width = `${((i + 1) / slides.length) * 100}%`
    history.replaceState(null, '', `#${i + 1}`)
  }
  /** Next/previous: steps through a draft/final slide before leaving it. */
  function advance(dir) {
    const s = slides[current]
    if (isCompare(s)) {
      const step = s._step + dir
      if (step >= 1 && step <= stepsOf(s)) return setStep(s, step)
    }
    go(current + dir, dir < 0)
  }

  function fit() {
    const scale = Math.min(innerWidth / 1920, innerHeight / 1080)
    document.documentElement.style.setProperty('--scale', scale)
  }

  slides.forEach((s, i) => {
    const n = s.querySelector('.meta .n')
    if (n) n.textContent = String(i + 1).padStart(2, '0')
  })

  if (PRINT) {
    document.fonts.ready.then(() => {
      document.documentElement.dataset.ready = '1'
    })
    return
  }

  fit()
  addEventListener('resize', fit)
  addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
      e.preventDefault()
      advance(1)
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
      e.preventDefault()
      advance(-1)
    } else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(slides.length - 1)
    else if (e.key === 'f')
      document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen()
  })
  addEventListener('click', (e) => {
    if (e.target.closest('a')) return
    advance(e.clientX > innerWidth / 3 ? 1 : -1)
  })
  go((parseInt(location.hash.slice(1), 10) || 1) - 1)
})()
