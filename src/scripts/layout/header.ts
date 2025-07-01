import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

const header = {
  el: {
    header: document.querySelector<HTMLElement>('.header'),
    text: document.querySelectorAll<HTMLElement>('.header__headline, .header__text'),
    unicorn: document.querySelector<HTMLElement>('.header__unicorn'),
  },

  init(): void {
    gsap.registerPlugin(ScrollTrigger)

    ScrollTrigger.create({
      animation: gsap.to(this.el.text, { ease: 'none', opacity: 0 }),
      end: '+=80rem',
      scrub: true,
      start: '0% -20rem',
      trigger: this.el.header,
    })

    ScrollTrigger.create({
      animation: gsap.to(this.el.header, { ease: 'none', borderRadius: 0 }),
      end: '+=80rem',
      scrub: true,
      start: '0% -40rem',
      trigger: this.el.header,
    })

    this.unicornAnimation()
  },

  unicornAnimation(): void {
    const animate = ({ animationProps, end = '+=120rem', page, start = '0% 0%' }) => {
      if (window.location.href.match(page)) {
        ScrollTrigger.create({
          animation: gsap.to(this.el.unicorn, { ...animationProps, ease: 'none' }),
          end,
          scrub: true,
          start,
          trigger: this.el.header,
        })
      }
    }

    animate({
      animationProps: { x: '-50%', y: '-20%' },
      end: '+=90rem',
      page: '/home',
    })

    animate({
      animationProps: { y: '28%' },
      page: '/search',
    })

    animate({
      animationProps: { x: '48%', y: '81%', rotation: 21 },
      page: '/cart',
    })

    animate({
      animationProps: { x: '78%', y: '31%' },
      page: '/favorites',
    })

    animate({
      animationProps: { x: '78%' },
      end: '+=90rem',
      page: '/messages',
    })
  },
}

export default header
