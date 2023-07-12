const esbuild = require('esbuild')

const { config } = require('./esbuild-config.js')

const build = async () => {
  await esbuild.build(config)
}

build()
