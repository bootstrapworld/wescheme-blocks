import WeschemeParser from './WeschemeParser';
import { CodeMirrorBlocks, Languages }  from "codemirror-blocks";
require('./style.less');

export const WeScheme = Languages.addLanguage({
  id: 'wescheme',
  name: 'WeScheme',
  description: 'The WeScheme language',
  getParser() {
    return new WeschemeParser();
  },
  getRenderOptions() {
    return {
      // TODO: perhaps also ['functionDefinition', 'variableDefinition', 'structDefinition']?
      lockNodesOfType: ['comment']
    };
  },
});

const constructor = (container, options) => new CodeMirrorBlocks(container, options, WeScheme);
export default constructor;

module.exports = constructor;