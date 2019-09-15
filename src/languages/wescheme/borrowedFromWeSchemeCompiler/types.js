//////////////////////////////////////////////////////////////////////
// helper functions

var jsnums = require('./js-numbers');
var types = {};


(function () {

//////////////////////////////////////////////////////////////////////


var appendChild = function(parent, child) {
    parent.appendChild(child);
};

var hasOwnProperty = {}.hasOwnProperty;

//////////////////////////////////////////////////////////////////////

// We are reusing the built-in Javascript boolean class here.
var Logic = {
    TRUE : true,
    FALSE : false
};

// WARNING
// WARNING: we are extending the built-in Javascript boolean class here!
// WARNING
Boolean.prototype.toWrittenString = function(cache) {
    if (this.valueOf()) { return "true"; }
    return "false";
};
Boolean.prototype.toString = function() { return this.valueOf() ? "true" : "false"; };


// Chars
// Char: string -> Char
var Char = function(val){
    this.val = val;
};

Char.makeInstance = function(val){
    return new Char(val);
};

Char.prototype.toString = function() {
	var code = this.val.charCodeAt(0);
	var returnVal;
	switch (code) {
		case 0: returnVal = '#\\nul'; break;
		case 8: returnVal = '#\\backspace'; break;
		case 9: returnVal = '#\\tab'; break;
		case 10: returnVal = '#\\newline'; break;
		case 11: returnVal = '#\\vtab'; break;
		case 12: returnVal = '#\\page'; break;
		case 13: returnVal = '#\\return'; break;
		case 20: returnVal = '#\\space'; break;
		case 127: returnVal = '#\\rubout'; break;
		default: if (code >= 32 && code <= 126) {
				 returnVal = ("#\\" + this.val);
			 }
			 else {
				 var numStr = code.toString(16).toUpperCase();
				 while (numStr.length < 4) {
					 numStr = '0' + numStr;
				 }
				 returnVal = ('#\\u' + numStr);
			 }
			 break;
	}
	return returnVal;
};

Char.prototype.toWrittenString = Char.prototype.toString;

//////////////////////////////////////////////////////////////////////
var Vector = function(n, initialElements) {
    this.elts = new Array(n);
    if (initialElements) {
	for (var i = 0; i < n; i++) {
	    this.elts[i] = initialElements[i];
	}
    } else {
	for (var i = 0; i < n; i++) {
	    this.elts[i] = undefined;
	}
    }
    this.mutable = true;
};
Vector.makeInstance = function(n, elts) {
    return new Vector(n, elts);
}
    Vector.prototype.length = function() {
	return this.elts.length;
    };

//////////////////////////////////////////////////////////////////////
// Now using mutable strings
var Str = function(chars) {
	this.chars = chars;
	this.length = chars.length;
	this.mutable = true;
}

Str.makeInstance = function(chars) {
	return new Str(chars);
}

Str.fromString = function(s) {
	return Str.makeInstance(s.split(""));
}

Str.prototype.toString = function() {
	return this.chars.join("");
}

Str.prototype.toWrittenString = function(cache) {
    return escapeString(this.toString());
}

//var _quoteReplacingRegexp = new RegExp("[\"\\\\]", "g");
var escapeString = function(s) {
    return '"' + replaceUnprintableStringChars(s) + '"';
//    return '"' + s.replace(_quoteReplacingRegexp,
//			      function(match, submatch, index) {
//				  return "\\" + match;
//			      }) + '"';
};

var replaceUnprintableStringChars = function(s) {
	var ret = [];
	for (var i = 0; i < s.length; i++) {
		var val = s.charCodeAt(i);
		switch(val) {
			case 7: ret.push('\\a'); break;
			case 8: ret.push('\\b'); break;
			case 9: ret.push('\\t'); break;
			case 10: ret.push('\\n'); break;
			case 11: ret.push('\\v'); break;
			case 12: ret.push('\\f'); break;
			case 13: ret.push('\\r'); break;
			case 34: ret.push('\\"'); break;
			case 92: ret.push('\\\\'); break;
			default: if (val >= 32 && val <= 126) {
					 ret.push( s.charAt(i) );
				 }
				 else {
					 var numStr = val.toString(16).toUpperCase();
					 while (numStr.length < 4) {
						 numStr = '0' + numStr;
					 }
					 ret.push('\\u' + numStr);
				 }
				 break;
		}
	}
	return ret.join('');
};

//////////////////////////////////////////////////////////////////////

var toWrittenString = function(x, cache) {

    if (x == undefined || x == null) {
	return "#<undefined>";
    }
    if (typeof(x) == 'string') {
	return escapeString(x.toString());
    }
    if (typeof(x) != 'object' && typeof(x) != 'function') {
	return x.toString();
    }

    var returnVal;
    if (typeof(x.toWrittenString) !== 'undefined') {
	returnVal = x.toWrittenString(cache);
    } else {
	returnVal = x.toString();
    }
    return returnVal;
};

var isString = function(s) {
	return (typeof s === 'string' || s instanceof Str);
}



/////////////////////////////////////////////////////////////////////
// Colored Error Message Support

var Message = function(args) {
  this.args = args;
};

Message.prototype.toString = function() {
  var toReturn = [];
  var i;
  for(i = 0; i < this.args.length; i++) {
      toReturn.push(''+this.args[i]);
  }

  return toReturn.join("");
};

var isMessage = function(o) {
  return o instanceof Message;
};

var ColoredPart = function(text, location) {
  this.text = text;
  this.location = location;
};

var isColoredPart = function(o) {
  return o instanceof ColoredPart;
};

ColoredPart.prototype.toString = function() {
    return this.text+'';
};


//////////////////////////////////////////////////////////////////////


var makeVector = function(args) {
    return Vector.makeInstance(args.length, args);
};

var makeString = function(s) {
	if (s instanceof Str) {
		return s;
	}
	else if (s instanceof Array) {
		return Str.makeInstance(s);
	}
	else if (typeof s === 'string') {
		return Str.fromString(s);
	}
	else {
		throw types.internalError('makeString expects and array of 1-character strings or a string;' +
					  ' given ' + s.toString(),
					  false);
	}
};


types.symbol = Symbol.makeInstance;
types.rational = jsnums.makeRational;
types['float'] = jsnums.makeFloat;
types.complex = jsnums.makeComplex;
types.bignum = jsnums.makeBignum;
types.vector = makeVector;
types['char'] = Char.makeInstance;
types['string'] = makeString;
types.toWrittenString = toWrittenString;

types.FALSE = Logic.FALSE;
types.TRUE = Logic.TRUE;

types.isSymbol = function(x) { return x instanceof Symbol; };
types.isChar = function(x) { return x instanceof Char; };
types.isString = isString;
types.isVector = function(x) { return x instanceof Vector; };

types.ColoredPart = ColoredPart;
types.Message = Message;
types.isColoredPart = isColoredPart;
types.isMessage = isMessage;
types.Vector = Vector;
types.Char = Char;

})();

module.exports = types;
