/*global */

var types = require('./types');
var Vector = types.Vector;

//////////////////////////////////////////////////////////////////////////////
/////////////////// COMMON FUNCTIONS AND STRUCTURES //////////////////////////
//////////////// used by multiple phases of the compiler/////////////////////
// encode the msg and location as a JSON error
export function throwError(msg, loc, errorClass) {
  loc.source = loc.source || "<unknown>"; // FIXME -- we should have the source populated
  // rewrite a ColoredPart to match the format expected by the runtime
  function rewritePart(part){
    if(typeof(part) === 'string'){
      return part;
    } else if(part instanceof symbolExpr){
      return '["span", [["class", "SchemeValue-Symbol"]], '+part.val+']';
    } else if(part.location !== undefined){
      return {text: part.text, type: 'ColoredPart', loc: part.location.toString()
        , toString: function(){return part.text;}};
    } else if(part.locations !== undefined){
      return {text: part.text, type: 'MultiPart', solid: part.solid
        , locs: part.locations.map(function(l){return l.toString()})
        , toString: function(){return part.text;}};
    }
  }

  msg.args = msg.args.map(rewritePart);

  var json = {type: "moby-failure"
    , "dom-message": ["span"
      ,[["class", "Error"]]
      ,["span"
        , [["class", (errorClass || "Message")]]].concat(
          (errorClass? [["span"
            , [["class", "Error.reason"]]
            , msg.toString()]
            , ["span", [["class", ((errorClass || "message")
              +((errorClass === "Error-GenericReadError")?
                ".locations"
                :".otherLocations"))]]]]
            : msg.args.map(function(x){return x.toString();})))
      ,["br", [], ""]
      ,["span"
        , [["class", "Error.location"]]
        , ["span"
          , [["class", "location-reference"]
            , ["style", "display:none"]]
          , ["span", [["class", "location-offset"]], (loc.startChar+1).toString()]
          , ["span", [["class", "location-line"]]  , loc.startRow.toString()]
          , ["span", [["class", "location-column"]], loc.startCol.toString()]
          , ["span", [["class", "location-span"]]  , loc.span.toString()]
          , ["span", [["class", "location-id"]]    , loc.source.toString()]
        ]
      ]
    ]
    , "structured-error": JSON.stringify({message: (errorClass? false : msg.args), location: loc.toString() })
  };
  throw JSON.stringify(json);
}
/**************************************************************************
 *
 *    CONVERT LOCAL COMPILER ERRORS INTO WESCHEME ERRORS
 *
 **************************************************************************/

// couple = pair
export function couple(first, second) {
  this.first = first;
  this.second = second;
  this.toString = function(){
    return "("+this.first.toString() +" "+this.second.toString()+")";
  };
}

/**************************************************************************
 *
 *    AST Nodes
 *
 **************************************************************************/

// all Programs, by default, print out their values
// anything that behaves differently must provide their own toString() function
export class Program {
  // every Program has a location, but it's initialized to null
  constructor(){
    this.location = null;
  }
  // -> String
  toString() { return this.val.toString(); }
}

// Comment
export class comment extends Program {
  constructor(txt) { super(); this.txt = txt; }
  toString() { return ";"+this.txt; }
}

// Function definition
export class defFunc extends Program {
  constructor(name, args, body, stx) {
    super();
    this.name = name;
    this.args = args;
    this.body = body;
    this.stx  = stx;
  }
  toString() {
    return "(define ("+this.name.toString()+" "+this.args.join(" ")+")\n    "+this.body.toString()+")";
  }
}

// Variable definition
export class defVar extends Program {
  constructor(name, expr, stx) {
    super();
    this.name = name;
    this.expr = expr;
    this.stx  = stx;
  }
  toString() {
    return "(define "+this.name.toString()+" "+this.expr.toString()+")";
  }
}

// Multi-Variable definition
export class defVars extends Program {
  constructor(names, expr, stx) {
    super();
    this.names  = names;
    this.expr   = expr;
    this.stx    = stx;
  }
  toString() {
    return "(define-values ("+this.names.join(" ")+") "+this.expr.toString()+")";
  }
}

