const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'src/public'), to: path.resolve(__dirname, 'dist') },
        { from: path.resolve(__dirname, 'src/manifest.webmanifest'), to: path.resolve(__dirname, 'dist/manifest.webmanifest') },
        // Dev: sw tanpa precache injection (cukup untuk test)
        { from: path.resolve(__dirname, 'src/sw-src.js'), to: path.resolve(__dirname, 'dist/sw.js') }
      ]
    })
  ],
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9000,
    open: true,
    client: { overlay: { errors: true, warnings: true } }
  }
});