const esbuild = require('esbuild')

const { config } = require('./esbuild-config')

const build = async () => {
  await esbuild.build(config)
}

build()
