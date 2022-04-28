const { build } = require('esbuild')
const { stylusLoader } = require('esbuild-stylus-loader')

module.exports.config = {
  plugins: [
    stylusLoader({
      stylusOptions: {
        includeCss: true,
      },
    }),
  ],
  entryPoints: [
    'demo.js',
    'demo.styl',
  ],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  target: ['chrome58', 'firefox57', 'safari11', 'edge18'],
  outdir: 'dist',
}

build(module.exports.config).catch(() => process.exit(1))
