const devCfg = require('./webpack.dev.js')

module.exports = {
  ...devCfg,
  mode: 'production',
}
