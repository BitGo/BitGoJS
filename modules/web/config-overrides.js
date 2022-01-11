const webpack = require('webpack');

module.exports = function override(config, env) {
  //do stuff with the webpack config...
  config.resolve = {
    ...config.resolve,
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      path: false,
      net: false,
      tls: false,
      dns: false,
      fs: false,
      vm: false,
      constants: false,
      os: false,
      zlib: false,
      stream: require.resolve('stream-browserify'),
      http: require.resolve("stream-http"),
      https: require.resolve('https-browserify'),
      buffer: require.resolve('buffer'),
      url: require.resolve("url/"),
    }
  };  
  config.externals = [
    'morgan', 
    'superagent-proxy'
  ];
  console.log(`--------------`)
  console.log(config.plugins);
  console.log(`--------------`)
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ];
  config.ignoreWarnings = [/Failed to parse source map/];
  return config;
}
