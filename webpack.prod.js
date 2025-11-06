const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
      { test: /\.js$/, exclude: /node_modules/, use: [{ loader: 'babel-loader', options: { presets: ['@babel/preset-env'] } }] }
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'src/public'), to: path.resolve(__dirname, 'dist') },
        { from: path.resolve(__dirname, 'src/manifest.webmanifest'), to: path.resolve(__dirname, 'dist/manifest.webmanifest') }
      ]
    }),
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw-src.js'),
      swDest: 'sw.js',
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
    })
  ]
});