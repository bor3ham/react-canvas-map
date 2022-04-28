const esbuild = require('esbuild')

module.exports.config = {
  bundle: true,
  sourcemap: true,
  minify: true,
  format: 'esm',
  target: ['esnext'],
  entryPoints: ['src/index.tsx'],
  outfile: 'dist/react-canvas-map.js',
  external: [
    'react',
  ],
}

esbuild.build(module.exports.config).catch(() => process.exit(1))
