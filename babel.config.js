module.exports = {
  presets: [
    ['@babel/preset-env'],
    [
      'minify',
      {
        builtIns: false,
        evaluate: false,
        mangle: false
      }
    ]
  ],
  comments: false
}
