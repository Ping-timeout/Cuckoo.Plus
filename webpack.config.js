const webpack = require('webpack')
const path = require('path')
const yargs = require('yargs')
const fs = require('fs')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const MinifyPlugin = require("babel-minify-webpack-plugin");

let { env } = yargs.argv
if (!env) env = 'develop'
const isEnvProduction = env === 'production'

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(env)
  }),
]

if (isEnvProduction) {
  // remove source map data
  fs.unlink(path.join(__dirname, './public/dist/bundle.js.map'), (err) => {})
  // plugins.push(new MinifyPlugin())

  // FIX: Force exit the server process on Node 22 when the bundle finishes emitting
  plugins.push({
    apply: (compiler) => {
      compiler.plugin('done', (stats) => {
        console.log("Webpack compilation complete. Force-exiting firecracker instance...");
        setTimeout(() => process.exit(0), 100);
      });
    }
  });
} else {
  // plugins.push(new BundleAnalyzerPlugin())
}

module.exports = {
  devServer: {
    contentBase: path.join(__dirname, '/public'),
    publicPath: '/dist/',
    compress: true,
    port: 3000,
    host: "0.0.0.0",
    watchContentBase: true,
    disableHostCheck: true
  },

  entry: './src/index.ts',

  devtool: isEnvProduction ? '' : '#source-map',

  output: {
    libraryExport: 'default',
    path: path.resolve(__dirname, 'public/dist/'),
    filename: 'bundle.js'
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            'i18n': '@kazupon/vue-i18n-loader'
          },
          esModule: true
        }
      },

      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/]
          }
        }
      },

      {
        test: /\.tsx$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          'ts-loader'
        ]
      },

      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '../assets/images/[name].[ext]'
        }
      },

      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: '../assets/fonts/[name].[ext]'
        }
      },

      {
        test: /\.css$/,
        use: [{
          loader: "style-loader"
        }, {
          loader: "css-loader"
        }]
      },

      {
        test: /\.less$/,
        use: [{
          loader: "style-loader"
        }, {
          loader: "css-loader"
        }, {
          loader: "less-loader"
        }]
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    alias: {
      '@': path.join(__dirname, '/src')
    }
  },

  externals: {
    'moment': 'moment',
    'underscore': '_'
  },

  plugins: plugins
};
