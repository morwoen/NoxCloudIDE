var debug = process.env.NODE_ENV !== "production";
var webpack = require("webpack");
var path = require("path");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var contextPath = path.join(__dirname);

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
  plugins: debug ? [
    new CopyWebpackPlugin([{
      from: 'node_modules/monaco-editor/dev/vs',
      to: 'vs',
    }]),
  ] : [
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": '"production"'
      }
    }),
    new CopyWebpackPlugin([{
      from: 'node_modules/monaco-editor/min/vs',
      to: 'vs',
    }]),
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
  ],
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
