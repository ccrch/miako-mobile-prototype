// Core node modules

import fs from 'fs'
import path from 'path'
import process from 'process'
import postcss from 'postcss'
import os from 'os'

// Build tools

import * as esbuild from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import alias from 'esbuild-plugin-alias'
import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'
import copyStaticFiles from 'esbuild-copy-static-files'
import svgPlugin from 'esbuild-plugin-svg'
import Twig from 'twig'
import { minify } from 'html-minifier'

// Clearing the build folder

const clearBuildFolder = () => {
  if (fs.existsSync('./build')) {
    fs.readdirSync('./build').forEach((file) => {
      const filePath = path.join('./build', file)
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmdirSync(filePath, { recursive: true })
      } else {
        fs.unlinkSync(filePath)
      }
    })
  }
}

// Current date added to css/js file names

const currentDate = () => {
  const now = new Date()

  const year = now.getFullYear().toString()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  // const seconds = String(now.getSeconds()).padStart(2, '0')

  return year + month + day + hours + minutes
}

// Twig plugin

let twigPlugin = {
  name: 'compileTwig',
  setup(build) {
    const twigArr = []
    const files = fs.readdirSync('src/twigs/')

    files.forEach((file) => {
      if (path.extname(file) == '.twig') {
        twigArr.push(file)
      }
    })

    twigArr.forEach((filename, index) => {
      Twig.renderFile(`src/twigs/${filename}`, {}, (err, html) => {
        if (err) {
          console.error('Twig error', err)
          return
        }

        const folder = filename.slice(0, -5) === 'index' ? undefined : `${path.parse(filename).name}`
        const file = `${path.parse(filename).name}.html`

        const minifiedHtml = minify(html, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        })

        if (folder) {
          fs.mkdirSync(`./build/${folder}`, { recursive: true })
          fs.writeFileSync(`./build/${folder}/index.html`, minifiedHtml)
        } else {
          fs.writeFileSync(`./build/${file}`, minifiedHtml)
        }
      })
    })

    console.log('Twig files compiled')
  },
}

clearBuildFolder()

// Global variables

const platform = os.platform()
let globalNpmModules = path.resolve('/usr/local/lib/node_modules')
if (platform === 'win32') {
  globalNpmModules = path.resolve(process.env.APPDATA, 'npm', 'node_modules')
}
const CURRENT_DIR = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'

// Options for esbuild, live-server and more related configurations.

const options = {
  build: {
    entryPoints: [
      { out: 'scripts', in: 'src/scripts/scripts.ts' },
      { out: 'styles', in: 'src/styles/styles.scss' },
    ],
    outExtension: { '.js': `.min.${currentDate()}.js`, '.css': `.min.${currentDate()}.css` },
    loader: {
      '.woff': 'file',
      '.woff2': 'file',
      '.ttf': 'file',
      '.otf': 'file',
      '.eot': 'file',
      '.svg': 'file',
      '.png': 'file',
      '.jpg': 'file',
    },
    color: !isProduction,
    target: 'es2017',
    logLevel: 'info',
    bundle: true,
    sourcemap: isProduction,
    minify: isProduction,
    outdir: './build/assets',
    format: 'esm',
    splitting: true,
  },
  styles: {
    type: 'css',
    filter: /.(s[ac]ss|css)$/,
    cache: false,
    variables: {
      showMediaLabel: !isProduction,
      showOverlayGrid: !isProduction,
      useRem: isProduction,
    },
    precompile(source, isRoot) {
      // This works for vanillajs, react will need to inject a whole lot more stuff into both the root file and the .module.scss files.
      return isRoot
        ? `
        $showMediaLabel: ${this.variables.showMediaLabel};
        $showOverlayGrid: ${this.variables.showOverlayGrid};
        $useRem: ${this.variables.useRem};
      \n${source}`
        : source
    },
    async transform(source, resolveDir) {
      const { css } = await postcss([
        postcssPresetEnv({
          from: undefined,
          stage: false,
          preserve: true,
          debug: !isProduction,
          autoprefixer: true,
          browsers: ['last 2 versions'],
        }),
      ]).process(source)
      return css
    },
  },
  alias: {
    '@': path.resolve(CURRENT_DIR, 'src'),
    assets: path.resolve(CURRENT_DIR, 'src', 'assets'),
  },
  copy: {
    src: './src/assets',
    dest: './build/assets',
    dereference: true,
    errorOnExist: true,
    filter: (e) => {
      if (e.includes('/fonts') || e.includes('/svg')) {
        return false
      }
      return true
    },
    preserveTimestamps: true,
    recursive: true,
  },
  devserver: {
    port: 9000, // Set the server port. Defaults to 8080.
    host: '0.0.0.0', // 'localhost', // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
    servedir: './build',
    keyfile: path.resolve(globalNpmModules, 'localcert', 'localhostserver.key'),
    certfile: path.resolve(globalNpmModules, 'localcert', 'localhostserver.crt'),
  },
  plugins() {
    return [sassPlugin(this.styles), alias(this.alias), svgPlugin(), twigPlugin]
  },
}

// Live server

if (!isProduction) {
  const args = process.argv.slice(2)
  const watch = args.includes('--watch') || args.includes('--servedir')

  const context = await esbuild.context({
    ...options.build,
    plugins: [...options.plugins()],
  })

  if (watch) {
    await context.watch()
    const { host, port } = await context.serve(options.devserver)
  } else {
    context.rebuild()
    context.dispose()
  }
}

// Building relevant files depending on what options are passed

await esbuild
  .build({
    ...options.build,
    plugins: [...options.plugins(), copyStaticFiles(options.copy)],
  })
  .catch((err) => {
    console.error('🚨 Error compiling styles & scripts! 🚨')
    console.error(err)
    process.exit(1)
  })
