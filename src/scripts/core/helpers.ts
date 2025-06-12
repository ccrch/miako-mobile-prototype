import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

export const esbuildReload = () => {
  new EventSource('https://localhost:9000/esbuild').addEventListener('change', (e) => {
    const { added, removed, updated } = JSON.parse(e.data)

    console.log('asdf')

    if (!added.length && !removed.length && updated.length === 1) {
      for (const link of document.getElementsByTagName('link') as any) {
        const url = new URL(link.href)

        if (url.host === location.host && url.pathname === updated[0]) {
          const next = link.cloneNode()
          next.href = `${updated[0]}?${Math.random().toString(36).slice(2)}`
          next.onload = () => link.remove()
          link.parentNode.insertBefore(next, link.nextSibling)
          return
        }
      }
    }

    location.reload()
  })
}

export const isProduction = process.env.NODE_ENV === 'production'

export let lenis = null

export const lenisRaf = (target) => {
  function raf(time) {
    target.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
}

export const lenisScroll = {
  init(options = undefined): void {
    lenis = new Lenis({
      lerp: 0.1,
      ...options,
    })

    // Standard approach
    // lenisRaf(lenis)

    // GSAP approach - better performance & no lags with ScrollTriggers & pinned containers
    gsap.registerPlugin(ScrollTrigger)
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)
  },
}

export const pageRestore = {
  init(): void {
    // Page restore for mobile iOS - without this back/forward buttons won't hide loader covers.
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        window.location.reload()
      }
    })
  },
}

export const prefetch = {
  init(): void {
    document.body.addEventListener('mouseover', this.handlePrefetch)
  },

  handlePrefetch(event): void {
    const target = event.target

    if (target.tagName !== 'A') {
      return
    }

    const href = target.getAttribute('href')
    const targetBlank = target.getAttribute('target') === '_blank'

    // if (!href || href.charAt(0) !== '/') {
    if (!href || targetBlank) {
      return
    }

    const isAlreadyAdded = document.head.querySelector(`link[href='${href}']`)

    if (isAlreadyAdded) {
      return
    }

    const isSamePage = target.pathname === window.location.pathname

    if (isSamePage) {
      return
    }

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href

    document.head.appendChild(link)
  },
}

export const pressedKeys = new Set()

export const simultaneousKeyPress = {
  down(event: KeyboardEvent, keys: Array<string>, callback: any): void {
    const key = event.key.toLowerCase()
    pressedKeys.add(key)

    if (keys.every((keyToDetect) => pressedKeys.has(keyToDetect))) {
      callback()
      pressedKeys.clear()
    }
  },

  up(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    pressedKeys && pressedKeys.delete(key)
  },
}

export let isVerticalResize = false

export const verticalResizeCheck = {
  init(): void {
    let lastWindowHeight = window.innerHeight
    let lastWindowWidth = window.innerWidth

    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight
      const currentWidth = window.innerWidth
      isVerticalResize = currentHeight !== lastWindowHeight && currentWidth === lastWindowWidth

      lastWindowHeight = currentHeight
      lastWindowWidth = currentWidth
    })
  },
}
