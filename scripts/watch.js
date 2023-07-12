const esbuild = require('esbuild')

const { config } = require('./esbuild-config.js')

const watch = async () => {
  const ctx = await esbuild.context({
    ...config,
    minify: false,
  })
  await ctx.watch()
  console.log('watching...')
}

watch()
