// will generate window.foo = ...
module.exports = [{
  output: {
    library: 'LogmaticBuilder',
    path: './dist',
    filename: 'logmatic.js'
  },
  entry: {
    library: './src/logmatic/logmatic-builder.js'
  }
}, {
  output: {
    path: './dist',
    filename: 'bootstrap.min.js'
  },
  entry: {
    library: './src/bootstrap.js'
  }
}];
