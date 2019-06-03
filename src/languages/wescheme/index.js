import WeschemeParser from './WeschemeParser';
import CodeMirrorBlocks, {Languages} from '../../../node_modules/codemirror-blocks';
require('./style.less');

export const language = Languages.addLanguage(
  {
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

export const constructor = (container, options) => new CodeMirrorBlocks(container, options, language);

export default constructor;