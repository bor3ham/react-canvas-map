const { build } = require('esbuild')

const config = require('./build.js').config

build({
  ...config,
  minify: false,
  watch: true,
}).then(result => {
  console.log('watching ...')
})
