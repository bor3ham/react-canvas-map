const esbuild = require('esbuild')

const config = require('./build.js').config

esbuild.build({
  ...config,
  minify: false,
  watch: true,
}).then(result => {
  console.log('watching ...')
})
