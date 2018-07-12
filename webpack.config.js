'use strict';
const ExtractTextPlugin = require('extract-text-webpack-plugin'); // used to extract CSS from bundle.js
const webpack = require('webpack');
const path = require('path');
require('babel-polyfill');

const prod = process.env.BUILD === 'prod';

let jsPlugins = [];

if (prod) {
	jsPlugins =[
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production')
			}
		}),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
				drop_console: true
			}
		})
	];
}
//let cssPlugins = [
	//new ExtractTextPlugin('style.css'),
//];
//

const sassConfig = {
  entry: {
    app: './src/scss/app.scss'
  },
  output: {
    filename: 'style.css',
    //Output path using nodeJs path module
    path: path.resolve(__dirname, 'public')
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('style.css')
  ]
};

const jsConfig = {
  entry: {
    app: './src/js/App.js'
  },
  output: {
    filename: 'bundle.js',
    //Output path using nodeJs path module
    path: path.resolve(__dirname, 'public')
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};


module.exports = [jsConfig, sassConfig];
