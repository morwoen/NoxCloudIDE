var debug = process.env.NODE_ENV !== "production";
var webpack = require("webpack");
var path = require("path");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var contextPath = path.join(__dirname);

var copyPlugins = [
  new CopyWebpackPlugin([{
    from: 'node_modules/monaco-editor/min/vs',
    to: 'vs',
  }]),
  new CopyWebpackPlugin([{
    from: 'node_modules/xterm/src/xterm.js',
    to: 'xterm/xterm.js',
  }]),
  new CopyWebpackPlugin([{
    from: 'node_modules/xterm/src/xterm.css',
    to: 'xterm/xterm.css',
  }]),
  new CopyWebpackPlugin([{
    from: 'node_modules/xterm/addons/fit/fit.js',
    to: 'xterm/addons/fit/fit.js',
  }]),
  new CopyWebpackPlugin([{
    from: 'node_modules/xterm/addons/linkify/linkify.js',
    to: 'xterm/addons/linkify/linkify.js',
  }])
];

module.exports = {
  context: contextPath,
  devtool: debug ? "inline-sourcemap" : null,
  entry: "./js/index.js",
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        query: {
          presets: ["react", "es2015", "stage-0"],
          plugins: ["react-html-attrs", "transform-class-properties", "transform-decorators-legacy"],
        }
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }
    ]
  },
  output: {
    path: contextPath,
    filename: "app.min.js",
    publicPath: "/"
  },
  plugins: debug ? copyPlugins : copyPlugins.concat([
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": '"production"'
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: false,
      sourcemap: false,
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    }),
  ]),
  "devServer": {
    proxy: {
      "/api/*": { target: "http://localhost:8081" },
      "/socket/*": { target: "http://localhost:8081" },
      // "/*": {
      //   target: "http://localhost:8080",
      //   rewrite: function(req) {
      //     req.url = req.url.replace(/^\/static/, "");
      //   }
      // }
    }
  }
};
