const baseConfig = require('./webpack.conf')

baseConfig.mode = 'production'
baseConfig.output.publicPath = '/Muso/'

module.exports = baseConfig
