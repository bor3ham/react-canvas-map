const fs = require('fs')
const { stylusLoader } = require('esbuild-stylus-loader')

const metafilePlugin = {
  name: 'metafilePlugin',
  setup: (build) => {
    build.onEnd((result) => {
      if (result.errors.length === 0) {
        fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile))
      }
    })
  },
}

exports.config = {
  plugins: [
    stylusLoader({
      stylusOptions: {
        includeCss: true,
      },
    }),
    metafilePlugin,
  ],
  entryPoints: [
    './src/demo.ts',
    './src/demo.styl',
  ],
  outdir: 'dist',
  metafile: true,
  bundle: true,
  format: 'iife',
}
