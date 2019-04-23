const path = require('path')

module.exports = {
  entry: './src/GifRecorder.js',
  mode: "production",
  output: {
    filename: "GifRecorder.js",
    path: path.resolve(__dirname, 'dist')
  }
}
