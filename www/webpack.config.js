const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js",
  },
  mode: "development",
  experiments: {
    asyncWebAssembly: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './*.html' },
        { from: './*.css' },
		{ from: './*.js' },
      ],
    }),
  ],
};
