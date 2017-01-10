import uuid from 'node-uuid';

function comparePos(a, b) {
  return a.line - b.line || a.ch - b.ch;
}

// given a list of sibling nodes and a parent, assign the parent
// and sibling pointers
function setChildAttributes(nodes, parent) {
  let lastNode = false;
  let level = (parent? parent.level+1 : 1); // if parent=false, depth=1
  nodes.forEach((node, i) => {
    node.prevSibling= lastNode;
    node.nextSibling= nodes[i+1] || false;
    node.parent     = parent;
    lastNode        = node;
    //node.options["aria-setsize"] = nodes.length;
    //node.options["aria-posinset"] = i+1;
  });
  if(parent) { parent.firstChild = nodes[0]; }
  
  // have each child initialize itself
  nodes.forEach(node => {
    var children = [...node].slice(1); // the first elt is always the parent
    if(children.length > 1) { setChildAttributes(children, node); }
  });
}

// This is the root of the *Abstract Syntax Tree*.  Parser implementations are
// required to spit out an `AST` instance.
export class AST {
  constructor(rootNodes) {

    // the `nodeMap` attribute can be used to look up nodes by their id.
    this.nodeMap = new Map();

    // the `rootNodes` attribute simply contains a list of the top level nodes
    // that were parsed.
    this.rootNodes = rootNodes;
    // the `reverseRootNodes` attribute is a shallow, reversed copy of the rootNodes
    this.reverseRootNodes = rootNodes.slice().reverse();

    this.nextNodeMap = new WeakMap();
    this.prevNodeMap = new WeakMap();
    setChildAttributes(this.rootNodes, false);

    let lastNode = null;
    for (let rootNode of this.rootNodes) {
      for (let node of rootNode) {
        if (node) {
          if (lastNode) {
            this.nextNodeMap.set(lastNode, node);
            this.prevNodeMap.set(node, lastNode);
          }
          this.nodeMap.set(node.id, node);
          lastNode = node;
        }
      }
    }
  }

  // Traversal
  // The family tree should be navigable via ancestor/sibling
  // relationships, or via a pre-order walk. If a move is invalid, 
  // each function returns the current node
  getNextSibling(node) {
    return node.nextSibling || node;
  }

  getPrevSibling(node) {
    return node.prevSibling || node;
  }

  getChild(node) {
    return node.firstChild || node;
  }

  getParent(node) {
    return node.parent || node;
  }

  getNodeAfter(selection) {
    return this.nextNodeMap.get(selection)
        || this.rootNodes.find(node => comparePos(node.from, selection) >= 0)
        || this.rootNodes[0];
  }

  getNodeBefore(selection) {
    return this.prevNodeMap.get(selection)
        || this.reverseRootNodes.find(node => comparePos(node.to, selection) <= 0)
        || this.reverseRootNodes[0];
  }
}

// Every node in the AST inherits from the `ASTNode` class, which is used to
// house some common attributes.
export class ASTNode {
  constructor(from, to, type, options) {

    // The `from` and `to` attributes are objects containing the start and end
    // positions of this node within the source document. They are in the format
    // of `{line: <line>, ch: <column>}`.
    this.from = from;
    this.to = to;

    // Every node has a `type` attribute, which is simply a human readable
    // string sepcifying what type of node it is. This helps with debugging and
    // with writing renderers.
    this.type = type;

    // Every node also has an `options` attribute, which is just an open ended
    // object that you can put whatever you want in it. This is useful if you'd
    // like to persist information from your parser about a particular node, all
    // the way through to the renderer. For example, when parsing wescheme code,
    // human readable aria labels are generated by the parser, stored in the
    // options object, and then rendered in the renderers.
    this.options = options;

    // Every node also has a globally unique `id` which can be used to look up
    // it's corresponding DOM element, or to look it up in `AST.nodeMap`
    this.id = uuid.v4();
  }
}

export class Unknown extends ASTNode {
  constructor(from, to, elts, options={}) {
    super(from, to, 'unknown', options);
    this.elts = elts;
  }

  *[Symbol.iterator]() {
    yield this;
    for (let elt of this.elts) {
      yield* elt;
    }
  }

  toString() {
    return `(${this.func} ${this.args.join(' ')})`;
  }
}

export class Expression extends ASTNode {
  constructor(from, to, func, args, options={}) {
    super(from, to, 'expression', options);
    this.func = func;
    this.args = args;
  }

  *[Symbol.iterator]() {
    yield this;
    if (this.func instanceof ASTNode) {
      yield* this.func;
    }
    for (let arg of this.args) {
      yield* arg;
    }
  }

  toString() {
    return `(${this.func} ${this.args.join(' ')})`;
  }
}

export class Struct extends ASTNode {
  constructor(from, to, name, fields, options={}) {
    super(from, to, 'struct', options);
    this.name = name;
    this.fields = fields;
  }

  *[Symbol.iterator]() {
    yield this;
    yield this.name;
    for (let node of this.fields) {
      yield node;
    }
  }

  toString() {
    return `(define-struct ${this.name} ${this.fields.join(' ')})`;
  }
}

export class VariableDefinition extends ASTNode {
  constructor(from, to, name, body, options={}) {
    super(from, to, 'variableDef', options);
    this.name = name;
    this.body = body;
  }

  *[Symbol.iterator]() {
    yield this;
    yield this.name;
    yield* this.body;
  }

  toString() {
    return `(define (${this.name} ${this.body})`;
  }
}

export class FunctionDefinition extends ASTNode {
  constructor(from, to, name, args, body, options={}) {
    super(from, to, 'functionDef', options);
    this.name = name;
    this.args = args;
    this.body = body;
  }

  *[Symbol.iterator]() {
    yield this;
    yield this.name;
    for (let node of this.args) {
      yield node;
    }
    yield* this.body;
  }

  toString() {
    return `(define (${this.name} ${this.args.join(' ')}) ${this.body})`;
  }
}

export class IfExpression extends ASTNode {
  constructor(from, to, testExpr, thenExpr, elseExpr, options={}) {
    super(from, to, 'ifExpression', options);
    this.testExpr = testExpr;
    this.thenExpr = thenExpr;
    this.elseExpr = elseExpr;
  }

  *[Symbol.iterator]() {
    yield this;
    yield* this.testExpr;
    yield* this.thenExpr;
    yield* this.elseExpr;
  }

  toString() {
    return `(if ${this.testExpr} ${this.thenExpr} ${this.elseExpr})`;
  }
}

export class Literal extends ASTNode {
  constructor(from, to, value, dataType='unknown', options={}) {
    super(from, to, 'literal', options);
    this.value = value;
    this.dataType = dataType;
  }

  *[Symbol.iterator]() {
    yield this;
  }

  toString() {
    return `${this.value}`;
  }
}

export class Comment extends ASTNode {
  constructor(from, to, comment, options={}) {
    super(from, to, 'comment', options);
    this.comment = comment;
  }

  *[Symbol.iterator]() {
    yield this;
  }

  toString() {
    return `${this.comment}`;
  }
}

export class Blank extends ASTNode {
  constructor(from, to, value, dataType='blank', options={}) {
    super(from, to, 'blank', options);
    this.value = value;
    this.dataType = dataType;
  }

  *[Symbol.iterator]() {
    yield this;
  }

  toString() {
    return `${this.value}`;
  }
}
