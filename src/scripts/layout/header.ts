import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

const header = {
  el: {
    header: document.querySelector<HTMLElement>('.header'),
    text: document.querySelectorAll<HTMLElement>('.header__headline, .header__text'),
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
  },
}

export default header
