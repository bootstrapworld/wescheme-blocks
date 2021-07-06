const path = require('path');
const {
  getWebpackDevServerConfig,
  getWebpackBundleConfig,
} = require('codemirror-blocks/lib/toolkit/webpack');

const config = getWebpackDevServerConfig({
  context: path.resolve('dev-server'),
  entry: './index.js',
});

const devServerConfig = {
  ...config,
  module: {
    ...config.module,
    rules: [
      ...config.module.rules,
      // Add loader for .rkt files
      {
        test: /\.rkt$/,
        use: [{ loader: 'raw-loader' }],
      },
    ],
  },
  resolve: {
    ...config.resolve,
    alias: {
      // Add aliases needed by WeschemeParser.js
      // TODO(pcardune): stop using aliases and just import
      // directly from the right place...?
      ...config.resolve?.alias,
      jsnums: 'wescheme-js/src/runtime/js-numbers',
      lex: 'wescheme-js/src/lex',
      types: 'wescheme-js/src/runtime/types',
      structs: 'wescheme-js/src/structures',
    },
  },
};

module.exports = [
  devServerConfig,
  getWebpackBundleConfig({
    entry: {
      CodeMirrorBlocks: path.resolve(__dirname, 'src', 'index'),
    },
  }),
];
