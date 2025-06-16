document.addEventListener('DOMContentLoaded', async () => {
  import('./core/helpers').then((module) => {
    // initializing helpers

    !module.isProduction && module.esbuildReload()
    module.pageRestore.init()
    module.prefetch.init()
  })

  console.log('Hi!')
  document.querySelector('html').classList.remove('preload')

  import('./core/theme-color-change').then((module) => module.default.init())
})