// Structure definition
export class defStruct extends Program {
  constructor(name, fields, stx) {
    super();
    this.name   = name;
    this.fields = fields;
    this.stx    = stx;
  }
  toString() {
    return "(define-struct "+this.name.toString()+" ("+this.fields.join(" ")+"))";
  }
}

// Begin expression
export class beginExpr extends Program {
  constructor(exprs, stx) {
    super();
    this.exprs  = exprs;
    this.stx    = stx;
  }
  toString() {
    return "(begin "+this.exprs.join(" ")+")";
  }
}

// Lambda expression
export class lambdaExpr extends Program {
  constructor(args, body, stx) {
    super();
    this.args = args;
    this.body = body;
    this.stx  = stx;
  }
  toString() {
    return "(lambda ("+this.args.join(" ")+") "+this.body.toString()+")";
  }
}

// Local expression
export class localExpr extends Program {
  constructor(defs, body, stx) {
    super();
    this.defs = defs;
    this.body = body;
    this.stx  = stx;
  }
  toString() {
    return "(local ("+this.defs.join(" ")+") "+this.body.toString()+")";
  }
}

// Letrec expression
export class letrecExpr extends Program {
  constructor(bindings, body, stx) {
    super();
    this.bindings = bindings;
    this.body     = body;
    this.stx      = stx;
  }
  toString() {
    return "(letrec ("+this.bindings.join(" ")+") ("+this.body.toString()+"))";
  }
}

// Let expression
export class letExpr extends Program {
  constructor(bindings, body, stx) {
    super();
    this.bindings = bindings;
    this.body     = body;
    this.stx      = stx;
  }
  toString() {
    return "(let ("+this.bindings.join(" ")+") ("+this.body.toString()+"))";
  }
}

// Let* expressions
export class letStarExpr extends Program {
  constructor(bindings, body, stx) {
    super();
    this.bindings = bindings;
    this.body     = body;
    this.stx      = stx;
  }
  toString() {
    return "(let* ("+this.bindings.join(" ")+") ("+this.body.toString()+"))";
  }
}

// cond expression
export class condExpr extends Program {
  constructor(clauses, stx){
    super();
    this.clauses  = clauses;
    this.stx      = stx;
  }
  toString() {
    return "(cond\n    "+this.clauses.join("\n    ")+")";
  }
}

// Case expression
export class caseExpr extends Program {
  constructor(expr, clauses, stx) {
    super();
    this.expr     = expr;
    this.clauses  = clauses;
    this.stx      = stx;
  }
  toString() {
    return "(case "+this.expr.toString()+"\n    "+this.clauses.join("\n    ")+")";
  }
}

// and expression
export class andExpr extends Program {
  constructor(exprs, stx) {
    super();
    this.exprs  = exprs;
    this.stx    = stx;
  }
  toString() { return "(and "+this.exprs.join(" ")+")"; }
}

// or expression
export class orExpr extends Program {
  constructor(exprs, stx) {
    super();
    this.exprs  = exprs;
    this.stx    = stx;
  }
  toString() { return "(or "+this.exprs.join(" ")+")"; }
}

// application expression
export class callExpr extends Program {
  constructor(func, args, stx) {
    super();
    this.func   = func;
    this.args   = args;
    this.stx    = stx;
  }
  toString() {
    return "("+[this.func].concat(this.args).join(" ")+")";
  }
}

// if expression
export class ifExpr extends Program {
  constructor(predicate, consequence, alternative, stx) {
    super();
    this.predicate = predicate;
    this.consequence = consequence;
    this.alternative = alternative;
    this.stx = stx;
  }
  toString() {
    return "(if "+this.predicate.toString()+" "+this.consequence.toString()+" "+this.alternative.toString()+")";
  }
}

// when/unless expression
export class whenUnlessExpr extends Program {
  constructor(predicate, exprs, stx){
    super();
    this.predicate = predicate;
    this.exprs = exprs;
    this.stx = stx;
  }
  toString() {
    return "("+this.stx[0]+" "+this.predicate.toString()+" "+this.exprs.join(" ")+")";
  }
}

