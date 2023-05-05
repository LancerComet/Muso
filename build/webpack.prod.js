const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

const baseConfig = require('./webpack.conf')

baseConfig.mode = 'production'
baseConfig.output.publicPath = '/Muso/'
baseConfig.plugins.push(new CopyPlugin({
  patterns: [
    { from: path.resolve(__dirname, '../static'), to: path.resolve(__dirname, '../.demo') }
  ]
}))

module.exports = baseConfig
