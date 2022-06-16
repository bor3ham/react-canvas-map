const esbuild = require('esbuild')

module.exports.config = {
  bundle: true,
  sourcemap: true,
  minify: true,
  format: 'esm',
  target: ['esnext'],
  entryPoints: [
    'src/index.tsx',
    'src/index.css',
  ],
  entryNames: 'react-canvas-map',
  outdir: 'dist',
  external: [
    'react',
  ],
}

esbuild.build(module.exports.config).catch(() => process.exit(1))
