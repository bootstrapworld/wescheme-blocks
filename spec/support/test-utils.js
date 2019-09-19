import WeSchemeBlocks from '../../src/languages/wescheme';

export async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function removeEventListeners() {
  const oldElem = document.body;
  const newElem = oldElem.cloneNode(true);
  oldElem.parentNode.replaceChild(newElem, oldElem);
}

const fixture = `
  <div id="root">
    <div id="cmb-editor" class="editor-container"/>
  </div>
`;
/**
 * Setup, be sure to use with `apply` (`activationSetup.apply(this, [pyret])`)
 * or `call` (`activationSetup.call(this, pyret)`)
 * so that `this` is scoped correctly!
 */
export function activationSetup() {
  document.body.insertAdjacentHTML('afterbegin', fixture);
  const container = document.getElementById('cmb-editor');
  this.cmb = WeSchemeBlocks(container, { collapseAll: false, value: "" });
  this.cmb.setBlockMode(true);

  this.activeNode = () => this.cmb.getFocusedNode();
  this.activeAriaId = () =>
    this.cmb.getScrollerElement().getAttribute('aria-activedescendent');
  this.selectedNodes = () => this.cmb.getSelectedNodes();
}

/**
 * Setup, be sure to use with `apply` (`cmSetup.apply(this, [pyret])`)
 * or `call` (`cmSetup.call(this, pyret)`)
 * so that `this` is scoped correctly!
 */
export function cmSetup(_) {
  document.body.insertAdjacentHTML('afterbegin', fixture);
  const container = document.getElementById('cmb-editor');
  this.cmb = WeSchemeBlocks(container, { collapseAll: false, value: "" });
  this.editor = this.cmb;
  this.cm = this.editor;
  this.blocks = this.cmb;
  this.cmb.setBlockMode(true);
}