import WeschemeParser from './WeschemeParser';
import CodeMirrorBlocks  from "codemirror-blocks";
require('./style.less');

export const language = {
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
};

const constructor = (container, options) => new CodeMirrorBlocks(container, options, language);
export default constructor;

module.exports = constructor;