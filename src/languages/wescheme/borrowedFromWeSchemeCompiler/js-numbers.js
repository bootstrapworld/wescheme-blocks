// Scheme numbers.


var __PLTNUMBERS_TOP__;
if (typeof(exports) !== 'undefined') {
    __PLTNUMBERS_TOP__ = exports;
} else {
    if (! this['jsnums']) {
 	this['jsnums'] = {};
    }
    __PLTNUMBERS_TOP__  = this['jsnums'];
}

// The numeric tower has the following levels:
//     integers
//     rationals
//     floats
//     complex numbers
//
// with the representations:
//     integers: fixnum or BigInteger [level=0]
//     rationals: Rational [level=1]
//     floats: FloatPoint [level=2]
//     complex numbers: Complex [level=3]

// We try to stick with the unboxed fixnum representation for
// integers, since that's what scheme programs commonly deal with, and
// we want that common type to be lightweight.


// A boxed-scheme-number is either BigInteger, Rational, FloatPoint, or Complex.
// An integer-scheme-number is either fixnum or BigInteger.


(function() {
    'use strict';
    // Abbreviation
    var Numbers = __PLTNUMBERS_TOP__;
    


    // isOverflow: javascript-number -> boolean
    // Returns true if we consider the number an overflow.
    var MIN_FIXNUM = -(9e15);
    var MAX_FIXNUM = (9e15);
    var isOverflow = function(n) {
	return (n < MIN_FIXNUM ||  MAX_FIXNUM < n);
    };

    
    // fromFixnum: fixnum -> scheme-number
    var fromFixnum = function(x) {
	if (isNaN(x) || (! isFinite(x))) {
	    return FloatPoint.makeInstance(x);
	}
	var nf = Math.floor(x);
	if (nf === x) {
            if (isOverflow(nf)) {
		return makeBignum(expandExponent(x+''));
            } else {
		return nf;
	    }
	} else {
            return FloatPoint.makeInstance(x);
	}
    };

    var expandExponent = function(s) {
	var match = s.match(scientificPattern(digitsForRadix(10), expMarkForRadix(10))), mantissaChunks, exponent;
	if (match) {
	    mantissaChunks = match[1].match(/^([^.]*)(.*)$/);
	    exponent = Number(match[2]);

	    if (mantissaChunks[2].length === 0) {
		return mantissaChunks[1] + zfill(exponent);
	    }

	    if (exponent >= mantissaChunks[2].length - 1) {
		return (mantissaChunks[1] + 
			mantissaChunks[2].substring(1) + 
			zfill(exponent - (mantissaChunks[2].length - 1)));
	    } else {
		return (mantissaChunks[1] +
			mantissaChunks[2].substring(1, 1+exponent));
	    }
	} else {
	    return s;
	}
    };

    // zfill: integer -> string
    // builds a string of "0"'s of length n.
    var zfill = function(n) {
	var buffer = [];
	buffer.length = n;
	for (var i = 0; i < n; i++) {
	    buffer[i] = '0';
	}
	return buffer.join('');
    };

    //////////////////////////////////////////////////////////////////////
    // Rationals


    var Rational = function(n, d) {
	this.n = n;
	this.d = d;
    };


    Rational.prototype.toString = function() {
	if (_integerIsOne(this.d)) {
	    return this.n.toString() + "";
	} else {
	    return this.n.toString() + "/" + this.d.toString();
	}
    };


    Rational.prototype.level = 1;


    Rational.makeInstance = function(n, d) {
	if (n === undefined)
	    throwRuntimeError("n undefined", n, d);

	if (d === undefined) { d = 1; }

	if (_integerIsZero(d)) {
	    throwRuntimeError("division by zero: "+n+"/"+d);
	}

  if (_integerLessThan(d, 0)) {
	    n = negate(n);
	    d = negate(d);
	}

	var divisor = _integerGcd(abs(n), abs(d));
	n = _integerQuotient(n, divisor);
	d = _integerQuotient(d, divisor);

	// Optimization: if we can get around construction the rational
	// in favor of just returning n, do it:
	if (_integerIsOne(d) || _integerIsZero(n)) {
	    return n;
	}

	return new Rational(n, d);
    };



    // Floating Point numbers
    var FloatPoint = function(n) {
	this.n = n;
    };
    FloatPoint = FloatPoint;


    var NaN = new FloatPoint(Number.NaN);
    var inf = new FloatPoint(Number.POSITIVE_INFINITY);
    var neginf = new FloatPoint(Number.NEGATIVE_INFINITY);

    // Negative zero is a distinguished value representing -0.0.
    // There should only be one instance for -0.0.
    var NEGATIVE_ZERO = new FloatPoint(-0.0);
    var INEXACT_ZERO = new FloatPoint(0.0);


    FloatPoint.makeInstance = function(n) {
	if (isNaN(n)) {
	    return FloatPoint.nan;
	} else if (n === Number.POSITIVE_INFINITY) {
	    return FloatPoint.inf;
	} else if (n === Number.NEGATIVE_INFINITY) {
	    return FloatPoint.neginf;
	} else if (n === 0) {
	    if ((1/n) === -Infinity) {
		return NEGATIVE_ZERO;
	    } else {
		return INEXACT_ZERO;
	    }
	}
	return new FloatPoint(n);
    };

    FloatPoint.prototype.level = 2;


    FloatPoint.prototype.toString = function() {
	if (isNaN(this.n))
	    return "+nan.0";
	if (this.n === Number.POSITIVE_INFINITY)
	    return "+inf.0";
	if (this.n === Number.NEGATIVE_INFINITY)
	    return "-inf.0";
	if (this === NEGATIVE_ZERO)
	    return "-0.0";
	var partialResult = this.n.toString();
	if (! partialResult.match('\\.')) {
	    return partialResult + ".0";
	} else {
	    return partialResult;
	}
    };

    //////////////////////////////////////////////////////////////////////
    // Complex numbers
    //////////////////////////////////////////////////////////////////////

    var Complex = function(r, i){
	this.r = r;
	this.i = i;
    };

    // Constructs a complex number from two basic number r and i.  r and i can
    // either be plt.type.Rational or plt.type.FloatPoint.
    Complex.makeInstance = function(r, i){
	if (i === undefined) { i = 0; }
	if (isExact(i) && isInteger(i) && _integerIsZero(i)) {
	    return r;
	}
	if (isInexact(r) || isInexact(i)) {
	    r = toInexact(r);
	    i = toInexact(i);
	}
	return new Complex(r, i);
    };

    Complex.prototype.toString = function() {
	var realPart = this.r.toString(), imagPart = this.i.toString();
	if (imagPart[0] === '-' || imagPart[0] === '+') {
	    return realPart + imagPart + 'i';
	} else {
	    return realPart + "+" + imagPart + 'i';
	}
    };


    var hashModifiersRegexp = new RegExp("^(#[ei]#[bodx]|#[bodx]#[ei]|#[bodxei])(.*)$")
    function rationalRegexp(digits) { return new RegExp("^([+-]?["+digits+"]+)/(["+digits+"]+)$"); }
    function matchComplexRegexp(radix, x) {
	var sign = "[+-]";
	var maybeSign = "[+-]?";
	var digits = digitsForRadix(radix)
	var expmark = "["+expMarkForRadix(radix)+"]"
	var digitSequence = "["+digits+"]+"

	var unsignedRational = digitSequence+"/"+digitSequence
	var rational = maybeSign + unsignedRational

	var noDecimal = digitSequence
	var decimalNumOnRight = "["+digits+"]*\\.["+digits+"]+"
	var decimalNumOnLeft = "["+digits+"]+\\.["+digits+"]*"

	var unsignedDecimal = "(?:" + noDecimal + "|" + decimalNumOnRight + "|" + decimalNumOnLeft + ")"

	var special = "(?:inf\.0|nan\.0|inf\.f|nan\.f)"

	var unsignedRealNoExp = "(?:" + unsignedDecimal + "|" + unsignedRational + ")"
	var unsignedReal = unsignedRealNoExp + "(?:" + expmark + maybeSign + digitSequence + ")?"
	var unsignedRealOrSpecial = "(?:" + unsignedReal + "|" + special + ")"
	var real = "(?:" + maybeSign + unsignedReal + "|" + sign + special + ")"

	var alt1 = new RegExp("^(" + rational + ")"
                             + "(" + sign + unsignedRational + "?)"
                             + "i$");
	var alt2 = new RegExp("^(" + real + ")?"
                             + "(" + sign + unsignedRealOrSpecial + "?)"
                             + "i$");
	var alt3 = new RegExp("^(" + real + ")@(" + real + ")$");

	var match1 = x.match(alt1)
	var match2 = x.match(alt2)
	var match3 = x.match(alt3)

	return match1 ? match1 :
	       match2 ? match2 :
	       match3 ? match3 :
	     /* else */ false
    }

    function digitRegexp(digits) { return new RegExp("^[+-]?["+digits+"]+$"); }
    /**
    /* NB: !!!! flonum regexp only matches "X.", ".X", or "X.X", NOT "X", this
    /* must be separately checked with digitRegexp.
    /* I know this seems dumb, but the alternative would be that this regexp
    /* returns six matches, which also seems dumb.
    /***/
    function flonumRegexp(digits) {
	var decimalNumOnRight = "(["+digits+"]*)\\.(["+digits+"]+)"
	var decimalNumOnLeft = "(["+digits+"]+)\\.(["+digits+"]*)"
	return new RegExp("^(?:([+-]?)(" +
                          decimalNumOnRight+"|"+decimalNumOnLeft +
                          "))$");
    }
    function scientificPattern(digits, exp_mark) {
	var noDecimal = "["+digits+"]+"
	var decimalNumOnRight = "["+digits+"]*\\.["+digits+"]+"
	var decimalNumOnLeft = "["+digits+"]+\\.["+digits+"]*"
	return new RegExp("^(?:([+-]?" +
			  "(?:"+noDecimal+"|"+decimalNumOnRight+"|"+decimalNumOnLeft+")" +
			  ")["+exp_mark+"]([+-]?["+digits+"]+))$");
    }

    function digitsForRadix(radix) {
	return radix === 2  ? "01" :
	       radix === 8  ? "0-7" :
	       radix === 10 ? "0-9" :
	       radix === 16 ? "0-9a-fA-F" :
	       throwRuntimeError("digitsForRadix: invalid radix", this, radix)
    }

    function expMarkForRadix(radix) {
	return (radix === 2 || radix === 8 || radix === 10) ? "defsl" :
	       (radix === 16)                               ? "sl" :
	       throwRuntimeError("expMarkForRadix: invalid radix", this, radix)
    }

    function Exactness(i) {
      this.defaultp = function () { return i == 0; }
      this.exactp = function () { return i == 1; }
      this.inexactp = function () { return i == 2; }
    }

    Exactness.def = new Exactness(0);
    Exactness.on = new Exactness(1);
    Exactness.off = new Exactness(2);

    Exactness.prototype.intAsExactp = function () { return this.defaultp() || this.exactp(); };
    Exactness.prototype.floatAsInexactp = function () { return this.defaultp() || this.inexactp(); };


    // fromString: string boolean -> (scheme-number | false)
    var fromString = function(x, exactness) {
	var radix = 10
	var exactness = typeof exactness === 'undefined' ? Exactness.def :
			exactness === true               ? Exactness.on :
			exactness === false              ? Exactness.off :
	   /* else */  throwRuntimeError( "exactness must be true or false"
                                        , this
                                        , r) ;

	var hMatch = x.toLowerCase().match(hashModifiersRegexp)
	if (hMatch) {
	    var modifierString = hMatch[1].toLowerCase();

	    var exactFlag = modifierString.match(new RegExp("(#[ei])"))
	    var radixFlag = modifierString.match(new RegExp("(#[bodx])"))

	    if (exactFlag) {
		var f = exactFlag[1].charAt(1)
		exactness = f === 'e' ? Exactness.on :
			    f === 'i' ? Exactness.off :
			 // this case is unreachable
			 throwRuntimeError("invalid exactness flag", this, r)
	    }
	    if (radixFlag) {
		var f = radixFlag[1].charAt(1)
		radix = f === 'b' ? 2 :
            f === 'o' ? 8 :
            f === 'd' ? 10 :
            f === 'x' ? 16 :
			 // this case is unreachable
			throwRuntimeError("invalid radix flag", this, r)
	    }
	}

	var numberString = hMatch ? hMatch[2] : x
	// if the string begins with a hash modifier, then it must parse as a
	// number, an invalid parse is an error, not false. False is returned
	// when the item could potentially have been read as a symbol.
	var mustBeANumberp = hMatch ? true : false

	return fromStringRaw(numberString, radix, exactness, mustBeANumberp)
    };

    function fromStringRaw(x, radix, exactness, mustBeANumberp) {
	var cMatch = matchComplexRegexp(radix, x);
	if (cMatch) {
	  return Complex.makeInstance( fromStringRawNoComplex( cMatch[1] || "0"
							     , radix
							     , exactness
							     )
				     , fromStringRawNoComplex( cMatch[2] === "+" ? "1"  :
							       cMatch[2] === "-" ? "-1" :
							       cMatch[2]
							     , radix
							     , exactness
							     ));
	}

        return fromStringRawNoComplex(x, radix, exactness, mustBeANumberp)
    }

    function fromStringRawNoComplex(x, radix, exactness, mustBeANumberp) {
	var aMatch = x.match(rationalRegexp(digitsForRadix(radix)));
	if (aMatch) {
	    return Rational.makeInstance( fromStringRawNoComplex( aMatch[1]
                                                                , radix
                                                                , exactness
                                                                )
                                        , fromStringRawNoComplex( aMatch[2]
                                                                , radix
                                                                , exactness
                                                                ));
	}

	// Floating point tests
	if (x === '+nan.0' || x === '-nan.0')
	    return FloatPoint.nan;
	if (x === '+inf.0')
	    return FloatPoint.inf;
	if (x === '-inf.0')
	    return FloatPoint.neginf;
	if (x === "-0.0") {
	    return NEGATIVE_ZERO;
	}

	var fMatch = x.match(flonumRegexp(digitsForRadix(radix)))
	if (fMatch) {
	    var integralPart = fMatch[3] !== undefined ? fMatch[3] : fMatch[5];
	    var fractionalPart = fMatch[4] !== undefined ? fMatch[4] : fMatch[6];
	    return parseFloat( fMatch[1]
                             , integralPart
                             , fractionalPart
                             , radix
                             , exactness
                             )
	}

	var sMatch = x.match(scientificPattern( digitsForRadix(radix)
					      , expMarkForRadix(radix)
					      ))
	if (sMatch) {
	    var coefficient = fromStringRawNoComplex(sMatch[1], radix, exactness)
	    var exponent = fromStringRawNoComplex(sMatch[2], radix, exactness)
	    return multiply(coefficient, expt(radix, exponent));
	}

	// Finally, integer tests.
	if (x.match(digitRegexp(digitsForRadix(radix)))) {
	    var n = parseInt(x, radix);
	    if (isOverflow(n)) {
		return makeBignum(x);
	    } else if (exactness.intAsExactp()) {
		return n;
	    } else {
		return FloatPoint.makeInstance(n)
	    }
	} else if (mustBeANumberp) {
	    if(x.length===0) throwRuntimeError("no digits");
	    throwRuntimeError("bad number: " + x, this);
	} else {
	    return false;
	}
    };

    function parseFloat(sign, integralPart, fractionalPart, radix, exactness) {
	var sign = (sign == "-" ? -1 : 1);
	var integralPartValue = integralPart === ""  ? 0  :
				exactness.intAsExactp() ? parseExactInt(integralPart, radix) :
							  parseInt(integralPart, radix)

	var fractionalNumerator = fractionalPart === "" ? 0 :
				  exactness.intAsExactp() ? parseExactInt(fractionalPart, radix) :
							    parseInt(fractionalPart, radix)
	/* unfortunately, for these next two calculations, `expt` and `divide` */
	/* will promote to Bignum and Rational, respectively, but we only want */
	/* these if we're parsing in exact mode */
	var fractionalDenominator = exactness.intAsExactp() ? expt(radix, fractionalPart.length) :
							      Math.pow(radix, fractionalPart.length)
	var fractionalPartValue = fractionalPart === "" ? 0 :
				  exactness.intAsExactp() ? divide(fractionalNumerator, fractionalDenominator) :
							    fractionalNumerator / fractionalDenominator

	var forceInexact = function(o) {
	    return typeof o === "number" ? FloatPoint.makeInstance(o) :
					   o.toInexact();
	}

	return exactness.floatAsInexactp() ? forceInexact(multiply(sign, add( integralPartValue, fractionalPartValue))) :
					     multiply(sign, add(integralPartValue, fractionalPartValue));
    }

    function parseExactInt(str, radix) {
	return fromStringRawNoComplex(str, radix, Exactness.on, true);
    }

    //////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////

    // The code below comes from Tom Wu's BigInteger implementation:

    // Copyright (c) 2005  Tom Wu
    // All Rights Reserved.
    // See "LICENSE" for details.

    // (public) Constructor
    function BigInteger(a,b,c) {
	if(a != null)
	    if("number" == typeof a) this.fromNumber(a,b,c);
	else if(b == null && "string" != typeof a) this.fromString(a,256);
	else this.fromString(a,b);
    }

   

    // makeBignum: string -> BigInteger
    var makeBignum = function(s) {
	if (typeof(s) === 'number') { s = s + ''; }
	s = expandExponent(s);
	return new BigInteger(s, 10);
    };

    BigInteger.prototype.level = 0;

    // External interface of js-numbers:
    Numbers['fromString'] = fromString;
})();
