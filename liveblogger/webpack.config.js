const slsw = require("serverless-webpack");

module.exports = {
  entry: slsw.lib.entries,
  target: "node",
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ["babel-loader"],
        exclude: /node_modules/
      }
    ]
  }
};
