const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const baseConfig = require('./base.config.js');

// this is the config for a single js file that can be included with a script tag
var configs = [
  Object.assign({}, baseConfig(), {
    entry: {
      "CodeMirrorBlocks": ['./src/languages/wescheme/index.js']
    },
    output: {
      path: path.resolve(__dirname, '..', "dist"),
      filename: "[name].js",
      libraryTarget: 'commonjs',
    },
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static', 
        openAnalyzer: !('TRAVIS' in process.env && 'CI' in process.env),
        reportFilename: "bundle-sizes.html",
        generateStatsFile: true,
        openAnalyzer: false,
      }),
    ],
    externals: {
      'codemirror': 'codemirror',
      'codemirror/addon/search/search' : 'codemirror',
      'codemirror/addon/search/searchcursor' : 'codemirror',
      'jsnums': 'jsnums',
      'lex': 'plt.compiler',
      'types': 'types',
      'structs': 'plt.compiler',
    },
    optimization: {
      minimize: true,
    },
  })
];

configs = configs.concat(
  configs.map(function(config) {
    return Object.assign({}, config, {
      output: {
        filename: "[name]-min.js"
      }
    });
  })
);
/*
configs.push(
  Object.assign({}, baseConfig({extractCSS:true}), {
    entry: {
      "blocks": './src/less/blocks.less'
    },
    output: {
      path: path.resolve(__dirname, '..', "dist"),
      filename: "[name].css"
    },
  })
);
*/
module.exports = configs;