// symbol expression (ID)
export class symbolExpr extends Program {
  constructor(val, stx) {
    super();
    this.val = val;
    this.stx = stx;
  }
}

// Literal values (String, Char, Number, Vector)
export class literal extends Program {
  constructor(val) {
    super();
    this.val = val;
  }
  toString() {
    // racket prints booleans using #t and #f
    if(this.val===true) return "#t";
    if(this.val===false) return "#f";
    // racket prints special chars using their names
    if(this.val instanceof types.Char){
      var c = this.val.val;
      return c === '\b' ? '#\\backspace' :
      c === '\t' ? '#\\tab' :
      c === '\n' ? '#\\newline' :
      c === ' '  ? '#\\space' :
      c === '\v' ? '#\\vtab' :
      /* else */  this.val.toWrittenString();
    }
    return types.toWrittenString(this.val);
  }
}

Vector.prototype.toString = Vector.prototype.toWrittenString = function(){
  var filtered = this.elts.filter(function(e){return e!==undefined;}),
    last = filtered[filtered.length-1];
  return "#("+this.elts.map(function(elt){return elt===undefined? last : elt;}).join(" ")+")";
}

// quoted expression
export class quotedExpr extends Program {
  constructor(val){
    super();
    this.val = val;
  }
  toString() {
    function quoteLikePairP(v) {
      return v instanceof Array
      && v.length === 2
      && v[0] instanceof symbolExpr
      && ( v[0].val === 'quasiquote'
        || v[0].val === 'quote'
        || v[0].val === 'unquote'
        || v[0].val === 'unquote-splicing'
      ) }
    function shortName(lexeme) {
      var s = lexeme.val
      return s === 'quasiquote' ? "`" :
      s === 'quote' ? "'" :
      s === 'unquote' ? "," :
      s === 'unquote-splicing' ? ",@" :
      (function () { throw "impossible quote-like string" })()
    }
    function elementToString(v) {
      if (quoteLikePairP(v)) {
        return shortName(v[0]).concat(elementToString(v[1]))
      } else if (v instanceof Array) {
        return v.reduce(function (acc, x) { return acc.concat(elementToString(x)) }, "(").concat(")")
      } else {
        return v.toString()
      }
    }
    return "'"+elementToString(this.val)
  }
}

// unquoted expression
export class unquotedExpr extends Program {
  constructor(val) {
    super();
    this.val = val;
  }
  toString() { return ","+this.val.toString(); }
}

// quasiquoted expression
export class quasiquotedExpr extends Program {
  constructor(val) {
    super();
    this.val = val;
  }
  toString() {
    if(this.val instanceof Array) return "`("+this.val.toString()+")";
    else return "`"+this.val.toString();
  }
}

// unquote-splicing
export class unquoteSplice extends Program {
  constructor(val) {
    super();
    this.val = val;
  }
  toString() { return ",@"+this.val.toString();}
}

// require expression
export class requireExpr extends Program {
  constructor(spec, stx) {
    super();
    this.spec = spec;
    this.stx  = stx;
  }
  toString() { return "(require "+this.spec.toString()+")"; }
}

// provide expression
export class provideStatement extends Program {
  constructor(clauses, stx) {
    super();
    this.clauses  = clauses;
    this.stx      = stx;
  }
  toString() { return "(provide "+this.clauses.join(" ")+")" }
}

// Unsupported structure (allows us to generate parser errors ahead of "unsupported" errors)
export class unsupportedExpr extends Program {
  constructor(val, errorMsg, errorSpan) {
    super();
    this.val = val;
    this.errorMsg = errorMsg;
    this.errorSpan = errorSpan; // when throwing an error, we use a different span from the actual sexp span
  }
  toString() { return this.val.toString() }
}

export var keywords = ["cond", "else", "let", "case", "let*", "letrec", "quote",
  "quasiquote", "unquote","unquote-splicing","local","begin",
  "if","or","and","when","unless","lambda","λ","define",
  "define-struct", "define-values"];
