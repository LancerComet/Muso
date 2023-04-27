/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const FriendlyErrorsPlugin = require('@soda/friendly-errors-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const webpackConfig = {
  entry: resolve('dev/index.ts'),

  mode: 'development',

  output: {
    path: resolve('.demo'),
    publicPath: '/'
  },

  resolve: {
    extensions: ['.js', '.ts', '.json']
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192
          }
        },
        generator: {
          filename: 'static/img/[name].[hash:10].[ext]'
        }
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: resolve('dev/index.html')
    }),

    new FriendlyErrorsPlugin()
  ],

  devServer: {
    static: resolve('static'),
    port: 5000,
    hot: true,
    host: '0.0.0.0'
  },

  stats: false
}

module.exports = webpackConfig

function resolve (dir) {
  return path.resolve(__dirname, '../' + dir)
}
