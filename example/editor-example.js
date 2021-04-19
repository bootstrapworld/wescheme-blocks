import WeSchemeCMB from '../src/languages/wescheme';
import './example-page.less';
import bigExampleCode from './ast-test.rkt';

// HACK: expose ALL test utilities, events, etc
// so they can be used from the browser console
import * as t from '../spec/support/test-utils';
Object.assign(window, t);

const smallExampleCode = `(+ 1 2) ;comment\n(+ 3 4)`;

const useBigCode = true;
const exampleCode = useBigCode ? bigExampleCode : smallExampleCode;

// grab the DOM Node to host the editor, and use it to instantiate
const container = document.getElementById('cmb-editor');
const editor = WeSchemeCMB(container, {collapseAll: false, value: exampleCode});

// for debugging purposes
window.editor = editor;
window.cmb = editor;