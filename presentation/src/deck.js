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
    '.compare .item, .flow > *, .code, .roles > .frame, .brief > *, .hero-live, .shots img, .live-link > *, .links li, .byline'
  slides.forEach((s) =>
    s.querySelectorAll(REVEAL).forEach((el, n) => {
      el.classList.add('rv')
      el.style.setProperty('--n', n)
    }),
  )
  // The illustrations' four-point star, added where data-spark is set (value = start time in s).
  const STAR =
    '<svg viewBox="-4 -4 8 8" aria-hidden="true"><path d="M0-4L1.12-1.12L4 0L1.12 1.12L0 4L-1.12 1.12L-4 0L-1.12-1.12Z"/></svg>'
  document.querySelectorAll('[data-spark]').forEach((el) => {
    const star = document.createElement('span')
    star.className = 'spark'
    star.innerHTML = STAR
    if (el.dataset.spark) star.style.setProperty('--spark-at', `${el.dataset.spark}s`)
    el.append(star)
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

  // ---------- videos: loop, all videos on a slide restart together ----------
  // Pairs are built to the same length with the end hold baked in (scripts/build.mjs), so a joint
  // restart is a seamless synced loop. Videos are paused just before their end instead of being
  // allowed to end: Chrome can blank an ended video.
  function playVideos(slide) {
    const vids = [...slide.querySelectorAll('video')]
    if (!vids.length) return
    const restart = () => {
      vids.forEach((v) => {
        v.currentTime = 0
        v.play()
      })
      watch()
    }
    const watch = () => {
      const done = vids.filter((v) => v.paused || v.currentTime >= v.duration - 0.08)
      done.forEach((v) => v.pause())
      if (done.length === vids.length) restart()
      else slide._raf = requestAnimationFrame(watch)
    }
    slide._vt = setTimeout(restart, 300)
  }
  function stopVideos(slide) {
    clearTimeout(slide._vt)
    cancelAnimationFrame(slide._raf)
    slide.querySelectorAll('video').forEach((v) => {
      v.pause()
      v.currentTime = 0
    })
  }

  // ---------- navigation ----------
  let current = -1
  function go(i) {
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
    playVideos(s)
    progress.style.width = `${((i + 1) / slides.length) * 100}%`
    history.replaceState(null, '', `#${i + 1}`)
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
      go(current + 1)
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
      e.preventDefault()
      go(current - 1)
    } else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(slides.length - 1)
    else if (e.key === 'f')
      document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen()
  })
  addEventListener('click', (e) => {
    if (e.target.closest('a')) return
    go(current + (e.clientX > innerWidth / 3 ? 1 : -1))
  })
  go((parseInt(location.hash.slice(1), 10) || 1) - 1)
})()
