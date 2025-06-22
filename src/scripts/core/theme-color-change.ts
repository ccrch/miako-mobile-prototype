const themeColorChange = {
  el: {
    themeMeta: document.querySelectorAll<HTMLMetaElement>(`meta[name='theme-color']`),
  },

  init(): void {
    const pageTheme = document.documentElement.dataset.theme
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--color-${pageTheme}`).trim()

    this.el.themeMeta.forEach((item) => {
      item.setAttribute('content', color)
    })
  },
}

export default themeColorChange
