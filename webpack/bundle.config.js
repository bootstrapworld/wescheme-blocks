var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');
var baseConfig = require('./base.config.js');

// this is the config for a single js file that can be included with a script tag
var configs = [
  _.extend({}, baseConfig(), {
    entry: {
      "CodeMirrorBlocks": ['./src/languages/wescheme/index.js']
    },
    output: {
      path: path.resolve(__dirname, '..', "dist"),
      filename: "[name].js",
      library: ["CodeMirrorBlocks"]
    },
    plugins: [
      new webpack.ProvidePlugin({ codemirror: "codemirror" }),
      new webpack.ProvidePlugin({ jsnums: "jsnums" }),
      new webpack.ProvidePlugin({ structs: "structs" }),
      new webpack.ProvidePlugin({ structs: "lex" }),
    ],
    externals: {
      'codemirror': 'CodeMirror',
      'jsnums': 'jsnums',
      'lex': 'plt.compiler',
      'types': 'types',
      'structs': 'plt.compiler',
    }
  })
];

configs = configs.concat(
  configs.map(function(config) {
    return _.merge({}, config, {
      output: {
        filename: "[name]-min.js"
      }
    });
  })
);

configs.push(
  _.extend({}, baseConfig({extractCSS:true}), {
    entry: {
      "blocks": './src/less/blocks.less'
    },
    output: {
      path: path.resolve(__dirname, '..', "dist"),
      filename: "[name].css"
    },
  })
);
module.exports = configs;