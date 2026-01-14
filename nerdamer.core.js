/*
 * Author : Martin Donk
 * Website : http://www.nerdamer.com
 * Email : martin.r.donk@gmail.com
 * Source : https://github.com/jiggzson/nerdamer
 */

// Type imports for JSDoc ======================================================
// These typedefs provide type aliases for the interfaces defined in index.d.ts.
// They enable proper type checking when working with the classes defined in this file.
//
// Usage patterns:
// - For return types: @returns {NerdamerSymbolType}
// - For parameters: @param {NerdamerSymbolType} symbol
// - For variable declarations: /** @type {NerdamerSymbolType} */
//
// Note: When casting local class instances to interface types, use the pattern:
//   /** @type {InterfaceType} */ (/** @type {unknown} */ (localInstance))
// This is needed because TypeScript sees local classes and interfaces as separate types.

/**
 * Core type aliases from index.d.ts
 *
 * @typedef {import('./index').NerdamerCore.NerdamerSymbol} NerdamerSymbolType
 *
 * @typedef {import('./index').NerdamerCore.Frac} FracType
 *
 * @typedef {import('./index').NerdamerCore.Vector} VectorType
 *
 * @typedef {import('./index').NerdamerCore.Matrix} MatrixType
 *
 * @typedef {import('./index').NerdamerCore.Parser} ParserType
 *
 * @typedef {import('./index').NerdamerCore.Collection} CollectionType
 *
 * @typedef {import('./index').NerdamerCore.NerdamerSet} SetType
 *
 * @typedef {import('./index').NerdamerCore.Settings} SettingsType
 *
 * @typedef {import('./index').NerdamerExpression} ExpressionType
 *
 * @typedef {import('./index').NerdamerCore.Token} TokenType
 *
 * @typedef {import('./index').NerdamerCore.ScopeArray} ScopeArrayType
 *
 *   Output and parameter types
 *
 * @typedef {import('./index').OutputType} OutputType
 *
 * @typedef {import('./index').ExpressionParam} ExpressionParam
 *
 *   Constructor types (for factory functions)
 *
 * @typedef {import('./index').NerdamerCore.FracConstructor} FracConstructor
 *
 * @typedef {import('./index').NerdamerCore.SymbolConstructor} SymbolConstructor
 *
 * @typedef {import('./index').NerdamerCore.VectorConstructor} VectorConstructor
 *
 * @typedef {import('./index').NerdamerCore.MatrixConstructor} MatrixConstructor
 *
 *   Exception types
 *
 * @typedef {import('./index').NerdamerCore.DivisionByZero} DivisionByZeroType
 *
 * @typedef {import('./index').NerdamerCore.ParseError} ParseErrorType
 *
 * @typedef {import('./index').NerdamerCore.NerdamerTypeError} NerdamerTypeErrorType
 */

// externals ====================================================================
/* BigInteger.js v1.6.28 https://github.com/peterolson/BigInteger.js/blob/master/LICENSE */
const nerdamerBigInt =
    typeof globalThis.nerdamerBigInt === 'undefined' ? require('big-integer') : globalThis.nerdamerBigInt;
/* Decimal.js v10.2.1 https://github.com/MikeMcl/decimal.js/LICENCE */
const nerdamerBigDecimal =
    typeof globalThis.nerdamerBigDecimal === 'undefined' ? require('decimal.js') : globalThis.nerdamerBigDecimal;
/* Mathematical constants */
const nerdamerConstants =
    typeof globalThis.nerdamerConstants === 'undefined' ? require('./constants.js') : globalThis.nerdamerConstants;

// Frac Class ===================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via the `deps` object which is set by the IIFE after initialization.

/**
 * Dependency container for Frac class. Populated by the IIFE during initialization.
 *
 * @type {{
 *     bigInt: typeof nerdamerBigInt;
 *     bigDec: typeof nerdamerBigDecimal;
 *     isInt: (n: any) => boolean;
 *     scientificToDecimal: (num: number) => string;
 *     DivisionByZero: new (msg: string) => Error;
 *     Settings: any;
 *     Fraction: { convert: Function; quickConversion: Function; fullConversion: Function };
 * }}
 */
const FracDeps = {
    bigInt: nerdamerBigInt,
    bigDec: nerdamerBigDecimal,
    isInt: () => false,
    scientificToDecimal: () => '',
    DivisionByZero: Error,
    Settings: { PRECISION: 21, USE_BIG: false },
    Fraction: { convert: () => [0, 1], quickConversion: () => [0, 1], fullConversion: () => [0, 1] },
};

/**
 * High-precision fraction class.
 *
 * @implements {FracType}
 */
class Frac {
    /** @param {number | string | Frac} [n] */
    constructor(n) {
        /** @type {import('big-integer').BigInteger} */
        this.num; // eslint-disable-line no-unused-expressions -- Property declaration
        /** @type {import('big-integer').BigInteger} */
        this.den; // eslint-disable-line no-unused-expressions -- Property declaration

        if (n instanceof Frac) {
            // eslint-disable-next-line no-constructor-return -- Frac is designed to return existing instances
            return n;
        }
        if (n === undefined) {
            // eslint-disable-next-line no-constructor-return -- Early return for undefined
            return this;
        }
        try {
            if (FracDeps.isInt(n)) {
                try {
                    this.num = FracDeps.bigInt(n);
                    this.den = FracDeps.bigInt(1);
                } catch (e) {
                    if (/** @type {Error} */ (e).message === 'timeout') {
                        throw e;
                    }
                    // eslint-disable-next-line no-constructor-return -- Fallback to simple parsing
                    return Frac.simple(n);
                }
            } else {
                const frac =
                    /** @type {any} */ (n) instanceof FracDeps.bigDec
                        ? FracDeps.Fraction.quickConversion(n)
                        : FracDeps.Fraction.convert(n);
                this.num = new FracDeps.bigInt(frac[0]);
                this.den = new FracDeps.bigInt(frac[1]);
            }
        } catch (e) {
            if (/** @type {Error} */ (e).message === 'timeout') {
                throw e;
            }
            // eslint-disable-next-line no-constructor-return -- Fallback to simple parsing
            return Frac.simple(n);
        }
    }

    /**
     * Safe to use with negative numbers or other types
     *
     * @param {number | string | Frac} n
     * @returns {Frac}
     */
    static create(n) {
        if (n instanceof Frac) {
            return n;
        }
        n = n.toString();
        const isNeg = n.charAt(0) === '-';
        if (isNeg) {
            n = n.substr(1, n.length - 1);
        }
        const frac = new Frac(n);
        if (isNeg) {
            frac.negate();
        }
        return frac;
    }

    /**
     * @param {any} o
     * @returns {o is Frac}
     */
    static isFrac(o) {
        return o instanceof Frac;
    }

    /**
     * @param {string | number} n
     * @param {string | number} d
     * @returns {Frac}
     */
    static quick(n, d) {
        const frac = new Frac();
        frac.num = new FracDeps.bigInt(n);
        frac.den = new FracDeps.bigInt(d);
        return frac;
    }

    /**
     * @param {number | string} n
     * @returns {Frac}
     */
    static simple(n) {
        const nstr = String(FracDeps.scientificToDecimal(/** @type {number} */ (n)));
        const mDc = nstr.split('.');
        const num = mDc.join('');
        /** @type {string} */
        let den = '1';
        const l = (mDc[1] || '').length;
        for (let i = 0; i < l; i++) {
            den += '0';
        }
        const frac = Frac.quick(num, den);
        return frac.simplify();
    }

    /**
     * @param {Frac} m
     * @returns {Frac}
     */
    multiply(m) {
        if (this.isOne()) {
            return m.clone();
        }
        if (m.isOne()) {
            return this.clone();
        }

        const c = this.clone();
        c.num = c.num.multiply(m.num);
        c.den = c.den.multiply(m.den);

        return c.simplify();
    }

    /**
     * @param {Frac} m
     * @returns {Frac}
     */
    divide(m) {
        if (m.equals(0)) {
            throw new FracDeps.DivisionByZero('Division by zero not allowed!');
        }
        return this.clone().multiply(m.clone().invert()).simplify();
    }

    /**
     * @param {Frac} m
     * @returns {Frac}
     */
    subtract(m) {
        return this.clone().add(m.clone().neg());
    }

    /**
     * Alias for subtract
     *
     * @param {Frac} m
     * @returns {Frac}
     */
    sub(m) {
        return this.subtract(m);
    }

    /** @returns {this} */
    neg() {
        this.num = this.num.multiply(-1);
        return this;
    }

    /**
     * @param {Frac} m
     * @returns {Frac}
     */
    add(m) {
        const n1 = this.den;
        const n2 = m.den;
        const c = this.clone();
        const a = c.num;
        const b = m.num;
        if (n1.equals(n2)) {
            c.num = a.add(b);
        } else {
            c.num = a.multiply(n2).add(b.multiply(n1));
            c.den = n1.multiply(n2);
        }

        return c.simplify();
    }

    /**
     * @param {Frac} m
     * @returns {Frac}
     */
    mod(m) {
        const a = this.clone();
        const b = m.clone();
        a.num = a.num.multiply(b.den);
        a.den = a.den.multiply(b.den);
        b.num = b.num.multiply(this.den);
        b.den = b.den.multiply(this.den);
        a.num = a.num.mod(b.num);
        return a.simplify();
    }

    /** @returns {this} */
    simplify() {
        const gcd = FracDeps.bigInt.gcd(this.num, this.den);
        this.num = this.num.divide(gcd);
        this.den = this.den.divide(gcd);
        return this;
    }

    /** @returns {Frac} */
    clone() {
        const m = new Frac();
        m.num = new FracDeps.bigInt(this.num);
        m.den = new FracDeps.bigInt(this.den);
        return m;
    }

    /**
     * @param {number} [prec]
     * @returns {string}
     */
    decimal(prec) {
        const sign = this.num.isNegative() ? '-' : '';
        if (this.num.equals(this.den)) {
            return '1';
        }
        prec ||= FracDeps.Settings.PRECISION;
        prec += 2;
        const narr = [];
        let n = this.num.abs();
        const d = this.den;
        let i;
        for (i = 0; i < prec; i++) {
            const w = n.divide(d);
            const r = n.subtract(w.multiply(d));
            narr.push(w);
            if (r.equals(0)) {
                break;
            }
            n = r.times(10);
        }
        const whole = narr.shift();
        if (narr.length === 0) {
            return sign + whole.toString();
        }

        if (i === prec) {
            const lt = [];
            for (let j = 0; j < 2; j++) {
                lt.unshift(narr.pop());
            }
            narr.push(Math.round(Number(lt.join('.'))));
        }

        const dec = `${whole.toString()}.${narr.join('')}`;
        return sign + dec;
    }

    /**
     * @param {number} [prec]
     * @returns {string | number}
     */
    toDecimal(prec) {
        prec ||= FracDeps.Settings.PRECISION;
        if (prec) {
            return this.decimal(prec);
        }
        return this.num.valueOf() / this.den.valueOf();
    }

    /**
     * @param {Frac} n
     * @returns {[import('big-integer').BigInteger, import('big-integer').BigInteger]}
     */
    qcompare(n) {
        return [this.num.multiply(n.den), n.num.multiply(this.den)];
    }

    /**
     * @param {number | Frac} n
     * @returns {boolean}
     */
    equals(n) {
        if (!isNaN(/** @type {number} */ (n))) {
            n = new Frac(/** @type {number} */ (n));
        }
        const q = this.qcompare(/** @type {Frac} */ (n));
        return q[0].equals(q[1]);
    }

    /**
     * @param {number | Frac} n
     * @returns {boolean}
     */
    absEquals(n) {
        if (!isNaN(/** @type {number} */ (n))) {
            n = new Frac(/** @type {number} */ (n));
        }
        const q = this.qcompare(/** @type {Frac} */ (n));
        return q[0].abs().equals(q[1]);
    }

    /**
     * @param {number | Frac} n
     * @returns {boolean}
     */
    greaterThan(n) {
        if (!isNaN(/** @type {number} */ (n))) {
            n = new Frac(/** @type {number} */ (n));
        }
        const q = this.qcompare(/** @type {Frac} */ (n));
        return q[0].gt(q[1]);
    }

    /**
     * Alias for greaterThan
     *
     * @param {number | Frac} n
     * @returns {boolean}
     */
    gt(n) {
        return this.greaterThan(n);
    }

    /**
     * @param {number | Frac} n
     * @returns {boolean}
     */
    gte(n) {
        return this.greaterThan(n) || this.equals(n);
    }

    /**
     * @param {number | Frac} n
     * @returns {boolean}
     */
    lte(n) {
        return this.lessThan(n) || this.equals(n);
    }

    /**
     * @param {number | Frac} n
     * @returns {boolean}
     */
    lessThan(n) {
        if (!isNaN(/** @type {number} */ (n))) {
            n = new Frac(/** @type {number} */ (n));
        }
        const q = this.qcompare(/** @type {Frac} */ (n));
        return q[0].lt(q[1]);
    }

    /**
     * Alias for lessThan
     *
     * @param {number | Frac} n
     * @returns {boolean}
     */
    lt(n) {
        return this.lessThan(n);
    }

    /** @returns {boolean} */
    isInteger() {
        return this.den.equals(1);
    }

    /** @returns {this} */
    negate() {
        this.num = this.num.multiply(-1);
        return this;
    }

    /** @returns {this} */
    invert() {
        const t = this.den;
        if (!this.num.equals(0)) {
            const isnegative = this.num.isNegative();
            this.den = this.num.abs();
            this.num = t;
            if (isnegative) {
                this.num = this.num.multiply(-1);
            }
        }
        return this;
    }

    /** @returns {boolean} */
    isOne() {
        return this.num.equals(1) && this.den.equals(1);
    }

    /** @returns {-1 | 1} */
    sign() {
        return this.num.isNegative() ? -1 : 1;
    }

    /** @returns {this} */
    abs() {
        this.num = this.num.abs();
        return this;
    }

    /**
     * @param {Frac} f
     * @returns {Frac}
     */
    gcd(f) {
        return Frac.quick(FracDeps.bigInt.gcd(f.num, this.num), FracDeps.bigInt.lcm(f.den, this.den));
    }

    /** @returns {string} */
    toString() {
        return this.den.equals(1) ? this.num.toString() : `${this.num.toString()}/${this.den.toString()}`;
    }

    /** @returns {number | import('decimal.js').Decimal} */
    valueOf() {
        if (FracDeps.Settings.USE_BIG) {
            return new FracDeps.bigDec(this.num.toString()).div(new FracDeps.bigDec(this.den.toString()));
        }
        const retval = this.num.valueOf() / this.den.valueOf();
        return retval;
    }

    /** @returns {boolean} */
    isNegative() {
        return /** @type {number} */ (this.toDecimal()) < 0;
    }

    /**
     * Checks if this fraction contains the given number (i.e., is divisible by it)
     *
     * @param {number | Frac} n
     * @returns {boolean}
     */
    contains(n) {
        const fracN = typeof n === 'number' ? new Frac(n) : n;
        return this.mod(fracN).equals(0);
    }
}

// NerdamerSet Class ====================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via SetDeps which is set by the IIFE after initialization.

/**
 * Dependency container for NerdamerSet class. Populated by the IIFE during initialization.
 *
 * @type {{
 *     isVector: (x: any) => boolean;
 *     Vector: { fromArray: (arr: any[]) => any };
 *     remove: (arr: any[], index: number) => void;
 * }}
 */
const SetDeps = {
    isVector: () => false,
    Vector: { fromArray: () => ({}) },
    remove: () => {},
};

/**
 * NerdamerSet class for mathematical set operations.
 *
 * @class
 * @param {any} [setArg]
 * @param {...any} rest
 */
function NerdamerSet(setArg, ...rest) {
    /** @type {any[]} */
    this.elements = [];
    // If the first object isn't an array, convert it to one.
    if (typeof setArg === 'undefined') {
        // No arguments passed
        return;
    }
    let setVal = setArg;
    if (!SetDeps.isVector(setVal)) {
        setVal = SetDeps.Vector.fromArray([setVal, ...rest]);
    }

    if (setVal) {
        const { elements } = setVal;
        for (let i = 0, l = elements.length; i < l; i++) {
            this.add(elements[i]);
        }
    }
}

/**
 * @param {any[]} arr
 * @returns {NerdamerSet}
 */
NerdamerSet.fromArray = function fromArray(arr) {
    /** @class */
    function F(args) {
        return NerdamerSet.apply(this, args);
    }
    F.prototype = NerdamerSet.prototype;

    return /** @type {NerdamerSet} */ (new F(arr));
};

/** @type {any} */
NerdamerSet.prototype = {
    /** @type {any[]} */
    elements: [],
    /** @param {any} x */
    add(x) {
        if (!this.contains(x)) {
            this.elements.push(x.clone());
        }
    },
    /**
     * @param {any} x
     * @returns {boolean}
     */
    contains(x) {
        for (let i = 0; i < this.elements.length; i++) {
            const e = this.elements[i];
            if (x.equals(e)) {
                return true;
            }
        }
        return false;
    },
    /**
     * @param {(e: any, inputSet: NerdamerSet, i: number) => void} f
     * @returns {NerdamerSet}
     */
    each(f) {
        const { elements } = this;
        const newSet = new NerdamerSet();
        for (let i = 0, l = elements.length; i < l; i++) {
            const e = elements[i];
            f.call(this, e, newSet, i);
        }
        return newSet;
    },
    /** @returns {NerdamerSet} */
    clone() {
        const newSet = new NerdamerSet();
        this.each(e => {
            newSet.add(e.clone());
        });
        return newSet;
    },
    /**
     * @param {NerdamerSet} inputSet
     * @returns {NerdamerSet}
     */
    union(inputSet) {
        const _union = this.clone();
        inputSet.each(e => {
            _union.add(e);
        });

        return _union;
    },
    /**
     * @param {NerdamerSet} inputSet
     * @returns {NerdamerSet}
     */
    difference(inputSet) {
        const diff = this.clone();
        inputSet.each(e => {
            diff.remove(e);
        });
        return diff;
    },
    /**
     * @param {any} element
     * @returns {boolean}
     */
    remove(element) {
        for (let i = 0, l = this.elements.length; i < l; i++) {
            const e = this.elements[i];
            if (e.equals(element)) {
                SetDeps.remove(this.elements, i);
                return true;
            }
        }
        return false;
    },
    /**
     * @param {NerdamerSet} inputSet
     * @returns {NerdamerSet}
     */
    intersection(inputSet) {
        const _intersection = new NerdamerSet();
        const A = this;
        inputSet.each(e => {
            if (A.contains(e)) {
                _intersection.add(e);
            }
        });

        return _intersection;
    },
    /**
     * @param {NerdamerSet} inputSet
     * @returns {boolean}
     */
    intersects(inputSet) {
        return this.intersection(inputSet).elements.length > 0;
    },
    /**
     * @param {NerdamerSet} inputSet
     * @returns {boolean}
     */
    isSubset(inputSet) {
        const { elements } = inputSet;
        for (let i = 0, l = elements.length; i < l; i++) {
            if (!this.contains(elements[i])) {
                return false;
            }
        }
        return true;
    },
    /** @returns {string} */
    toString() {
        return `{${this.elements.join(',')}}`;
    },
};

// Collection Class =================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via CollectionDeps which is set by the IIFE after initialization.

/**
 * Dependency container for Collection class. Populated by the IIFE during initialization.
 *
 * @type {{
 *     _: any;
 *     block: Function;
 * }}
 */
const CollectionDeps = {
    _: null,
    block: () => {},
};

/**
 * Class used to collect arguments for functions
 *
 * @class
 */
function Collection() {
    /** @type {any[]} */
    this.elements = [];
}
Collection.prototype.append = function append(e) {
    this.elements.push(e);
};
Collection.prototype.getItems = function getItems() {
    return this.elements;
};
Collection.prototype.toString = function toString() {
    return CollectionDeps._.prettyPrint(this.elements);
};
Collection.prototype.dimensions = function dimensions() {
    return this.elements.length;
};
// eslint-disable-next-line func-names -- naming this 'text' would shadow the outer text function
Collection.prototype.text = function (options) {
    return `(${this.elements.map(e => e.text(options)).join(',')})`;
};
Collection.create = function create(e) {
    const collection = new Collection();
    if (e) {
        collection.append(e);
    }
    return collection;
};
Collection.prototype.clone = function clone(_elements) {
    const c = Collection.create();
    c.elements = this.elements.map(e => e.clone());
    return c;
};
Collection.prototype.expand = function expand(options) {
    this.elements = this.elements.map(e => CollectionDeps._.expand(e, options));
    return this;
};

// eslint-disable-next-line func-names -- naming this 'evaluate' would shadow the outer evaluate variable
Collection.prototype.evaluate = function (options) {
    this.elements = this.elements.map(e => CollectionDeps._.evaluate(e, options));
    return this;
};

Collection.prototype.map = function map(lambda) {
    const c2 = this.clone();
    c2.elements = c2.elements.map((x, i) => lambda(x, i + 1));
    return c2;
};

// Returns the result of adding the argument to the vector
Collection.prototype.add = function add(c2) {
    return CollectionDeps.block(
        'SAFE',
        () => {
            const V = c2.elements || c2;
            if (this.elements.length !== V.length) {
                return null;
            }
            return this.map((x, i) => CollectionDeps._.add(x, V[i - 1]));
        },
        undefined,
        this
    );
};

// Returns the result of subtracting the argument from the vector
Collection.prototype.subtract = function subtract(vector) {
    return CollectionDeps.block(
        'SAFE',
        () => {
            const V = vector.elements || vector;
            if (this.elements.length !== V.length) {
                return null;
            }
            return this.map((x, i) => CollectionDeps._.subtract(x, V[i - 1]));
        },
        undefined,
        this
    );
};

// Scientific Class =================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via ScientificDeps which is set by the IIFE after initialization.

/**
 * Dependency container for Scientific class. Populated by the IIFE during initialization.
 *
 * @type {{
 *     Settings: any;
 *     nround: Function;
 * }}
 */
const ScientificDeps = {
    Settings: { SCIENTIFIC_IGNORE_ZERO_EXPONENTS: true },
    nround: (x, s) => Math.round(x * 10 ** s) / 10 ** s,
};

/*
 * Javascript has the toExponential method but this allows you to work with string and therefore any number of digits of your choosing
 * For example Scientific('464589498449496467924197545625247695464569568959124568489548454');
 */

/** @param {string | number} [num] */
function Scientific(num) {
    if (!(this instanceof Scientific)) {
        return new Scientific(num);
    }

    num = String(typeof num === 'undefined' ? 0 : num); // Convert to a string

    // remove the sign
    if (num.startsWith('-')) {
        this.sign = -1;
        // Remove the sign
        num = num.substr(1, num.length);
    } else {
        this.sign = 1;
    }

    if (Scientific.isScientific(num)) {
        this.fromScientific(num);
    } else {
        this.convert(num);
    }
    return this;
}

Scientific.prototype = {
    /** @param {string} num */
    fromScientific(num) {
        const parts = String(num).toLowerCase().split('e');
        this.coeff = parts[0];
        this.exponent = Number(parts[1]); // Convert to number for consistent === 0 checks in toString()

        const coeffParts = this.coeff.split('.');
        this.wholes = coeffParts[0] || '';
        this.dec = coeffParts[1] || '';
        const { dec } = this; // If it's undefined or zero it's going to blank
        this.decp = dec === '0' ? 0 : dec.length;

        return this;
    },
    /** @param {string} num */
    convert(num) {
        // Get wholes and decimals
        const parts = num.split('.');
        // Make zero go away
        let w = parts[0] || '';
        let d = parts[1] || '';
        // Convert zero to blank strings
        w = Scientific.removeLeadingZeroes(w);
        d = Scientific.removeTrailingZeroes(d);
        // Find the location of the decimal place which is right after the wholes
        const dotLocation = w.length;
        // Add them together so we can move the dot
        const n = w + d;
        // Find the next number
        const zeroes = Scientific.leadingZeroes(n).length;
        // NerdamerSet the exponent
        this.exponent = dotLocation - (zeroes + 1);
        // NerdamerSet the coeff but first remove leading zeroes
        const coeff = Scientific.removeLeadingZeroes(n);
        this.coeff = `${coeff.charAt(0)}.${Scientific.removeTrailingZeroes(coeff.substr(1, coeff.length)) || '0'}`;

        // The coeff decimal places
        const dec = this.coeff.split('.')[1] || ''; // If it's undefined or zero it's going to blank

        this.decp = dec === '0' ? 0 : dec.length;
        // Decimals
        this.dec = d;
        // Wholes
        this.wholes = w;

        return this;
    },
    /** @param {number} num */
    round(num) {
        const n = this.copy();

        num = Number(num); // Cast to number for safety
        // since we know it guaranteed to be in the format {digit}{optional dot}{optional digits}
        // we can round based on this
        if (num === 0) {
            n.coeff = n.coeff.charAt(0);
        } else {
            // Get up to n-1 digits
            const rounded = this.coeff.substring(0, num + 1);
            // Get the next two
            const nextTwo = this.coeff.substring(num + 1, num + 3);
            // The extra digit
            let ed = Number(nextTwo.charAt(0));

            if (Number(nextTwo.charAt(1)) > 4) {
                ed++;
            }

            n.coeff = rounded + ed;
        }

        return n;
    },
    copy() {
        const n = new Scientific(0);
        n.coeff = this.coeff;
        n.exponent = this.exponent;
        n.sign = this.sign;
        return n;
    },
    /** @param {number} [n] */
    toString(n) {
        let retval;

        if (ScientificDeps.Settings.SCIENTIFIC_IGNORE_ZERO_EXPONENTS && this.exponent === 0 && this.decp < n) {
            if (this.decp === 0 && this.wholes !== undefined) {
                retval = this.wholes;
            } else {
                retval = this.coeff;
            }
        } else {
            let coeff =
                typeof n === 'undefined' ? this.coeff : Scientific.round(this.coeff, Math.min(n, this.decp || 1));
            let exp = this.exponent;
            if (coeff.startsWith('10.')) {
                // Edge case when coefficient is 9.999999 rounds to 10
                coeff =
                    typeof n === 'undefined'
                        ? coeff.replace(/^10\./u, '1.0')
                        : Scientific.round(coeff.replace(/^10\./u, '1.0'), Math.min(n, this.decp || 1));
                exp = Number(exp) + 1;
            }
            retval = this.exponent === 0 ? coeff : `${coeff}e${exp}`;
        }

        return (this.sign === -1 ? '-' : '') + retval;
    },
};

/** @param {string} num */
Scientific.isScientific = function isScientific(num) {
    return /\d+\.?\d*e[+-]*\d+/iu.test(num);
};
/** @param {string} num */
Scientific.leadingZeroes = function leadingZeroes(num) {
    const match = num.match(/^(?<zeros>0*).*$/u);
    return match ? match[1] : '';
};
/** @param {string} num */
Scientific.removeLeadingZeroes = function removeLeadingZeroes(num) {
    const match = num.match(/^0*(?<rest>.*)$/u);
    return match ? match[1] : '';
};

/** @param {string} num */
Scientific.removeTrailingZeroes = function removeTrailingZeroes(num) {
    const match = num.match(/0*$/u);
    return match ? num.substring(0, num.length - match[0].length) : '';
};

/**
 * @param {string} c
 * @param {number} n
 */
Scientific.round = function round(c, n) {
    let coeff = String(ScientificDeps.nround(c, n));
    const m = coeff.includes('.') ? coeff.split('.').pop() : '';
    const d = n - m.length;
    // If we're asking for more significant figures
    if (d > 0) {
        if (!coeff.includes('.')) {
            coeff += '.';
        }
        coeff += new Array(d + 1).join('0');
    }
    return coeff;
};

// CustomError Function =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// This function creates custom error classes.

/**
 * Creates a custom error class with the given name.
 *
 * @param {string} name - The name of the custom error class
 * @returns {new (message?: string) => Error} A custom error constructor
 */
function customError(name) {
    const E = function (message) {
        this.name = name;
        this.message = message === undefined ? '' : message;
        const error = new Error(this.message);
        error.name = this.name;
        this.stack = error.stack;
    }; // Create an empty error
    E.prototype = Object.create(Error.prototype);
    return E;
}

// IsArray Function =================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if an object is an array
 *
 * @param {unknown} arr
 * @returns {arr is any[]}
 */
function isArray(arr) {
    return Array.isArray(arr);
}

// InBrackets Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * @param {unknown} str
 * @returns {string} - Returns a formatted string surrounded by brackets
 */
function inBrackets(str) {
    return `(${str})`;
}

// SameSign Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if numbers are both negative or are both positive
 *
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
function sameSign(a, b) {
    return a < 0 === b < 0;
}

// Format Function ==================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * A helper function to replace multiple occurences in a string. Takes multiple arguments
 *
 * @example
 *     format('{0} nice, {0} sweet', 'something');
 *     //returns 'something nice, something sweet'
 *
 * @param {...any} args
 * @returns {string}
 */
function format(...args) {
    const str = args.shift();
    const newStr = str.replace(/\{(?<idx>\d+)\}/gu, (match, index) => {
        const arg = args[index];
        return typeof arg === 'function' ? arg() : arg;
    });

    return newStr;
}

// Range Function ===================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Generates an array with values within a range. Multiplies by a step if provided
 *
 * @param {number} start
 * @param {number} end
 * @param {number} [step]
 * @returns {number[]}
 */
function range(start, end, step) {
    const arr = [];
    step ||= 1;
    for (let i = start; i <= end; i++) {
        arr.push(i * step);
    }
    return arr;
}

// Stringify Function ===============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Safely stringify object
 *
 * @param {any} o
 * @returns {string | any}
 */
function stringify(o) {
    if (!o) {
        return o;
    }
    return String(o);
}

// StringReplace Function ===========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * A helper function to replace parts of string
 *
 * @param {string} str - The original string
 * @param {number} from - The starting index
 * @param {number} to - The ending index
 * @param {string} withStr - The replacement string
 * @returns {string} - A formatted string
 */
function stringReplace(str, from, to, withStr) {
    return str.substr(0, from) + withStr + str.substr(to, str.length);
}

// CustomType Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * The Parser uses this to check if it's allowed to convert the obj to type NerdamerSymbol
 *
 * @param {object} obj
 * @returns {boolean}
 */
function customType(obj) {
    return obj !== undefined && obj.custom;
}

// ArrayMax Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Returns the maximum number in an array
 *
 * @param {any[]} arr
 * @returns {number}
 */
function arrayMax(arr) {
    return Math.max.apply(undefined, arr);
}

// ArrayMin Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Returns the minimum number in an array
 *
 * @param {any[]} arr
 * @returns {number}
 */
function arrayMin(arr) {
    return Math.min.apply(undefined, arr);
}

// Even Function ====================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if a number is an even number
 *
 * @param {number | any} num
 * @returns {boolean}
 */
function even(num) {
    return Number(num) % 2 === 0;
}

// EvenFraction Function ============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if a fraction is divisible by 2
 *
 * @param {number} num
 * @returns {boolean}
 */
function evenFraction(num) {
    return (1 / (num % 1)) % 2 === 0;
}

// ArrayUnique Function =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Strips duplicates out of an array
 *
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function arrayUnique(arr) {
    const l = arr.length;
    const a = [];
    for (let i = 0; i < l; i++) {
        const item = arr[i];
        if (a.indexOf(item) === -1) {
            a.push(item);
        }
    }
    return a;
}

// Arguments2Array Function =========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Converts function arguments to an array. Now used by gcd and lcm in Algebra.js :)
 *
 * @param {Parameters<typeof Array.prototype.slice.call>['0']} obj
 * @returns {any[]}
 */
function arguments2Array(obj) {
    return [].slice.call(obj);
}

// IsInt Function ===================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if a number is an integer
 *
 * @param {number | string | any} num
 * @returns {boolean}
 */
function isInt(num) {
    if (typeof num === 'number') {
        return Number.isInteger(num);
    }
    return typeof num !== 'undefined' && /^[-+]?\d+e?\+?\d*$/gimu.test(num.toString());
}

// ArrayEqual Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if two arrays are equal
 *
 * @param {any[]} arr1
 * @param {any[]} arr2
 * @returns {boolean}
 */
function arrayEqual(arr1, arr2) {
    arr1.sort();
    arr2.sort();

    // The must be of the same length
    if (arr1.length === arr2.length) {
        for (let i = 0; i < arr1.length; i++) {
            // If any two items don't match we're done
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
        // Otherwise they're equal
        return true;
    }

    return false;
}

// ArrayClone Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Clones array with clonable items
 *
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function arrayClone(arr) {
    const newArray = [];
    const l = arr.length;
    for (let i = 0; i < l; i++) {
        newArray[i] = /** @type {any} */ (arr[i]).clone();
    }
    return newArray;
}

// IsNumber Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks if n is a number
 *
 * @param {any} n
 * @returns {boolean}
 */
function isNumber(n) {
    return /^\d+\.?\d*$/u.test(n);
}

// Nround Function ==================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Rounds a number up to x decimal places
 *
 * @param {number | string} x
 * @param {number} [s]
 * @returns {number | string}
 */
function nround(x, s = 14) {
    if (isInt(x)) {
        if (Number(x) >= Number.MAX_VALUE) {
            return x.toString();
        }
        return Number(x);
    }
    return Math.round(/** @type {number} */ (x) * 10 ** s) / 10 ** s;
}

// ArrayAddSlices Function ==========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Fills numbers between array values
 *
 * @param {number[]} arr
 * @param {number} [slices]
 * @returns {number[]}
 */
function arrayAddSlices(arr, slices) {
    slices ||= 20;
    const retval = [];
    let c;
    let delta;
    let e;
    retval.push(arr[0]); // Push the beginning
    for (let i = 0; i < arr.length - 1; i++) {
        c = arr[i];
        delta = arr[i + 1] - c; // Get the difference
        e = delta / slices; // Chop it up in the desired number of slices
        for (let j = 0; j < slices; j++) {
            c += e; // Add the mesh to the last slice
            retval.push(c);
        }
    }

    return retval;
}

// Each Function ====================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Loops through each item in object and calls function with item as param
 *
 * @param {object | any[]} obj
 * @param {Function} fn
 */
function each(obj, fn) {
    if (isArray(obj)) {
        const l = obj.length;
        for (let i = 0; i < l; i++) {
            fn.call(obj, i);
        }
    } else {
        for (const x in obj) {
            if (Object.hasOwn(obj, x)) {
                fn.call(obj, x);
            }
        }
    }
}

// Remove Function ==================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Removes an item from either an array or an object. If the object is an array, the index must be specified after the
 * array. If it's an object then the key must be specified
 *
 * @param {object | any[]} obj
 * @param {number | string} indexOrKey
 * @returns {any}
 */
function remove(obj, indexOrKey) {
    let result;
    if (isArray(obj)) {
        result = obj.splice(/** @type {number} */ (indexOrKey), 1)[0];
    } else {
        result = obj[indexOrKey];
        delete obj[indexOrKey];
    }
    return result;
}

// KnownVariable Function ===========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Generates an object with known variable value for evaluation
 *
 * @param {string} variable
 * @param {any} value Any stringifyable object
 * @returns {object}
 */
function knownVariable(variable, value) {
    const o = {};
    o[variable] = value;
    return o;
}

// AllNumeric Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if an array contains only numeric values
 *
 * @param {any[]} arr
 * @returns {boolean}
 */
function allNumeric(arr) {
    for (let i = 0; i < arr.length; i++) {
        if (!isNumber(arr[i])) {
            return false;
        }
    }
    return true;
}

// ScientificToDecimal Function =====================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Convert number from scientific format to decimal format
 *
 * @param {number} num
 * @returns {string}
 */
function scientificToDecimal(num) {
    const nsign = Math.sign(num);
    // Remove the sign
    /** @type {number | string} */
    let n = Math.abs(num);
    // If the number is in scientific notation remove it
    if (/\d+\.?\d*e[+-]*\d+/iu.test(String(n))) {
        const zero = '0';
        const parts = String(n).toLowerCase().split('e'); // Split into coeff and exponent
        const e = parts.pop(); // Store the exponential part
        let l = Math.abs(Number(e)); // Get the number of zeros
        const sign = Math.sign(Number(e));
        const coeffArray = parts[0].split('.');
        if (sign === -1) {
            // Return "("+parts[0]+"/1"+"0".repeat(l)+")";
            l -= coeffArray[0].length;
            if (l < 0) {
                n = `${coeffArray[0].slice(0, l)}.${coeffArray[0].slice(
                    l
                )}${coeffArray.length === 2 ? coeffArray[1] : ''}`;
            } else {
                n = `${zero}.${new Array(l + 1).join(zero)}${coeffArray.join('')}`;
            }
        } else {
            const dec = coeffArray[1];
            if (dec) {
                l -= dec.length;
            }
            if (l < 0) {
                n = `${coeffArray[0] + dec.slice(0, l)}.${dec.slice(l)}`;
            } else {
                n = coeffArray.join('') + new Array(l + 1).join(zero);
            }
        }
    }

    return nsign < 0 ? `-${n}` : String(n);
}

// AllSame Function =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see that all symbols in array are the same
 *
 * @param {any[]} arr
 * @returns {boolean}
 */
function allSame(arr) {
    const last = arr[0];
    for (let i = 1, l = arr.length; i < l; i++) {
        if (!arr[i].equals(last)) {
            return false;
        }
    }
    return true;
}

// RemoveDuplicates Function =======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Removes duplicates from an array
 *
 * @param {Array} arr
 * @param {Function} [condition]
 * @returns {Array}
 */
function removeDuplicates(arr, condition) {
    const conditionType = typeof condition;

    if (conditionType !== 'function') {
        condition = function (a, b) {
            return a === b;
        };
    }

    const seen = [];

    while (arr.length) {
        const a = arr[0];
        // Only one element left so we're done
        if (arr.length === 1) {
            seen.push(a);
            break;
        }
        const temp = [];
        seen.push(a); // We already scanned these
        for (let i = 1; i < arr.length; i++) {
            const b = arr[i];
            // If the number is outside the specified tolerance
            if (!condition(a, b)) {
                temp.push(b);
            }
        }
        // Start over with the remainder
        arr = temp;
    }

    return seen;
}

// ComboSort Function ===============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Sorts two arrays together, keeping elements at matching indices paired. Sorts by the first array's values
 * numerically.
 *
 * @param {any[]} a
 * @param {any[]} b
 * @returns {[any[], any[]]}
 */
function comboSort(a, b) {
    const l = a.length;
    const combined = []; // The linker
    for (let i = 0; i < a.length; i++) {
        combined.push([a[i], b[i]]); // Create the map
    }

    combined.sort((x, y) => Number(x[0]) - Number(y[0]));

    const na = [];
    const nb = [];

    for (let i = 0; i < l; i++) {
        na.push(combined[i][0]);
        nb.push(combined[i][1]);
    }

    return [na, nb];
}

// DivisionByZero Error ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown for division by zero.
 *
 * @type {new (message?: string) => Error}
 */
const DivisionByZero = customError('DivisionByZero');

// ParseError Error ====================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if an error occurred during parsing.
 *
 * @type {new (message?: string) => Error}
 */
const ParseError = customError('ParseError');

// UndefinedError Error ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if the expression results in undefined.
 *
 * @type {new (message?: string) => Error}
 */
const UndefinedError = customError('UndefinedError');

// OutOfFunctionDomainError Error ======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if input is out of the function domain.
 *
 * @type {new (message?: string) => Error}
 */
const OutOfFunctionDomainError = customError('OutOfFunctionDomainError');

// MaximumIterationsReached Error ======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if a function exceeds maximum iterations.
 *
 * @type {new (message?: string) => Error}
 */
const MaximumIterationsReached = customError('MaximumIterationsReached');

// NerdamerTypeError Error =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if the parser receives an incorrect type.
 *
 * @type {new (message?: string) => Error}
 */
const NerdamerTypeError = customError('NerdamerTypeError');

// ParityError Error ===================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if bracket parity is not correct.
 *
 * @type {new (message?: string) => Error}
 */
const ParityError = customError('ParityError');

// OperatorError Error =================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if an unexpected or incorrect operator is encountered.
 *
 * @type {new (message?: string) => Error}
 */
const OperatorError = customError('OperatorError');

// OutOfRangeError Error ===============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if an index is out of range.
 *
 * @type {new (message?: string) => Error}
 */
const OutOfRangeError = customError('OutOfRangeError');

// DimensionError Error ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if dimensions are incorrect (mostly for matrices).
 *
 * @type {new (message?: string) => Error}
 */
const DimensionError = customError('DimensionError');

// InvalidVariableNameError Error ======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if variable name violates naming rule.
 *
 * @type {new (message?: string) => Error}
 */
const InvalidVariableNameError = customError('InvalidVariableNameError');

// ValueLimitExceededError Error =======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if the limits of the library are exceeded for a function.
 *
 * @type {new (message?: string) => Error}
 */
const ValueLimitExceededError = customError('ValueLimitExceededError');

// NerdamerValueError Error ============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if the value is an incorrect LH or RH value.
 *
 * @type {new (message?: string) => Error}
 */
const NerdamerValueError = customError('NerdamerValueError');

// SolveError Error ====================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown for solve-related errors.
 *
 * @type {new (message?: string) => Error}
 */
const SolveError = customError('SolveError');

// InfiniteLoopError Error =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown for an infinite loop.
 *
 * @type {new (message?: string) => Error}
 */
const InfiniteLoopError = customError('InfiniteLoopError');

// UnexpectedTokenError Error ==========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Error thrown if an operator is found when there shouldn't be one.
 *
 * @type {new (message?: string) => Error}
 */
const UnexpectedTokenError = customError('UnexpectedTokenError');

// IsCollection Function ===============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if the object provided is a Collection
 *
 * @param {object} obj
 * @returns {obj is Collection}
 */
function isCollection(obj) {
    return obj instanceof Collection;
}

// IsSet Function ======================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Checks to see if the object provided is a NerdamerSet
 *
 * @param {object} obj
 * @returns {obj is NerdamerSet}
 */
function isSet(obj) {
    return obj instanceof NerdamerSet;
}

// FirstObject Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Returns the first encountered item in an object. Items do not have a fixed order in objects so only use if you need
 * any first random or if there's only one item in the object
 *
 * @param {object} obj
 * @param {string} [key] - Return this key as first object
 * @param {boolean} [both] - Return both key and object
 * @returns {any}
 */
function firstObject(obj, key, both) {
    const objKeys = Object.keys(obj);
    const x = objKeys[0];
    if (key) {
        return x;
    }
    if (both) {
        return {
            key: x,
            obj: obj[x],
        };
    }
    return obj[x];
}

// Keys Alias ======================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/** Alias for Object.keys - returns an array of all the keys in an object */
const { keys } = Object;

// IsNumericSymbol Function ========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via IsNumericSymbolDeps which is set by the IIFE after initialization.

/**
 * Dependency container for isNumericSymbol function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     N: number;
 *     P: number;
 * }}
 */
const IsNumericSymbolDeps = {
    N: 1,
    P: 2,
};

/**
 * Checks to see if a symbol is in group N (number) or P (power)
 *
 * @param {NerdamerSymbolType} symbol
 * @returns {boolean}
 */
function isNumericSymbol(symbol) {
    return symbol.group === IsNumericSymbolDeps.N || symbol.group === IsNumericSymbolDeps.P;
}

// IsVariableSymbol Function =======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via IsVariableSymbolDeps which is set by the IIFE after initialization.

/**
 * Dependency container for isVariableSymbol function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     S: number;
 * }}
 */
const IsVariableSymbolDeps = {
    S: 3,
};

/**
 * Checks to see if a symbol is a variable with no multiplier nor power
 *
 * @param {NerdamerSymbolType} symbol
 * @returns {boolean}
 */
function isVariableSymbol(symbol) {
    return symbol.group === IsVariableSymbolDeps.S && symbol.multiplier.equals(1) && symbol.power.equals(1);
}

// AllNumbers Function =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via AllNumbersDeps which is set by the IIFE after initialization.

/**
 * Dependency container for allNumbers function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     N: number;
 * }}
 */
const AllNumbersDeps = {
    N: 1,
};

/**
 * Checks to see if all arguments are numbers
 *
 * @param {object} args
 * @returns {boolean}
 */
function allNumbers(args) {
    for (let i = 0; i < args.length; i++) {
        if (args[i].group !== AllNumbersDeps.N) {
            return false;
        }
    }
    return true;
}

// ReserveNames Function ===========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via ReserveNamesDeps which is set by the IIFE after initialization.

/**
 * Dependency container for reserveNames function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     RESERVED: string[];
 * }}
 */
const ReserveNamesDeps = {
    RESERVED: [],
};

/**
 * Reserves the names in an object so they cannot be used as function names
 *
 * @param {object} obj
 */
function reserveNames(obj) {
    const add = function (item) {
        if (ReserveNamesDeps.RESERVED.indexOf(item) === -1) {
            ReserveNamesDeps.RESERVED.push(item);
        }
    };

    if (typeof obj === 'string') {
        add(obj);
    } else {
        each(obj, x => {
            add(x);
        });
    }
}

// ClearU Function =================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via ClearUDeps which is set by the IIFE after initialization.

/**
 * Dependency container for clearU function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     RESERVED: (string | undefined)[];
 * }}
 */
const ClearUDeps = {
    RESERVED: [],
};

/**
 * Clears the u variable so it's no longer reserved
 *
 * @param {string} u
 */
function clearU(u) {
    const indx = ClearUDeps.RESERVED.indexOf(u);
    if (indx !== -1) {
        ClearUDeps.RESERVED[indx] = undefined;
    }
}

// ValidateName Function ===========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via ValidateNameDeps which is set by the IIFE after initialization.

/**
 * Dependency container for validateName function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     ALLOW_CHARS: string[];
 *     VALIDATION_REGEX: RegExp;
 * }}
 */
const ValidateNameDeps = {
    ALLOW_CHARS: [],
    VALIDATION_REGEX: /^[a-z_][a-z\d_]*$/iu,
};

/**
 * Enforces rule: "must start with a letter or underscore and can have any number of underscores, letters, and numbers
 * thereafter."
 *
 * @param {string} name The name of the symbol being checked
 * @param {string} [typ] - The type of symbols that's being validated
 * @throws {Error} - Throws an exception on fail
 */
function validateName(name, typ = 'variable') {
    if (ValidateNameDeps.ALLOW_CHARS.indexOf(name) !== -1) {
        return;
    }
    const regex = ValidateNameDeps.VALIDATION_REGEX;
    if (!regex.test(name)) {
        throw new InvalidVariableNameError(`${name} is not a valid ${typ} name`);
    }
}

// IsReserved Function =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via IsReservedDeps which is set by the IIFE after initialization.

/**
 * Dependency container for isReserved function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     RESERVED: string[];
 * }}
 */
const IsReservedDeps = {
    RESERVED: [],
};

/**
 * Checks to see if value is one of nerdamer's reserved names
 *
 * @param {string} value
 * @returns {boolean}
 */
function isReserved(value) {
    return IsReservedDeps.RESERVED.indexOf(value) !== -1;
}

// Warn Function ===================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via WarnDeps which is set by the IIFE after initialization.

/**
 * Dependency container for warn function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     WARNINGS: string[];
 *     SHOW_WARNINGS: boolean;
 * }}
 */
const WarnDeps = {
    WARNINGS: [],
    SHOW_WARNINGS: false,
};

/**
 * Used to pass warnings or low severity errors about the library
 *
 * @param {string} msg
 */
function warn(msg) {
    WarnDeps.WARNINGS.push(msg);
    if (WarnDeps.SHOW_WARNINGS && console && console.warn) {
        console.warn(msg);
    }
}

/**
 * Get nerdamer generated warnings
 *
 * @returns {string[]}
 */
function getWarnings() {
    return WarnDeps.WARNINGS;
}

// NumExpressions Function =======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses NumExpressionsDeps for dependency injection of EXPRESSIONS array.

/**
 * Dependency container for numExpressions function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     EXPRESSIONS: any[];
 * }}
 */
const NumExpressionsDeps = {
    EXPRESSIONS: [],
};

/**
 * Returns the number of equations/expressions currently loaded
 *
 * @returns {number}
 */
function numExpressions() {
    return NumExpressionsDeps.EXPRESSIONS.length;
}

// GetSetting Function ===========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses GetSettingDeps for dependency injection of Settings object.

/**
 * Dependency container for getSetting function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     Settings: Record<string, any>;
 * }}
 */
const GetSettingDeps = {
    Settings: {},
};

/**
 * Get the value of a nerdamer setting
 *
 * @param {string} setting
 * @returns {any}
 */
function getSetting(setting) {
    return GetSettingDeps.Settings[setting];
}

// ValidVarName Function =========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses ClearUDeps.RESERVED (already initialized) and validateName (already external).

/**
 * Validates if the provided string is a valid variable name
 *
 * @param {string} varname Variable name
 * @returns {boolean}
 */
function validVarName(varname) {
    try {
        validateName(varname);
        return ClearUDeps.RESERVED.indexOf(varname) === -1;
    } catch (e) {
        if (e.message === 'timeout') {
            throw e;
        }
        return false;
    }
}

// Reserved Function =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses ClearUDeps.RESERVED (already initialized).

/**
 * Returns reserved variable names
 *
 * @param {boolean} [asArray] If true, returns as array; otherwise returns comma-separated string
 * @returns {string | string[]}
 */
function reserved(asArray) {
    if (asArray) {
        return ClearUDeps.RESERVED;
    }
    return ClearUDeps.RESERVED.join(', ');
}

// Version Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses VersionDeps for dependency injection of _version and C (Core object).

/**
 * Dependency container for version function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     _version: string;
 *     C: Record<string, { version: string }>;
 * }}
 */
const VersionDeps = {
    _version: '',
    C: {},
};

/**
 * Get the version of nerdamer or a loaded add-on
 *
 * @param {string} [addOn] - The add-on being checked
 * @returns {string} Returns the version of nerdamer
 */
function version(addOn) {
    if (addOn) {
        try {
            return VersionDeps.C[addOn].version;
        } catch (e) {
            if (e.message === 'timeout') {
                throw e;
            }
            return `No module named ${addOn} found!`;
        }
    }
    return VersionDeps._version;
}

// GetCore Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses VersionDeps.C which is already initialized with the Core object.

/**
 * Exports the nerdamer core functions and objects
 *
 * @returns {object} The Core object
 */
function getCore() {
    return VersionDeps.C;
}

// Supported Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses SupportedDeps.functions which provides access to _.functions.

/**
 * Dependencies for the supported function. Initialized inside the IIFE.
 *
 * @type {{
 *     functions: object | null;
 * }}
 */
const SupportedDeps = {
    functions: null,
};

/**
 * Returns an array of all supported function names
 *
 * @returns {string[]} Array of function names
 */
function supported() {
    return keys(SupportedDeps.functions);
}

// GetConstant Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses GetConstantDeps.CONSTANTS which provides access to _.CONSTANTS.

/**
 * Dependencies for the getConstant function. Initialized inside the IIFE.
 *
 * @type {{
 *     CONSTANTS: object | null;
 * }}
 */
const GetConstantDeps = {
    CONSTANTS: null,
};

/**
 * Returns the value of a previously set constant
 *
 * @param {string} constant The name of the constant
 * @returns {string} The string value of the constant
 */
function getConstant(constant) {
    return String(GetConstantDeps.CONSTANTS[constant]);
}

// GetVar Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses GetVarDeps.VARS which provides access to VARS.

/**
 * Dependencies for the getVar function. Initialized inside the IIFE.
 *
 * @type {{
 *     VARS: object | null;
 * }}
 */
const GetVarDeps = {
    VARS: null,
};

/**
 * Returns the value of a previously set variable
 *
 * @param {string} v The name of the variable
 * @returns {any} The value of the variable
 */
function getVar(v) {
    return GetVarDeps.VARS[v];
}

/**
 * Returns an object containing all stored variables, optionally formatted.
 *
 * @param {string} [output] Output format: 'object' (raw VARS), 'text' (default), or 'latex'
 * @param {string | string[]} [option] Formatting option passed to text/latex methods
 * @returns {object} Object with variable names as keys
 */
function getVars(output, option) {
    output ||= 'text';
    let result = {};
    if (output === 'object') {
        result = GetVarDeps.VARS;
    } else {
        for (const v in GetVarDeps.VARS) {
            if (!Object.hasOwn(GetVarDeps.VARS, v)) {
                continue;
            }
            if (output === 'latex') {
                result[v] = GetVarDeps.VARS[v].latex(option);
            } else if (output === 'text') {
                result[v] = GetVarDeps.VARS[v].text(option);
            }
        }
    }
    return result;
}

// ConvertToLaTeX Function =======================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses ConvertToLaTeXDeps._ which provides access to the core object.

/**
 * Dependencies for core wrapper functions. Initialized inside the IIFE.
 *
 * @type {{
 *     _: {
 *         toTeX: (e: any, opt?: any) => string;
 *         getOperator: (operator: string) => any;
 *         aliasOperator: (operator: string, withOperator: string) => void;
 *         setOperator: (operator: any, shift?: any) => void;
 *         peekers: Record<string, Function[]>;
 *         tree: (e: any) => any;
 *         toRPN: (e: any) => any;
 *         tokenize: (e: any) => any;
 *         parse: (e: any) => any;
 *         functions: Record<string, [Function, number | [number, number], any?]>;
 *     } | null;
 *     C: any;
 * }}
 */
const ConvertToLaTeXDeps = {
    _: null,
    C: null,
};

/**
 * Generates LaTeX from expression string
 *
 * @param {string} e
 * @param {object} opt
 * @returns {string}
 */
function convertToLaTeX(e, opt) {
    return ConvertToLaTeXDeps._.toTeX(e, opt);
}

/**
 * Returns the operator object for a given operator string
 *
 * @param {string} operator
 * @returns {any}
 */
function getOperator(operator) {
    return ConvertToLaTeXDeps._.getOperator(operator);
}

/**
 * Creates an alias for an operator
 *
 * @param {string} operator
 * @param {string} withOperator
 * @returns {void}
 */
function aliasOperator(operator, withOperator) {
    ConvertToLaTeXDeps._.aliasOperator(operator, withOperator);
}

/**
 * Sets an operator
 *
 * @param {any} operator
 * @param {any} shift
 * @returns {void}
 */
function setOperator(operator, shift) {
    ConvertToLaTeXDeps._.setOperator(operator, shift);
}

/**
 * Adds a peeker function
 *
 * @param {string} name
 * @param {Function} f
 * @returns {void}
 */
function addPeeker(name, f) {
    if (ConvertToLaTeXDeps._.peekers[name]) {
        ConvertToLaTeXDeps._.peekers[name].push(f);
    }
}

/**
 * Removes a peeker function
 *
 * @param {string} name
 * @param {Function} f
 * @returns {void}
 */
function removePeeker(name, f) {
    const peekers = ConvertToLaTeXDeps._.peekers[name];
    if (peekers) {
        const index = peekers.indexOf(f);
        if (index !== -1) {
            remove(peekers, index);
        }
    }
}

/**
 * Returns the tree representation of an expression
 *
 * @param {string} expression
 * @returns {any}
 */
function tree(expression) {
    return ConvertToLaTeXDeps._.tree(
        /** @type {any} */ (ConvertToLaTeXDeps._.toRPN(ConvertToLaTeXDeps._.tokenize(expression)))
    );
}

/**
 * Parses an expression string into an array of symbols
 *
 * @param {string} e
 * @returns {any[]}
 */
function parse(e) {
    return String(e)
        .split(';')
        .map(x => ConvertToLaTeXDeps._.parse(x));
}

/**
 * Converts expression into rpn form
 *
 * @param {string} expression
 * @returns {object[]}
 */
function rpn(expression) {
    return ConvertToLaTeXDeps._.tokenize(
        /** @type {string} */ (
            /** @type {unknown} */ (
                ConvertToLaTeXDeps._.toRPN(/** @type {any[]} */ (/** @type {unknown} */ (expression)))
            )
        )
    );
}

/**
 * Generates an HTML tree representation of an expression
 *
 * @param {string} expression
 * @param {number} [indent]
 * @returns {string}
 */
function htmlTree(expression, indent) {
    const treeResult = tree(expression);

    return (
        `<div class="tree">\n` +
        `    <ul>\n` +
        `        <li>\n${treeResult.toHTML(3, indent)}\n` +
        `        </li>\n` +
        `    </ul>\n` +
        `</div>`
    );
}

/**
 * Replaces an internal function with a new implementation
 *
 * @param {string} name The name of the function to replace
 * @param {Function} fn A factory function that receives (existingFn, C) and returns the new function
 * @param {number} [numArgs] Optional number of arguments (defaults to existing function's numArgs)
 * @returns {void}
 */
function replaceFunction(name, fn, numArgs) {
    const existing = ConvertToLaTeXDeps._.functions[name];
    const newNumArgs = typeof numArgs === 'undefined' ? existing[1] : numArgs;
    ConvertToLaTeXDeps._.functions[name] = [fn(existing[0], ConvertToLaTeXDeps.C), newNumArgs];
}

// Expressions Function ===========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.

/**
 * Dependencies for expressions and related functions. Initialized inside the IIFE.
 *
 * @type {{
 *     EXPRESSIONS: any[];
 *     USER_FUNCTIONS: string[];
 *     LaTeX: any;
 *     text: (obj: any, option?: any) => string;
 *     functions: Record<string, [Function, number | [number, number], any?]>;
 *     Math2: Record<string, Function>;
 *     _: { tokenize: (e: any) => any; parse: (e: any) => any } | null;
 *     Expression: (new (symbol: any) => any) | null;
 * }}
 */
const ExpressionsDeps = {
    EXPRESSIONS: [],
    USER_FUNCTIONS: [],
    LaTeX: { latex: () => '', parse: () => '' },
    text: () => '',
    functions: {},
    Math2: {},
    _: null,
    Expression: null,
};

/**
 * Returns stored expressions as an array or object, optionally in LaTeX format.
 *
 * @param {boolean} [asObject] Return as object with 1-based indices as keys
 * @param {boolean} [asLaTeX] Convert expressions to LaTeX
 * @param {string | string[]} [option] Formatting option
 * @returns {Record<number, string> | string[]}
 */
function expressions(asObject, asLaTeX, option) {
    /** @type {Record<number, string> | string[]} */
    const result = asObject ? {} : [];
    for (let i = 0; i < ExpressionsDeps.EXPRESSIONS.length; i++) {
        const eq = asLaTeX
            ? ExpressionsDeps.LaTeX.latex(ExpressionsDeps.EXPRESSIONS[i], option)
            : ExpressionsDeps.text(ExpressionsDeps.EXPRESSIONS[i], option);
        asObject ? (result[i + 1] = eq) : /** @type {string[]} */ (result).push(eq);
    }
    return result;
}

/**
 * Returns user-defined functions as an array or object.
 *
 * @param {boolean} [asObject] Return as object with 1-based indices as keys
 * @param {string | string[]} [option] Formatting option
 * @returns {Record<number, string> | string[]}
 */
function getFunctions(asObject, option) {
    const result = asObject ? {} : [];
    for (let i = 0; i < ExpressionsDeps.USER_FUNCTIONS.length; i++) {
        let params;
        let body;
        const fnName = ExpressionsDeps.USER_FUNCTIONS[i];
        const fnDef = ExpressionsDeps.functions[fnName][2];
        if (fnDef) {
            ({ params, body } = fnDef);
        } else {
            const fnString = ExpressionsDeps.Math2[fnName].toString();
            [, params] = /\((?<params>.*?)\)/u.exec(fnString);
            params = params.split(',').map(x => x.trim());
            body = '{JavaScript}';
        }
        const fn = `${fnName}(${params.join(', ')})=${body}`;
        const eq = ExpressionsDeps.text(fn, option);
        asObject ? (result[i + 1] = eq) : result.push(eq);
    }
    return result;
}

/**
 * Converts LaTeX to a nerdamer expression. Very basic at the moment - handles subscripts, superscripts, and fractions.
 *
 * @param {string} e LaTeX string to convert
 * @returns {any} Expression object
 */
function convertFromLaTeX(e) {
    // Convert x_2a => x_2 a
    e = e.replace(/_(?<char>[A-Za-z0-9])/gu, (...g) => `${g[0]} `);
    // Convert x^2 => x^{2}
    e = e.replace(/\^(?<char>[A-Za-z0-9])/gu, (...g) => `^{${g[1]}}`);
    // Convert \frac12 => \frac{1}2
    e = e.replace(/(?<cmd>\\[A-Za-z]+)(?<digit>\d)/gu, (...g) => `${g[1]}{${g[2]}}`);
    // Convert \frac{1}2 => \frac{1}{2}
    e = e.replace(/(?<cmd>\\[A-Za-z]+\{.*?\})(?<digit>\d)/gu, (...g) => `${g[1]}{${g[2]}}`);
    const txt = ExpressionsDeps.LaTeX.parse(ExpressionsDeps._.tokenize(e));
    return new ExpressionsDeps.Expression(ExpressionsDeps._.parse(txt));
}

// Chain Functions ===============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// These functions return libExports for method chaining.
// Uses ChainDeps for dependency injection of libExports, VARS, and helper functions.

/**
 * Dependencies for chain functions. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     libExports: any;
 *     VARS: Record<string, any>;
 *     _clearFunctions: () => void;
 *     _initConstants: () => void;
 *     clear: ((equationNumber?: any, keepExpressionsFixed?: boolean) => any) | null;
 * }}
 */
const ChainDeps = {
    libExports: null,
    VARS: {},
    _clearFunctions: () => {},
    _initConstants: () => {},
    clear: null,
};

/**
 * Clears all user-defined variables
 *
 * @returns {any} Returns the nerdamer object for chaining
 */
function clearVars() {
    // Reset VARS to empty object - we need to clear the actual VARS object
    for (const key in ChainDeps.VARS) {
        if (Object.hasOwn(ChainDeps.VARS, key)) {
            delete ChainDeps.VARS[key];
        }
    }
    return ChainDeps.libExports;
}

/**
 * Clears all added functions
 *
 * @returns {any} Returns the nerdamer object for chaining
 */
function clearFunctions() {
    ChainDeps._clearFunctions();
    return ChainDeps.libExports;
}

/**
 * Clears all user-defined constants
 *
 * BUG: The original implementation used `_.initConstants.bind(_)` which creates a bound function but does NOT call it.
 * This means clearConstants() is a no-op and doesn't actually clear any constants. The test confirms this bug by
 * expecting constants to persist after calling clearConstants().
 *
 * To actually clear constants, the code should be: `_.initConstants()` or `_.initConstants.call(_)` instead of
 * `_.initConstants.bind(_)`.
 *
 * This bug is preserved for backwards compatibility - fixing it would be a breaking change. See issue #XX (TODO: file
 * issue).
 *
 * @returns {any} Returns the nerdamer object for chaining
 */
function clearConstants() {
    // Original code was: _.initConstants.bind(_);
    // This just creates a bound function but doesn't call it - confirmed bug.
    // Preserving original (buggy) behavior for backwards compatibility.
    return ChainDeps.libExports;
}

/**
 * Alias for nerdamer.clear('all') - clears all stored expressions
 *
 * @returns {any} Returns the nerdamer object for chaining
 */
function flush() {
    ChainDeps.clear(/** @type {any} */ ('all'));
    return ChainDeps.libExports;
}

/**
 * Loads a custom loader function with nerdamer as `this` context
 *
 * @param {Function} loader - The loader function to call
 * @returns {any} Returns the nerdamer object for chaining
 */
function load(loader) {
    loader.call(ChainDeps.libExports);
    return ChainDeps.libExports;
}

// SetConstant Function ==========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses SetConstantDeps for dependency injection.

/**
 * Dependencies for setConstant function. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     libExports: any;
 *     CONSTANTS: Record<string, any>;
 * }}
 */
const SetConstantDeps = {
    libExports: null,
    CONSTANTS: {},
};

/**
 * Set the value of a constant
 *
 * @param {string} constant - The name of the constant
 * @param {number | 'delete' | ''} value - The value of the constant or 'delete' to remove
 * @returns {any} Returns the nerdamer object for chaining
 */
function setConstant(constant, value) {
    validateName(constant);
    if (!isReserved(constant)) {
        // Fix for issue #127
        if (value === 'delete' || value === '') {
            delete SetConstantDeps.CONSTANTS[constant];
        } else {
            if (isNaN(/** @type {number} */ (value))) {
                throw new NerdamerTypeError('Constant must be a number!');
            }
            SetConstantDeps.CONSTANTS[constant] = value;
        }
    }
    return SetConstantDeps.libExports;
}

// SetVar Function ===============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses SetVarDeps for dependency injection.

/**
 * Dependencies for setVar function. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     libExports: any;
 *     VARS: Record<string, any>;
 *     CONSTANTS: Record<string, any>;
 *     parse: (expression: any) => any;
 *     isSymbol: (obj: any) => boolean;
 * }}
 */
const SetVarDeps = {
    libExports: null,
    VARS: {},
    CONSTANTS: {},
    parse: () => null,
    isSymbol: () => false,
};

/**
 * Set the value of a variable
 *
 * @param {string} v - Variable to be set
 * @param {string | any} val - Value of variable. This can be a variable expression or number
 * @returns {any} Returns the nerdamer object for chaining
 */
function setVar(v, val) {
    validateName(v);
    // Check if it's not already a constant
    if (v in SetVarDeps.CONSTANTS) {
        err(`Cannot set value for constant ${v}`);
    }
    if (val === 'delete' || val === '') {
        delete SetVarDeps.VARS[v];
    } else {
        SetVarDeps.VARS[v] = SetVarDeps.isSymbol(val) ? val : SetVarDeps.parse(val);
    }
    return SetVarDeps.libExports;
}

// SetFunction Function ==========================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses SetFunctionDeps for dependency injection.

/**
 * Dependencies for setFunction function. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     libExports: any;
 *     _setFunction: (fnName: any, fnParams: any, fnBody: any) => boolean;
 * }}
 */
const SetFunctionDeps = {
    libExports: null,
    _setFunction: () => false,
};

/**
 * Set a custom function
 *
 * @example
 *     nerdamer.setFunction('f',['x'], 'x^2+2');
 *     OR nerdamer.setFunction('f(x)=x^2+2');
 *     OR function custom(x , y) {
 *     return x + y;
 *     }
 *     nerdamer.setFunction(custom);
 *
 * @param {string | Function} fnName - The name of the function
 * @param {string[] | undefined} fnParams - A list containing the parameter name of the functions
 * @param {string | undefined} fnBody - The body of the function
 * @returns {any} Returns nerdamer if succeeded and throws on fail
 */
function setFunction(fnName, fnParams, fnBody) {
    if (!SetFunctionDeps._setFunction(fnName, fnParams, fnBody)) {
        throw new Error('Failed to set function!');
    }
    return SetFunctionDeps.libExports;
}

// Clear Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses ClearDeps for dependency injection.

/**
 * Dependencies for clear function. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     libExports: any;
 *     EXPRESSIONS: any[];
 * }}
 */
const ClearDeps = {
    libExports: null,
    EXPRESSIONS: [],
};

/**
 * Clear expressions from history
 *
 * @param {number | 'all' | 'last' | 'first'} equationNumber - The number of the equation to clear. If 'all' is supplied
 *   then all equations are cleared
 * @param {boolean} [keepExpressionsFixed] - Use true if you don't want to keep EXPRESSIONS length fixed
 * @returns {any} Returns the nerdamer object for chaining
 */
function clear(equationNumber, keepExpressionsFixed = false) {
    if (/** @type {unknown} */ (equationNumber) === 'all') {
        ClearDeps.EXPRESSIONS.length = 0;
    } else if (/** @type {unknown} */ (equationNumber) === 'last') {
        ClearDeps.EXPRESSIONS.pop();
    } else if (/** @type {unknown} */ (equationNumber) === 'first') {
        ClearDeps.EXPRESSIONS.shift();
    } else {
        const index = equationNumber ? /** @type {number} */ (equationNumber) - 1 : ClearDeps.EXPRESSIONS.length;
        keepExpressionsFixed === true
            ? (ClearDeps.EXPRESSIONS[index] = undefined)
            : remove(ClearDeps.EXPRESSIONS, index);
    }
    return ClearDeps.libExports;
}

// Register Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses RegisterDeps for dependency injection.

/**
 * Dependencies for the register function. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     libExports: any;
 *     Settings: any;
 *     functions: any;
 * }}
 */
const RegisterDeps = {
    libExports: null,
    Settings: null,
    functions: null,
};

/**
 * Register modules/addons with nerdamer
 *
 * @param {any} obj - The addon object or array of addon objects to register
 * @returns {void}
 */
function register(obj) {
    const core = RegisterDeps.libExports.getCore();

    if (isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (obj) {
                register(obj[i]);
            }
        }
    } else if (obj && RegisterDeps.Settings.exclude.indexOf(obj.name) === -1) {
        // Make sure all the dependencies are available
        if (obj.dependencies) {
            for (let i = 0; i < obj.dependencies.length; i++) {
                if (!core[obj.dependencies[i]]) {
                    throw new Error(format('{0} requires {1} to be loaded!', obj.name, obj.dependencies[i]));
                }
            }
        }
        // If no parent object is provided then the function does not have an address and cannot be called directly
        const parentObj = obj.parent;
        const fn = obj.build.call(core); // Call constructor to get function
        if (parentObj) {
            if (!core[parentObj]) {
                core[obj.parent] = {};
            }

            const refObj = parentObj === 'nerdamer' ? RegisterDeps.libExports : core[parentObj];
            // Attach the function to the core
            refObj[obj.name] = fn;
        }
        if (obj.visible) {
            RegisterDeps.functions[obj.name] = [fn, obj.numargs];
        } // Make the function available
    }
}

// Set Function ==================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses SettingsDeps for dependency injection.

/**
 * Dependencies for the set function. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     bigDec: any;
 *     Settings: any;
 *     functions: any;
 *     symfunction: any;
 *     NerdamerSymbol: any;
 * }}
 */
const SettingsDeps = {
    bigDec: null,
    Settings: null,
    functions: null,
    symfunction: null,
    NerdamerSymbol: null,
};

/**
 * Set the value of a setting
 *
 * @param {string | object} setting - The setting to be changed
 * @param {boolean | number | string} [value] - The value to set
 * @returns {void}
 */
function set(setting, value) {
    // Current options:
    // PARSE2NUMBER, suppress_errors
    if (typeof setting === 'object' && setting !== null) {
        const settingObj = /** @type {Record<string, any>} */ (setting);
        for (const x in settingObj) {
            if (!Object.hasOwn(settingObj, x)) {
                continue;
            }
            set(x, settingObj[x]);
        }
    }

    const disallowed = ['SAFE'];
    if (disallowed.indexOf(/** @type {string} */ (setting)) !== -1) {
        err(`Cannot modify setting: ${setting}`);
    }

    if (setting === 'PRECISION') {
        SettingsDeps.bigDec.set({ precision: value });
        SettingsDeps.Settings.PRECISION = /** @type {number} */ (value);

        // Avoid that nerdamer puts out garbage after 21 decimal place
        if (/** @type {number} */ (value) > 21) {
            set('USE_BIG', true);
        }
    } else if (setting === 'USE_LN' && value === true) {
        // Set log as LN
        SettingsDeps.Settings.LOG = 'LN';
        // Set log10 as log
        SettingsDeps.Settings.LOG10 = 'log';
        // Point the functions in the right direction
        SettingsDeps.functions.log = SettingsDeps.Settings.LOG_FNS.log10; // Log is now log10
        // the log10 function must be explicitly set
        SettingsDeps.functions.log[0] = function log10Wrapper(x) {
            if (x.isConstant()) {
                return new SettingsDeps.NerdamerSymbol(Math.log10(x));
            }
            return SettingsDeps.symfunction(SettingsDeps.Settings.LOG10, [x]);
        };
        SettingsDeps.functions.LN = SettingsDeps.Settings.LOG_FNS.log; // LN is now log

        // remove log10
        delete SettingsDeps.functions.log10;
    } else {
        SettingsDeps.Settings[/** @type {string} */ (setting)] = value;
    }
}

// UpdateAPI Function ==============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses UpdateAPIDeps for dependency injection.

/**
 * Dependencies for the updateAPI function. Initialized inside the IIFE with actual references.
 *
 * @type {{
 *     libExports: any;
 *     functions: any;
 *     parse: any;
 *     callfunction: any;
 *     Expression: any;
 * }}
 */
const UpdateAPIDeps = {
    libExports: null,
    functions: null,
    parse: null,
    callfunction: null,
    Expression: null,
};

/**
 * Makes internal functions available externally
 *
 * @param {boolean} [override] - Override the functions when calling updateAPI if it exists
 * @returns {void}
 */
function updateAPI(override = false) {
    // Map internal functions to external ones
    const linker = function linker(fname) {
        return function linkedFunction(...args) {
            for (let i = 0; i < args.length; i++) {
                args[i] = UpdateAPIDeps.parse(args[i]);
            }
            return new UpdateAPIDeps.Expression(block('PARSE2NUMBER', () => UpdateAPIDeps.callfunction(fname, args)));
        };
    };
    // Perform the mapping
    for (const x in UpdateAPIDeps.functions) {
        if (!(x in UpdateAPIDeps.libExports) || override) {
            UpdateAPIDeps.libExports[x] = linker(x);
        }
    }
}

// Err Function ==================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses ErrDeps for dependency injection of suppress_errors setting.

/**
 * Dependencies for the err function. Initialized inside the IIFE with actual Settings values.
 *
 * @type {{
 *     suppress_errors: boolean;
 * }}
 */
const ErrDeps = {
    suppress_errors: false,
};

/**
 * Use this when errors are suppressible
 *
 * @param {string} msg
 * @param {new (message?: string) => Error} [ErrorObj]
 */
function err(msg, ErrorObj = undefined) {
    if (!ErrDeps.suppress_errors) {
        if (ErrorObj) {
            throw new ErrorObj(msg);
        } else {
            throw new Error(msg);
        }
    }
}

// IsPrime Function =============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses IsPrimeDeps for dependency injection of PRIMES_SET.

/**
 * Dependencies for the isPrime function. Initialized inside the IIFE with actual PRIMES_SET reference.
 *
 * @type {{
 *     PRIMES_SET: Record<number, boolean>;
 * }}
 */
const IsPrimeDeps = {
    PRIMES_SET: {},
};

/**
 * Checks if number is a prime number
 *
 * @param {number} n - The number to be checked
 * @returns {boolean}
 */
function isPrime(n) {
    if (n in IsPrimeDeps.PRIMES_SET) {
        return true;
    }
    const q = Math.floor(Math.sqrt(n));
    for (let i = 2; i <= q; i++) {
        if (n % i === 0) {
            return false;
        }
    }
    return true;
}

// Timeout Functions ===============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses TimeoutDeps for shared state and dependency injection of Settings.TIMEOUT.

/**
 * Dependencies for the timeout functions. Contains shared state and is initialized inside the IIFE.
 *
 * @type {{
 *     starttime: number;
 *     timeout: number;
 *     TIMEOUT: number;
 * }}
 */
const TimeoutDeps = {
    starttime: 0,
    timeout: 0,
    TIMEOUT: 800,
};

/** Arms the timeout mechanism with current time and timeout setting */
function armTimeout() {
    TimeoutDeps.starttime = Date.now();
    TimeoutDeps.timeout = TimeoutDeps.TIMEOUT;
}

/** Disarms the timeout mechanism */
function disarmTimeout() {
    TimeoutDeps.starttime = 0;
}

/**
 * Checks if timeout has been exceeded and throws if so
 *
 * @throws {Error} If timeout has been exceeded
 */
function checkTimeout() {
    if (TimeoutDeps.starttime !== 0 && Date.now() > TimeoutDeps.starttime + TimeoutDeps.timeout) {
        throw new Error('timeout');
    }
}

// PrimeFactors Function ============================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Uses PrimeFactorsDeps for dependency injection of PRIMES and PRIMES_SET.

/**
 * Dependencies for the primeFactors function. Initialized inside the IIFE.
 *
 * @type {{
 *     PRIMES: number[];
 *     PRIMES_SET: Record<number, boolean>;
 * }}
 */
const PrimeFactorsDeps = {
    PRIMES: [],
    PRIMES_SET: {},
};

/**
 * Calculates prime factors for a number. It first checks if the number is a prime number. If it's not then it will
 * calculate all the primes for that number.
 *
 * @param {number} num
 * @returns {number[]}
 */
function primeFactors(num) {
    checkTimeout();

    if (isPrime(num)) {
        return [num];
    }

    let l = num;
    let i = 1;
    const factors = [];
    const epsilon = 2.2204460492503130808472633361816e-16;
    while (i < l) {
        checkTimeout();
        const quotient = num / i;
        const whole = Math.floor(quotient);
        const remainder = quotient - whole;

        if (remainder <= epsilon && i > 1) {
            // If the prime wasn't found but calculated then save it and
            // add it as a factor.
            if (isPrime(i)) {
                if (!PrimeFactorsDeps.PRIMES_SET[i]) {
                    PrimeFactorsDeps.PRIMES.push(i);
                    PrimeFactorsDeps.PRIMES_SET[i] = true;
                }
                factors.push(i);
            }

            // Check if the remainder is a prime
            if (isPrime(whole)) {
                factors.push(whole);
                break;
            }

            l = whole;
        }
        i++;
    }

    return factors.sort((a, b) => a - b);
}

/**
 * Generates prime numbers up to a specified number
 *
 * @param {number} upto
 */
function generatePrimes(upto) {
    // Get the last prime in the array
    const lastPrime = PrimeFactorsDeps.PRIMES[PrimeFactorsDeps.PRIMES.length - 1] || 2;
    // No need to check if we've already encountered the number. Just check the cache.
    for (let i = lastPrime; i < upto; i++) {
        if (isPrime(i)) {
            PrimeFactorsDeps.PRIMES.push(i);
        }
        PrimeFactorsDeps.PRIMES_SET[i] = true;
    }
}

// Block Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via BlockDeps which is set by the IIFE after initialization.

/**
 * Dependency container for block function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     Settings: Record<string, any>;
 * }}
 */
const BlockDeps = {
    Settings: {},
};

/**
 * Creates a temporary block in which one of the global settings is temporarily modified while the function is called.
 * For instance if you want to parse directly to a number rather than have a symbolic answer for a period you would set
 * PARSE2NUMBER to true in the block.
 *
 * @example
 *     block('PARSE2NUMBER', function(){//symbol being parsed to number}, true);
 *
 * @param {string} setting - The setting being accessed
 * @param {Function} f
 * @param {boolean} [opt] - The value of the setting in the block
 * @param {unknown} [obj] - The obj of interest. Usually a NerdamerSymbol but could be any object
 * @returns {any}
 */
function block(setting, f, opt = undefined, obj = undefined) {
    const currentSetting = BlockDeps.Settings[setting];
    BlockDeps.Settings[setting] = opt === undefined ? true : !!opt;
    const retval = f.call(obj);
    BlockDeps.Settings[setting] = currentSetting;
    return retval;
}

// Evaluate Function ================================================================
// Extracted outside IIFE to enable proper TypeScript type inference.
// Dependencies are injected via EvaluateDeps which is set by the IIFE after initialization.

/**
 * Dependency container for evaluate function. Populated by the IIFE during initialization.
 *
 * @type {{
 *     _: { parse: Function };
 * }}
 */
const EvaluateDeps = {
    _: { parse: () => {} },
};

/**
 * As the name states. It forces evaluation of the expression
 *
 * @param {any} symbol
 * @param {Record<string, any>} [o]
 * @returns {any}
 */
function evaluate(symbol, o = undefined) {
    return block('PARSE2NUMBER', () => EvaluateDeps._.parse(symbol, o), true);
}

const nerdamer = (function initNerdamerCore(imports) {
    // Version ======================================================================
    const _version = '1.1.16';

    // Import bigInt
    const { bigInt } = imports;
    const { bigDec } = imports;

    // NerdamerSet the precision to js precision
    bigDec.set({
        precision: 250,
    });

    const Groups = {};

    // Import constants
    const { PRIMES } = imports.constants;
    const { PRIMES_SET } = imports.constants;

    // Settings =====================================================================
    const CUSTOM_OPERATORS = {};

    const Settings = {
        // Enables/Disables call peekers. False means callPeekers are disabled and true means callPeekers are enabled.
        callPeekers: false,

        // The max number up to which to cache primes. Making this too high causes performance issues
        init_primes: 1000,

        exclude: [],
        // If you don't care about division by zero for example then this can be set to true.
        // Has some nasty side effects so choose carefully.
        suppress_errors: false,
        // The global used to invoke the libary to parse to a number. Normally cos(9) for example returns
        // cos(9) for convenience but parse to number will always try to return a number if set to true.
        PARSE2NUMBER: false,
        // This flag forces the a clone to be returned when add, subtract, etc... is called
        SAFE: false,
        // The symbol to use for imaginary symbols
        IMAGINARY: 'i',
        // The modules used to link numeric function holders
        /** @type {any[]} */
        FUNCTION_MODULES: [Math],
        // Allow certain characters
        ALLOW_CHARS: ['π'],
        // Allow nerdamer to convert multi-character variables
        USE_MULTICHARACTER_VARS: true,
        // Allow changing of power operator
        POWER_OPERATOR: '^',
        // Function catch regex
        FUNCTION_REGEX: /^\s*(?<fnName>[a-z_][a-z0-9_]*)\((?<fnArgs>[a-z0-9_,\s]*)\)\s*:?=\s*(?<fnBody>.+)\s*$/iu,
        // The variable validation regex
        // VALIDATION_REGEX: /^[a-z_][a-z\d\_]*$/i
        VALIDATION_REGEX:
            /^[a-z_αAβBγΓδΔϵEζZηHθΘιIκKλΛμMνNξΞoOπΠρPσΣτTυϒϕΦχXψΨωΩ∞][0-9a-z_αAβBγΓδΔϵEζZηHθΘιIκKλΛμMνNξΞoOπΠρPσΣτTυϒϕΦχXψΨωΩ]*$/iu,
        // The regex used to determine which characters should be included in implied multiplication
        IMPLIED_MULTIPLICATION_REGEX:
            /(?<coeff>[+\-/*]*[0-9]+)(?<vars>[a-z_αAβBγΓδΔϵEζZηHθΘιIκKλΛμMνNξΞoOπΠρPσΣτTυϒϕΦχXψΨωΩ]+[+\-/*]*)/giu,
        // Aliases
        ALIASES: {
            π: 'pi',
            '∞': 'Infinity',
        },
        POSITIVE_MULTIPLIERS: false,
        // Cached items
        CACHE: {},
        // Print out warnings or not
        SILENCE_WARNINGS: false,
        // Precision
        PRECISION: 21,
        // The Expression defaults to this value for decimal places
        EXPRESSION_DECP: 19,
        // The text function defaults to this value for decimal places
        DEFAULT_DECP: 16,
        // Function mappings
        VECTOR: 'vector',
        PARENTHESIS: 'parens',
        SQRT: 'sqrt',
        ABS: 'abs',
        FACTORIAL: 'factorial',
        DOUBLEFACTORIAL: 'dfactorial',
        // Reference pi and e (imported from constants.js)
        LONG_PI: imports.constants.LONG_PI,
        LONG_E: imports.constants.LONG_E,
        PI: Math.PI,
        E: Math.E,
        LOG: 'log',
        LOG10: 'log10',
        LOG10_LATEX: 'log_{10}',
        LOG2: 'log2',
        LOG2_LATEX: 'log_{2}',
        LOG1P: 'log1p',
        LOG1P_LATEX: 'ln\\left( 1 + {0} \\right)',
        MAX_EXP: 200000,
        // The number of scientific place to round to
        SCIENTIFIC_MAX_DECIMAL_PLACES: 14,
        // True if ints should not be converted to
        SCIENTIFIC_IGNORE_ZERO_EXPONENTS: true,
        // Exponent (absolute value) from which to switch from decimals to scientific in "decimals_or_scientific" mode
        SCIENTIFIC_SWITCH_FROM_DECIMALS_MIN_EXPONENT: 7,
        // No simplify() or solveFor() should take more ms than this
        TIMEOUT: 800,
    };

    (function initSettingsCache() {
        Settings.CACHE.roots = {};
        const x = 40;
        const y = 40;
        for (let i = 2; i <= x; i++) {
            for (let j = 2; j <= y; j++) {
                const nthpow = bigInt(i).pow(j);
                Settings.CACHE.roots[`${nthpow}-${j}`] = i;
            }
        }
    })();

    // Timeout functions are now defined outside IIFE
    // Initialize TimeoutDeps with Settings.TIMEOUT via getter
    Object.defineProperty(TimeoutDeps, 'TIMEOUT', {
        get: () => Settings.TIMEOUT,
        configurable: true,
    });

    // Forward declarations for variables that are defined later but used in earlier functions
    // These use 'let' to allow reassignment when the actual definitions occur
    /** @type {ParserType | null} */
    let _ = null; // Parser instance, defined at line ~10867
    // block is now defined outside IIFE
    // evaluate is now defined outside IIFE
    let LaTeX = null; // LaTeX object, defined at line ~11020
    let C = null; // Math2 object, Defined at line ~1745
    let Fraction = null; // Fraction object, Defined at line ~10871
    let Build = null; // Build object, Defined at line ~12723
    let isSymbol = null; // IsSymbol function, Defined at line ~478
    // firstObject is now defined outside IIFE
    // InvalidVariableNameError is now defined outside IIFE

    // Add the groups. These have been reorganized as of v0.5.1 to make CP the highest group
    // The groups that help with organizing during parsing. Note that for FN is still a function even
    // when it's raised to a symbol, which typically results in an EX
    const N = (Groups.N = 1); // A number
    const P = (Groups.P = 2); // A number with a rational power e.g. 2^(3/5).
    const S = (Groups.S = 3); // A single variable e.g. x.
    const EX = (Groups.EX = 4); // An exponential
    const FN = (Groups.FN = 5); // A function
    const PL = (Groups.PL = 6); // A symbol/expression having same name with different powers e.g. 1/x + x^2
    const CB = (Groups.CB = 7); // A symbol/expression composed of one or more variables through multiplication e.g. x*y
    const CP = (Groups.CP = 8); // A symbol/expression composed of one variable and any other symbol or number x+1 or x+y

    const CONST_HASH = (Settings.CONST_HASH = '#');

    const { PARENTHESIS } = Settings;

    const { SQRT } = Settings;

    const { ABS } = Settings;

    const { FACTORIAL } = Settings;

    const { DOUBLEFACTORIAL } = Settings;

    // The storage container "memory" for parsed expressions
    const EXPRESSIONS = [];

    // Variables
    const VARS = {};

    // The container used to store all the reserved functions
    const RESERVED = [];

    const WARNINGS = [];

    const USER_FUNCTIONS = [];

    // Err is now defined outside IIFE
    // Initialize ErrDeps with Settings values via getter
    Object.defineProperty(ErrDeps, 'suppress_errors', {
        get: () => Settings.suppress_errors,
        configurable: true,
    });

    // Utils ========================================================================

    // isReserved is now defined outside IIFE
    // Initialize IsReservedDeps with RESERVED array
    IsReservedDeps.RESERVED = RESERVED;

    // Warn is now defined outside IIFE
    // Initialize WarnDeps with WARNINGS array
    // Note: WarnDeps.WARNINGS is set to reference WARNINGS so changes are shared
    WarnDeps.WARNINGS = WARNINGS;
    // Use a getter to dynamically read SHOW_WARNINGS from Settings
    Object.defineProperty(WarnDeps, 'SHOW_WARNINGS', {
        get: () => Settings.SHOW_WARNINGS,
        configurable: true,
    });

    // NumExpressions is now defined outside IIFE
    // Use a getter because EXPRESSIONS can be reassigned (e.g., in clear('all'))
    Object.defineProperty(NumExpressionsDeps, 'EXPRESSIONS', {
        get: () => EXPRESSIONS,
        configurable: true,
    });

    // GetSetting is now defined outside IIFE
    // Initialize GetSettingDeps with Settings object reference
    GetSettingDeps.Settings = Settings;

    // Version is now defined outside IIFE
    // Initialize VersionDeps with _version and C (Core object)
    VersionDeps._version = _version;
    // C is assigned later in the IIFE - use getter for lazy access
    Object.defineProperty(VersionDeps, 'C', {
        get: () => C,
        configurable: true,
    });

    // ValidateName is now defined outside IIFE
    // Initialize ValidateNameDeps with Settings values
    ValidateNameDeps.ALLOW_CHARS = Settings.ALLOW_CHARS;
    ValidateNameDeps.VALIDATION_REGEX = Settings.VALIDATION_REGEX;

    // IsPrime is now defined outside IIFE
    // Initialize IsPrimeDeps with PRIMES_SET reference
    IsPrimeDeps.PRIMES_SET = PRIMES_SET;

    // PrimeFactors is now defined outside IIFE
    // Initialize PrimeFactorsDeps with PRIMES and PRIMES_SET references
    PrimeFactorsDeps.PRIMES = PRIMES;
    PrimeFactorsDeps.PRIMES_SET = PRIMES_SET;

    // GeneratePrimes is now defined outside IIFE (uses PrimeFactorsDeps)

    /**
     * Checks to see if a number or NerdamerSymbol is a fraction
     *
     * @param {number | string | NerdamerSymbolType} num
     * @returns {boolean}
     */
    const isFraction = function (num) {
        if (isSymbol(num)) {
            return isFraction(/** @type {NerdamerSymbolType} */ (num).multiplier.toDecimal());
        }
        return Number(num) % 1 !== 0;
    };

    /**
     * Checks to see if the object provided is a NerdamerSymbol
     *
     * @param {any} obj
     * @returns {obj is NerdamerSymbol}
     */
    isSymbol = function (obj) {
        return obj instanceof NerdamerSymbol;
    };

    /**
     * Checks to see if the object provided is an Expression
     *
     * @param {object} obj
     */
    const isExpression = function (obj) {
        return obj instanceof Expression;
    };

    /**
     * This method traverses the symbol structure and grabs all the variables in a symbol. The variable names are then
     * returned in alphabetical order.
     *
     * @param {NerdamerSymbolType | FracType} obj
     * @param {boolean} poly
     * @param {object} vars - An object containing the variables. Do not pass this in as it generated automatically. In
     *   the future this will be a Collector object.
     * @returns {string[]} - An array containing variable names
     */
    const variables = function (obj, poly = null, vars = null) {
        vars ||= {
            c: [],
            add(value) {
                if (this.c.indexOf(value) === -1 && isNaN(value)) {
                    this.c.push(value);
                }
            },
        };

        if (isSymbol(obj)) {
            const { group } = obj;
            const prevgroup = obj.previousGroup;
            if (group === EX) {
                variables(obj.power, poly, vars);
            }

            if (group === CP || group === CB || prevgroup === CP || prevgroup === CB) {
                for (const x in obj.symbols) {
                    if (!Object.hasOwn(obj.symbols, x)) {
                        continue;
                    }
                    variables(obj.symbols[x], poly, vars);
                }
            } else if (group === S || prevgroup === S) {
                // Very crude needs fixing. TODO
                if (!(obj.value === 'e' || obj.value === 'pi' || obj.value === Settings.IMAGINARY)) {
                    vars.add(obj.value);
                }
            } else if (group === PL || prevgroup === PL) {
                variables(firstObject(obj.symbols), poly, vars);
            } else if (group === EX) {
                if (!isNaN(Number(obj.value))) {
                    vars.add(obj.value);
                }
                variables(obj.power, poly, vars);
            } else if (group === FN && !poly && obj.args) {
                for (let i = 0; i < obj.args.length; i++) {
                    variables(obj.args[i], poly, vars);
                }
            }
        }

        return vars.c.sort();
    };

    /**
     * Returns the sum of an array
     *
     * @param {Array} arr
     * @param {boolean} toNumber
     * @returns {NerdamerSymbol | number}
     */
    const arraySum = function (arr, toNumber) {
        let sum = new NerdamerSymbol(0);
        for (let i = 0; i < arr.length; i++) {
            const x = arr[i];
            // Convert to symbol if not
            sum = _.add(sum, isSymbol(x) ? x : _.parse(x));
        }

        return toNumber ? Number(sum) : sum;
    };

    /**
     * Separates out the variables into terms of variabls. e.g. x+y+x_y+sqrt(2)+pi returns {x: x, y: y, x y: x_y,
     * constants: sqrt(2)+pi
     *
     * @param {any} symbol
     * @param {any} o
     * @returns {undefined}
     * @throws {Error} For exponentials
     */
    const separate = function (symbol, o) {
        symbol = _.expand(symbol);
        o ||= {};
        const insert = function (key, sym) {
            o[key] ||= new NerdamerSymbol(0);
            o[key] = _.add(o[key], sym.clone());
        };
        symbol.each(x => {
            if (x.isConstant('all')) {
                insert('constants', x);
            } else if (x.group === S) {
                insert(x.value, x);
            } else if (x.group === FN && (x.fname === ABS || x.fname === '')) {
                separate(x.args[0]);
            } else if (x.group === EX || x.group === FN) {
                // Todo: gm: this occurs with sqrt(a+1)
                // Do nothing - skip EX and FN groups
            } else {
                insert(variables(x).join(' '), x);
            }
        });

        return o;
    };

    /**
     * Fills holes in an array with zero symbol or generates one with n zeroes
     *
     * @param {Array} arr
     * @param {number} n
     */
    const fillHoles = function (arr, n) {
        n ||= arr.length;
        for (let i = 0; i < n; i++) {
            const sym = arr[i];
            if (!sym) {
                arr[i] = new NerdamerSymbol(0);
            }
        }
        return arr;
    };

    /**
     * Checks to see if the object provided is a Vector
     *
     * @param {object} obj
     * @returns {obj is Vector}
     */
    const isVector = function (obj) {
        return obj instanceof Vector;
    };

    // IsCollection is now defined outside IIFE

    /**
     * Checks to see if the object provided is a Matrix
     *
     * @param {object} obj
     * @returns {obj is Matrix}
     */
    const isMatrix = function (obj) {
        return obj instanceof Matrix;
    };

    // IsSet is now defined outside IIFE

    // isNumericSymbol is now defined outside IIFE
    // Initialize IsNumericSymbolDeps with Groups constants
    IsNumericSymbolDeps.N = N;
    IsNumericSymbolDeps.P = P;

    // IsVariableSymbol is now defined outside IIFE
    // Initialize IsVariableSymbolDeps with Groups constants
    IsVariableSymbolDeps.S = S;

    /**
     * @param {number | NerdamerSymbol} obj
     * @returns {boolean}
     */
    const isNegative = function (obj) {
        if (isSymbol(obj)) {
            return obj.multiplier.lessThan(0);
        }
        return obj < 0;
    };
    /**
     * A helper function to replace parts of string
     *
     * @param {string} str - The original string
     * @param {number} from - The starting index
     * @param {number} to - The ending index
     * @param {string} withStr - The replacement string
     * @returns {string} - A formatted string
     */
    /**
     * Generates an array with values within a range. Multiplies by a step if provided
     *
     * @param {number} start
     * @param {number} end
     * @param {number} step
     */
    /**
     * Returns an array of all the keys in an array
     *
     * @param {object} obj
     * @returns {Array}
     */
    // keys is now defined outside IIFE

    // firstObject is defined outside IIFE

    /**
     * Substitutes out variables for two symbols, parses them to a number and them compares them numerically
     *
     * @param {NerdamerSymbolType} sym1
     * @param {NerdamerSymbolType} sym2
     * @param {string[]} vars - An optional array of variables to use
     * @returns {boolean}
     */
    const compare = function (sym1, sym2, vars) {
        const n = 5; // A random number between 1 and 5 is good enough
        /** @type {Record<string, NerdamerSymbol>} */
        const scope = {}; // Scope object with random numbers generated using vars
        let comparison;
        for (let i = 0; i < vars.length; i++) {
            scope[vars[i]] = new NerdamerSymbol(Math.floor(Math.random() * n) + 1);
        }
        block('PARSE2NUMBER', () => {
            comparison = _.parse(sym1, scope).equals(_.parse(sym2, scope));
        });
        return comparison;
    };

    /**
     * Is used to set a user defined function using the function assign operator and also is used to set a user defined
     * JavaScript function using the function assign operator
     *
     * @param {string | Function} fnName
     * @param {string[]} [fnParams]
     * @param {string} [fnBody]
     * @returns {boolean}
     */
    const _setFunction = function (fnName, fnParams, fnBody) {
        if (!fnParams) {
            const fnNameType = typeof fnName;

            // Option setFunction('f(x)=x^2+2'), setFunction('f(x):=x^2+2')
            if (fnNameType === 'string') {
                const fnNameStr = /** @type {string} */ (fnName);
                if (!/:?=/u.test(fnNameStr)) {
                    return false;
                }

                const match = Settings.FUNCTION_REGEX.exec(fnNameStr);
                if (!match) {
                    return false;
                }
                const [, fName, fParams, fBody] = match;
                fnName = fName;
                fnParams = fParams.split(',').map(arg => arg.trim());
                fnBody = fBody;
            }

            // Option setFunction(function fox(x) { return x^2; })
            else if (fnNameType === 'function') {
                const jsFunction = /** @type {Function} */ (fnName);
                const jsName = jsFunction.name;
                validateName(jsName);
                if (!isReserved(jsName)) {
                    C.Math2[jsName] = jsFunction;
                    _.functions[jsName] = [undefined, jsFunction.length];

                    if (!USER_FUNCTIONS.includes(jsName)) {
                        USER_FUNCTIONS.push(jsName);
                    }
                    return true;
                }
                return false;
            } else {
                return false;
            }
        }

        fnName = /** @type {string} */ (fnName).trim();
        validateName(fnName);

        // Option setFunction('f(x)', ['x'], 'x^2+2') or setFunction('f(x)=x^2+2'), setFunction('f(x):=x^2+2')
        if (!isReserved(fnName)) {
            fnParams ||= variables(_.parse(fnBody));
            fnParams = fnParams.map(p => p.trim());
            // The function gets set to PARSER.mapped function which is just
            // a generic function call.
            _.functions[/** @type {string} */ (fnName)] = [
                _.mappedFunction,
                fnParams.length,
                {
                    name: fnName,
                    params: fnParams,
                    body: fnBody,
                },
            ];

            if (!USER_FUNCTIONS.includes(fnName)) {
                USER_FUNCTIONS.push(fnName);
            }

            return true;
        }
        return false;
    };

    /** Clears all user defined functions */
    const _clearFunctions = function () {
        for (const name of USER_FUNCTIONS) {
            delete C.Math2[name];
            delete _.functions[name];
        }
    };

    /**
     * Gets nth roots of a number
     *
     * @param {NerdamerSymbolType} symbol
     * @returns {Vector}
     */
    const nroots = function (symbol) {
        let a;
        let b;
        let _roots;

        if (symbol.group === FN && symbol.fname === '') {
            a = NerdamerSymbol.unwrapPARENS(_.parse(symbol).toLinear());
            b = _.parse(symbol.power);
        } else if (symbol.group === P) {
            a = _.parse(symbol.value);
            b = _.parse(symbol.power);
        }

        if (a && b && a.group === N && b.group === N && a.multiplier.isNegative()) {
            _roots = [];

            const parts = NerdamerSymbol.toPolarFormArray(evaluate(symbol));
            const r = parts[0];

            // Var r = _.parse(a).abs().toString();

            // https://en.wikipedia.org/wiki/De_Moivre%27s_formula
            const x = _.arg(a);
            const n = b.multiplier.den.toString();
            const p = b.multiplier.num.toString();

            const formula = '(({0})^({1})*(cos({3})+({2})*sin({3})))^({4})';

            for (let i = 0; i < Number(n); i++) {
                const t = evaluate(_.parse(format('(({0})+2*pi*({1}))/({2})', x, i, n))).multiplier.toDecimal();
                _roots.push(evaluate(_.parse(format(formula, r, n, Settings.IMAGINARY, t, p))));
            }
            return Vector.fromArray(_roots);
        }
        if (symbol.isConstant(true, true)) {
            const sign = symbol.sign();
            const x = evaluate(symbol.abs());
            const root = _.sqrt(x);

            _roots = [root.clone(), root.negate()];

            if (sign < 0) {
                _roots = _roots.map(r => _.multiply(r, NerdamerSymbol.imaginary()));
            }
        } else {
            _roots = [_.parse(symbol)];
        }

        return Vector.fromArray(_roots);
    };

    /**
     * TODO: Pick a more descriptive name and better description Breaks a function down into it's parts wrt to a
     * variable, mainly coefficients Example a*x^2+b wrt x
     *
     * @param {NerdamerSymbolType} fn
     * @param {string} wrt
     * @param {boolean} asObj
     */
    const decomposeFn = function (fn, wrt, asObj) {
        wrt = String(wrt); // Convert to string
        let ax;
        let b;
        if (fn.group === CP) {
            const t = _.expand(fn.clone()).stripVar(wrt);
            ax = _.subtract(fn.clone(), t.clone());
            b = t;
        } else {
            ax = fn.clone();
        }
        const a = ax.stripVar(wrt);
        const x = _.divide(ax.clone(), a.clone());
        b ||= new NerdamerSymbol(0);
        if (asObj) {
            return {
                a,
                x,
                ax,
                b,
            };
        }
        return [a, x, ax, b];
    };
    /**
     * Is used for u-substitution. Gets a suitable u for substitution. If for instance a is used in the symbol then it
     * keeps going down the line until one is found that's not in use. If all letters are taken then it starts appending
     * numbers. IMPORTANT! It assumes that the substitution will be undone beore the user gets to interact with the
     * object again.
     *
     * @param {NerdamerSymbolType} symbol
     */
    const getU = function (symbol) {
        // Start with u
        const u = 'u'; // Start with u
        let v = u; // Init with u
        let c = 0; // Postfix number
        const vars = variables(symbol);
        // Make sure this variable isn't reserved and isn't in the variable list
        while (!(RESERVED.indexOf(v) === -1 && vars.indexOf(v) === -1)) {
            v = u + c++;
        }
        // Get an empty slot. It seems easier to just push but the
        // problem is that we may have some which are created by clearU
        for (
            let i = 0, l = RESERVED.length;
            i <= l;
            i++ // Reserved cannot equals false or 0 so we can safely check for a falsy type
        ) {
            if (!RESERVED[i]) {
                RESERVED[i] = v; // Reserve the variable
                break;
            }
        }
        return v;
    };

    // ClearU is now defined outside IIFE
    // Initialize ClearUDeps with RESERVED array reference
    ClearUDeps.RESERVED = RESERVED;

    /**
     * Gets all the variables in an array of Symbols
     *
     * @param {NerdamerSymbol[]} arr
     */
    const arrayGetVariables = function (arr) {
        let vars = variables(arr[0], null, null);

        // Get all variables
        for (let i = 1, l = arr.length; i < l; i++) {
            vars = vars.concat(variables(arr[i]));
        }
        // Remove duplicates
        vars = arrayUnique(vars).sort();

        // Done
        return vars;
    };

    // ReserveNames is now defined outside IIFE
    // Initialize ReserveNamesDeps with RESERVED array reference
    ReserveNamesDeps.RESERVED = RESERVED;

    // Block is now defined outside IIFE
    // Initialize BlockDeps with Settings reference
    BlockDeps.Settings = Settings;

    /**
     * Provide a mechanism for accessing functions directly. Not yet complete!!! Some functions will return undefined.
     * This can maybe just remove the function object at some point when all functions are eventually housed in the
     * global function object. Returns ALL parser available functions. Parser.functions may not contain all functions
     */
    const importFunctions = function () {
        const o = {};
        for (const x in _.functions) {
            if (!Object.hasOwn(_.functions, x)) {
                continue;
            }
            o[x] = _.functions[x][0];
        }
        return o;
    };

    /**
     * Returns the coefficients of a symbol given a variable. Given ax^2+b^x+c, it divides each nth term by x^n.
     *
     * @param {NerdamerSymbolType} symbol
     * @param {NerdamerSymbolType} wrt
     */
    const getCoeffs = function (symbol, wrt, _info) {
        const coeffs = [];
        // We loop through the symbols and stick them in their respective
        // containers e.g. y*x^2 goes to index 2
        symbol.each(term => {
            let coeff;
            let p;
            if (term.contains(wrt)) {
                // We want only the coefficient which in this case will be everything but the variable
                // e.g. a*b*x -> a*b if the variable to solve for is x
                coeff = term.stripVar(wrt);
                const x = _.divide(term.clone(), coeff.clone());
                p = x.power.toDecimal();
            } else {
                coeff = term;
                p = 0;
            }
            const e = coeffs[p];
            // If it exists just add it to it
            coeffs[p] = e ? _.add(e, coeff) : coeff;
        }, true);

        for (let i = 0; i < coeffs.length; i++) {
            coeffs[i] ||= new NerdamerSymbol(0);
        }
        // Fill the holes
        return coeffs;
    };

    // Evaluate is now defined outside IIFE
    // EvaluateDeps._ is set after parser initialization (see below where _ is assigned)

    /**
     * Converts an array to a vector. Consider moving this to Vector.fromArray
     *
     * @param {string[] | string | NerdamerSymbol | number | number[]} x
     */
    const convertToVector = function (x) {
        if (isArray(x)) {
            const vector = new Vector([]);
            for (let i = 0; i < x.length; i++) {
                vector.elements.push(convertToVector(x[i]));
            }
            return vector;
        }
        // Ensure that a nerdamer ready object is returned
        if (!isSymbol(x)) {
            return _.parse(x);
        }
        return x;
    };

    // GeneratePrimes is now defined outside IIFE

    // allNumbers is now defined outside IIFE
    // Initialize AllNumbersDeps with Groups constants
    AllNumbersDeps.N = N;

    /*
     * Checks if all arguments aren't just all number but if they
     * are constants as well e.g. pi, e.
     * @param {object} args
     */
    const allConstants = function (args) {
        for (let i = 0; i < args.length; i++) {
            if (args[i].isPi() || args[i].isE()) {
                continue;
            }
            if (!args[i].isConstant(true)) {
                return false;
            }
        }
        return true;
    };

    /**
     * Used to multiply two expression in expanded form
     *
     * @param {NerdamerSymbolType} a
     * @param {NerdamerSymbolType} b
     */
    const mix = function (a, b, opt) {
        // Flip them if b is a CP or PL and a is not
        if ((b.isComposite() && !a.isComposite()) || (b.isLinear() && !a.isLinear())) {
            [a, b] = [b, a];
        }
        // A temporary variable to hold the expanded terms
        let t = new NerdamerSymbol(0);
        if (a.isLinear()) {
            a.each(x => {
                // If b is not a PL or a CP then simply multiply it
                if (!b.isComposite()) {
                    const term = _.multiply(_.parse(x), _.parse(b));
                    t = _.add(t, _.expand(term, opt));
                }
                // Otherwise multiply out each term.
                else if (b.isLinear()) {
                    b.each(y => {
                        const term = _.multiply(_.parse(x), _.parse(y));
                        const expanded = _.expand(_.parse(term), opt);
                        t = _.add(t, expanded);
                    }, true);
                } else {
                    t = _.add(t, _.multiply(x, _.parse(b)));
                }
            }, true);
        } else {
            // Just multiply them together
            t = _.multiply(a, b);
        }

        // The expanded function is now t
        return t;
    };

    // Exceptions ===================================================================
    // All error classes are defined outside IIFE for proper TypeScript type inference:
    // DivisionByZero, ParseError, UndefinedError, OutOfFunctionDomainError,
    // MaximumIterationsReached, NerdamerTypeError, ParityError, OperatorError,
    // OutOfRangeError, DimensionError, InvalidVariableNameError, ValueLimitExceededError,
    // NerdamerValueError, SolveError, InfiniteLoopError, UnexpectedTokenError

    const exceptions = {
        DivisionByZero,
        ParseError,
        OutOfFunctionDomainError,
        UndefinedError,
        MaximumIterationsReached,
        NerdamerTypeError,
        ParityError,
        OperatorError,
        OutOfRangeError,
        DimensionError,
        InvalidVariableNameError,
        ValueLimitExceededError,
        NerdamerValueError,
        SolveError,
        InfiniteLoopError,
        UnexpectedTokenError,
    };
    // Math2 ========================================================================
    // This object holds additional functions for nerdamer. Think of it as an extension of the Math object.
    // I really don't like touching objects which aren't mine hence the reason for Math2. The names of the
    // functions within are pretty self-explanatory.
    // NOTE: DO NOT USE INLINE COMMENTS WITH THE MATH2 OBJECT! THIS BREAK DURING COMPILATION OF BUILDFUNCTION.
    const Math2 = {
        csc(x) {
            return 1 / Math.sin(x);
        },
        sec(x) {
            return 1 / Math.cos(x);
        },
        cot(x) {
            return 1 / Math.tan(x);
        },
        acsc(x) {
            return Math.asin(1 / x);
        },
        asec(x) {
            return Math.acos(1 / x);
        },
        acot(x) {
            return Math.PI / 2 - Math.atan(x);
        },
        // https://gist.github.com/jiggzson/df0e9ae8b3b06ff3d8dc2aa062853bd8
        erf(x) {
            const t = 1 / (1 + 0.5 * Math.abs(x));
            const result =
                1 -
                t *
                    Math.exp(
                        -x * x -
                            1.26551223 +
                            t *
                                (1.00002368 +
                                    t *
                                        (0.37409196 +
                                            t *
                                                (0.09678418 +
                                                    t *
                                                        (-0.18628806 +
                                                            t *
                                                                (0.27886807 +
                                                                    t *
                                                                        (-1.13520398 +
                                                                            t *
                                                                                (1.48851587 +
                                                                                    t *
                                                                                        (-0.82215223 +
                                                                                            t * 0.17087277))))))))
                    );
            return x >= 0 ? result : -result;
        },
        diff(f) {
            const h = 0.001;

            const derivative = function (x) {
                return (f(x + h) - f(x - h)) / (2 * h);
            };

            return derivative;
        },
        median(...values) {
            values.sort((a, b) => a - b);

            const half = Math.floor(values.length / 2);

            if (values.length % 2) {
                return values[half];
            }

            return (values[half - 1] + values[half]) / 2.0;
        },
        /*
         * Reverses continued fraction calculation
         * @param {obj} contd
         * @returns {number}
         */
        fromContinued(contd) {
            const arr = contd.fractions.slice();
            let e = 1 / arr.pop();
            for (let i = 0, l = arr.length; i < l; i++) {
                e = 1 / (arr.pop() + e);
            }
            return contd.sign * (contd.whole + e);
        },
        /*
         * Calculates continued fractions
         * @param {number} n
         * @param {number} x The number of places
         * @returns {number}
         */
        continuedFraction(n, x) {
            x ||= 20;
            const sign = Math.sign(n); /* Store the sign*/
            const absn = Math.abs(n); /* Get the absolute value of the number*/
            const whole = Math.floor(absn); /* Get the whole*/
            let ni = absn - whole; /* Subtract the whole*/
            let c = 0; /* The counter to keep track of iterations*/
            let done = false;
            const epsilon = 1e-14;
            const max = 1e7;
            let e;
            let w;
            const retval = {
                whole,
                sign,
                fractions: [],
            };
            /* Start calculating*/
            while (!done && ni !== 0) {
                /* Invert and get the whole*/
                e = 1 / ni;
                w = Math.floor(e);
                if (w > max) {
                    /* This signals that we may have already gone too far*/
                    const d = Math2.fromContinued(retval) - n;
                    if (d <= Number.EPSILON) {
                        break;
                    }
                }
                /* Add to result*/
                retval.fractions.push(w);
                /* Move the ni to the decimal*/
                ni = e - w;
                /* Ni should always be a decimal. If we have a whole number then we're in the rounding errors*/
                if (ni <= epsilon || c >= x - 1) {
                    done = true;
                }
                c++;
            }
            /* Cleanup 1/(n+1/1) = 1/(n+1) so just move the last digit one over if it's one*/
            let idx = retval.fractions.length - 1;
            if (retval.fractions[idx] === 1) {
                retval.fractions.pop();
                /* Increase the last one by one*/
                retval.fractions[--idx]++;
            }
            return retval;
        },
        bigpow(n, p) {
            if (!(n instanceof Frac)) {
                n = Frac.create(n);
            }
            if (!(p instanceof Frac)) {
                p = Frac.create(p);
            }
            const retval = new Frac(0);
            if (p.isInteger()) {
                retval.num = n.num.pow(p.toString());
                retval.den = n.den.pow(p.toString());
            } else {
                const num = Frac.create(n.num ** p.num);
                const den = Frac.create(n.den ** p.num);

                retval.num = Math2.nthroot(num, p.den.toString());
                retval.den = Math2.nthroot(den, p.den);
            }
            return retval;
        },
        // http://stackoverflow.com/questions/15454183/how-to-make-a-function-that-computes-the-factorial-for-numbers-with-decimals
        gamma(z) {
            const g = 7;
            const gammaCoeffs = [
                0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
                12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
            ];
            if (z < 0.5) {
                return Math.PI / (Math.sin(Math.PI * z) * Math2.gamma(1 - z));
            }
            z -= 1;

            let x = gammaCoeffs[0];
            for (let i = 1; i < g + 2; i++) {
                x += gammaCoeffs[i] / (z + i);
            }

            const t = z + g + 0.5;
            return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
        },
        // Factorial
        bigfactorial(x) {
            let retval = new bigInt(1);
            for (let i = 2; i <= x; i++) {
                retval = retval.times(i);
            }
            return new Frac(retval);
        },
        // https://en.wikipedia.org/wiki/Logarithm#Calculation
        bigLog(x) {
            const CACHE = imports.constants.BIG_LOG_CACHE;
            if (CACHE[x]) {
                return Frac.quick.apply(null, CACHE[x].split('/'));
            }
            x = new Frac(x);
            const n = 80;
            let retval = new Frac(0);
            const a = x.subtract(new Frac(1));
            const b = x.add(new Frac(1));
            for (let i = 0; i < n; i++) {
                const t = new Frac(2 * i + 1);
                const k = Math2.bigpow(a.divide(b), t);
                const r = t.clone().invert().multiply(k);
                retval = retval.add(r);
            }
            return retval.multiply(new Frac(2));
        },
        // The factorial function but using the big library instead
        factorial(x) {
            const isInteger = x % 1 === 0;

            /* Factorial for negative integers is complex infinity according to Wolfram Alpha*/
            if (isInteger && x < 0) {
                return NaN;
            }

            if (!isInteger) {
                return Math2.gamma(x + 1);
            }

            let retval = 1;
            for (let i = 2; i <= x; i++) {
                retval *= i;
            }
            return retval;
        },
        // Double factorial
        // http://mathworld.wolfram.com/DoubleFactorial.html
        dfactorial(x) {
            /* The return value*/
            /** @type {FracType | number} */
            let r = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(1)));
            if (isInt(x)) {
                const isEven = x % 2 === 0;
                /* If x = isEven then n = x/2 else n = (x-1)/2*/
                const n = isEven ? x / 2 : (x + 1) / 2;
                /* Start the loop*/
                if (isEven) {
                    for (let i = 1; i <= n; i++) {
                        r = /** @type {FracType} */ (r).multiply(new Frac(2).multiply(new Frac(i)));
                    }
                } else {
                    for (let i = 1; i <= n; i++) {
                        r = /** @type {FracType} */ (r).multiply(
                            new Frac(2).multiply(new Frac(i)).subtract(new Frac(1))
                        );
                    }
                }
            } else {
                /* Not yet extended to bigNum*/
                r =
                    2 ** ((1 + 2 * x - Math.cos(Math.PI * x)) / 4) *
                    Math.PI ** ((Math.cos(Math.PI * x) - 1) / 4) *
                    Math2.gamma(1 + x / 2);
            }

            /* Done*/
            return r;
        },
        GCD(...rest) {
            const args = arrayUnique(rest.map(x => Math.abs(x))).sort();
            let a = Math.abs(args.shift());
            let n = args.length;

            while (n-- > 0) {
                let b = Math.abs(args.shift());
                while (true) {
                    a %= b;
                    if (a === 0) {
                        a = b;
                        break;
                    }
                    b %= a;
                    if (b === 0) {
                        break;
                    }
                }
            }
            return a;
        },
        QGCD(...args) {
            let a = args[0];
            for (let i = 1; i < args.length; i++) {
                const b = args[i];
                const sign = a.isNegative() && b.isNegative() ? -1 : 1;
                a = b.gcd(a);
                if (sign < 0) {
                    a.negate();
                }
            }
            return a;
        },
        LCM(a, b) {
            return (a * b) / Math2.GCD(a, b);
        },
        // Pow but with the handling of negative numbers
        // http://stackoverflow.com/questions/12810765/calculating-cubic-root-for-negative-number
        pow(b, e) {
            if (b < 0) {
                if (Math.abs(e) < 1) {
                    /* Nth root of a negative number is imaginary when n is even*/
                    if ((1 / e) % 2 === 0) {
                        return NaN;
                    }
                    return -(Math.abs(b) ** e);
                }
            }
            return b ** e;
        },
        factor(n) {
            n = Number(n);
            const sign = Math.sign(n); /* Store the sign*/
            /* move the number to absolute value*/
            n = Math.abs(n);
            const ifactors = Math2.ifactor(n);
            let factors = new NerdamerSymbol();
            factors.symbols = {};
            factors.group = CB;
            for (const x in ifactors) {
                if (!Object.hasOwn(ifactors, x)) {
                    continue;
                }
                const factor = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(1)));
                factor.group = P; /* Cheat a little*/
                factor.value = x;
                /** @type {NerdamerSymbolType} */
                const powerSym = /** @type {NerdamerSymbolType} */ (
                    /** @type {unknown} */ (new NerdamerSymbol(ifactors[x]))
                );
                factor.power = powerSym;
                factors.symbols[x] = factor;
            }
            factors.updateHash();

            if (n === 1) {
                factors = new NerdamerSymbol(n);
            }

            /* Put back the sign*/
            if (sign < 0) {
                factors.negate();
            }

            return factors;
        },
        /**
         * Uses trial division
         *
         * @param {number} n - The number being factored
         * @param {object} factors - The factors object
         * @returns {object}
         */
        sfactor(n, factors) {
            factors ||= {};
            const r = Math.floor(Math.sqrt(n));
            const lcprime = PRIMES[PRIMES.length - 1];
            /* A one-time cost... Hopefully ... And don't bother for more than a million*/
            /* takes too long*/
            if (r > lcprime && n < 1e6) {
                generatePrimes(r);
            }
            const l = PRIMES.length;
            for (let i = 0; i < l; i++) {
                const prime = PRIMES[i];
                /* Trial division*/
                while (n % prime === 0) {
                    n /= prime;
                    factors[prime] = (factors[prime] || 0) + 1;
                }
            }
            if (n > 1) {
                factors[n] = 1;
            }
            return factors;
        },
        /**
         * Pollard's rho
         *
         * @param {number} num
         * @returns {object}
         */
        ifactor(num) {
            const input = new bigInt(num);

            let n = new bigInt(String(num)); /* Convert to bigInt for safety*/

            if (n.equals(0)) {
                return { 0: 1 };
            }
            const sign = n.isNegative() ? -1 : 1;
            n = n.abs();
            let factors = {}; /* Factor object being returned.*/
            if (n.lt('65536')) {
                /* Less than 2^16 just use trial division*/
                factors = Math2.sfactor(n, factors);
            } else {
                const add = function (e) {
                    if (e.isPrime()) {
                        factors[e] = (factors[e] || 0) + 1;
                    } else {
                        factors = Math2.sfactor(e, factors);
                    }
                };

                try {
                    // NerdamerSet a safety
                    const max = 1e3;
                    const safetyCounter = { value: 0 };

                    const rho = function (c, currentN, safetyObj) {
                        let xf = new bigInt(c);
                        let cz = 2;
                        let x = new bigInt(c);
                        let factor = new bigInt(1);

                        while (factor.equals(1)) {
                            for (let i = 0; i <= cz && factor.equals(1); i++) {
                                // Trigger the safety
                                if (safetyObj.value++ > max) {
                                    throw new Error('stopping');
                                }

                                x = x.pow(2).add(1).mod(currentN);
                                factor = bigInt.gcd(x.minus(xf).abs(), currentN);
                            }

                            cz *= 2;
                            xf = x;
                        }
                        if (factor.equals(currentN)) {
                            return rho(c + 1, currentN, safetyObj);
                        }
                        return factor;
                    };

                    while (!n.abs().equals(1)) {
                        if (n.isPrime()) {
                            add(n);
                            break;
                        } else {
                            const factor = rho(2, n, safetyCounter);
                            add(factor);
                            /* Divide out the factor*/
                            n = n.divide(factor);
                        }
                    }
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    // Reset factors
                    factors = {};
                    add(input);
                }
            }

            /* Put the sign back*/
            if (sign === -1) {
                const sm = arrayMin(keys(factors)); /*/ get the smallest number*/
                factors[`-${sm}`] = factors[sm];
                delete factors[sm];
            }

            return factors;
        },
        // Factors a number into rectangular box. If sides are primes that this will be
        // their prime factors. e.g. 21 -> (7)(3), 133 -> (7)(19)
        boxfactor(n, max) {
            max ||= 200; // Stop after this number of iterations
            let c;
            let r;
            let d = Math.floor((5 / 12) * n); // The divisor
            let i = 0; // Number of iterations
            let safety = false;
            while (true) {
                c = Math.floor(n / d);
                r = n % d;
                if (r === 0) {
                    break;
                } // We're done
                if (safety) {
                    return [n, 1];
                }
                d = Math.max(r, d - r);
                i++;
                safety = i > max;
            }
            return [c, d, i];
        },
        fib(n) {
            let sign = Math.sign(n);
            n = Math.abs(n);
            sign = even(n) ? sign : Math.abs(sign);
            let a = 0;
            let b = 1;
            let f = 1;
            for (let i = 2; i <= n; i++) {
                f = a + b;
                a = b;
                b = f;
            }
            return f * sign;
        },
        mod(x, y) {
            return x % y;
        },
        // http://mathworld.wolfram.com/IntegerPart.html
        integer_part(x) {
            const sign = Math.sign(x);
            return sign * Math.floor(Math.abs(x));
        },
        simpson(f, a, b, step) {
            const getValue = function (fn, x, side) {
                let v = fn(x);
                const d = 0.000000000001;
                if (isNaN(v)) {
                    v = fn(side === 1 ? x + d : x - d);
                }
                return v;
            };

            step ||= 0.0001;
            // Calculate the number of intervals
            let n = Math.abs(Math.floor((b - a) / step));
            // Simpson's rule requires an even number of intervals. If it's not then add 1
            if (n % 2 !== 0) {
                n++;
            }
            // Get the interval size
            const dx = (b - a) / n;
            // Get x0
            let retval = getValue(f, a, 1);

            // Get the middle part 4x1+2x2+4x3 ...
            // but first set a flag to see if it's even or odd.
            // The first one is odd so we start there
            let isEvenIteration = false;
            // Get x1
            let xi = a + dx;
            // The coefficient
            let c;
            let k;
            // https://en.wikipedia.org/wiki/Simpson%27s_rule
            for (let i = 1; i < n; i++) {
                c = isEvenIteration ? 2 : 4;
                k = c * getValue(f, xi, 1);
                retval += k;
                // Flip the even flag
                isEvenIteration = !isEvenIteration;
                // Increment xi
                xi += dx;
            }

            // Add xn
            return (retval + getValue(f, xi, 2)) * (dx / 3);
        },
        /**
         * https://github.com/scijs/integrate-adaptive-simpson
         *
         * @param {Function} f - The function being integrated
         * @param {number} a - Lower bound
         * @param {number} b - Upper bound
         * @param {number} tol - Step width
         * @param {number} [maxdepth]
         * @returns {number | string}
         */
        num_integrate(f, a, b, tol, maxdepth) {
            if (maxdepth < 0) {
                throw new Error('max depth cannot be negative');
            }

            /* This algorithm adapted from pseudocode in:*/
            /* http://www.math.utk.edu/~ccollins/refs/Handouts/rich.pdf*/
            function adsimp(fn, lo, hi, fa, fm, fb, V0, tolerance, maxDepth, depth, state) {
                if (state.nanEncountered) {
                    return NaN;
                }
                const h = hi - lo;
                const f1 = fn(lo + h * 0.25);
                const f2 = fn(hi - h * 0.25);
                /* Simple check for NaN:*/
                if (isNaN(f1)) {
                    state.nanEncountered = true;
                    return undefined;
                }
                /* Simple check for NaN:*/
                if (isNaN(f2)) {
                    state.nanEncountered = true;
                    return undefined;
                }

                const sl = (h * (fa + 4 * f1 + fm)) / 12;
                const sr = (h * (fm + 4 * f2 + fb)) / 12;
                const s2 = sl + sr;
                const error = (s2 - V0) / 15;

                if (state.maxDepthCount > 1000 * maxDepth) {
                    return undefined;
                }

                if (depth > maxDepth) {
                    state.maxDepthCount++;
                    return s2 + error;
                }
                if (Math.abs(error) < tolerance) {
                    return s2 + error;
                }
                const m = lo + h * 0.5;
                const V1 = adsimp(fn, lo, m, fa, f1, fm, sl, tolerance * 0.5, maxDepth, depth + 1, state);
                if (isNaN(V1)) {
                    state.nanEncountered = true;
                    return NaN;
                }
                const V2 = adsimp(fn, m, hi, fm, f2, fb, sr, tolerance * 0.5, maxDepth, depth + 1, state);

                if (isNaN(V2)) {
                    state.nanEncountered = true;
                    return NaN;
                }

                return V1 + V2;
            }

            function integrate(fn, lo, hi, tolerance, maxDepth) {
                const state = {
                    maxDepthCount: 0,
                    nanEncountered: false,
                };

                if (tolerance === undefined) {
                    tolerance = 1e-9;
                }
                if (maxDepth === undefined) {
                    /* Issue #458 - This was lowered because of performance issues. */
                    /* This was suspected from before but is now confirmed with this issue*/
                    maxDepth = 45;
                }

                const fa = fn(lo);
                const fm = fn(0.5 * (lo + hi));
                const fb = fn(hi);

                const V0 = ((fa + 4 * fm + fb) * (hi - lo)) / 6;

                const result = adsimp(fn, lo, hi, fa, fm, fb, V0, tolerance, maxDepth, 1, state);

                if (state.maxDepthCount > 0) {
                    warn(
                        `integrate-adaptive-simpson: Warning: maximum recursion depth (${maxDepth}) reached ${
                            state.maxDepthCount
                        } times`
                    );
                }

                if (state.nanEncountered) {
                    throw new Error('Function does not converge over interval!');
                }

                return result;
            }
            /** @type {number} */
            let retval;

            try {
                retval = integrate(f, a, b, tol, maxdepth);
            } catch (e) {
                if (e.message === 'timeout') {
                    throw e;
                }
                /* Fallback to non-adaptive*/
                return Math2.simpson(f, a, b);
            }
            return nround(retval, 12);
        },
        // https://en.wikipedia.org/wiki/Trigonometric_integral
        // CosineIntegral
        Ci(x) {
            const n = 20;
            /* Roughly Euler–Mascheroni*/
            const g = 0.5772156649015329;
            let sum = 0;
            for (let i = 1; i < n; i++) {
                /* Cache 2n*/
                const n2 = 2 * i;
                sum += ((-1) ** i * x ** n2) / (n2 * Math2.factorial(n2));
            }
            return Math.log(x) + g + sum;
        },
        /* SineIntegral*/
        Si(x) {
            const n = 20;
            let sum = 0;
            for (let i = 0; i < n; i++) {
                const n2 = 2 * i;
                sum += ((-1) ** i * x ** (n2 + 1)) / ((n2 + 1) * Math2.factorial(n2 + 1));
            }
            return sum;
        },
        /* ExponentialIntegral*/
        Ei(x) {
            if (Number(x) === 0) {
                return -Infinity;
            }
            const n = 30;
            const g = 0.5772156649015329; /* Roughly Euler–Mascheroni*/
            let sum = 0;
            for (let i = 1; i < n; i++) {
                sum += x ** i / (i * Math2.factorial(i));
            }
            return g + Math.abs(Math.log(x)) + sum;
        },
        /* Hyperbolic Sine Integral*/
        /* http://mathworld.wolfram.com/Shi.html*/
        Shi(x) {
            const n = 30;
            let sum = 0;
            let k;
            let t;
            for (let i = 0; i < n; i++) {
                k = 2 * i;
                t = k + 1;
                sum += x ** t / (t * t * Math2.factorial(k));
            }
            return sum;
        },
        /* The cosine integral function*/
        Chi(x) {
            const dx = 0.001;
            const g = 0.5772156649015329;
            const f = function (t) {
                return (Math.cosh(t) - 1) / t;
            };
            return (
                Math.log(/** @type {number} */ (x)) +
                g +
                /** @type {number} */ (Math2.num_integrate(f, 0.002, /** @type {number} */ (x), dx))
            );
        },
        /* The log integral*/
        Li(x) {
            return Math2.Ei(Math2.bigLog(x));
        },
        /* The gamma incomplete function*/
        gamma_incomplete(n, xVal) {
            const t = n - 1;
            let sum = 0;
            const x = xVal || 0;
            for (let i = 0; i < t; i++) {
                sum += x ** i / Math2.factorial(i);
            }
            return Math2.factorial(t) * Math.exp(-x) * sum;
        },
        /*
         * Heaviside step function - Moved from Special.js (originally contributed by Brosnan Yuen)
         * Specification : http://mathworld.wolfram.com/HeavisideStepFunction.html
         * if x > 0 then 1
         * if x == 0 then 1/2
         * if x < 0 then 0
         */
        step(x) {
            if (x > 0) {
                return 1;
            }
            if (x < 0) {
                return 0;
            }
            return 0.5;
        },
        /*
         * Rectangle function - Moved from Special.js (originally contributed by Brosnan Yuen)
         * Specification : http://mathworld.wolfram.com/RectangleFunction.html
         * if |x| > 1/2 then 0
         * if |x| == 1/2 then 1/2
         * if |x| < 1/2 then 1
         */
        rect(x) {
            const absX = Math.abs(x);
            if (absX === 0.5) {
                return absX;
            }
            if (absX > 0.5) {
                return 0;
            }
            return 1;
        },
        /*
         * Sinc function - Moved from Special.js (originally contributed by Brosnan Yuen)
         * Specification : http://mathworld.wolfram.com/SincFunction.html
         * if x == 0 then 1
         * otherwise sin(x)/x
         */
        sinc(x) {
            if (x.equals(0)) {
                return 1;
            }
            return Math.sin(x) / x;
        },
        /*
         * Triangle function - Moved from Special.js (originally contributed by Brosnan Yuen)
         * Specification : http://mathworld.wolfram.com/TriangleFunction.html
         * if |x| >= 1 then 0
         * if |x| < then 1-|x|
         */
        tri(x) {
            x = Math.abs(x);
            if (x >= 1) {
                return 0;
            }
            return 1 - x;
        },
        // https://en.wikipedia.org/wiki/Nth_root_algorithm
        nthroot(A, n) {
            /* Make sure the input is of type Frac*/
            if (!(A instanceof Frac)) {
                A = new Frac(A.toString());
            }
            if (!(n instanceof Frac)) {
                n = new Frac(n.toString());
            }
            if (n.equals(1)) {
                return A;
            }
            /* Begin algorithm*/
            let xk = A.divide(new Frac(2)); /* X0*/
            const e = new Frac(1e-15);
            let dk;
            let dk0;
            let d0;
            const a = n.clone().invert();
            const b = n.subtract(new Frac(1));
            do {
                const powb = Math2.bigpow(xk, b);
                let dkDec = a.multiply(A.divide(powb).subtract(xk)).toDecimal(25);
                dk = Frac.create(dkDec);
                if (d0) {
                    break;
                }

                xk = xk.add(dk);
                /* Check to see if there's no change from the last xk*/
                dkDec = dk.toDecimal();
                d0 = dk0 ? dk0 === dkDec : false;
                dk0 = dkDec;
            } while (dk.abs().gte(e));

            return xk;
        },
        /* https://gist.github.com/jiggzson/0c5b33cbcd7b52b36132b1e96573285f*/
        /* Just the square root function but big :)*/
        sqrt(n) {
            if (!(n instanceof Frac)) {
                n = new Frac(n);
            }
            let xn;
            let d;
            let ld;
            let sameDelta;
            let c = 0; /* Counter*/
            let done = false;
            const delta = new Frac(1e-20);
            xn = n.divide(new Frac(2));
            const safety = 1000;
            do {
                /* Break if we're not converging*/
                if (c > safety) {
                    throw new Error(`Unable to calculate square root for ${n}`);
                }
                xn = xn.add(n.divide(xn)).divide(new Frac(2));
                xn = new Frac(xn.decimal(30));
                /* Get the difference from the true square*/
                d = n.subtract(xn.multiply(xn));
                /* If the square of the calculated number is close enough to the number*/
                /* we're getting the square root or the last delta was the same as the new delta*/
                /* then we're done*/
                sameDelta = ld ? ld.equals(d) : false;
                if (d.clone().abs().lessThan(delta) || sameDelta) {
                    done = true;
                }
                /* Store the calculated delta*/
                ld = d;
                c++; /* Increase the counter*/
            } while (!done);

            return xn;
        },
    };
    // Link the Math2 object to Settings.FUNCTION_MODULES
    Settings.FUNCTION_MODULES.push(Math2);
    reserveNames(/** @type {object} */ (Math2)); // Reserve the names in Math2

    // Polyfills ====================================================================
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/
    Math.sign ||= function sign(x) {
        x = Number(x); // Convert to a number
        if (x === 0 || isNaN(x)) {
            return x;
        }
        return x > 0 ? 1 : -1;
    };

    Math.cosh ||= function cosh(x) {
        const y = Math.exp(x);
        return (y + 1 / y) / 2;
    };

    Math.sech ||= function sech(x) {
        return 1 / Math.cosh(x);
    };

    Math.csch ||= function csch(x) {
        return 1 / Math.sinh(x);
    };

    Math.coth ||= function coth(x) {
        return 1 / Math.tanh(x);
    };

    Math.sinh ||= function sinh(x) {
        const y = Math.exp(x);
        return (y - 1 / y) / 2;
    };

    Math.tanh ||= function tanh(x) {
        if (x === Infinity) {
            return 1;
        }
        if (x === -Infinity) {
            return -1;
        }
        const y = Math.exp(2 * x);
        return (y - 1) / (y + 1);
    };

    Math.asinh ||= function asinh(x) {
        if (x === -Infinity) {
            return x;
        }
        return Math.log(x + Math.sqrt(x * x + 1));
    };

    Math.acosh ||= function acosh(x) {
        return Math.log(x + Math.sqrt(x * x - 1));
    };

    Math.atanh ||= function atanh(x) {
        return Math.log((1 + x) / (1 - x)) / 2;
    };

    Math.trunc ||= function trunc(x) {
        if (isNaN(x)) {
            return NaN;
        }
        if (x > 0) {
            return Math.floor(x);
        }
        return Math.ceil(x);
    };

    // Global functions =============================================================
    /**
     * This method will return a hash or a text representation of a NerdamerSymbol, Matrix, or Vector. If all else fails
     * it _assumes_ the object has a toString method and will call that.
     *
     * @param {object} obj
     * @param {string | string[]} option Get is as a hash
     * @param {number} useGroup
     * @returns {string}
     */
    function text(obj, option = undefined, useGroup = undefined, decp = undefined) {
        const asHash = option === 'hash';
        // Whether to wrap numbers in brackets
        let wrapCondition;
        const opt = asHash ? undefined : option;
        const asDecimal = opt === 'decimal' || opt === 'decimals' || opt === 'decimals_or_scientific';

        // Only set default decp for decimals_or_scientific mode, not for plain decimals.
        // This preserves full valueOf() precision for internal operations.
        //
        // Background: When a NerdamerSymbol with a fractional multiplier (e.g., 1/3) is converted to
        // a string via valueOf(), it becomes a decimal like "0.3333333333333333". If that
        // decimal is then parsed back into a NerdamerSymbol, nerdamer uses a continued fractions
        // algorithm (Fraction.fullConversion) to reconstruct the fraction. This algorithm
        // finds the simplest fraction within epsilon (1e-30) of the decimal value.
        //
        // The precision matters:
        //   - 16 threes (0.3333333333333333): exactly equals JS's 1/3 in IEEE 754 → reconstructs to 1/3
        //   - 15 threes (0.333333333333333): differs by ~3.3e-16 → becomes 321685687669321/965057063007964
        //
        // Setting decp here would trigger toDecimal(16) which can truncate precision.
        // By not setting decp for plain decimals mode, we preserve full valueOf() precision.
        if (opt === 'decimals_or_scientific' && typeof decp === 'undefined') {
            decp = Settings.DEFAULT_DECP;
        }

        function toString(fracObj, decimalPlaces) {
            switch (option) {
                case 'decimals':
                case 'decimal':
                    wrapCondition ||= function (_str) {
                        return false;
                    };
                    if (decimalPlaces) {
                        return fracObj.toDecimal(decimalPlaces);
                    }
                    return fracObj.valueOf();
                case 'recurring': {
                    wrapCondition ||= function (s) {
                        return s.indexOf("'") !== -1;
                    };

                    const str = fracObj.toString();
                    // Verify that the string is actually a fraction
                    const frac = /^-?\d+(?:\/\d+)?$/u.exec(str);
                    if (frac.length === 0) {
                        return str;
                    }

                    // Split the fraction into the numerator and denominator
                    const parts = frac[0].split('/');
                    let negative = false;
                    let m = Number(parts[0]);
                    if (m < 0) {
                        m = -m;
                        negative = true;
                    }
                    let n = Number(parts[1]);
                    n ||= 1;

                    // https://softwareengineering.stackexchange.com/questions/192070/what-is-a-efficient-way-to-find-repeating-decimal#comment743574_192081
                    /** @type {number | string} */
                    let quotient = Math.floor(m / n);
                    let c = 10 * (m - quotient * n);
                    quotient = `${quotient.toString()}.`;
                    while (c && c < n) {
                        c *= 10;
                        quotient += '0';
                    }
                    let digits = '';
                    const passed = [];
                    let i = 0;
                    while (true) {
                        if (typeof passed[c] !== 'undefined') {
                            const prefix = digits.slice(0, passed[c]);
                            const cycle = digits.slice(passed[c]);
                            const result = `${quotient + prefix}'${cycle}'`;
                            return (negative ? '-' : '') + result.replace("'0'", '').replace(/\.$/u, '');
                        }
                        const q = Math.floor(c / n);
                        const r = c - q * n;
                        passed[c] = i;
                        digits += q.toString();
                        i += 1;
                        c = 10 * r;
                    }
                }
                case 'mixed': {
                    wrapCondition ||= function (s) {
                        return s.indexOf('/') !== -1;
                    };

                    const str = fracObj.toString();
                    // Verify that the string is actually a fraction
                    const frac = /^-?\d+(?:\/\d+)?$/u.exec(str);
                    if (frac.length === 0) {
                        return str;
                    }

                    // Split the fraction into the numerator and denominator
                    const parts = frac[0].split('/');
                    const numer = new bigInt(parts[0]);
                    let denom = new bigInt(parts[1]);
                    if (denom.equals(0)) {
                        denom = new bigInt(1);
                    }

                    // Return the quotient plus the remainder
                    const divmod = numer.divmod(denom);
                    const { quotient } = divmod;
                    const { remainder } = divmod;
                    const operator = parts[0][0] === '-' || quotient.equals(0) || remainder.equals(0) ? '' : '+';
                    return (
                        (quotient.equals(0) ? '' : quotient.toString()) +
                        operator +
                        (remainder.equals(0) ? '' : `${remainder.toString()}/${parts[1]}`)
                    );
                }
                case 'scientific':
                    wrapCondition ||= function (_str) {
                        return false;
                    };
                    return new Scientific(fracObj.valueOf()).toString(Settings.SCIENTIFIC_MAX_DECIMAL_PLACES);
                case 'decimals_or_scientific': {
                    wrapCondition ||= function (_str) {
                        return false;
                    };
                    const decimals = fracObj.valueOf();
                    const scientific = new Scientific(decimals);
                    if (Math.abs(scientific.exponent) >= Settings.SCIENTIFIC_SWITCH_FROM_DECIMALS_MIN_EXPONENT) {
                        return scientific.toString(Settings.SCIENTIFIC_MAX_DECIMAL_PLACES);
                    }
                    if (decimalPlaces) {
                        return fracObj.toDecimal(decimalPlaces);
                    }
                    return decimals;
                }

                default:
                    wrapCondition ||= function (s) {
                        return s.indexOf('/') !== -1;
                    };

                    return fracObj.toString();
            }
        }

        // If the object is a symbol
        if (isSymbol(obj)) {
            /** @type {string | number} */
            let multiplier = '';
            let power = '';
            let sign = '';
            const group = obj.group || useGroup;
            let { value } = obj;

            // If the value is to be used as a hash then the power and multiplier need to be suppressed
            if (!asHash) {
                // Get multiplier as string. Don't pass decp here to preserve precision
                // for internal operations - decp is only applied in the N case below.
                let om = toString(obj.multiplier);
                if (String(om) === '-1' && String(obj.multiplier) === '-1') {
                    sign = '-';
                    om = '1';
                }
                // Only add the multiplier if it's not 1
                if (String(om) !== '1') {
                    multiplier = om;
                }
                // Use asDecimal to get the object back as a decimal
                const p = obj.power ? toString(obj.power) : '';
                // Only add the multiplier
                if (String(p) !== '1') {
                    // Is it a symbol
                    if (isSymbol(p)) {
                        power = text(p, opt);
                    } else {
                        power = p;
                    }
                }
            }

            switch (group) {
                case N: {
                    multiplier = '';
                    // Handle numeric output with appropriate precision:
                    // - decimals_or_scientific: use toString with decp to trigger Scientific formatting
                    // - decimals with explicit decp: round to requested decimal places
                    // - otherwise: use default toString which preserves full precision via valueOf()
                    let m;
                    if (opt === 'decimals_or_scientific') {
                        m = toString(obj.multiplier, decp);
                    } else if (decp && asDecimal) {
                        m = obj.multiplier.toDecimal(decp);
                    } else {
                        m = toString(obj.multiplier);
                    }
                    // If it's numerical then all we need is the multiplier
                    value = String(obj.multiplier) === '-1' ? '1' : m;
                    power = '';
                    break;
                }
                case PL:
                    value = obj
                        .collectSymbols()
                        .map(x => {
                            let txt = text(x, opt, useGroup, decp);
                            if (txt === '0') {
                                txt = '';
                            }
                            return txt;
                        })
                        .sort()
                        .join('+')
                        .replace(/\+-/gu, '-');
                    break;
                case CP:
                    value = obj
                        .collectSymbols()
                        .map(x => {
                            let txt = text(x, opt, useGroup, decp);
                            if (txt === '0') {
                                txt = '';
                            }
                            return txt;
                        })
                        .sort()
                        .join('+')
                        .replace(/\+-/gu, '-');
                    break;
                case CB:
                    value = obj
                        .collectSymbols(symbol => {
                            const g = symbol.group;
                            // Both groups will already be in brackets if their power is greater than 1
                            // so skip it.
                            if ((g === PL || g === CP) && symbol.power.equals(1) && symbol.multiplier.equals(1)) {
                                return inBrackets(text(symbol, opt));
                            }
                            return text(symbol, opt);
                        })
                        .join('*');
                    break;
                case EX: {
                    const pg = obj.previousGroup;
                    const pwg = obj.power.group;

                    // PL are the exception. It's simpler to just collect and set the value
                    if (pg === PL) {
                        value = obj.collectSymbols(text, opt).join('+').replace('+-', '-');
                    }
                    if (!(pg === N || pg === S || pg === FN) && !asHash) {
                        value = inBrackets(value);
                    }

                    if ((pwg === CP || pwg === CB || pwg === PL || obj.power.multiplier.toString() !== '1') && power) {
                        power = inBrackets(power);
                    }
                    break;
                }
            }

            if (group === FN) {
                value = obj.fname + inBrackets(obj.args.map(symbol => text(symbol, opt)).join(','));
            }
            // TODO: Needs to be more efficient. Maybe.
            if (group === FN && obj.fname in CUSTOM_OPERATORS) {
                let a = text(obj.args[0]);
                let b = text(obj.args[1]);
                if (obj.args[0].isComposite()) // Preserve the brackets
                {
                    a = inBrackets(a);
                }
                if (obj.args[1].isComposite()) // Preserve the brackets
                {
                    b = inBrackets(b);
                }
                value = a + CUSTOM_OPERATORS[obj.fname] + b;
            }
            // Wrap the power since / is less than ^
            // TODO: introduce method call isSimple
            const shouldWrapPower =
                typeof wrapCondition === 'function' ? /** @type {Function} */ (wrapCondition)(power) : false;
            if (power && group !== EX && shouldWrapPower) {
                power = inBrackets(power);
            }

            // The following groups are held together by plus or minus. They can be raised to a power or multiplied
            // by a multiplier and have to be in brackets to preserve the order of precedence
            if (
                ((group === CP || group === PL) && ((multiplier && String(multiplier) !== '1') || sign === '-')) ||
                ((group === CB || group === CP || group === PL) && power && String(power) !== '1') ||
                (!asHash && group === P && String(value) === '-1') ||
                obj.fname === PARENTHESIS
            ) {
                value = inBrackets(value);
            }

            if (
                decp &&
                (option === 'decimal' || ((option === 'decimals' || option === 'decimals_or_scientific') && multiplier))
            ) {
                // Scientific notation? regular rounding would be the wrong decision here
                if (multiplier.toString().includes('e')) {
                    if (option !== 'decimals_or_scientific') {
                        // ToPrecision can create extra digits, so we also
                        // convert it to string straight up and pick the shorter version
                        const numMult = Number(multiplier);
                        const m1 = numMult.toExponential();
                        const m2 = numMult.toPrecision(decp);
                        /** @type {string | number} */
                        multiplier = m1.length < m2.length ? m1 : m2;
                    }
                } else {
                    multiplier = nround(Number(multiplier), decp);
                }
            }

            // Add the sign back
            let c = sign + multiplier;

            const shouldWrapMult =
                typeof wrapCondition === 'function' ? /** @type {Function} */ (wrapCondition)(multiplier) : false;
            if (multiplier && shouldWrapMult) {
                c = inBrackets(c);
            }

            if (Number(power) < 0) {
                power = inBrackets(power);
            }

            // Add the multiplication back
            if (multiplier) {
                c = `${c}*`;
            }

            if (power) {
                if (value === 'e' && Settings.E_TO_EXP) {
                    return `${c}exp${inBrackets(power)}`;
                }
                power = Settings.POWER_OPERATOR + power;
            }

            // This needs serious rethinking. Must fix
            if (group === EX && value.charAt(0) === '-') {
                value = inBrackets(value);
            }

            let cv = c + value;

            if (obj.parens) {
                cv = inBrackets(cv);
            }

            return cv + power;
        }
        if (isVector(obj)) {
            const l = obj.elements.length;
            const c = [];
            for (let i = 0; i < l; i++) {
                c.push(obj.elements[i].text(option));
            }
            return `[${c.join(',')}]`;
        }
        try {
            return obj.toString();
        } catch (e) {
            if (e.message === 'timeout') {
                throw e;
            }
            return '';
        }
    }

    // PrimeFactors is now defined outside IIFE
    // Expression ===================================================================
    /**
     * This is what nerdamer returns. It's sort of a wrapper around the symbol class and provides the user with some
     * useful functions. If you want to provide the user with extra library functions then add them to this class's
     * prototype.
     *
     * @class
     * @this {ExpressionType}
     * @param {NerdamerSymbolType} symbol
     */
    function Expression(symbol) {
        // We don't want arrays wrapped
        this.symbol = symbol;
    }
    /**
     * Returns stored expression at index. For first index use 1 not 0.
     *
     * @param {number | string} expressionNumber
     * @param {boolean} [_asType]
     */
    Expression.getExpression = function getExpression(expressionNumber, _asType = undefined) {
        if (expressionNumber === 'last' || !expressionNumber) {
            expressionNumber = EXPRESSIONS.length;
        }
        if (expressionNumber === 'first') {
            expressionNumber = 1;
        }
        const index = Number(expressionNumber) - 1;
        const expression = EXPRESSIONS[index];
        const retval = expression ? new Expression(expression) : expression;
        return retval;
    };
    Expression.prototype = {
        /**
         * Returns the text representation of the expression
         *
         * @param {string} [opt] - Option of formatting numbers
         * @param {number} [n] The number of significant figures
         * @returns {string}
         */
        text(opt = 'decimals', n = undefined) {
            n ||= Settings.EXPRESSION_DECP;
            const sym = /** @type {NerdamerSymbolType} */ (this.symbol);
            if (sym.text_) {
                return sym.text_(opt);
            }

            return text(this.symbol, opt, undefined, n);
        },
        /**
         * Returns the latex representation of the expression
         *
         * @param {OutputType} option - Option for formatting numbers
         * @returns {string}
         */
        latex(option) {
            if (this.symbol.latex) {
                return this.symbol.latex(option);
            }
            return LaTeX.latex(this.symbol, option);
        },
        valueOf() {
            return this.symbol.valueOf();
        },

        /**
         * Evaluates the expression and tries to reduce it to a number if possible. If an argument is given in the form
         * of %{integer} it will evaluate that expression. Other than that it will just use it's own text and reparse
         *
         * @returns {Expression}
         */
        evaluate(...args) {
            // Don't evaluate an empty vector
            if (isVector(this.symbol) && this.symbol.dimensions() === 0) {
                return this;
            }

            const firstArg = args[0];
            let expression;
            let idx = 1;

            // Enable getting of expressions using the % so for example %1 should get the first expression
            if (typeof firstArg === 'string') {
                // TODO Replace substr with slice, and test it
                expression =
                    firstArg.charAt(0) === '%' ? Expression.getExpression(firstArg.substr(1)).text() : firstArg;
            } else if (firstArg instanceof Expression || isSymbol(firstArg)) {
                expression = firstArg.text();
            } else {
                expression = this.symbol.text();
                idx--;
            }

            const subs = args[idx] || {};

            const retval = new Expression(block('PARSE2NUMBER', () => _.parse(expression, subs), true));

            return retval;
        },
        /**
         * Converts a symbol to a JS function. Pass in an array of variables to use that order instead of the default
         * alphabetical order
         *
         * @param vars {Array}
         */
        buildFunction(vars) {
            return Build.build(this.symbol, vars);
        },
        /**
         * Checks to see if the expression is just a plain old number
         *
         * @returns {boolean}
         */
        isNumber() {
            return isNumericSymbol(this.symbol);
        },
        /**
         * Checks to see if the expression is infinity
         *
         * @returns {boolean}
         */
        isInfinity() {
            return Math.abs(this.symbol.multiplier.valueOf()) === Infinity;
        },
        /**
         * Checks to see if the expression contains imaginary numbers
         *
         * @returns {boolean}
         */
        isImaginary() {
            return evaluate(_.parse(this.symbol)).isImaginary();
        },
        /**
         * Returns all the variables in the expression
         *
         * @returns {Array}
         */
        variables() {
            return variables(this.symbol);
        },

        toString() {
            try {
                if (isArray(this.symbol)) {
                    return `[${this.symbol.toString()}]`;
                }
                return this.symbol.toString();
            } catch (e) {
                if (e.message === 'timeout') {
                    throw e;
                }
                return '';
            }
        },
        // Forces the symbol to be returned as a decimal
        toDecimal(prec) {
            Settings.precision = prec;
            const dec = text(this.symbol, 'decimals');
            Settings.precision = undefined;
            return dec;
        },
        // Checks to see if the expression is a fraction
        isFraction() {
            return isFraction(this.symbol);
        },
        // Checks to see if the symbol is a multivariate polynomial
        isPolynomial() {
            return this.symbol.isPoly();
        },
        // Performs a substitution
        sub(symbol, forSymbol) {
            return new Expression(this.symbol.sub(_.parse(symbol), _.parse(forSymbol)));
        },
        operation(otype, symbol) {
            if (isExpression(symbol)) {
                symbol = symbol.symbol;
            } else if (!isSymbol(symbol)) {
                symbol = _.parse(symbol);
            }
            return new Expression(_[otype](this.symbol.clone(), symbol.clone()));
        },
        add(symbol) {
            return this.operation('add', symbol);
        },
        subtract(symbol) {
            return this.operation('subtract', symbol);
        },
        multiply(symbol) {
            return this.operation('multiply', symbol);
        },
        divide(symbol) {
            return this.operation('divide', symbol);
        },
        pow(symbol) {
            return this.operation('pow', symbol);
        },
        expand() {
            return new Expression(_.expand(this.symbol));
        },
        each(callback, i) {
            if (this.symbol.each) {
                this.symbol.each(callback, i);
            } else if (isArray(this.symbol)) {
                for (let idx = 0; idx < this.symbol.length; idx++) {
                    callback.call(this.symbol, this.symbol[idx], idx);
                }
            } else {
                callback.call(this.symbol);
            }
        },
        eq(value) {
            if (!isSymbol(value)) {
                value = _.parse(value);
            }
            try {
                const d = _.subtract(this.symbol.clone(), value);
                return d.equals(0);
            } catch (e) {
                if (e.message === 'timeout') {
                    throw e;
                }
                return false;
            }
        },
        lt(value) {
            if (!isSymbol(value)) {
                value = _.parse(value);
            }
            try {
                const d = evaluate(_.subtract(this.symbol.clone(), value));
                return d.lessThan(0);
            } catch (e) {
                if (e.message === 'timeout') {
                    throw e;
                }
                return false;
            }
        },
        gt(value) {
            if (!isSymbol(value)) {
                value = _.parse(value);
            }
            try {
                const d = evaluate(_.subtract(this.symbol.clone(), value));
                return d.greaterThan(0);
            } catch (e) {
                if (e.message === 'timeout') {
                    throw e;
                }
                return false;
            }
        },
        gte(value) {
            return this.gt(value) || this.eq(value);
        },
        lte(value) {
            return this.lt(value) || this.eq(value);
        },

        numerator() {
            return new Expression(this.symbol.getNum());
        },
        denominator() {
            return new Expression(this.symbol.getDenom());
        },
        hasFunction(f) {
            return this.symbol.containsFunction(f);
        },
        contains(variable) {
            return this.symbol.contains(variable);
        },
    };
    // Aliases
    Expression.prototype.toTeX = Expression.prototype.latex;

    // Scientific class is now defined outside the IIFE (see above).\n    // Initialize its dependencies now that they're available.\n    ScientificDeps.Settings = Settings;\n    ScientificDeps.nround = nround;\n\n    // Frac class is now defined outside the IIFE (see above).
    // Initialize its dependencies now that they're available.
    FracDeps.bigInt = bigInt;
    FracDeps.bigDec = bigDec;
    FracDeps.isInt = isInt;
    FracDeps.scientificToDecimal = scientificToDecimal;
    FracDeps.DivisionByZero = DivisionByZero;
    FracDeps.Settings = Settings;
    // Note: Fraction is initialized later after it's defined (see line ~11700)

    // NerdamerSymbol =======================================================================
    /**
     * All symbols e.g. x, y, z, etc or functions are wrapped in this class. All symbols have a multiplier and a group.
     * All symbols except for "numbers (group N)" have a power.
     *
     * @class Primary Data type for the Parser.
     * @param {string | number | NerdamerSymbolType | FracType | import('big-integer').BigInteger | object} [obj]
     * @returns {NerdamerSymbolType}
     */
    function NerdamerSymbol(obj) {
        checkTimeout();

        const isInfinity = obj === 'Infinity';
        // This enables the class to be instantiated without the new operator
        if (!(this instanceof NerdamerSymbol)) {
            return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(obj)));
        }
        // Convert big numbers to a string
        if (typeof obj === 'object' && obj !== null && /** @type {any} */ (obj) instanceof bigDec) {
            obj = /** @type {any} */ (obj).toString();
        }
        // Define numeric symbols
        const objStr = String(obj);
        if (
            /^(?<sign>-?\+?\d+)\.?\d*e?-?\+?\d*/iu.test(objStr) ||
            (typeof obj === 'object' && obj !== null && /** @type {any} */ (obj) instanceof bigDec)
        ) {
            this.group = N;
            this.value = CONST_HASH;
            this.multiplier = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(obj)));
        }
        // Define symbolic symbols
        else {
            this.group = S;
            validateName(obj);
            this.value = obj;
            this.multiplier = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(1)));
            this.imaginary = obj === Settings.IMAGINARY;
            this.isInfinity = isInfinity;
        }

        // As of 6.0.0 we switched to infinite precision so all objects have a power
        // Although this is still redundant in constants, it simplifies the logic in
        // other parts so we'll keep it
        this.power = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(1)));

        // Initialize optional properties used by function symbols (FN group)
        /** @type {NerdamerSymbol[] | undefined} */
        this.args = undefined;
        /** @type {string | undefined} */
        this.fname = undefined;
        /** @type {boolean | undefined} */
        this.isImgSymbol = undefined;

        // Added to silence the strict warning.
        return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this));
    }
    /**
     * Returns vanilla imaginary symbol
     *
     * @returns {NerdamerSymbolType}
     */
    NerdamerSymbol.imaginary = function imaginary() {
        const s = new NerdamerSymbol(Settings.IMAGINARY);
        s.imaginary = true;
        return s;
    };
    /**
     * Return nerdamer's representation of Infinity
     *
     * @param {number} negative -1 to return negative infinity
     * @returns {NerdamerSymbolType}
     */
    NerdamerSymbol.infinity = function infinity(negative = undefined) {
        const v = new NerdamerSymbol('Infinity');
        if (negative === -1) {
            v.negate();
        }
        return v;
    };
    /**
     * Creates a shell symbol for a given group
     *
     * @param {number} group
     * @param {any} [value]
     * @returns {NerdamerSymbolType}
     */
    NerdamerSymbol.shell = function shell(group, value) {
        const symbol = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(value)));
        symbol.group = group;
        symbol.symbols = {};
        symbol.length = 0;
        return symbol;
    };
    // Sqrt(x) -> x^(1/2)
    NerdamerSymbol.unwrapSQRT = function unwrapSQRT(symbol, all) {
        const p = symbol.power;
        if (symbol.fname === SQRT && (symbol.isLinear() || all)) {
            const t = symbol.args[0].clone();
            t.power = t.power.multiply(new Frac(1 / 2));
            t.multiplier = t.multiplier.multiply(symbol.multiplier);
            symbol = t;
            if (all) {
                symbol.power = p.multiply(new Frac(1 / 2));
            }
        }

        return symbol;
    };
    NerdamerSymbol.hyp = function hyp(a, b) {
        a ||= new NerdamerSymbol(0);
        b ||= new NerdamerSymbol(0);
        return _.sqrt(_.add(_.pow(a.clone(), new NerdamerSymbol(2)), _.pow(b.clone(), new NerdamerSymbol(2))));
    };
    // Converts to polar form array
    NerdamerSymbol.toPolarFormArray = function toPolarFormArray(symbol) {
        const re = symbol.realpart();
        const im = symbol.imagpart();
        const r = NerdamerSymbol.hyp(re, im);
        const theta = re.equals(0) ? _.parse('pi/2') : _.trig.atan(_.divide(im, re));
        return [r, theta];
    };
    // Removes parentheses
    NerdamerSymbol.unwrapPARENS = function unwrapPARENS(symbol) {
        if (symbol.fname === '') {
            const r = symbol.args[0];
            r.power = r.power.multiply(symbol.power);
            r.multiplier = r.multiplier.multiply(symbol.multiplier);
            if (symbol.fname === '') {
                return NerdamerSymbol.unwrapPARENS(r);
            }
            return r;
        }
        return symbol;
    };
    // Quickly creates a NerdamerSymbol
    NerdamerSymbol.create = function create(value, power) {
        power = power === undefined ? 1 : power;
        return _.parse(`(${value})^(${power})`);
    };
    NerdamerSymbol.prototype = {
        /** @returns {NerdamerSymbolType} */
        pushMinus() {
            /** @type {NerdamerSymbolType} */
            let retval = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this));
            if (
                (this.group === CB || this.group === CP || this.group === PL) &&
                this.multiplier.lessThan(0) &&
                !even(this.power)
            ) {
                // Console.log();
                // console.log("replacing "+this.text("fractions"))
                retval = this.clone();
                const m = retval.multiplier.clone();
                m.negate();
                // Console.log("  negated multiplier: "+m)
                retval.toUnitMultiplier();

                // Console.log("  unit main part: "+this)
                for (const termkey in retval.symbols) {
                    if (!Object.hasOwn(retval.symbols, termkey)) {
                        continue;
                    }
                    retval.symbols[termkey] = retval.symbols[termkey].clone().negate();
                    // Console.log("  negated term: "+this.symbols[termkey])
                    if (retval.group === CB) {
                        // Console.log("  is CB, breaking");
                        break;
                    }
                }

                // Console.log("  combined: "+retval.text("fractions"));
                if (retval.length > 0) {
                    retval.each(c => c.pushMinus());
                    // Console.log("  result: "+this.text("fractions"));
                }

                // Console.log("  negated main part: "+retval)
                retval = _.parse(retval);
                retval = _.multiply(_.parse(m), retval);
            }
            return retval;
        },

        /**
         * Gets nth root accounting for rounding errors
         *
         * @param {number} n
         * @returns {NerdamerSymbolType}
         */
        getNth(n) {
            // First calculate the root
            const root = evaluate(_.pow(_.parse(this.multiplier), _.parse(String(n)).invert()));
            // Round of any errors
            const rounded = _.parse(nround(root));
            // Reverse the root
            const e = evaluate(_.pow(rounded, _.parse(String(n))));
            // If the rounded root equals the original number then we're good
            if (e.equals(_.parse(this.multiplier))) {
                return rounded;
            }
            // Otherwise return the unrounded version
            return root;
        },
        /**
         * Checks if symbol is to the nth power
         *
         * @returns {boolean}
         */
        isToNth(n) {
            // Start by check in the multiplier for squareness
            // First get the root but round it because currently we still depend
            const root = this.getNth(n);
            const nthMultiplier = isInt(root);
            let nthPower;

            if (this.group === CB) {
                // Start by assuming that all will be square.
                nthPower = true;
                // All it takes is for one of the symbols to not have an even power
                // e.g. x^n1*y^n2 requires that both n1 and n2 are even
                this.each(x => {
                    const isNth = x.isToNth(n);

                    if (!isNth) {
                        nthPower = false;
                    }
                });
            } else {
                // Check if the power is divisible by n if it's not a number.
                nthPower = this.group === N ? true : isInt(_.divide(_.parse(this.power), _.parse(n)));
            }

            return nthMultiplier && nthPower;
        },
        /**
         * Checks if a symbol is square
         *
         * @returns {boolean}
         */
        isSquare() {
            return this.isToNth(2);
        },
        /**
         * Checks if a symbol is cube
         *
         * @returns {boolean}
         */
        isCube() {
            return this.isToNth(3);
        },
        /**
         * Checks if a symbol is a bare variable
         *
         * @returns {boolean}
         */
        isSimple() {
            return this.power.equals(1) && this.multiplier.equals(1);
        },
        /**
         * Simplifies the power of the symbol
         *
         * @returns {NerdamerSymbolType} A clone of the symbol
         */
        powSimp() {
            if (this.group === CB) {
                const powers = [];
                const sign = this.multiplier.sign();
                this.each(x => {
                    const p = x.power;
                    // Why waste time if I can't do anything anyway
                    if (isSymbol(p) || p.equals(1)) {
                        return;
                    }
                    powers.push(p);
                });
                if (powers.length === 0) {
                    return this.clone();
                }
                const min = new Frac(arrayMin(powers));

                // Handle the coefficient
                // handle the multiplier
                // sign already declared above
                const m = this.multiplier.clone().abs();
                const mfactors = Math2.ifactor(m.valueOf());
                // If we have a multiplier of 6750 and a min of 2 then the factors are 5^3*5^3*2
                // we can then reduce it to 2*3*5*(15)^2
                let out_ = new Frac(1);
                let in_ = new Frac(1);

                for (const x in mfactors) {
                    if (!Object.hasOwn(mfactors, x)) {
                        continue;
                    }
                    let n = new Frac(mfactors[x]);
                    if (!n.lessThan(min)) {
                        n = n.divide(min).subtract(new Frac(1));
                        in_ = in_.multiply(new Frac(x)); // Move the factor inside the bracket
                    }

                    out_ = out_.multiply(_.parse(`${inBrackets(x)}^${inBrackets(n)}`).multiplier);
                }
                let t = new NerdamerSymbol(in_);
                this.each(x => {
                    x = x.clone();
                    x.power = x.power.divide(min);
                    t = _.multiply(t, x);
                });

                const xt = _.symfunction(PARENTHESIS, [t]);
                xt.power = min;
                xt.multiplier = sign < 0 ? out_.negate() : out_;

                return xt;
            }
            return this.clone();
        },
        /**
         * Checks to see if two functions are of equal value
         *
         * @param {string | number | NerdamerSymbolType} symbol
         * @returns {boolean}
         */
        equals(symbol) {
            /** @type {NerdamerSymbol} */
            let sym;
            if (isSymbol(symbol)) {
                sym = symbol;
            } else {
                sym = new NerdamerSymbol(symbol);
            }
            return (
                this.value === sym.value &&
                this.power.equals(sym.power) &&
                this.multiplier.equals(sym.multiplier) &&
                this.group === sym.group
            );
        },
        /** @returns {NerdamerSymbolType} */
        abs() {
            const e = this.clone();
            e.multiplier.abs();
            return e;
        },
        /**
         * Greater than
         *
         * @param {string | number | NerdamerSymbolType} symbol
         * @returns {boolean}
         */
        gt(symbol) {
            if (!isSymbol(symbol)) {
                symbol = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(symbol)));
            }
            return this.isConstant() && symbol.isConstant() && this.multiplier.greaterThan(symbol.multiplier);
        },
        /**
         * Greater than or equal
         *
         * @param {string | number | NerdamerSymbolType} symbol
         * @returns {boolean}
         */
        gte(symbol) {
            if (!isSymbol(symbol)) {
                symbol = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(symbol)));
            }
            return (
                this.equals(symbol) ||
                (this.isConstant() && symbol.isConstant() && this.multiplier.greaterThan(symbol.multiplier))
            );
        },
        /**
         * Less than
         *
         * @param {string | number | NerdamerSymbolType} symbol
         * @returns {boolean}
         */
        lt(symbol) {
            if (!isSymbol(symbol)) {
                symbol = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(symbol)));
            }
            return this.isConstant() && symbol.isConstant() && this.multiplier.lessThan(symbol.multiplier);
        },
        /**
         * Less than or equal
         *
         * @param {string | number | NerdamerSymbolType} symbol
         * @returns {boolean}
         */
        lte(symbol) {
            if (!isSymbol(symbol)) {
                symbol = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(symbol)));
            }
            return (
                this.equals(symbol) ||
                (this.isConstant() && symbol.isConstant() && this.multiplier.lessThan(symbol.multiplier))
            );
        },
        /**
         * Because nerdamer doesn't group symbols by polynomials but rather a custom grouping method, this has to be
         * reinserted in order to make use of most algorithms. This function checks if the symbol meets the criteria of
         * a polynomial.
         *
         * @param {boolean} [multivariate]
         * @returns {boolean}
         */
        isPoly(multivariate = false) {
            const g = this.group;
            const p = this.power;
            // The power must be a integer so fail if it's not
            if (!isInt(p) || Number(p) < 0) {
                return false;
            }
            // Constants and first orders
            if (g === N || g === S || this.isConstant(true)) {
                return true;
            }
            const vars = variables(this);
            if (g === CB && vars.length === 1) {
                // The variable is assumed the only one that was found
                const v = vars[0];
                // If no variable then guess what!?!? We're done!!! We have a polynomial.
                if (!v) {
                    return true;
                }
                for (const x in this.symbols) {
                    if (!Object.hasOwn(this.symbols, x)) {
                        continue;
                    }
                    const sym = this.symbols[x];
                    // Sqrt(x)
                    if (sym.group === FN && !sym.args[0].isConstant()) {
                        return false;
                    }
                    if (!sym.contains(v) && !sym.isConstant(true)) {
                        return false;
                    }
                }
                return true;
            }
            // PL groups. These only fail if a power is not an int
            // this should handle cases such as x^2*t
            if (this.isComposite() || (g === CB && multivariate)) {
                // Fail if we're not checking for multivariate polynomials
                if (!multivariate && vars.length > 1) {
                    return false;
                }
                // Loop though the symbols and check if they qualify
                for (const x in this.symbols) {
                    // We've already the symbols if we're not checking for multivariates at this point
                    // so we check the sub-symbols
                    if (!this.symbols[x].isPoly(multivariate)) {
                        return false;
                    }
                }
                return true;
            }
            return false;

            /*
             //all tests must have passed so we must be dealing with a polynomial
             return true;
             */
        },
        // Removes the requested variable from the symbol and returns the remainder
        /**
         * @param {string} x
         * @param {boolean} [excludeX]
         * @returns {NerdamerSymbolType}
         */
        stripVar(x, excludeX = false) {
            /** @type {NerdamerSymbolType} */
            let retval;
            if ((this.group === PL || this.group === S) && this.value === x) {
                retval = /** @type {NerdamerSymbolType} */ (
                    /** @type {unknown} */ (new NerdamerSymbol(excludeX ? 0 : this.multiplier))
                );
            } else if (this.group === CB && this.isLinear()) {
                retval = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(1)));
                this.each(s => {
                    if (!s.contains(x, true)) {
                        retval = _.multiply(retval, s.clone());
                    }
                });
                retval.multiplier = retval.multiplier.multiply(this.multiplier);
            } else if (this.group === CP && !this.isLinear()) {
                retval = /** @type {NerdamerSymbolType} */ (
                    /** @type {unknown} */ (new NerdamerSymbol(this.multiplier))
                );
            } else if (this.group === CP && this.isLinear()) {
                retval = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(0)));
                this.each(s => {
                    if (!s.contains(x)) {
                        const t = s.clone();
                        t.multiplier = t.multiplier.multiply(this.multiplier);
                        retval = _.add(retval, t);
                    }
                });
                // BIG TODO!!! It doesn't make much sense
                if (retval.equals(0)) {
                    retval = /** @type {NerdamerSymbolType} */ (
                        /** @type {unknown} */ (new NerdamerSymbol(this.multiplier))
                    );
                }
            } else if (
                this.group === EX &&
                /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this.power)).contains(x, true)
            ) {
                retval = /** @type {NerdamerSymbolType} */ (
                    /** @type {unknown} */ (new NerdamerSymbol(this.multiplier))
                );
            } else if (this.group === FN && this.contains(x)) {
                retval = /** @type {NerdamerSymbolType} */ (
                    /** @type {unknown} */ (new NerdamerSymbol(this.multiplier))
                );
            } else // Wth? This should technically be the multiplier.
            // Unfortunately this method wasn't very well thought out :`(.
            // should be: retval = new NerdamerSymbol(this.multiplier);
            // use: ((1+x^2)*sqrt(-1+x^2))^(-1) for correction.
            // this will break a bunch of unit tests so be ready to for the long haul
            {
                retval = this.clone();
            }

            return retval;
        },
        // Returns symbol in array form with x as base e.g. a*x^2+b*x+c = [c, b, a].
        toArray(v, arr) {
            arr ||= {
                arr: [],
                add(x, idx) {
                    const e = this.arr[idx];
                    this.arr[idx] = e ? _.add(e, x) : x;
                },
            };
            const g = this.group;

            if (g === S && this.contains(v)) {
                arr.add(new NerdamerSymbol(this.multiplier), this.power);
            } else if (g === CB) {
                const a = this.stripVar(v);
                const x = _.divide(this.clone(), a.clone());
                const p = x.isConstant() ? 0 : x.power;
                arr.add(a, p);
            } else if (g === PL && this.value === v) {
                this.each((x, p) => {
                    arr.add(x.stripVar(v), p);
                });
            } else if (g === CP) {
                // The logic: they'll be broken into symbols so e.g. (x^2+x)+1 or (a*x^2+b*x+c)
                // each case is handled above
                this.each(x => {
                    x.toArray(v, arr);
                });
            } else if (this.contains(v)) {
                throw new NerdamerTypeError('Cannot convert to array! Exiting');
            } else {
                arr.add(this.clone(), 0); // It's just a constant wrt to v
            }
            // Fill the holes
            arr = arr.arr; // Keep only the array since we don't need the object anymore
            for (let i = 0; i < arr.length; i++) {
                arr[i] ||= new NerdamerSymbol(0);
            }
            return arr;
        },
        // Checks to see if a symbol contans a function
        hasFunc(v) {
            const fnGroup = this.group === FN || this.group === EX;
            if ((fnGroup && !v) || (fnGroup && this.contains(v))) {
                return true;
            }
            if (this.symbols) {
                for (const x in this.symbols) {
                    if (this.symbols[x].hasFunc(v)) {
                        return true;
                    }
                }
            }
            return false;
        },
        sub(a, b) {
            a = isSymbol(a) ? a.clone() : _.parse(a);
            b = isSymbol(b) ? b.clone() : _.parse(b);
            if (a.group === N || a.group === P) {
                err('Cannot substitute a number. Must be a variable');
            }
            let samePow = false;
            const aIsUnitMultiplier = a.multiplier.equals(1);
            let m = this.multiplier.clone();
            let retval;
            /*
             * In order to make the substitution the bases have to first match take
             * (x+1)^x -> (x+1)=y || x^2 -> x=y^6
             * In both cases the first condition is that the bases match so we begin there
             * Either both are PL or both are not PL but we cannot have PL and a non-PL group match
             */
            if (
                this.value === a.value &&
                ((this.group !== PL && a.group !== PL) || (this.group === PL && a.group === PL))
            ) {
                // We cleared the first hurdle but a subsitution may not be possible just yet
                if (aIsUnitMultiplier || a.multiplier.equals(this.multiplier)) {
                    if (a.isLinear()) {
                        retval = b;
                    } else if (a.power.equals(this.power)) {
                        retval = b;
                        samePow = true;
                    }
                    if (a.multiplier.equals(this.multiplier)) {
                        m = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(1)));
                    }
                }
            }
            // The next thing is to handle CB
            else if (this.group === CB || this.previousGroup === CB) {
                retval = new NerdamerSymbol(1);
                this.each(x => {
                    const subbed = _.parse(x.sub(a, b)); // Parse it again for safety
                    retval = _.multiply(retval, subbed);
                });
            } else if (this.isComposite()) {
                const symbol = this.clone();

                if (a.isComposite() && symbol.isComposite() && symbol.isLinear() && a.isLinear()) {
                    const find = function (stack, needle) {
                        for (const x in stack.symbols) {
                            if (!Object.hasOwn(stack.symbols, x)) {
                                continue;
                            }
                            const sym = stack.symbols[x];
                            // If the symbol equals the needle or it's within the sub-symbols we're done
                            if ((sym.isComposite() && find(sym, needle)) || sym.equals(needle)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    // Go fish
                    for (const x in a.symbols) {
                        if (!Object.hasOwn(a.symbols, x)) {
                            continue;
                        }
                        if (!find(symbol, a.symbols[x])) {
                            return symbol.clone();
                        }
                    }
                    retval = _.add(_.subtract(symbol.clone(), a), b);
                } else {
                    retval = new NerdamerSymbol(0);
                    symbol.each(x => {
                        retval = _.add(retval, x.sub(a, b));
                    });
                }
            } else if (this.group === EX) {
                // The parsed value could be a function so parse and sub
                retval = _.parse(this.value).sub(a, b);
            } else if (this.group === FN) {
                const nargs = [];
                for (let i = 0; i < this.args.length; i++) {
                    /** @type {NerdamerSymbolType} */
                    let arg = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this.args[i]));
                    if (!isSymbol(arg)) {
                        arg = _.parse(arg);
                    }
                    nargs.push(arg.sub(a, b));
                }
                retval = _.symfunction(this.fname, nargs);
            }
            // If we did manage a substitution
            if (retval) {
                if (!samePow) {
                    // Substitute the power
                    const p =
                        this.group === EX
                            ? /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this.power)).sub(a, b)
                            : _.parse(this.power);
                    // Now raise the symbol to that power
                    retval = _.pow(retval, p);
                }

                // Transfer the multiplier
                retval.multiplier = retval.multiplier.multiply(m);

                // Done
                return retval;
            }
            // If all else fails
            return this.clone();
        },
        isMonomial() {
            if (this.group === S) {
                return true;
            }
            if (this.group === CB) {
                for (const x in this.symbols) {
                    if (this.symbols[x].group !== S) {
                        return false;
                    }
                }
            } else {
                return false;
            }
            return true;
        },
        isPi() {
            return this.group === S && this.value === 'pi';
        },
        sign() {
            return this.multiplier.sign();
        },
        isE() {
            return this.value === 'e';
        },
        isSQRT() {
            return this.fname === SQRT;
        },
        isConstant(checkAll, checkSymbols) {
            if (checkSymbols && this.group === CB) {
                for (const x in this.symbols) {
                    if (this.symbols[x].isConstant(true)) {
                        return true;
                    }
                }
            }

            if (checkAll === 'functions' && this.isComposite()) {
                let isConstant = true;

                this.each(x => {
                    if (!x.isConstant(checkAll, checkSymbols)) {
                        isConstant = false;
                    }
                }, true);

                return isConstant;
            }

            if (checkAll === 'all' && (this.isPi() || this.isE())) {
                return true;
            }

            if (checkAll && this.group === FN) {
                for (let i = 0; i < this.args.length; i++) {
                    if (!this.args[i].isConstant(checkAll)) {
                        return false;
                    }
                }
                return true;
            }

            if (checkAll) {
                return isNumericSymbol(this);
            }
            return this.value === CONST_HASH;
        },
        // The symbols is imaginary if
        // 1. n*i
        // 2. a+b*i
        // 3. a*i
        isImaginary() {
            if (this.imaginary) {
                return true;
            }
            if (this.symbols) {
                for (const x in this.symbols) {
                    if (this.symbols[x].isImaginary()) {
                        return true;
                    }
                }
            }
            return false;
        },
        /**
         * Returns the real part of a symbol
         *
         * @returns {NerdamerSymbolType}
         */
        realpart() {
            if (this.isConstant()) {
                return this.clone();
            }
            if (this.imaginary) {
                return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(0)));
            }
            if (this.isComposite()) {
                /** @type {NerdamerSymbolType} */
                let retval = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(0)));
                this.each(x => {
                    retval = _.add(retval, x.realpart());
                });
                return retval;
            }
            if (this.isImaginary()) {
                return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(0)));
            }
            return this.clone();
        },
        /*
         * Return imaginary part of a symbol
         * @returns {NerdamerSymbolType}
         */
        imagpart() {
            if (this.group === S && this.isImaginary()) {
                /** @type {NerdamerSymbolType} */
                let x = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this));
                if (this.power.isNegative()) {
                    x = this.clone();
                    x.power.negate();
                    x.multiplier.negate();
                }
                return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(x.multiplier)));
            }
            if (this.isComposite()) {
                /** @type {NerdamerSymbolType} */
                let retval = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(0)));
                this.each(x => {
                    retval = _.add(retval, x.imagpart());
                });
                return retval;
            }
            if (this.group === CB) {
                return this.stripVar(Settings.IMAGINARY);
            }
            return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(0)));
        },
        isInteger() {
            return this.isConstant() && this.multiplier.isInteger();
        },
        isLinear(wrt) {
            if (wrt) {
                if (this.isConstant()) {
                    return true;
                }
                // If this symbol doesn't contain the variable (including in exponents), it's constant with respect to it
                if (!this.contains(wrt, true)) {
                    return true;
                }
                if (this.group === S) {
                    if (this.value === wrt) {
                        return this.power.equals(1);
                    }
                    return true;
                }

                if (this.isComposite() && this.power.equals(1)) {
                    for (const x in this.symbols) {
                        if (!this.symbols[x].isLinear(wrt)) {
                            return false;
                        }
                    }
                    return true;
                }

                if (this.group === CB) {
                    // If the variable doesn't exist in this term, it's constant wrt that variable, hence linear
                    if (!this.symbols[wrt]) {
                        return true;
                    }
                    return this.symbols[wrt].isLinear(wrt);
                }
                return false;
            }
            return this.power.equals(1);
        },
        /**
         * Checks to see if a symbol has a function by a specified name or within a specified list
         *
         * @param {string | string[]} names
         * @returns {boolean}
         */
        containsFunction(names) {
            if (typeof names === 'string') {
                names = [names];
            }
            if (this.group === FN && names.indexOf(this.fname) !== -1) {
                return true;
            }
            if (this.symbols) {
                for (const x in this.symbols) {
                    if (this.symbols[x].containsFunction(names)) {
                        return true;
                    }
                }
            }
            return false;
        },
        /**
         * Multiplies the current power by the given power
         *
         * @param {NerdamerSymbolType | FracType} p2
         * @returns {NerdamerSymbolType}
         */
        multiplyPower(p2) {
            // Leave out 1
            if (this.group === N && this.multiplier.equals(1)) {
                return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this));
            }

            /** @type {FracType | NerdamerSymbolType} */
            let p1 = this.power;

            if (this.group !== EX && isSymbol(p2) && p2.group === N) {
                const p = p2.multiplier;
                if (this.group === N && !p.isInteger()) {
                    this.convert(P);
                }

                this.power = /** @type {FracType} */ (
                    p1.equals(1) ? p.clone() : /** @type {FracType} */ (p1).multiply(p)
                );

                if (this.group === P && isInt(this.power)) {
                    // Bring it back to an N
                    this.value = Number(this.value) ** Number(this.power);
                    this.toLinear();
                    this.convert(N);
                }
            } else {
                if (this.group !== EX) {
                    p1 = /** @type {FracType | NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(p1)));
                    this.convert(EX);
                }
                /** @type {FracType | NerdamerSymbolType} */
                const newPower = /** @type {FracType | NerdamerSymbolType} */ (
                    /** @type {unknown} */ (_.multiply(p1, p2))
                );
                /** @type {FracType | NerdamerSymbolType} */
                this.power = newPower;
            }

            return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this));
        },
        setPower(p, retainSign = false) {
            // Leave out 1
            if (this.group === N && this.multiplier.equals(1)) {
                return this;
            }
            if (this.group === EX && !isSymbol(p)) {
                this.group = this.previousGroup;
                delete this.previousGroup;
                if (this.group === N) {
                    this.multiplier = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(this.value)));
                    this.value = CONST_HASH;
                } else {
                    this.power = p;
                }
            } else {
                let isSymbolic = false;
                if (isSymbol(p)) {
                    if (p.group === N) {
                        // P should be the multiplier instead
                        p = p.multiplier;
                    } else {
                        isSymbolic = true;
                    }
                }
                const group = isSymbolic ? EX : P;
                this.power = p;
                if (this.group === N && group) {
                    this.convert(group, retainSign);
                }
            }

            return this;
        },
        /**
         * Checks to see if symbol is located in the denominator
         *
         * @returns {boolean}
         */
        isInverse() {
            if (this.group === EX) {
                return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this.power)).multiplier.lessThan(0);
            }
            return Number(this.power) < 0;
        },
        /**
         * Make a duplicate of a symbol by copying a predefined list of items. The name 'copy' would probably be a more
         * appropriate name. to a new symbol
         *
         * @param {NerdamerSymbolType} [c]
         * @returns {NerdamerSymbolType}
         */
        clone(c = undefined) {
            /** @type {NerdamerSymbolType} */
            const self = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this));
            const clone = c || /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(0)));
            // List of properties excluding power as this may be a symbol and would also need to be a clone.
            const properties = [
                'value',
                'group',
                'length',
                'previousGroup',
                'imaginary',
                'fname',
                'args',
                'isInfinity',
                'scientific',
            ];
            const l = properties.length;
            let i;
            if (self.symbols) {
                clone.symbols = {};
                for (const x in self.symbols) {
                    if (!Object.hasOwn(self.symbols, x)) {
                        continue;
                    }
                    clone.symbols[x] = self.symbols[x].clone();
                }
            }

            for (i = 0; i < l; i++) {
                if (self[properties[i]] !== undefined) {
                    clone[properties[i]] = self[properties[i]];
                }
            }

            clone.power = self.power.clone();
            clone.multiplier = self.multiplier.clone();
            // Add back the flag to track if this symbol is a conversion symbol
            if (self.isConversion) {
                clone.isConversion = self.isConversion;
            }

            if (self.isUnit) {
                clone.isUnit = self.isUnit;
            }

            return clone;
        },
        /**
         * Converts a symbol multiplier to one.
         *
         * @param {boolean} [keepSign] Keep the multiplier as negative if the multiplier is negative and keepSign is
         *   true
         */
        toUnitMultiplier(keepSign = false) {
            this.multiplier.num = new bigInt(this.multiplier.num.isNegative() && keepSign ? -1 : 1);
            this.multiplier.den = new bigInt(1);
            return this;
        },
        /** Converts a NerdamerSymbol's power to one. */
        toLinear() {
            // Do nothing if it's already linear
            if (this.power.equals(1)) {
                return this;
            }
            this.setPower(new Frac(1));
            return this;
        },
        /**
         * Iterates over all the sub-symbols. If no sub-symbols exist then it's called on itself
         *
         * @param {Function} fn
         * @param {boolean} [deep] If true it will itterate over the sub-symbols their symbols as well
         */
        each(fn, deep = false) {
            if (this.symbols) {
                for (const x in this.symbols) {
                    if (!Object.hasOwn(this.symbols, x)) {
                        continue;
                    }
                    const sym = this.symbols[x];
                    if (sym.group === PL && deep) {
                        for (const y in sym.symbols) {
                            if (!Object.hasOwn(sym.symbols, y)) {
                                continue;
                            }
                            fn.call(x, sym.symbols[y], y);
                        }
                    } else {
                        fn.call(this, sym, x);
                    }
                }
            } else {
                fn.call(this, this, this.value);
            }
        },
        /**
         * A numeric value to be returned for Javascript. It will try to return a number as far a possible but in case
         * of a pure symbolic symbol it will just return its text representation
         *
         * @returns {string | number}
         */
        valueOf() {
            if (this.group === N) {
                return this.multiplier.valueOf();
            }
            if (this.power.equals(0)) {
                return 1;
            }
            if (this.multiplier.equals(0)) {
                return 0;
            }
            return text(this, 'decimals');
        },
        /**
         * Checks to see if a symbols has a particular variable within it. Pass in true as second argument to include
         * the power of exponentials which aren't check by default.
         *
         * @example
         *     let s = _.parse('x+y+z');
         *     s.contains('y');
         *     //returns true
         *
         * @param {any} variable
         * @param {boolean} [all]
         * @returns {boolean}
         */
        contains(variable, all = false) {
            // Contains expects a string
            variable = String(variable);
            const g = this.group;
            if (this.value === variable) {
                return true;
            }
            if (this.symbols) {
                for (const x in this.symbols) {
                    if (this.symbols[x].contains(variable, all)) {
                        return true;
                    }
                }
            }
            if (g === FN || this.previousGroup === FN) {
                for (let i = 0; i < this.args.length; i++) {
                    if (this.args[i].contains(variable, all)) {
                        return true;
                    }
                }
            }

            if (g === EX) {
                // Exit only if it does
                if (
                    all &&
                    /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this.power)).contains(variable, all)
                ) {
                    return true;
                }
                if (this.value === variable) {
                    return true;
                }
            }

            return this.value === variable;
        },
        /** Negates a symbols */
        negate() {
            this.multiplier.negate();
            if (this.group === CP || this.group === PL) {
                this.distributeMultiplier();
            }
            return this;
        },
        /**
         * Inverts a symbol
         *
         * @param {boolean} [powerOnly]
         * @param {boolean} [all]
         */
        invert(powerOnly = false, all = false) {
            // Invert the multiplier
            if (!powerOnly) {
                this.multiplier = this.multiplier.invert();
            }
            // Invert the rest
            if (isSymbol(this.power)) {
                this.power.negate();
            } else if (this.group === CB && all) {
                this.each(x => x.invert());
            } else if (this.power && this.group !== N) {
                this.power.negate();
            }
            return this;
        },
        /**
         * Symbols of group CP or PL may have the multiplier being carried by the top level symbol at any given time
         * e.g. 2*(x+y+z). This is convenient in many cases, however in some cases the multiplier needs to be carried
         * individually e.g. 2_x+2_y+2*z. This method distributes the multiplier over the entire symbol
         *
         * @param {boolean} [all]
         */
        distributeMultiplier(all = false) {
            const isOne = all ? this.power.absEquals(1) : this.power.equals(1);
            if (this.symbols && isOne && this.group !== CB && !this.multiplier.equals(1)) {
                for (const x in this.symbols) {
                    if (!Object.hasOwn(this.symbols, x)) {
                        continue;
                    }
                    const s = this.symbols[x];
                    s.multiplier = s.multiplier.multiply(this.multiplier);
                    s.distributeMultiplier();
                }
                this.toUnitMultiplier();
            }

            return this;
        },
        /** This method expands the exponent over the entire symbol just like distributeMultiplier */
        distributeExponent() {
            if (!this.power.equals(1)) {
                const p = this.power;
                for (const x in this.symbols) {
                    if (!Object.hasOwn(this.symbols, x)) {
                        continue;
                    }
                    const s = this.symbols[x];
                    if (s.group === EX) {
                        s.power = _.multiply(s.power, new NerdamerSymbol(p));
                    } else if (isSymbol(this.symbols[x].power)) {
                        this.symbols[x].power = _.multiply(this.symbols[x].power, new NerdamerSymbol(p));
                    } else {
                        this.symbols[x].power = this.symbols[x].power.multiply(p);
                    }
                }
                this.toLinear();
            }
            return this;
        },
        /**
         * This method will attempt to up-convert or down-convert one symbol from one group to another. Not all symbols
         * are convertible from one group to another however. In that case the symbol will remain unchanged.
         *
         * @param {number} group
         * @param {boolean} [imaginary]
         */
        convert(group, imaginary = undefined) {
            if (group > FN) {
                // Make a clone of this symbol;
                const cp = this.clone();

                // Attach a symbols object and upgrade the group
                this.symbols = {};

                if (group === CB) {
                    // Symbol of group CB hold symbols bound together through multiplication
                    // because of commutativity this multiplier can technically be anywhere within the group
                    // to keep track of it however it's easier to always have the top level carry it
                    cp.toUnitMultiplier();
                } else {
                    // Reset the symbol
                    this.toUnitMultiplier();
                }

                if (this.group === FN) {
                    cp.args = /** @type {NerdamerSymbolType[] | undefined} */ (/** @type {unknown} */ (this.args));
                    delete this.args;
                    delete this.fname;
                }

                // The symbol may originate from the symbol i but this property no longer holds true
                // after copying
                if (this.isImgSymbol) {
                    delete this.isImgSymbol;
                }

                this.toLinear();
                // Attach a clone of this symbol to the symbols object using its proper key
                this.symbols[cp.keyForGroup(group)] = cp;
                this.group = group;
                // Objects by default don't have a length property. However, in order to keep track of the number
                // of sub-symbols we have to impliment our own.
                this.length = 1;
            } else if (group === EX) {
                // 1^x is just one so check and make sure
                if (!(this.group === N && this.multiplier.equals(1))) {
                    if (this.group !== EX) {
                        this.previousGroup = this.group;
                    }
                    if (this.group === N) {
                        this.value = this.multiplier.num.toString();
                        this.toUnitMultiplier();
                    }
                    // Update the hash to reflect the accurate hash
                    else {
                        this.value = text(this, 'hash');
                    }

                    this.group = EX;
                }
            } else if (group === N) {
                const m = this.multiplier.toDecimal();
                this.symbols &&= undefined;
                new NerdamerSymbol(this.group === P ? Number(m) * Number(this.value) ** Number(this.power) : m).clone(
                    this
                );
            } else if (group === P && this.group === N) {
                this.value = imaginary
                    ? this.multiplier.num.toString()
                    : Math.abs(Number(this.multiplier.num.toString()));
                this.toUnitMultiplier(!imaginary);
                this.group = P;
            }
            return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (this));
        },
        /**
         * This method is one of the principal methods to make it all possible. It performs cleanup and prep operations
         * whenever a symbols is inserted. If the symbols results in a 1 in a CB (multiplication) group for instance it
         * will remove the redundant symbol. Similarly in a symbol of group PL or CP (symbols glued by multiplication)
         * it will remove any dangling zeroes from the symbol. It will also up-convert or down-convert a symbol if it
         * detects that it's incorrectly grouped. It should be noted that this method is not called directly but rather
         * by the 'attach' method for addition groups and the 'combine' method for multiplication groups.
         *
         * @param {NerdamerSymbolType} symbol
         * @param {string} action
         */
        insert(symbol, action) {
            // This check can be removed but saves a lot of aggravation when trying to hunt down
            // a bug. If left, you will instantly know that the error can only be between 2 symbols.
            if (!isSymbol(symbol)) {
                err(`Object ${symbol} is not of type NerdamerSymbol!`);
            }
            if (this.symbols) {
                const { group } = this;
                if (group > FN) {
                    const key = symbol.keyForGroup(group);
                    const existing = key in this.symbols ? this.symbols[key] : false; // Check if there's already a symbol there
                    if (action === 'add') {
                        const hash = key;
                        if (existing) {
                            // Add them together using the parser
                            this.symbols[hash] = _.add(existing, symbol);
                            // If the addition resulted in a zero multiplier remove it
                            if (this.symbols[hash].multiplier.equals(0)) {
                                delete this.symbols[hash];
                                this.length--;

                                if (this.length === 0) {
                                    this.convert(N);
                                    this.multiplier = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(0)));
                                }
                            }
                        } else {
                            this.symbols[key] = symbol;
                            this.length++;
                        }
                    } else {
                        // Check if this is of group P and unwrap before inserting
                        if (symbol.group === P && isInt(symbol.power)) {
                            symbol.convert(N);
                        }

                        // Transfer the multiplier to the upper symbol but only if the symbol numeric
                        if (symbol.group === EX) {
                            symbol.parens = symbol.multiplier.lessThan(0);
                            this.multiplier = this.multiplier.multiply(symbol.multiplier.clone().abs());
                            symbol.toUnitMultiplier(true);
                        } else {
                            this.multiplier = this.multiplier.multiply(symbol.multiplier);
                            symbol.toUnitMultiplier();
                        }

                        if (existing) {
                            // Remove because the symbol may have changed
                            symbol = _.multiply(remove(this.symbols, key), symbol);
                            if (symbol.isConstant()) {
                                this.multiplier = this.multiplier.multiply(symbol.multiplier);
                                symbol = /** @type {NerdamerSymbolType} */ (
                                    /** @type {unknown} */ (new NerdamerSymbol(1))
                                ); // The dirty work gets done down the line when it detects 1
                            }

                            this.length--;
                            // Clean up
                        }

                        // Don't insert the symbol if it's 1
                        if (!symbol.isOne(true)) {
                            this.symbols[key] = symbol;
                            this.length++;
                        } else if (symbol.multiplier.lessThan(0)) {
                            this.negate(); // Put back the sign
                        }
                    }

                    // Clean up
                    if (this.length === 0) {
                        this.convert(N);
                    }
                    // Update the hash
                    if (this.group === CP || this.group === CB) {
                        this.updateHash();
                    }
                }
            }

            return this;
        },
        /** The insert method for addition */
        attach(symbol) {
            if (isArray(symbol)) {
                for (let i = 0; i < symbol.length; i++) {
                    this.insert(symbol[i], 'add');
                }
                return this;
            }
            return this.insert(symbol, 'add');
        },
        /** The insert method for multiplication */
        combine(symbol) {
            if (isArray(symbol)) {
                for (let i = 0; i < symbol.length; i++) {
                    this.insert(symbol[i], 'multiply');
                }
                return this;
            }
            return this.insert(symbol, 'multiply');
        },
        /**
         * This method should be called after any major "surgery" on a symbol. It updates the hash of the symbol for
         * example if the fname of a function has changed it will update the hash of the symbol.
         */
        updateHash() {
            if (this.group === N) {
                return;
            }

            if (this.group === FN) {
                let contents = '';
                const { args } = this;
                const isParens = this.fname === PARENTHESIS;
                for (let i = 0; i < args.length; i++) {
                    contents += (i === 0 ? '' : ',') + text(args[i]);
                }
                const fnName = isParens ? '' : this.fname;
                this.value = fnName + (isParens ? contents : inBrackets(contents));
            } else if (!(this.group === S || this.group === PL)) {
                this.value = text(this, 'hash');
            }
        },
        /**
         * This function defines how every group in stored within a group of higher order think of it as the switchboard
         * for the library. It defines the hashes for symbols.
         *
         * @param {number} group
         */
        keyForGroup(group) {
            const g = this.group;
            let key;

            if (g === N) {
                key = this.value;
            } else if (g === S || g === P) {
                if (group === PL) {
                    key = this.power.toDecimal();
                } else {
                    key = this.value;
                }
            } else if (g === FN) {
                if (group === PL) {
                    key = this.power.toDecimal();
                } else {
                    key = text(this, 'hash');
                }
            } else if (g === PL) {
                // If the order is reversed then we'll assume multiplication
                // TODO: possible future dilemma
                if (group === CB) {
                    key = text(this, 'hash');
                } else if (group === CP) {
                    if (this.power.equals(1)) {
                        key = this.value;
                    } else {
                        key = inBrackets(text(this, 'hash')) + Settings.POWER_OPERATOR + this.power.toDecimal();
                    }
                } else if (group === PL) {
                    key = this.power.toString();
                } else {
                    key = this.value;
                }
                return key;
            } else if (g === CP) {
                if (group === CP) {
                    key = text(this, 'hash');
                }
                if (group === PL) {
                    key = this.power.toDecimal();
                } else {
                    key = this.value;
                }
            } else if (g === CB) {
                if (group === PL) {
                    key = this.power.toDecimal();
                } else {
                    key = text(this, 'hash');
                }
            } else if (g === EX) {
                if (group === PL) {
                    key = text(this.power);
                } else {
                    key = text(this, 'hash');
                }
            }

            return key;
        },
        /**
         * Symbols are typically stored in an object which works fine for most cases but presents a problem when the
         * order of the symbols makes a difference. This function simply collects all the symbols and returns them as an
         * array. If a function is supplied then that function is called on every symbol contained within the object.
         *
         * @param {Function} fn
         * @param {object} opt
         * @param {((a: any, b: any) => number) | undefined | null} sortFn
         * @param {boolean} expandSymbol
         * @returns {Array}
         */
        collectSymbols(fn, opt, sortFn, expandSymbol) {
            let collected = [];
            if (this.symbols) {
                for (const x in this.symbols) {
                    if (!Object.hasOwn(this.symbols, x)) {
                        continue;
                    }
                    const symbol = this.symbols[x];
                    if (expandSymbol && (symbol.group === PL || symbol.group === CP)) {
                        collected = collected.concat(symbol.collectSymbols());
                    } else {
                        collected.push(fn ? fn(symbol, opt) : symbol);
                    }
                }
            } else {
                collected.push(this);
            }
            if (sortFn === null) {
                sortFn = undefined;
            } // WTF Firefox? Seriously?

            return collected.sort(sortFn); // Sort hopefully gives us some sort of consistency
        },

        /**
         * CollectSymbols but only for summands
         *
         * @param {Function} fn
         * @param {object} opt
         * @param {((a: any, b: any) => number) | undefined | null} sortFn
         * @param {boolean} expandSymbol
         * @returns {Array}
         */
        collectSummandSymbols(fn, opt, sortFn, expandSymbol) {
            let collected = [];
            if (!this.symbols || this.group === CB) {
                collected.push(this);
            } else {
                for (const x in this.symbols) {
                    if (!Object.hasOwn(this.symbols, x)) {
                        continue;
                    }
                    const symbol = this.symbols[x];
                    if (expandSymbol && (symbol.group === PL || symbol.group === CP)) {
                        collected = collected.concat(symbol.collectSymbols());
                    } else {
                        collected.push(fn ? fn(symbol, opt) : symbol);
                    }
                }
            }
            if (sortFn === null) {
                sortFn = undefined;
            } // WTF Firefox? Seriously?

            return collected.sort(sortFn); // Sort hopefully gives us some sort of consistency
        },
        /**
         * Returns the latex representation of the symbol
         *
         * @param {string} option
         * @returns {string}
         */
        latex(option) {
            return LaTeX.latex(this, option);
        },
        /**
         * Returns the text representation of a symbol
         *
         * @param {string} [option]
         * @returns {string}
         */
        text(option = undefined) {
            return text(this, option);
        },
        /**
         * Checks if the function evaluates to 1. e.g. x^0 or 1 :)
         *
         * @param {boolean} [abs] Compares the absolute value
         */
        isOne(abs = false) {
            const f = abs ? 'absEquals' : 'equals';
            if (this.group === N) {
                return this.multiplier[f](1);
            }
            return this.power.equals(0);
        },
        isComposite() {
            const g = this.group;
            const pg = this.previousGroup;
            return g === CP || g === PL || pg === PL || pg === CP;
        },
        isCombination() {
            const g = this.group;
            const pg = this.previousGroup;
            return g === CB || pg === CB;
        },
        lessThan(n) {
            return this.multiplier.lessThan(n);
        },
        greaterThan(n) {
            if (!isSymbol(n)) {
                n = new NerdamerSymbol(n);
            }

            // We can't tell for sure if a is greater than be if they're not both numbers
            if (!this.isConstant(true) || !n.isConstant(true)) {
                return false;
            }

            return this.multiplier.greaterThan(n.multiplier);
        },
        /**
         * Get's the denominator of the symbol if the symbol is of class CB (multiplication) with other classes the
         * symbol is either the denominator or not. Take x^-1+x^-2. If the symbol was to be mixed such as x+x^-2 then
         * the symbol doesn't have have an exclusive denominator and has to be found by looking at the actual symbols
         * themselves.
         */
        getDenom() {
            let retval;
            let symbol;
            symbol = this.clone();
            // E.g. 1/(x*(x+1))
            if (this.group === CB && this.power.lessThan(0)) {
                symbol = _.expand(symbol);
            }

            // If the symbol already is the denominator... DONE!!!
            if (
                symbol.power.lessThan(0) ||
                (symbol.group === EX && /** @type {NerdamerSymbolType} */ (symbol.power).multiplier.lessThan(0))
            ) {
                const d = _.parse(symbol.multiplier.den);
                retval = symbol.toUnitMultiplier();
                retval.power.negate();
                retval = _.multiply(d, retval); // Put back the coeff
            } else if (symbol.group === CB) {
                retval = _.parse(symbol.multiplier.den);
                for (const x in symbol.symbols) {
                    if (!Object.hasOwn(symbol.symbols, x)) {
                        continue;
                    }
                    const s = symbol.symbols[x];
                    if (
                        Number(s.power) < 0 ||
                        (s.group === EX && /** @type {NerdamerSymbolType} */ (s.power).multiplier.lessThan(0))
                    ) {
                        retval = _.multiply(retval, symbol.symbols[x].clone().invert());
                    }
                }
            } else {
                retval = _.parse(symbol.multiplier.den);
            }
            return retval;
        },
        getNum() {
            let retval;
            let symbol;
            symbol = this.clone();
            // E.g. 1/(x*(x+1))
            if (symbol.group === CB && symbol.power.lessThan(0)) {
                symbol = _.expand(symbol);
            }
            // If the symbol already is the denominator... DONE!!!
            if (
                (symbol.power.greaterThan(0) && symbol.group !== CB) ||
                (symbol.group === EX && /** @type {NerdamerSymbolType} */ (symbol.power).multiplier.greaterThan(0))
            ) {
                retval = _.multiply(_.parse(symbol.multiplier.num), symbol.toUnitMultiplier());
            } else if (symbol.group === CB) {
                retval = _.parse(symbol.multiplier.num);
                symbol.each(x => {
                    if (
                        Number(x.power) > 0 ||
                        (x.group === EX && /** @type {NerdamerSymbolType} */ (x.power).multiplier.greaterThan(0))
                    ) {
                        retval = _.multiply(retval, x.clone());
                    }
                });
            }
            //            Else if(symbol.group === EX && this.previousGroup === S) {
            //                retval = _.multiply(_.parse(symbol.multiplier.num), symbol.toUnitMultiplier());
            //            }
            else {
                retval = _.parse(symbol.multiplier.num);
            }
            return retval;
        },
        toString() {
            return this.text();
        },
    };

    // Parser =======================================================================
    // Uses modified Shunting-yard algorithm. http://en.wikipedia.org/wiki/Shunting-yard_algorithm
    /** @class */
    function Parser() {
        // Point to the local parser instead of this global one

        /** @type {ParserType} */
        const _parser = /** @type {ParserType} */ (/** @type {unknown} */ (this));
        const bin = {};
        const preprocessors = { names: [], actions: [] };

        // Parser.classes ===============================================================
        function Slice(upper, lower) {
            this.start = upper;
            this.end = lower;
        }
        Slice.prototype.isConstant = function isConstant() {
            return this.start.isConstant() && this.end.isConstant();
        };
        // eslint-disable-next-line func-names -- naming this 'text' would shadow the outer text function
        Slice.prototype.text = function () {
            return `${text(this.start)}:${text(this.end)}`;
        };

        function Token(node, nodeType, column) {
            this.type = nodeType;
            this.value = node;
            if (column !== undefined) {
                this.column = column + 1;
            }
            if (nodeType === Token.OPERATOR) {
                // Copy everything over from the operator
                // eslint-disable-next-line no-use-before-define -- operators is defined later but this function is only called after
                const operator = operators[node];
                for (const x in operator) {
                    if (!Object.hasOwn(operator, x)) {
                        continue;
                    }
                    this[x] = operator[x];
                }
            } else if (nodeType === Token.FUNCTION) {
                this.precedence = Token.MAX_PRECEDENCE; // Leave enough roon
                this.leftAssoc = false;
            }
        }
        /** @this {TokenType} */
        Token.prototype.toString = function toString() {
            if (this.is_prefix) {
                return `\`${this.value}`;
            }
            return this.value;
        };
        // Some constants
        Token.OPERATOR = 'OPERATOR';
        Token.VARIABLE_OR_LITERAL = 'VARIABLE_OR_LITERAL';
        Token.FUNCTION = 'FUNCTION';
        Token.UNIT = 'UNIT';
        Token.KEYWORD = 'KEYWORD';
        Token.MAX_PRECEDENCE = 999;
        // Create link to classes
        this.classes = {
            Collection,
            Slice,
            Token,
        };
        // Parser.modules ===============================================================
        // object for functions which handle complex number
        const complex = {
            prec: undefined,
            cos(r, i) {
                const re = _.parse(String(Math.cos(r) * Math.cosh(i)));
                const im = _.parse(String(Math.sin(r) * Math.sinh(i)));
                return _.subtract(re, _.multiply(im, NerdamerSymbol.imaginary()));
            },
            sin(r, i) {
                const re = _.parse(String(Math.sin(r) * Math.cosh(i)));
                const im = _.parse(String(Math.cos(r) * Math.sinh(i)));
                return _.subtract(re, _.multiply(im, NerdamerSymbol.imaginary()));
            },
            tan(r, i) {
                const re = _.parse(String(Math.sin(2 * r) / (Math.cos(2 * r) + Math.cosh(2 * i))));
                const im = _.parse(String(Math.sinh(2 * i) / (Math.cos(2 * r) + Math.cosh(2 * i))));
                return _.add(re, _.multiply(im, NerdamerSymbol.imaginary()));
            },
            sec(r, i) {
                const t = this.removeDen(this.cos(r, i));
                return _.subtract(t[0], _.multiply(t[1], NerdamerSymbol.imaginary()));
            },
            csc(r, i) {
                const t = this.removeDen(this.sin(r, i));
                return _.add(t[0], _.multiply(t[1], NerdamerSymbol.imaginary()));
            },
            cot(r, i) {
                const t = this.removeDen(this.tan(r, i));
                return _.subtract(t[0], _.multiply(t[1], NerdamerSymbol.imaginary()));
            },
            acos(r, i) {
                const symbol = this.fromArray([r, i]);
                const squared = _.pow(symbol.clone(), new NerdamerSymbol(2));
                const sq = _.expand(squared); // Z*z
                const a = _.multiply(sqrt(_.subtract(new NerdamerSymbol(1), sq)), NerdamerSymbol.imaginary());
                const b = _.expand(_.add(symbol.clone(), a));
                const c = log(b);
                return _.expand(_.multiply(NerdamerSymbol.imaginary().negate(), c));
            },
            asin(r, i) {
                return _.subtract(_.parse('pi/2'), this.acos(r, i));
            },
            atan(r, i) {
                // Handle i and -i
                if (r.equals(0) && (i.equals(1) || i.equals(-1))) {
                    // Just copy Wolfram Alpha for now. The parenthesis
                    return _.parse(`${NerdamerSymbol.infinity()}*${Settings.IMAGINARY}*${i}`);
                }
                const symbol = complex.fromArray([r, i]);
                const a = _.expand(_.multiply(NerdamerSymbol.imaginary(), symbol.clone()));
                const b = log(_.expand(_.subtract(new NerdamerSymbol(1), a.clone())));
                const c = log(_.expand(_.add(new NerdamerSymbol(1), a.clone())));
                return _.expand(
                    _.multiply(_.divide(NerdamerSymbol.imaginary(), new NerdamerSymbol(2)), _.subtract(b, c))
                );
            },
            asec(r, i) {
                const d = this.removeDen([r, i]);
                d[1].negate();
                return this.acos(...d);
            },
            acsc(r, i) {
                const d = this.removeDen([r, i]);
                d[1].negate();
                return this.asin(...d);
            },
            acot(r, i) {
                const d = this.removeDen([r, i]);
                d[1].negate();
                return this.atan(...d);
            },
            // Hyperbolic trig
            cosh(r, i) {
                const re = _.parse(String(Math.cosh(r) * Math.cos(i)));
                const im = _.parse(String(Math.sinh(r) * Math.sin(i)));
                return _.add(re, _.multiply(im, NerdamerSymbol.imaginary()));
            },
            sinh(r, i) {
                const re = _.parse(String(Math.sinh(r) * Math.cos(i)));
                const im = _.parse(String(Math.cosh(r) * Math.sin(i)));
                return _.add(re, _.multiply(im, NerdamerSymbol.imaginary()));
            },
            tanh(r, i) {
                const re = _.parse(String(Math.sinh(2 * r) / (Math.cos(2 * i) + Math.cosh(2 * r))));
                const im = _.parse(String(Math.sin(2 * i) / (Math.cos(2 * i) + Math.cosh(2 * r))));
                return _.subtract(re, _.multiply(im, NerdamerSymbol.imaginary()));
            },
            sech(r, i) {
                const t = this.removeDen(this.cosh(r, i));
                return _.subtract(t[0], _.multiply(t[1], NerdamerSymbol.imaginary()));
            },
            csch(r, i) {
                const t = this.removeDen(this.sinh(r, i));
                return _.subtract(t[0], _.multiply(t[1], NerdamerSymbol.imaginary()));
            },
            coth(r, i) {
                const t = this.removeDen(this.tanh(r, i));
                return _.add(t[0], _.multiply(t[1], NerdamerSymbol.imaginary()));
            },
            acosh(r, i) {
                const z = this.fromArray([r, i]);
                const a = sqrt(_.add(z.clone(), new NerdamerSymbol(1)));
                const b = sqrt(_.subtract(z.clone(), new NerdamerSymbol(1)));
                return _.expand(log(_.add(z, _.expand(_.multiply(a, b)))));
            },
            asinh(r, i) {
                const z = this.fromArray([r, i]);
                const a = sqrt(_.add(new NerdamerSymbol(1), _.expand(_.pow(z.clone(), new NerdamerSymbol(2)))));
                return _.expand(log(_.add(z, a)));
            },
            atanh(r, i) {
                const z = this.fromArray([r, i]);
                const a = log(_.add(z.clone(), new NerdamerSymbol(1)));
                const b = log(_.subtract(new NerdamerSymbol(1), z));
                return _.expand(_.divide(_.subtract(a, b), new NerdamerSymbol(2)));
            },
            asech(r, i) {
                const t = this.removeDen([r, i]);
                t[1].negate();
                return this.acosh(...t);
            },
            acsch(r, i) {
                const t = this.removeDen([r, i]);
                t[1].negate();
                return this.asinh(...t);
            },
            acoth(r, i) {
                const t = this.removeDen([r, i]);
                t[1].negate();
                return this.atanh(...t);
            },
            sqrt(symbol) {
                const re = symbol.realpart();
                const im = symbol.imagpart();
                const h = NerdamerSymbol.hyp(re, im);
                const a = _.add(re.clone(), h);
                const d = sqrt(_.multiply(new NerdamerSymbol(2), a.clone()));
                return _.add(_.divide(a.clone(), d.clone()), _.multiply(_.divide(im, d), NerdamerSymbol.imaginary()));
            },
            log(r, i) {
                const re = log(NerdamerSymbol.hyp(r, i));
                const phi = Settings.USE_BIG
                    ? new NerdamerSymbol(bigDec.atan2(i.multiplier.toDecimal(), r.multiplier.toDecimal()))
                    : Math.atan2(i, r);
                const im = _.parse(phi);
                return _.add(re, _.multiply(NerdamerSymbol.imaginary(), im));
            },
            erf(symbol, _n) {
                // Do nothing for now. Revisit this in the future.
                return _.symfunction('erf', [symbol]);

                // N = n || 30;

                // let f = function (R, I) {
                //     return block('PARSE2NUMBER', function () {
                //         let retval = new NerdamerSymbol(0);
                //         for(let i = 0; i < n; i++) {
                //             let a, b;
                //             a = _.parse(bigDec.exp(bigDec(i).toPower(2).neg().dividedBy(bigDec(n).pow(2).plus(bigDec(R).toPower(2).times(4)))));
                //             b = _.parse(format('2*({1})-e^(-(2*{0}*{1}*{2}))*(2*{1}*cosh({2}*{3})-{0}*{3}*sinh({3}*{2}))', Settings.IMAGINARY, R, I, i));
                //             retval = _.add(retval, _.multiply(a, b));
                //         }
                //         return _.multiply(retval, new NerdamerSymbol(2));
                //     }, true);
                // };
                // let re, im, a, b, c, k;
                // re = symbol.realpart();
                // im = symbol.imagpart();

                // k = _.parse(format('(e^(-{0}^2))/pi', re));
                // a = _.parse(format('(1-e^(-(2*{0}*{1}*{2})))/(2*{1})', Settings.IMAGINARY, re, im));
                // b = f(re.toString(), im.toString());

                // return _.add(_.parse(Math2.erf(re.toString())), _.multiply(k, _.add(a, b)));
            },
            removeDen(symbol) {
                let r;
                let i;
                if (isArray(symbol)) {
                    r = symbol[0];
                    i = symbol[1];
                } else {
                    r = symbol.realpart();
                    i = symbol.imagpart();
                }

                const den = r ** 2 + i ** 2;
                const re = _.parse(String(r / den));
                const im = _.parse(String(i / den));
                return [re, im];
            },
            fromArray(arr) {
                return _.add(arr[0], _.multiply(NerdamerSymbol.imaginary(), arr[1]));
            },
            evaluate(symbol, f) {
                let re;
                let im;

                const signVal = symbol.power.sign();
                // Remove it from under the denominator
                symbol.power = symbol.power.abs();
                // Expand
                if (symbol.power.greaterThan(1)) {
                    symbol = _.expand(symbol);
                }
                // Remove the denominator
                if (signVal < 0) {
                    const d = this.removeDen(symbol);
                    re = d[0];
                    im = d[1];
                } else {
                    re = symbol.realpart();
                    im = symbol.imagpart();
                }

                if (re.isConstant('all') && im.isConstant('all')) {
                    return this[f](re, im);
                }

                return _.symfunction(f, [symbol]);
            },
        };
        // Object for functions which handle trig
        const trig = (this.trig = {
            // Container for trigonometric function
            cos(symbol) {
                if (symbol.equals('pi') && symbol.multiplier.den.equals(2)) {
                    return new NerdamerSymbol(0);
                }

                if (Settings.PARSE2NUMBER) {
                    if (symbol.equals(new NerdamerSymbol(Settings.PI / 2))) {
                        return new NerdamerSymbol(0);
                    }
                    if (symbol.isConstant()) {
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(bigDec.cos(symbol.multiplier.toDecimal()));
                        }

                        return new NerdamerSymbol(Math.cos(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'cos');
                    }
                }
                if (symbol.equals(0)) {
                    return new NerdamerSymbol(1);
                }

                let retval;
                let c = false;
                const q = getQuadrant(symbol.multiplier.toDecimal());
                const m = symbol.multiplier.abs();
                symbol.multiplier = m;

                if (symbol.isPi() && symbol.isLinear()) {
                    // Return for 1 or -1 for multiples of pi
                    if (isInt(m)) {
                        retval = new NerdamerSymbol(even(m) ? 1 : -1);
                    } else {
                        const _n = Number(m.num);
                        const d = Number(m.den);
                        if (d === 2) {
                            retval = new NerdamerSymbol(0);
                        } else if (d === 3) {
                            retval = _.parse('1/2');
                            c = true;
                        } else if (d === 4) {
                            retval = _.parse('1/sqrt(2)');
                            c = true;
                        } else if (d === 6) {
                            retval = _.parse('sqrt(3)/2');
                            c = true;
                        } else {
                            retval = _.symfunction('cos', [symbol]);
                        }
                    }
                }

                if (c && (q === 2 || q === 3)) {
                    retval.negate();
                }

                retval ||= _.symfunction('cos', [symbol]);

                return retval;
            },
            sin(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        if (Number(symbol.multiplier.toDecimal()) % Math.PI === 0) {
                            return new NerdamerSymbol(0);
                        }

                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(bigDec.sin(symbol.multiplier.toDecimal()));
                        }

                        return new NerdamerSymbol(Math.sin(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'sin');
                    }
                }

                if (symbol.equals(0)) {
                    return new NerdamerSymbol(0);
                }

                let retval;
                let c = false;
                const q = getQuadrant(symbol.multiplier.toDecimal());
                const signVal = symbol.multiplier.sign();
                const m = symbol.multiplier.abs();
                symbol.multiplier = m;
                if (symbol.equals('pi')) {
                    retval = new NerdamerSymbol(0);
                } else if (symbol.isPi() && symbol.isLinear()) {
                    // Return for 0 for multiples of pi
                    if (isInt(m)) {
                        retval = new NerdamerSymbol(0);
                    } else {
                        const _n = m.num;
                        const d = m.den;
                        if (d.equals(2)) {
                            retval = new NerdamerSymbol(1);
                            c = true;
                        } else if (d.equals(3)) {
                            retval = _.parse('sqrt(3)/2');
                            c = true;
                        } else if (d.equals(4)) {
                            retval = _.parse('1/sqrt(2)');
                            c = true;
                        } else if (d.equals(6)) {
                            retval = _.parse('1/2');
                            c = true;
                        } else {
                            retval = _.multiply(new NerdamerSymbol(signVal), _.symfunction('sin', [symbol]));
                        }
                    }
                }

                retval ||= _.multiply(new NerdamerSymbol(signVal), _.symfunction('sin', [symbol]));

                if (c && (q === 3 || q === 4)) {
                    retval.negate();
                }

                return retval;
            },
            tan(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (Number(symbol.multiplier.toDecimal()) % Math.PI === 0 && symbol.isLinear()) {
                        return new NerdamerSymbol(0);
                    }
                    if (symbol.isConstant()) {
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(bigDec.tan(symbol.multiplier.toDecimal()));
                        }

                        return new NerdamerSymbol(Math.tan(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'tan');
                    }
                }
                let retval;
                let c = false;
                const q = getQuadrant(symbol.multiplier.toDecimal());
                const m = symbol.multiplier;

                symbol.multiplier = m;

                if (symbol.isPi() && symbol.isLinear()) {
                    // Return 0 for all multiples of pi
                    if (isInt(m)) {
                        retval = new NerdamerSymbol(0);
                    } else {
                        const _n = m.num;
                        const d = m.den;
                        if (d.equals(2)) {
                            throw new UndefinedError(`tan is undefined for ${symbol.toString()}`);
                        } else if (d.equals(3)) {
                            retval = _.parse('sqrt(3)');
                            c = true;
                        } else if (d.equals(4)) {
                            retval = new NerdamerSymbol(1);
                            c = true;
                        } else if (d.equals(6)) {
                            retval = _.parse('1/sqrt(3)');
                            c = true;
                        } else {
                            retval = _.symfunction('tan', [symbol]);
                        }
                    }
                }

                retval ||= _.symfunction('tan', [symbol]);

                if (c && (q === 2 || q === 4)) {
                    retval.negate();
                }

                return retval;
            },
            sec(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(
                                new bigDec(1).dividedBy(bigDec.cos(symbol.multiplier.toDecimal()))
                            );
                        }

                        return new NerdamerSymbol(Math2.sec(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'sec');
                    }
                    return _.parse(format('1/cos({0})', symbol));
                }

                let retval;
                let c = false;
                const q = getQuadrant(symbol.multiplier.toDecimal());
                const m = symbol.multiplier.abs();
                symbol.multiplier = m;

                if (symbol.isPi() && symbol.isLinear()) {
                    // Return for 1 or -1 for multiples of pi
                    if (isInt(m)) {
                        retval = new NerdamerSymbol(even(m) ? 1 : -1);
                    } else {
                        const _n = m.num;
                        const d = m.den;
                        if (d.equals(2)) {
                            throw new UndefinedError(`sec is undefined for ${symbol.toString()}`);
                        } else if (d.equals(3)) {
                            retval = new NerdamerSymbol(2);
                            c = true;
                        } else if (d.equals(4)) {
                            retval = _.parse('sqrt(2)');
                            c = true;
                        } else if (d.equals(6)) {
                            retval = _.parse('2/sqrt(3)');
                            c = true;
                        } else {
                            retval = _.symfunction('sec', [symbol]);
                        }
                    }
                }

                if (c && (q === 2 || q === 3)) {
                    retval.negate();
                }

                retval ||= _.symfunction('sec', [symbol]);

                return retval;
            },
            csc(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(
                                new bigDec(1).dividedBy(bigDec.sin(symbol.multiplier.toDecimal()))
                            );
                        }

                        return new NerdamerSymbol(Math2.csc(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'csc');
                    }
                    return _.parse(format('1/sin({0})', symbol));
                }

                let retval;
                let c = false;
                const q = getQuadrant(symbol.multiplier.toDecimal());
                const signVal = symbol.multiplier.sign();
                const m = symbol.multiplier.abs();

                symbol.multiplier = m;

                if (symbol.isPi() && symbol.isLinear()) {
                    // Return for 0 for multiples of pi
                    if (isInt(m)) {
                        throw new UndefinedError(`csc is undefined for ${symbol.toString()}`);
                    } else {
                        const _n = m.num;
                        const d = m.den;
                        if (d.equals(2)) {
                            retval = new NerdamerSymbol(1);
                            c = true;
                        } else if (d.equals(3)) {
                            retval = _.parse('2/sqrt(3)');
                            c = true;
                        } else if (d.equals(4)) {
                            retval = _.parse('sqrt(2)');
                            c = true;
                        } else if (d.equals(6)) {
                            retval = new NerdamerSymbol(2);
                            c = true;
                        } else {
                            retval = _.multiply(new NerdamerSymbol(signVal), _.symfunction('csc', [symbol]));
                        }
                    }
                }

                retval ||= _.multiply(new NerdamerSymbol(signVal), _.symfunction('csc', [symbol]));

                if (c && (q === 3 || q === 4)) {
                    retval.negate();
                }

                return retval;
            },
            cot(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (Number(symbol.multiplier.toDecimal()) % (Math.PI / 2) === 0) {
                        return new NerdamerSymbol(0);
                    }
                    if (symbol.isConstant()) {
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(
                                new bigDec(1).dividedBy(bigDec.tan(symbol.multiplier.toDecimal()))
                            );
                        }

                        return new NerdamerSymbol(Math2.cot(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'cot');
                    }
                    return _.parse(format('1/tan({0})', symbol));
                }
                let retval;
                let c = false;
                const q = getQuadrant(symbol.multiplier.toDecimal());
                const m = symbol.multiplier;

                symbol.multiplier = m;

                if (symbol.isPi() && symbol.isLinear()) {
                    // Return 0 for all multiples of pi
                    if (isInt(m)) {
                        throw new UndefinedError(`cot is undefined for ${symbol.toString()}`);
                    } else {
                        const _n = m.num;
                        const d = m.den;
                        if (d.equals(2)) {
                            retval = new NerdamerSymbol(0);
                        } else if (d.equals(3)) {
                            retval = _.parse('1/sqrt(3)');
                            c = true;
                        } else if (d.equals(4)) {
                            retval = new NerdamerSymbol(1);
                            c = true;
                        } else if (d.equals(6)) {
                            retval = _.parse('sqrt(3)');
                            c = true;
                        } else {
                            retval = _.symfunction('cot', [symbol]);
                        }
                    }
                }

                retval ||= _.symfunction('cot', [symbol]);

                if (c && (q === 2 || q === 4)) {
                    retval.negate();
                }

                return retval;
            },
            acos(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        // Handle values in the complex domain
                        if (symbol.gt(1) || symbol.lt(-1)) {
                            const x = symbol.toString();
                            return expand(evaluate(`pi/2-asin(${x})`));
                        }
                        // Handle big numbers
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(bigDec.acos(symbol.multiplier.toDecimal()));
                        }

                        return new NerdamerSymbol(Math.acos(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'acos');
                    }
                }
                return _.symfunction('acos', [symbol]);
            },
            asin(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        // Handle values in the complex domain
                        if (symbol.gt(1) || symbol.lt(-1)) {
                            const i = Settings.IMAGINARY;
                            const x = symbol.multiplier.toDecimal();
                            return expand(evaluate(`${i}*log(sqrt(1-${x}^2)-${i}*${x})`));
                        }
                        // Handle big numbers
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(bigDec.asin(symbol.multiplier.toDecimal()));
                        }

                        return new NerdamerSymbol(Math.asin(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'asin');
                    }
                }
                return _.symfunction('asin', [symbol]);
            },
            atan(symbol) {
                let retval;
                if (symbol.equals(0)) {
                    retval = new NerdamerSymbol(0);
                } else if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        // Handle big numbers
                        if (Settings.USE_BIG) {
                            return new NerdamerSymbol(bigDec.atan(symbol.multiplier.toDecimal()));
                        }

                        return new NerdamerSymbol(Math.atan(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'atan');
                    }
                    return _.symfunction('atan', [symbol]);
                } else if (symbol.equals(-1)) {
                    retval = _.parse('-pi/4');
                } else {
                    retval = _.symfunction('atan', [symbol]);
                }
                return retval;
            },
            asec(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.equals(0)) {
                        throw new OutOfFunctionDomainError('Input is out of the domain of sec!');
                    }
                    if (symbol.isConstant()) {
                        return trig.acos(symbol.invert());
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'asec');
                    }
                }
                return _.symfunction('asec', [symbol]);
            },
            acsc(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return trig.asin(symbol.invert());
                    }

                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'acsc');
                    }
                }
                return _.symfunction('acsc', [symbol]);
            },
            acot(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return _.add(_.parse('pi/2'), trig.atan(symbol).negate());
                    }

                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'acot');
                    }
                }
                return _.symfunction('acot', [symbol]);
            },
            atan2(a, b) {
                if (a.equals(0) && b.equals(0)) {
                    throw new UndefinedError('atan2 is undefined for 0, 0');
                }

                if (Settings.PARSE2NUMBER && a.isConstant() && b.isConstant()) {
                    return new NerdamerSymbol(Math.atan2(a, b));
                }
                return _.symfunction('atan2', [a, b]);
            },
        });
        // Object for functions which handle hyperbolic trig
        const trigh = (this.trigh = {
            // Container for hyperbolic trig function
            cosh(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return new NerdamerSymbol(Math.cosh(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'cosh');
                    }
                }

                return _.symfunction('cosh', [symbol]);
            },
            sinh(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return new NerdamerSymbol(Math.sinh(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'sinh');
                    }
                }

                return _.symfunction('sinh', [symbol]);
            },
            tanh(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return new NerdamerSymbol(Math.tanh(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'tanh');
                    }
                }

                return _.symfunction('tanh', [symbol]);
            },
            sech(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return new NerdamerSymbol(Math.sech(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'sech');
                    }
                    return _.parse(format('1/cosh({0})', symbol));
                }

                return _.symfunction('sech', [symbol]);
            },
            csch(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return new NerdamerSymbol(Math.csch(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'csch');
                    }
                    return _.parse(format('1/sinh({0})', symbol));
                }

                return _.symfunction('csch', [symbol]);
            },
            coth(symbol) {
                if (Settings.PARSE2NUMBER) {
                    if (symbol.isConstant()) {
                        return new NerdamerSymbol(Math.coth(symbol.valueOf()));
                    }
                    if (symbol.isImaginary()) {
                        return complex.evaluate(symbol, 'coth');
                    }
                    return _.parse(format('1/tanh({0})', symbol));
                }

                return _.symfunction('coth', [symbol]);
            },
            acosh(symbol) {
                let retval;
                if (Settings.PARSE2NUMBER && symbol.isImaginary()) {
                    retval = complex.evaluate(symbol, 'acosh');
                } else if (Settings.PARSE2NUMBER) {
                    retval = evaluate(_.parse(format(`${Settings.LOG}(({0})+sqrt(({0})^2-1))`, symbol.toString())));
                } else {
                    retval = _.symfunction('acosh', [symbol]);
                }
                return retval;
            },
            asinh(symbol) {
                let retval;
                if (Settings.PARSE2NUMBER && symbol.isImaginary()) {
                    retval = complex.evaluate(symbol, 'asinh');
                } else if (Settings.PARSE2NUMBER) {
                    retval = evaluate(_.parse(format(`${Settings.LOG}(({0})+sqrt(({0})^2+1))`, symbol.toString())));
                } else {
                    retval = _.symfunction('asinh', [symbol]);
                }
                return retval;
            },
            atanh(symbol) {
                let retval;
                if (Settings.PARSE2NUMBER && symbol.isImaginary()) {
                    retval = complex.evaluate(symbol, 'atanh');
                } else if (Settings.PARSE2NUMBER) {
                    retval = evaluate(_.parse(format(`(1/2)*${Settings.LOG}((1+({0}))/(1-({0})))`, symbol.toString())));
                } else {
                    retval = _.symfunction('atanh', [symbol]);
                }
                return retval;
            },
            asech(symbol) {
                let retval;
                if (Settings.PARSE2NUMBER && symbol.isImaginary()) {
                    retval = complex.evaluate(symbol, 'asech');
                } else if (Settings.PARSE2NUMBER) {
                    retval = evaluate(
                        log(
                            _.add(
                                symbol.clone().invert(),
                                sqrt(_.subtract(_.pow(symbol, new NerdamerSymbol(-2)), new NerdamerSymbol(1)))
                            )
                        )
                    );
                } else {
                    retval = _.symfunction('asech', [symbol]);
                }
                return retval;
            },
            acsch(symbol) {
                let retval;
                if (Settings.PARSE2NUMBER && symbol.isImaginary()) {
                    retval = complex.evaluate(symbol, 'acsch');
                } else if (Settings.PARSE2NUMBER) {
                    retval = evaluate(_.parse(format(`${Settings.LOG}((1+sqrt(1+({0})^2))/({0}))`, symbol.toString())));
                } else {
                    retval = _.symfunction('acsch', [symbol]);
                }
                return retval;
            },
            acoth(symbol) {
                let retval;
                if (Settings.PARSE2NUMBER && symbol.isImaginary()) {
                    retval = complex.evaluate(symbol, 'acoth');
                } else if (Settings.PARSE2NUMBER) {
                    if (symbol.equals(1)) {
                        retval = NerdamerSymbol.infinity();
                    } else {
                        retval = evaluate(
                            _.divide(
                                log(
                                    _.divide(
                                        _.add(symbol.clone(), new NerdamerSymbol(1)),
                                        _.subtract(symbol.clone(), new NerdamerSymbol(1))
                                    )
                                ),
                                new NerdamerSymbol(2)
                            )
                        );
                    }
                } else {
                    retval = _.symfunction('acoth', [symbol]);
                }
                return retval;
            },
        });
        // List of supported units
        this.units = {};
        // List all the supported operators
        const operators = {
            '\\': {
                precedence: 8,
                operator: '\\',
                action: 'slash',
                prefix: true,
                postfix: false,
                leftAssoc: true,
                operation(e) {
                    return e; // Bypass the slash
                },
            },
            '!!': {
                precedence: 7,
                operator: '!!',
                action: 'dfactorial',
                prefix: false,
                postfix: true,
                leftAssoc: true,
                operation(e) {
                    return _.symfunction(Settings.DOUBLEFACTORIAL, [e]); // Wrap it in a factorial function
                },
            },
            '!': {
                precedence: 7,
                operator: '!',
                action: 'factorial',
                prefix: false,
                postfix: true,
                leftAssoc: true,
                operation(e) {
                    return _factorial(e); // Wrap it in a factorial function
                },
            },
            '^': {
                precedence: 6,
                operator: '^',
                action: 'pow',
                prefix: false,
                postfix: false,
                leftAssoc: true,
            },
            '**': {
                precedence: 6,
                operator: '**',
                action: 'pow',
                prefix: false,
                postfix: false,
                leftAssoc: true,
            },
            '%': {
                precedence: 4,
                operator: '%',
                action: 'percent',
                prefix: false,
                postfix: true,
                leftAssoc: true,
                overloaded: true,
                overloadAction: 'mod',
                overloadLeftAssoc: false,
                operation(x) {
                    return _.divide(x, new NerdamerSymbol(100));
                },
            },
            '*': {
                precedence: 4,
                operator: '*',
                action: 'multiply',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            '/': {
                precedence: 4,
                operator: '/',
                action: 'divide',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            '+': {
                precedence: 3,
                operator: '+',
                action: 'add',
                prefix: true,
                postfix: false,
                leftAssoc: false,
                operation(x) {
                    return x;
                },
            },
            plus: {
                precedence: 3,
                operator: 'plus',
                action: 'add',
                prefix: true,
                postfix: false,
                leftAssoc: false,
                operation(x) {
                    return x;
                },
            },
            '-': {
                precedence: 3,
                operator: '-',
                action: 'subtract',
                prefix: true,
                postfix: false,
                leftAssoc: false,
                operation(x) {
                    return x.negate();
                },
            },
            '=': {
                precedence: 2,
                operator: '=',
                action: 'equals',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            '==': {
                precedence: 1,
                operator: '==',
                action: 'eq',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            '<': {
                precedence: 1,
                operator: '<',
                action: 'lt',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            '<=': {
                precedence: 1,
                operator: '<=',
                action: 'lte',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            '>': {
                precedence: 1,
                operator: '>',
                action: 'gt',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            '=>': {
                precedence: 1,
                operator: '=>',
                action: 'gte',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            ',': {
                precedence: 0,
                operator: ',',
                action: 'comma',
                prefix: false,
                postfix: false,
                leftAssoc: false,
            },
            ':': {
                precedence: 0,
                operator: ',',
                action: 'assign',
                prefix: false,
                postfix: false,
                leftAssoc: false,
                vectorFn: 'slice',
            },
            ':=': {
                precedence: 0,
                operator: ',',
                action: 'functionAssign',
                prefix: false,
                postfix: false,
                leftAssoc: true,
            },
        };
        // Brackets
        const brackets = {
            '(': {
                type: 'round',
                id: 1,
                is_open: true,
                is_close: false,
            },
            ')': {
                type: 'round',
                id: 2,
                is_open: false,
                is_close: true,
            },
            '[': {
                type: 'square',
                id: 3,
                is_open: true,
                is_close: false,
                maps_to: 'vector',
            },
            ']': {
                type: 'square',
                id: 4,
                is_open: false,
                is_close: true,
            },
            '{': {
                type: 'curly',
                id: 5,
                is_open: true,
                is_close: false,
                maps_to: 'NerdamerSet',
            },
            '}': {
                type: 'curly',
                id: 6,
                is_open: false,
                is_close: true,
            },
        };
        // Supported functions.
        // Format: function_name: [mappedFunction, number_of_parameters]
        const functions = (this.functions = {
            cos: [trig.cos, 1],
            sin: [trig.sin, 1],
            tan: [trig.tan, 1],
            sec: [trig.sec, 1],
            csc: [trig.csc, 1],
            cot: [trig.cot, 1],
            acos: [trig.acos, 1],
            asin: [trig.asin, 1],
            atan: [trig.atan, 1],
            arccos: [trig.acos, 1],
            arcsin: [trig.asin, 1],
            arctan: [trig.atan, 1],
            asec: [trig.asec, 1],
            acsc: [trig.acsc, 1],
            acot: [trig.acot, 1],
            atan2: [trig.atan2, 2],
            acoth: [trigh.acoth, 1],
            asech: [trigh.asech, 1],
            acsch: [trigh.acsch, 1],
            sinh: [trigh.sinh, 1],
            cosh: [trigh.cosh, 1],
            tanh: [trigh.tanh, 1],
            asinh: [trigh.asinh, 1],
            sech: [trigh.sech, 1],
            csch: [trigh.csch, 1],
            coth: [trigh.coth, 1],
            acosh: [trigh.acosh, 1],
            atanh: [trigh.atanh, 1],
            log10: [undefined, 1],
            log2: [undefined, 1],
            log1p: [undefined, 1],
            exp: [exp, 1],
            radians: [radians, 1],
            degrees: [degrees, 1],
            min: [min, -1],
            max: [max, -1],
            erf: [undefined, 1],
            floor: [undefined, 1],
            ceil: [undefined, 1],
            trunc: [undefined, 1],
            Si: [undefined, 1],
            step: [undefined, 1],
            rect: [undefined, 1],
            sinc: [sinc, 1],
            tri: [undefined, 1],
            sign: [sign, 1],
            Ci: [undefined, 1],
            Ei: [undefined, 1],
            Shi: [undefined, 1],
            Chi: [undefined, 1],
            Li: [undefined, 1],
            fib: [undefined, 1],
            fact: [_factorial, 1],
            factorial: [_factorial, 1],
            continuedFraction: [continuedFraction, [1, 2]],
            dfactorial: [undefined, 1],
            gamma_incomplete: [undefined, [1, 2]],
            round: [round, [1, 2]],
            scientific: [scientific, [1, 2]],
            mod: [_mod, 2],
            pfactor: [pfactor, 1],
            vector: [vector, -1],
            matrix: [matrix, -1],
            NerdamerSet: [set, -1],
            imatrix: [imatrix, -1],
            parens: [parens, -1],
            sqrt: [sqrt, 1],
            cbrt: [cbrt, 1],
            nthroot: [nthroot, 2],
            log: [log, [1, 2]],
            expand: [expandall, 1],
            abs: [abs, 1],
            invert: [invert, 1],
            determinant: [determinant, 1],
            size: [size, 1],
            transpose: [transpose, 1],
            dot: [dot, 2],
            cross: [cross, 2],
            vecget: [vecget, 2],
            vecset: [vecset, 3],
            vectrim: [vectrim, [1, 2]],
            matget: [matget, 3],
            matset: [matset, 4],
            matgetrow: [matgetrow, 2],
            matsetrow: [matsetrow, 3],
            matgetcol: [matgetcol, 2],
            matsetcol: [matsetcol, 3],
            rationalize: [rationalize, 1],
            IF: [IF, 3],
            isIn: [isIn, 2],
            // Imaginary support
            realpart: [realpart, 1],
            imagpart: [imagpart, 1],
            conjugate: [conjugate, 1],
            arg: [arg, 1],
            polarform: [polarform, 1],
            rectform: [rectform, 1],
            sort: [sort, [1, 2]],
            integer_part: [undefined, 1],
            union: [union, 2],
            contains: [contains, 2],
            intersection: [intersection, 2],
            difference: [difference, 2],
            intersects: [intersects, 2],
            isSubset: [isSubset, 2],
            primes: [primes, 2],
            // System support
            print: [print, -1],
        });

        // Error handler
        this.error = err;
        // This function is used to comb through the function modules and find a function given its name
        const findFunction = function (fname) {
            const fmodules = Settings.FUNCTION_MODULES;
            const l = fmodules.length;
            for (let i = 0; i < l; i++) {
                const fmodule = fmodules[i];
                if (fname in fmodule) {
                    return fmodule[fname];
                }
            }
            return err(`The function ${fname} is undefined!`);
        };

        /**
         * This method gives the ability to override operators with new methods.
         *
         * @param {string} which
         * @param {Function} withWhat
         */
        this.override = function override(which, withWhat) {
            bin[which] ||= [];
            bin[which].push(this[which]);
            this[which] = withWhat;
        };

        /**
         * Restores a previously overridden operator
         *
         * @param {string} what
         */
        this.restore = function restore(what) {
            this[what] &&= bin[what].pop();
        };

        /**
         * This method is supposed to behave similarly to the override method but it does not override the existing
         * function rather it only extends it
         *
         * @param {string} what
         * @param {Function} withWhat
         * @param {boolean} forceCall
         */
        this.extend = function extend(what, withWhat, forceCall) {
            const self = this;
            const extended = this[what];
            if (typeof extended === 'function' && typeof withWhat === 'function') {
                const f = this[what];
                this[what] = function extendedOp(a, b) {
                    if (isSymbol(a) && isSymbol(b) && !forceCall) {
                        return f.call(self, a, b);
                    }
                    return withWhat.call(self, a, b, f);
                };
            }
        };

        /**
         * Generates library's representation of a function. It's a fancy way of saying a symbol with a few extras. The
         * most important thing is that that it gives a fname and an args property to the symbols in addition to
         * changing its group to FN
         *
         * @param {string} fnName
         * @param {Array} params
         * @returns {NerdamerSymbolType}
         */
        this.symfunction = function symfunction(fnName, params) {
            // Call the proper function and return the result;
            const f = new NerdamerSymbol(fnName);
            f.group = FN;
            if (typeof params === 'object') {
                params = [].slice.call(params);
            } // Ensure an array
            f.args = params;
            f.fname = fnName === PARENTHESIS ? '' : fnName;
            f.updateHash();
            return f;
        };

        /**
         * An internal function call for the Parser. This will either trigger a real function call if it can do so or
         * just return a symbolic representation of the function using symfunction.
         *
         * @param {string} fnName
         * @param {Array} args
         * @param {number} [allowedArgs]
         * @returns {NerdamerSymbolType}
         */
        this.callfunction = function callfunction(fnName, args, allowedArgs = undefined) {
            const fnSettings = functions[fnName];

            if (!fnSettings) {
                err(`Nerdamer currently does not support the function ${fnName}`);
            }

            const numAllowedArgs = fnSettings[1] || allowedArgs; // Get the number of allowed arguments
            let fn = fnSettings[0]; // Get the mapped function
            let retval;
            // We want to be able to call apply on the arguments or create a symfunction. Both require
            // an array so make sure to wrap the argument in an array.
            if (!(args instanceof Array)) {
                args = args === undefined ? [] : [args];
            }

            if (numAllowedArgs !== -1) {
                const isArrayType = isArray(numAllowedArgs);
                const minArgs = isArrayType ? numAllowedArgs[0] : numAllowedArgs;
                const maxArgs = isArrayType ? numAllowedArgs[1] : numAllowedArgs;
                const numArgs = args.length;

                const errorMsg = `${fnName} requires a {0} of {1} arguments. {2} provided!`;

                if (numArgs < minArgs) {
                    err(format(errorMsg, 'minimum', minArgs, numArgs));
                }
                if (numArgs > maxArgs) {
                    err(format(errorMsg, 'maximum', maxArgs, numArgs));
                }
            }

            /*
             * The following are very important to the how nerdamer constructs functions!
             * Assumption 1 - if fn is undefined then handling of the function is purely numeric. This
             *     enables us to reuse Math, Math2, ..., any function from Settings.FUNCTIONS_MODULES entry
             * Assumption 2 - if fn is defined then that function takes care of EVERYTHING including symbolics
             * Assumption 3 - if the user calls symbolics on a function that returns a numeric value then
             *     they are expecting a symbolic output.
             */
            // check if arguments are all numers
            const numericArgs = allNumbers(args);
            // Big number support. Check if Big number is requested and the arguments are all numeric and, not imaginary
            //            if (Settings.USE_BIG && numericArgs) {
            //                retval = Big[fnName].apply(undefined, args);
            //            }
            //            else {
            if (fn) {
                // Call nerdamer function
                // Remember assumption 2. The function is defined so it MUST handle all aspects including numeric values
                retval = fn.apply(fnSettings[2], args);
            } else {
                // Call JS function
                // Remember assumption 1. No function defined so it MUST be numeric in nature
                fn = findFunction(fnName);
                if (Settings.PARSE2NUMBER && numericArgs) {
                    retval = bigConvert(fn.apply(fn, args));
                } else {
                    retval = _.symfunction(fnName, args);
                }
            }
            //            }

            return retval;
        };
        /**
         * Build a regex based on the operators currently loaded. These operators are to be ignored when substituting
         * spaces for multiplication
         */
        this.operator_filter_regex = (function buildOperatorFilterRegex() {
            // We only want the operators which are singular since those are the ones
            // that nerdamer uses anyway
            const ostr = `^\\${Object.keys(operators)
                .filter(x => x.length === 1)
                .join('\\')}`;
            // Create a regex which captures all spaces between characters except those
            // have an operator on one end
            // eslint-disable-next-line require-unicode-regexp
            return new RegExp(`([${ostr}])\\s+([${ostr}])`);
        })();

        /**
         * Replaces nerdamer.setOperator
         *
         * @param {object} operator
         * @param {Function} [action]
         * @param {'over' | 'under'} [shift]
         */
        // eslint-disable-next-line no-shadow -- intentionally shadows outer setOperator for Parser method
        this.setOperator = function setOperator(operator, action = undefined, shift = undefined) {
            const name = operator.operator; // Take the name to be the symbol
            operators[name] = operator;
            if (action) {
                this[operator.action] = action;
            }
            // Make the parser aware of the operator
            _parser[name] = operator.operation;
            // Make the action available to the parser if infix
            if (!operator.action && !(operator.prefix || operator.postif)) {
                operator.action = name;
            }
            // If this operator is exclusive then all successive operators should be shifted
            if (shift === 'over' || shift === 'under') {
                const { precedence } = operator;

                for (const x in operators) {
                    if (!Object.hasOwn(operators, x)) {
                        continue;
                    }
                    const o = operators[x];
                    const condition = shift === 'over' ? o.precedence >= precedence : o.precedence > precedence;
                    if (condition) {
                        o.precedence++;
                    }
                }
            }
        };

        /**
         * Gets an opererator by its symbol
         *
         * @param {string} operator
         * @returns {object}
         */
        // eslint-disable-next-line no-shadow -- intentionally shadows outer getOperator for Parser method
        this.getOperator = function getOperator(operator) {
            return operators[operator];
        };

        // eslint-disable-next-line no-shadow -- intentionally shadows outer aliasOperator for Parser method
        this.aliasOperator = function aliasOperator(o, n) {
            const t = {};
            const operator = operators[o];
            // Copy everything over to the new operator
            for (const x in operator) {
                if (!Object.hasOwn(operator, x)) {
                    continue;
                }
                t[x] = operator[x];
            }
            // Update the symbol
            t.operator = n;

            this.setOperator(t);
        };

        /**
         * Returns the list of operators. Caution! Can break parser!
         *
         * @returns {object}
         */
        this.getOperators = function getOperators() {
            // Will replace this with some cloning action in the future
            return operators;
        };

        this.getBrackets = function getBrackets() {
            return brackets;
        };
        /*
         * Preforms preprocessing on the string. Useful for making early modification before
         * sending to the parser
         * @param {string} e
         * @param {Parser} parser - The parser instance to use as context
         */
        const prepareExpression = function prepareExpression(e, parser) {
            /*
             * Since variables cannot start with a number, the assumption is made that when this occurs the
             * user intents for this to be a coefficient. The multiplication symbol in then added. The same goes for
             * a side-by-side close and open parenthesis
             */
            e = String(e);
            // Apply preprocessors
            for (let i = 0; i < preprocessors.actions.length; i++) {
                e = preprocessors.actions[i].call(parser, e);
            }

            // E = e.split(' ').join('');//strip empty spaces
            // replace multiple spaces with one space
            e = e.replace(/\s+/gu, ' ');

            // Only even bother to check if the string contains e. This regex is painfully slow and might need a better solution. e.g. hangs on (0.06/3650))^(365)
            if (/e/giu.test(e)) {
                // Negative numbers
                e = e.replace(/-+\d+\.?\d*e\+?-?\d+/giu, x => scientificToDecimal(x));
                // Positive numbers that are not part of an identifier
                e = e.replace(/(?<![A-Za-z])\d+\.?\d*e\+?-?\d+/giu, x => scientificToDecimal(x));
            }
            // Replace scientific numbers

            // allow omission of multiplication after coefficients
            e =
                e
                    .replace(Settings.IMPLIED_MULTIPLICATION_REGEX, (match, group1, group2, start, str) => {
                        const first = str.charAt(start);
                        let before = '';
                        let d = '*';
                        if (!first.match(/[+\-/*]/u)) {
                            before = str.charAt(start - 1);
                        }
                        if (before.match(/[a-z]/iu)) {
                            d = '';
                        }
                        return group1 + d + group2;
                    })
                    .replace(/(?<varname>[a-z0-9_]+)/giu, (match, a) => {
                        if (Settings.USE_MULTICHARACTER_VARS === false && !(a in functions)) {
                            if (!isNaN(a)) {
                                return a;
                            }
                            return a.split('').join('*');
                        }
                        return a;
                    })
                    // Allow omission of multiplication sign between brackets
                    .replace(/\)\(/gu, ')*(') || '0';
            // Replace x(x+a) with x*(x+a)
            while (true) {
                const eOrg = e; // Store the original
                e = e.replace(
                    /(?<prefix>[a-z0-9_]+)(?<open>\()|(?<close>\))(?<suffix>[a-z0-9]+)/giu,
                    (match, a, b, c, d) => {
                        const g1 = a || c;
                        const g2 = b || d;
                        if (g1 in functions) // Create a passthrough for functions
                        {
                            return g1 + g2;
                        }
                        return `${g1}*${g2}`;
                    }
                );
                // If the original equals the replace we're done
                if (eOrg === e) {
                    break;
                }
            }
            return e;
        };
        // Delay setting of constants until Settings is ready
        this.initConstants = function initConstants() {
            this.CONSTANTS = {
                E: new NerdamerSymbol(Settings.E),
                PI: new NerdamerSymbol(Settings.PI),
            };
        };
        /*
         * Debugging method used to better visualize vector and arrays
         * @param {object | ScopeArrayType} o
         * @returns {string}
         */
        this.prettyPrint = function prettyPrint(o) {
            if (Array.isArray(o)) {
                const arr = /** @type {ScopeArrayType} */ (o);
                const s = arr.map(x => _.prettyPrint(x)).join(', ');
                if (arr.type === 'vector') {
                    return `vector<${s}>`;
                }
                return `(${s})`;
            }
            return o.toString();
        };
        this.peekers = {
            pre_operator: [],
            post_operator: [],
            pre_function: [],
            post_function: [],
        };

        this.callPeekers = function callPeekers(name, ...rest) {
            if (Settings.callPeekers) {
                const peekers = this.peekers[name];
                // Remove the first items and stringify
                const args = rest.map(stringify);
                // Call each one of the peekers
                for (let i = 0; i < peekers.length; i++) {
                    peekers[i].apply(null, args);
                }
            }
        };
        /*
         * Tokenizes the string
         * @param {string} e
         * @returns {Token[]}
         */
        this.tokenize = function tokenize(e) {
            // Cast to String
            e = String(e);
            // Remove multiple white spaces and spaces at beginning and end of string
            e = e.trim().replace(/\s+/gu, ' ');
            // Remove spaces before and after brackets
            for (const x in brackets) {
                if (!Object.hasOwn(brackets, x)) {
                    continue;
                }
                // eslint-disable-next-line require-unicode-regexp
                const regex = new RegExp(brackets[x].is_close ? `\\s+\\${x}` : `\\${x}\\s+`, 'g');
                e = e.replace(regex, x);
            }

            let col = 0; // The column position
            const L = e.length; // Expression length
            let lpos = 0; // Marks beginning of next token
            const tokens = []; // The tokens container
            const scopes = [tokens]; // Initiate with the tokens as the highest scope
            let target = scopes[0]; // The target to which the tokens are added. This can swing up or down
            let depth = 0;
            const openBrackets = [];
            let hasSpace = false; // Marks if an open space character was found
            let operatorStr; // Current operator string being processed
            const SPACE = ' ';
            const EMPTY_STRING = '';
            const COMMA = ',';
            const MINUS = '-';
            const MULT = '*';
            // Possible source of bug. Review
            /*
             //gets the next space
             let next_space = function(from) {
             for(let i=from; i<L; i++) {
             if(e.charAt(i) === ' ')
             return i;
             }
             
             return L; //assume the end of the string instead
             };
             */
            /**
             * Adds a scope to tokens
             *
             * @param {string} [scopeType]
             * @param {number} [column]
             * @returns {undefined}
             */
            const addScope = function (scopeType = undefined, column = undefined) {
                /** @type {ScopeArrayType} */
                const newScope = /** @type {ScopeArrayType} */ ([]); // Create a new scope
                if (scopeType !== undefined) {
                    newScope.type = scopeType;
                }
                newScope.column = column; // Mark the column of the scope
                scopes.push(newScope); // Add it to the list of scopes
                target.push(newScope); // Add it to the tokens list since now it's a scope
                target = newScope; // Point to it
                depth++; // Go down one in scope
            };
            /**
             * Goes up in scope by one
             *
             * @returns {undefined}
             */
            const goUp = function () {
                scopes.pop(); // Remove the scope from the scopes stack
                target = scopes[--depth]; // Point the above scope
            };
            /**
             * Extracts all the operators from the expression string starting at postion startAt
             *
             * @param {number} startAt
             * @returns {string}
             */
            const getOperatorStr = function (startAt) {
                startAt = startAt === undefined ? col : startAt;
                // Mark the end of the operator as the start since we're just going
                // to be walking along the string
                let end = startAt + 1;
                // Just keep moving along
                while (e.charAt(end++) in operators) {
                    // Intentionally empty - just advancing end pointer
                }
                // Remember that we started at one position ahead. The beginning operator is what triggered
                // this function to be called in the first place. String.CharAt is zero based so we now
                // have to correct two places. The initial increment + the extra++ at the end of end during
                // the last iteration.
                return e.substring(startAt, end - 1);
            };
            /**
             * Breaks operator up in to several different operators as defined in operators
             *
             * @param {string} opStr
             * @returns {Token[]}
             */
            const chunkify = function (opStr) {
                const start = col - opStr.length; // Start of operator
                const _operators = [];
                let operator = opStr.charAt(0);
                // Grab the largest possible chunks but start at 2 since we already know
                // that the first character is an operator
                const len = opStr.length;
                let i;
                for (i = 1; i < len; i++) {
                    const ch = opStr.charAt(i);
                    const o = operator + ch;
                    // Since the operator now is undefined then the last operator
                    // was the largest possible combination.
                    if (o in operators) {
                        operator = o; // Now the operator is the larger chunk
                    } else {
                        _operators.push(new Token(operator, Token.OPERATOR, start + i));
                        operator = ch;
                    }
                }
                // Add the last operator
                _operators.push(new Token(operator, Token.OPERATOR, start + i));
                return _operators;
            };

            /**
             * Is used to add a token to the tokens array. Makes sure that no empty token is added
             *
             * @param {number} at
             * @param {string} [token]
             * @returns {undefined}
             */
            const addToken = function (at, token = undefined) {
                // Grab the token if we're not supplied one
                if (token === undefined) {
                    token = e.substring(lpos, at);
                }
                // Only add it if it's not an empty string
                if (token in _.units) {
                    target.push(new Token(token, Token.UNIT, lpos));
                } else if (token !== '') {
                    target.push(new Token(token, Token.VARIABLE_OR_LITERAL, lpos));
                }
            };
            /**
             * Adds a function to the output
             *
             * @param {string} f
             * @returns {undefined}
             */
            const addFunction = function (f) {
                target.push(new Token(f, Token.FUNCTION, lpos));
            };
            /**
             * Tokens are found between operators so this marks the location of where the last token was found
             *
             * @param {number} position
             * @returns {undefined}
             */
            const setLastPosition = function (position) {
                lpos = position + 1;
            };
            /**
             * When a operator is found and added, especially a combo operator, then the column location has to be
             * adjusted to the end of the operator
             *
             * @returns {undefined}
             */
            const adjustColumnPosition = function () {
                lpos = lpos + operatorStr.length - 2;
                col = lpos - 1;
            };
            for (; col < L; col++) {
                const ch = e.charAt(col);
                if (ch in operators) {
                    addToken(col);
                    // Is the last token numeric?
                    const lastTokenIsNumeric = target[0] && isNumber(target[0]);
                    // Is this character multiplication?
                    const isMultiplication = lastTokenIsNumeric && ch === MULT;
                    // If we're in a new scope then go up by one but if the space
                    // is right befor an operator then it makes no sense to go up in scope
                    // consider sin -x. The last position = current position at the minus sign
                    // this means that we're going for sin(x) -x which is wrong
                    // Ignore comma since comma is still part of the existing scope.
                    if (hasSpace && lpos < col && !(ch === COMMA || isMultiplication)) {
                        hasSpace = false;
                        goUp();
                    }
                    // Mark the last position that a
                    setLastPosition(col + 1);
                    operatorStr = getOperatorStr(col);

                    adjustColumnPosition();
                    target.push(...chunkify(operatorStr));
                } else if (ch in brackets) {
                    const bracket = brackets[ch];

                    if (bracket.is_open) {
                        // Mark the bracket
                        openBrackets.push([bracket, lpos]);
                        const f = e.substring(lpos, col);
                        if (f in functions) {
                            addFunction(f);
                        } else if (f !== '') {
                            // Assume multiplication
                            // TODO: Add the multiplication to stack
                            target.push(new Token(f, Token.VARIABLE_OR_LITERAL, lpos));
                        }
                        // Go down one in scope
                        addScope(bracket.maps_to, col);
                    } else if (bracket.is_close) {
                        // Get the matching bracket
                        const pair = openBrackets.pop();
                        // Throw errors accordingly
                        // missing open bracket
                        if (!pair) {
                            throw new ParityError(`Missing open bracket for bracket at: ${col + 1}`);
                        }
                        // Incorrect pair
                        else if (pair[0].id !== bracket.id - 1) {
                            throw new ParityError('Parity error');
                        }

                        addToken(col);
                        goUp();
                    }
                    setLastPosition(col);
                } else if (ch === SPACE) {
                    const prev = e.substring(lpos, col); // Look back
                    let nxt = e.charAt(col + 1); // Look forward
                    if (hasSpace) {
                        if (prev in operators) {
                            target.push(new Token(prev, Token.OPERATOR, col));
                        } else {
                            addToken(undefined, prev);
                            // We're at the closing space
                            goUp(); // Go up in scope if we're at a space

                            // assume multiplication if it's not an operator except for minus
                            const isOperator = nxt in operators;

                            if ((isOperator && operators[nxt].value === MINUS) || !isOperator) {
                                target.push(new Token(MULT, Token.OPERATOR, col));
                            }
                        }
                        hasSpace = false; // Remove the space
                    } else {
                        // We're at the closing space
                        // check if it's a function
                        const f = e.substring(lpos, col);

                        if (f in functions) {
                            // There's no need to go up in scope if the next character is an operator
                            hasSpace = true; // Mark that a space was found
                            addFunction(f);
                            addScope();
                        } else if (f in operators) {
                            target.push(new Token(f, Token.OPERATOR, col));
                        } else {
                            addToken(undefined, f);
                            // Peek ahead to the next character
                            nxt = e.charAt(col + 1);

                            // If it's a number then add the multiplication operator to the stack but make sure that the next character
                            // is not an operator

                            if (
                                prev !== EMPTY_STRING &&
                                nxt !== EMPTY_STRING &&
                                !(prev in operators) &&
                                !(nxt in operators)
                            ) {
                                target.push(new Token(MULT, Token.OPERATOR, col));
                            }
                        }
                        // Possible source of bug. Review
                        /*
                         //space can mean multiplication so add the symbol if the is encountered
                         if(/\d+|\d+\.?\d*e[\+\-]*\d+/i.test(f)) {
                         let next = e.charAt(col+1);
                         let nextIsOperator = next in operators;
                         let ns = next_space(col+1);
                         let next_word = e.substring(col+1, ns);
                         //the next can either be a prefix operator or no operator
                         if((nextIsOperator && operators[next].prefix) || !(nextIsOperator || next_word in operators))
                         target.push(new Token('*', Token.OPERATOR, col));
                         }
                         */
                    }
                    setLastPosition(col); // Mark this location
                }
            }
            // Check that all brackets were closed
            if (openBrackets.length) {
                const b = openBrackets.pop();
                throw new ParityError(`Missing closed bracket for bracket at ${b[1] + 1}`);
            }
            // Add the last token
            addToken(col);

            return tokens;
        };
        /*
         * Puts token array in Reverse Polish Notation
         * @param {Token[]} tokens
         * @returns {Token[]}
         */
        this.toRPN = function toRPN(tokens) {
            const fn = tokens.type;
            const l = tokens.length;
            let i;
            let e; // Current token being processed - also used for error reporting
            const output = [];
            const stack = [];
            const prefixes = [];
            const collapse = function collapse(target, destination) {
                while (target.length) {
                    destination.push(target.pop());
                }
            };
            // Mark all the prefixes and add them to the stack
            for (i = 0; i < l; i++) {
                const token = tokens[i];
                if (token.type !== Token.OPERATOR) {
                    break;
                }
                if (!token.prefix) {
                    throw new OperatorError('Not a prefix operator');
                }
                token.is_prefix = true;
                stack.push(token);
            }
            // Begin with remaining tokens
            for (; i < l; i++) {
                e = tokens[i];
                if (e.type === Token.OPERATOR) {
                    const operator = e;

                    // Create the option for the operator being overloaded
                    if (operator.overloaded) {
                        const next = tokens[i + 1];
                        // If it's followed by a number or variable then we assume it's not a postfix operator
                        if (next && next.type === Token.VARIABLE_OR_LITERAL) {
                            operator.postfix = false;
                            // Override the original function with the overload function
                            operator.action = operator.overloadAction;
                            operator.leftAssoc = operator.overloadLeftAssoc;
                        }
                    }

                    // If the stack is not empty
                    while (stack.length) {
                        const last = stack[stack.length - 1];
                        // If (there is an operator at the top of the operator stack with greater precedence)
                        // or (the operator at the top of the operator stack has equal precedence and is left associative)) ~ wikipedia
                        // the !prefixes.length makes sure that the operator on stack isn't prematurely taken fromt he stack.
                        if (
                            !(
                                last.precedence > operator.precedence ||
                                (!operator.leftAssoc && last.precedence === operator.precedence)
                            )
                        ) {
                            break;
                        }
                        output.push(stack.pop());
                    }

                    // Change the behavior of the operator if it's a vector and we've been asked to do so
                    if ((fn === 'vector' || fn === 'set') && 'vectorFn' in operator) {
                        operator.action = operator.vectorFn;
                    }

                    // If the operator is a postfix operator then we're ready to go since it belongs
                    // to the preceding token. However the output cannot be empty. It must have either
                    // an operator or a variable/literal
                    if (operator.postfix) {
                        const previous = tokens[i - 1];
                        if (!previous) {
                            throw new OperatorError(`Unexpected prefix operator '${e.value}'! at ${e.column}`);
                        } else if (previous.type === Token.OPERATOR) {
                            // A postfix can only be followed by a postfix
                            if (!previous.postfix) {
                                throw new OperatorError(
                                    `Unexpected prefix operator '${previous.value}'! at ${previous.column}`
                                );
                            }
                        }
                    } else {
                        // We must be at an infix so point the operator this
                        let nextIsOperator;
                        do {
                            // The first one is an infix operator all others have to be prefix operators so jump to the end
                            const next = tokens[i + 1]; // Take a look ahead
                            nextIsOperator = next ? next.type === Token.OPERATOR : false; // Check if it's an operator
                            if (nextIsOperator) {
                                // If it's not a prefix operator then it not in the right place
                                if (!next.prefix) {
                                    throw new OperatorError(`A prefix operator was expected at ${next.column}`);
                                }
                                // Mark it as a confirmed prefix
                                next.is_prefix = true;
                                // Add it to the prefixes
                                prefixes.push(next);
                                i++;
                            }
                        } while (nextIsOperator);
                    }

                    // If it's a prefix it should be on a special stack called prefixes
                    // we do this to hold on to prefixes because of left associative operators.
                    // they belong to the variable/literal but if placed on either the stack
                    // or output there's no way of knowing this. I might be wrong so I welcome
                    // any discussion about this.

                    if (operator.is_prefix) // ADD ALL EXCEPTIONS FOR ADDING TO PREFIX STACK HERE. !!!
                    {
                        prefixes.push(operator);
                    } else {
                        stack.push(operator);
                    }
                    // Move the prefixes to the stack
                    while (prefixes.length) {
                        if (
                            operator.leftAssoc ||
                            (!operator.leftAssoc && prefixes[prefixes.length - 1].precedence >= operator.precedence)
                        ) // Revisit for commas
                        {
                            stack.push(prefixes.pop());
                        } else {
                            break;
                        }
                    }
                } else if (e.type === Token.VARIABLE_OR_LITERAL) {
                    // Move prefixes to stack at beginning of scope
                    if (output.length === 0) {
                        collapse(prefixes, stack);
                    }
                    // Done with token
                    output.push(e);
                    const lastOnStack = stack[stack.length - 1];
                    // Then move all the prefixes to the output
                    if (!lastOnStack || !lastOnStack.leftAssoc) {
                        collapse(prefixes, output);
                    }
                } else if (e.type === Token.FUNCTION) {
                    stack.push(e);
                } else if (e.type === Token.UNIT) {
                    // If it's a unit it belongs on the stack since it's tied to the previous token
                    output.push(e);
                }
                // If it's an additonal scope then put that into RPN form
                if (Array.isArray(e)) {
                    const scopeArr = /** @type {ScopeArrayType} */ (e);
                    output.push(this.toRPN(e));
                    if (scopeArr.type) {
                        output.push(new Token(scopeArr.type, Token.FUNCTION, scopeArr.column));
                    } // Since it's hidden it needs no column
                }
            }
            // Collapse the remainder of the stack and prefixes to output
            collapse(stack, output);
            collapse(prefixes, output);

            return output;
        };
        /*
         * Parses the tokens
         * @param {Tokens[]} rpn
         * @param {object} substitutions
         * @returns {NerdamerSymbolType}
         */
        // eslint-disable-next-line no-shadow -- rpn parameter name matches expected API
        this.parseRPN = function parseRPN(rpn, substitutions) {
            try {
                // Default substitutions
                substitutions ||= {};
                // Prepare the substitutions.
                // we first parse them out as-is
                for (const x in substitutions) {
                    if (!Object.hasOwn(substitutions, x)) {
                        continue;
                    }
                    substitutions[x] = _.parse(substitutions[x], {});
                }

                // Although technically constants,
                // pi and e are only available when evaluating the expression so add to the subs.
                // Doing this avoids rounding errors
                // link e and pi
                if (Settings.PARSE2NUMBER) {
                    // Use the value provided if the individual for some strange reason prefers this.
                    // one reason could be to sub e but not pi or vice versa
                    if (!('e' in substitutions)) {
                        substitutions.e = new NerdamerSymbol(Settings.E);
                    }
                    if (!('pi' in substitutions)) {
                        substitutions.pi = new NerdamerSymbol(Settings.PI);
                    }
                }

                const Q = [];
                let e; // Current RPN token being processed - also used for error reporting
                for (let i = 0, l = rpn.length; i < l; i++) {
                    e = rpn[i];

                    // Arrays indicate a new scope so parse that out
                    if (Array.isArray(e)) {
                        e = this.parseRPN(e, substitutions);
                    }

                    if (e) {
                        if (e.type === Token.OPERATOR) {
                            if (e.is_prefix || e.postfix) // Resolve the operation assocated with the prefix
                            {
                                Q.push(e.operation(Q.pop()));
                            } else {
                                let b = Q.pop();
                                let a = Q.pop();
                                // Throw an error if the RH value is empty. This cannot be a postfix since we already checked
                                if (typeof a === 'undefined') {
                                    throw new OperatorError(`${e} is not a valid postfix operator at ${e.column}`);
                                }

                                const isComma = e.action === 'comma';
                                // Convert Sets to Vectors on all operations at this point. Sets are only recognized functions or individually
                                if (a instanceof NerdamerSet && !isComma) {
                                    a = Vector.fromSet(/** @type {SetType} */ (/** @type {unknown} */ (a)));
                                }

                                if (b instanceof NerdamerSet && !isComma) {
                                    b = Vector.fromSet(/** @type {SetType} */ (/** @type {unknown} */ (b)));
                                }

                                // Call all the pre-operators
                                this.callPeekers('pre_operator', a, b, e);

                                const ans = _[e.action](a, b);

                                // Call all the pre-operators
                                this.callPeekers('post_operator', ans, a, b, e);

                                Q.push(ans);
                            }
                        } else if (e.type === Token.FUNCTION) {
                            let args = Q.pop();
                            const { parent } = args; // Make a note of the parent
                            if (!(args instanceof Collection)) {
                                args = Collection.create(args);
                            }
                            // The return value may be a vector. If it is then we check
                            // Q to see if there's another vector on the stack. If it is then
                            // we check if has elements. If it does then we know that we're dealing
                            // with an "getter" object and return the requested values

                            // call the function. This is the _.callfunction method in nerdamer
                            const fnName = e.value;
                            const fnArgs = args.getItems();

                            // Call the pre-function peekers
                            this.callPeekers('pre_function', fnName, fnArgs);

                            const ret = _.callfunction(fnName, fnArgs);

                            // Call the post-function peekers
                            this.callPeekers('post_function', ret, fnName, fnArgs);

                            const _last = Q[Q.length - 1];
                            const next = rpn[i + 1];
                            const _next_is_comma = next && next.type === Token.OPERATOR && next.value === ',';

                            // If(!next_is_comma && ret instanceof Vector && last && last.elements && !(last instanceof Collection)) {
                            //     //remove the item from the queue
                            //     let item = Q.pop();

                            //     let getter = ret.elements[0];
                            //     //check if it's symbolic. If so put it back and add the item to the stack
                            //     if(!getter.isConstant()) {
                            //         item.getter = getter;
                            //         Q.push(item);
                            //         Q.push(ret);
                            //     }
                            //     else if(getter instanceof Slice) {
                            //         //if it's a Slice return the slice
                            //         Q.push(Vector.fromArray(item.elements.slice(getter.start, getter.end)));
                            //     }
                            //     else {
                            //         let index = Number(getter);
                            //         let il = item.elements.length;
                            //         //support for negative indices
                            //         if(index < 0)
                            //             index = il + index;
                            //         //it it's still out of bounds
                            //         if(index < 0 || index >= il) //index should no longer be negative since it's been reset above
                            //             //range error
                            //             throw new OutOfRangeError('Index out of range ' + (e.column + 1));

                            //         let element = item.elements[index];
                            //         //cyclic but we need to mark this for future reference
                            //         item.getter = index;
                            //         element.parent = item;

                            //         Q.push(element);
                            //     }
                            // }
                            // else {
                            // extend the parent reference
                            if (parent) {
                                ret.parent = parent;
                            }
                            Q.push(ret);
                            // }
                        } else {
                            let subbed;
                            const v = e.value;

                            if (v in Settings.ALIASES) {
                                e = _.parse(Settings.ALIASES[e]);
                            }
                            // Wrap it in a symbol if need be
                            else if (e.type === Token.VARIABLE_OR_LITERAL) {
                                e = new NerdamerSymbol(v);
                            } else if (e.type === Token.UNIT) {
                                /** @type {NerdamerSymbolType} */
                                const unitSymbol = /** @type {NerdamerSymbolType} */ (
                                    /** @type {unknown} */ (new NerdamerSymbol(v))
                                );
                                unitSymbol.isUnit = true;
                                e = unitSymbol;
                            }

                            // Make substitutions
                            // Always constants first. This avoids the being overridden
                            if (v in _.CONSTANTS) {
                                subbed = e;
                                e = new NerdamerSymbol(_.CONSTANTS[v]);
                            }
                            // Next substitutions. This allows declared variable to be overridden
                            // check if the values match to avoid erasing the multiplier.
                            // Example:/e = 3*a. substutiting a for a will wipe out the multiplier.
                            else if (v in substitutions && v !== substitutions[v].toString()) {
                                subbed = e;
                                e = substitutions[v].clone();
                            }
                            // Next declare variables
                            else if (v in VARS) {
                                subbed = e;
                                e = VARS[v].clone();
                            }
                            // Make notation of what it was before
                            if (subbed) {
                                e.subbed = subbed;
                            }

                            Q.push(e);
                        }
                    }
                }

                const retval = Q[0];

                if (['undefined', 'string', 'number'].indexOf(typeof retval) !== -1) {
                    throw new UnexpectedTokenError('Unexpected token!');
                }

                return retval;
            } catch (error) {
                if (error.message === 'timeout') {
                    throw error;
                }
                const rethrowErrors = [OutOfFunctionDomainError];
                // Rethrow certain errors in the same class to preserve them
                rethrowErrors.forEach(E => {
                    if (error instanceof E) {
                        const col = /** @type {{ column?: number }} */ (error).column;
                        throw new E(`${error.message}${col ? `: ${col}` : ''}`);
                    }
                });

                const errCol = /** @type {{ column?: number }} */ (error).column;
                throw new ParseError(`${error.message}${errCol ? `: ${errCol}` : ''}`);
            }
        };
        /**
         * This is the method that triggers the parsing of the string. It generates a parse tree but processes it right
         * away. The operator functions are called when their respective operators are reached. For instance
         *
         * - With cause this.add to be called with the left and right hand values. It works by walking along each
         *   character of the string and placing the operators on the stack and values on the output. When an operator
         *   having a lower order than the last is reached then the stack is processed from the last operator on the
         *   stack.
         *
         * @param {{ type: string; value: string; left?: any; right?: any }} token
         */

        function Node(token) {
            this.type = token.type;
            this.value = token.value;
            // The incoming token may already be a Node type
            this.left = token.left;
            this.right = token.right;
        }

        Node.prototype.toString = function toString() {
            const left = this.left ? `${this.left.toString()}---` : '';
            const right = this.right ? `---${this.right.toString()}` : '';
            return `${left}(${this.value})${right}`;
        };

        Node.prototype.toHTML = function toHTML(depth, indent) {
            depth ||= 0;
            indent = typeof indent === 'undefined' ? 4 : indent;
            const tab = function tab(n) {
                return ' '.repeat(indent * n);
            };
            let html = '';
            const left = this.left
                ? `${tab(depth + 1)}<li>\n${this.left.toHTML(depth + 2, indent)}${tab(depth + 1)}</li> \n`
                : '';
            const right = this.right
                ? `${tab(depth + 1)}<li>\n${this.right.toHTML(depth + 2, indent)}${tab(depth + 1)}</li>\n`
                : '';
            html = `${tab(depth)}<div class="${this.type.toLowerCase()}"><span>${this.value}</span></div>${tab(
                depth
            )}\n`;
            if (left || right) {
                html += `${tab(depth)}<ul>\n${left}${right}${tab(depth)}</ul>\n`;
            }
            return html;
        };

        // eslint-disable-next-line no-shadow -- intentionally shadows outer tree for Parser method
        this.tree = function tree(tokens) {
            const Q = [];
            for (let i = 0; i < tokens.length; i++) {
                let e = tokens[i];
                // Arrays indicate a new scope so parse that out
                if (Array.isArray(e)) {
                    e = this.tree(e);
                    // If it's a comma then it's just arguments
                    Q.push(e);
                    continue;
                }
                if (e.type === Token.OPERATOR) {
                    if (e.is_prefix || e.postfix) {
                        // Prefixes go to the left, postfix to the right
                        const location = e.is_prefix ? 'left' : 'right';
                        const last = Q.pop();
                        e = new Node(e);
                        e[location] = last;
                        Q.push(e);
                    } else {
                        e = new Node(e);
                        e.right = Q.pop();
                        e.left = Q.pop();
                        Q.push(e);
                    }
                } else if (e.type === Token.FUNCTION) {
                    e = new Node(e);
                    const args = Q.pop();
                    e.right = args;
                    if (e.value === 'object') {
                        // Check if Q has a value
                        let last = Q[Q.length - 1];
                        if (last) {
                            while (last.right) {
                                last = last.right;
                            }
                            last.right = e;
                            continue;
                        }
                    }

                    Q.push(e);
                } else {
                    Q.push(new Node(e));
                }
            }

            return Q[0];
        };
        // eslint-disable-next-line no-shadow -- intentionally shadows outer parse for Parser method
        this.parse = function parse(e, substitutions) {
            e = prepareExpression(e, this);
            substitutions ||= {};
            // Three passes but easier to debug
            const tokens = this.tokenize(e);
            const rpnTokens = this.toRPN(tokens);
            return this.parseRPN(rpnTokens, substitutions);
        };
        /**
         * TODO: Switch to Parser.tokenize for this method Reads a string into an array of Symbols and operators
         *
         * @param {string} expressionString
         * @returns {Array}
         */
        this.toObject = function toObject(expressionString) {
            const objectify = function objectify(tokens) {
                const output = [];
                for (let i = 0, l = tokens.length; i < l; i++) {
                    const token = tokens[i];
                    const v = token.value;
                    if (token.type === Token.VARIABLE_OR_LITERAL) {
                        output.push(new NerdamerSymbol(v));
                    } else if (token.type === Token.FUNCTION) {
                        // Jump ahead since the next object are the arguments
                        i++;
                        // Create a symbolic function and stick it on output
                        const f = _.symfunction(v, objectify(tokens[i]));
                        f.isConversion = true;
                        output.push(f);
                    } else if (token.type === Token.OPERATOR) {
                        output.push(v);
                    } else {
                        output.push(objectify(token));
                    }
                }

                return output;
            };
            return objectify(_.tokenize(expressionString));
        };

        // A helper method for toTeX
        const chunkAtCommas = function chunkAtCommas(arr) {
            let k = 0;
            const chunks = [[]];
            for (let j = 0, l = arr.length; j < l; j++) {
                if (arr[j] === ',') {
                    k++;
                    chunks[k] = [];
                } else {
                    chunks[k].push(arr[j]);
                }
            }
            return chunks;
        };

        // Helper method for toTeX
        const remBrackets = function (str) {
            return str.replace(/^\\left\((?<inner>.+)\\right\)$/gu, (match, a) => {
                if (a) {
                    return a;
                }
                return match;
            });
        };

        const removeRedundantPowers = function (arr) {
            // The filtered array
            const narr = [];

            while (arr.length) {
                // Remove the element from the front
                const e = arr.shift();
                const next = arr[0];
                const nextIsArray = isArray(next);
                const nextIsMinus = next === '-';

                // Remove redundant plusses
                if (e === '^') {
                    if (next === '+') {
                        arr.shift();
                    } else if (nextIsArray && next[0] === '+') {
                        next.shift();
                    }

                    // Remove redundant parentheses
                    if (nextIsArray && next.length === 1) {
                        arr.unshift(arr.shift()[0]);
                    }
                }

                // Check if it's a negative power
                if (e === '^' && ((nextIsArray && next[0] === '-') || nextIsMinus)) {
                    // If so:
                    // - Remove it from the new array, place a one and a division sign in that array and put it back
                    const last = narr.pop();
                    // Check if it's something multiplied by
                    const before = narr[narr.length - 1];
                    let beforeLast = '1';

                    if (before === '*') {
                        narr.pop();
                        // For simplicity we just pop it.
                        beforeLast = narr.pop();
                    }
                    // Implied multiplication
                    else if (isArray(before)) {
                        beforeLast = narr.pop();
                    }

                    narr.push(beforeLast, '/', last, e);

                    // Remove the negative sign from the power
                    if (nextIsArray) {
                        next.shift();
                    } else {
                        arr.shift();
                    }

                    // Remove it from the array so we don't end up with redundant parentheses if we can
                    if (nextIsArray && next.length === 1) {
                        narr.push(arr.shift()[0]);
                    }
                } else {
                    narr.push(e);
                }
            }

            return narr;
        };
        /*
         * Convert expression or object to LaTeX
         * @param {string} expressionOrObj
         * @param {object} opt
         * @returns {string}
         */
        this.toTeX = function toTeX(expressionOrObj, opt) {
            opt ||= {};
            // Add decimal option as per issue #579. Consider passing an object to Latex.latex as option instead of string
            const decimals = opt.decimals === true ? 'decimals' : undefined;

            let obj = typeof expressionOrObj === 'string' ? this.toObject(expressionOrObj) : expressionOrObj;
            const TeX = [];
            const cdot = typeof opt.cdot === 'undefined' ? '\\cdot' : opt.cdot; // NerdamerSet omit cdot to true by default

            // Remove negative powers as per issue #570
            obj = removeRedundantPowers(obj);

            if (isArray(obj)) {
                const nobj = [];
                let a;
                let b;
                // First handle ^
                for (let i = 0; i < obj.length; i++) {
                    a = obj[i];

                    if (obj[i + 1] === '^') {
                        b = obj[i + 2];
                        nobj.push(`${LaTeX.braces(this.toTeX([a]))}^${LaTeX.braces(this.toTeX([b]))}`);
                        i += 2;
                    } else {
                        nobj.push(a);
                    }
                }
                obj = nobj;
            }

            for (let i = 0, l = obj.length; i < l; i++) {
                let e = obj[i];

                // Convert * to cdot
                if (e === '*') {
                    e = cdot;
                }

                if (isSymbol(e)) {
                    if (e.group === FN) {
                        const { fname } = e;
                        let f;

                        if (fname === SQRT) {
                            f = `\\sqrt${LaTeX.braces(this.toTeX(e.args))}`;
                        } else if (fname === ABS) {
                            f = LaTeX.brackets(this.toTeX(e.args), 'abs');
                        } else if (fname === PARENTHESIS) {
                            f = LaTeX.brackets(this.toTeX(e.args), 'parens');
                        } else if (fname === Settings.LOG10) {
                            f = `\\${Settings.LOG10_LATEX}\\left( ${this.toTeX(e.args)}\\right)`;
                        } else if (fname === Settings.LOG2) {
                            f = `\\${Settings.LOG2_LATEX}\\left( ${this.toTeX(e.args)}\\right)`;
                        } else if (fname === Settings.LOG1P) {
                            f = `\\${format(Settings.LOG1P_LATEX, this.toTeX(e.args))}`;
                        } else if (fname === 'integrate') {
                            /* Retrive [Expression, x] */
                            const chunks = chunkAtCommas(e.args);
                            /* Build TeX */
                            const expr = LaTeX.braces(this.toTeX(chunks[0]));
                            const dx = this.toTeX(chunks[1]);
                            f = `\\int ${expr}\\, d${dx}`;
                        } else if (fname === 'defint') {
                            const chunks = chunkAtCommas(e.args);
                            const expr = LaTeX.braces(this.toTeX(chunks[0]));
                            const dx = this.toTeX(chunks[3]);
                            const lb = this.toTeX(chunks[1]);
                            const ub = this.toTeX(chunks[2]);
                            f = `\\int\\limits_{${lb}}^{${ub}} ${expr}\\, d${dx}`;
                        } else if (fname === 'diff') {
                            const chunks = chunkAtCommas(e.args);
                            let dx = '';
                            const expr = LaTeX.braces(this.toTeX(chunks[0]));
                            /* Handle cases: one argument provided, we need to guess the variable, and assume n = 1 */
                            if (chunks.length === 1) {
                                const vars = [];
                                for (let j = 0; j < chunks[0].length; j++) {
                                    if (chunks[0][j].group === 3) {
                                        vars.push(chunks[0][j].value);
                                    }
                                }
                                vars.sort();
                                dx = vars.length > 0 ? `\\frac{d}{d ${vars[0]}}` : '\\frac{d}{d x}';
                            } else if (chunks.length === 2) {
                                /* If two arguments, we have expression and variable, we assume n = 1 */
                                dx = `\\frac{d}{d ${chunks[1]}}`;
                            } else {
                                /* If we have more than 2 arguments, we assume we've got everything */
                                dx = `\\frac{d^{${chunks[2]}}}{d ${this.toTeX(chunks[1])}^{${chunks[2]}}}`;
                            }

                            f = `${dx}\\left(${expr}\\right)`;
                        } else if (fname === 'sum' || fname === 'product') {
                            // Split e.args into 4 parts based on locations of , symbols.
                            const argSplit = [[], [], [], []];
                            let argIdx = 0;
                            for (let k = 0; k < e.args.length; k++) {
                                if (e.args[k] === ',') {
                                    argIdx++;
                                    continue;
                                }
                                argSplit[argIdx].push(e.args[k]);
                            }
                            // Then build TeX string.
                            f =
                                (fname === 'sum' ? '\\sum_' : '\\prod_') +
                                LaTeX.braces(`${this.toTeX(argSplit[1])} = ${this.toTeX(argSplit[2])}`);
                            f += `^${LaTeX.braces(this.toTeX(argSplit[3]))}${LaTeX.braces(this.toTeX(argSplit[0]))}`;
                        } else if (fname === 'limit') {
                            const toTeXfn = this.toTeX.bind(this);
                            const parserRef = _;
                            const args = chunkAtCommas(e.args).map(x => {
                                if (Array.isArray(x)) {
                                    return parserRef.toTeX(x.join(''));
                                }
                                return toTeXfn(String(x));
                            });
                            f = `\\lim_${LaTeX.braces(`${args[1]}\\to ${args[2]}`)} ${LaTeX.braces(args[0])}`;
                        } else if (fname === FACTORIAL || fname === DOUBLEFACTORIAL) {
                            f = this.toTeX(e.args) + (fname === FACTORIAL ? '!' : '!!');
                        } else {
                            f = LaTeX.latex(e, decimals);
                            // F = '\\mathrm'+LaTeX.braces(fname.replace(/_/g, '\\_')) + LaTeX.brackets(this.toTeX(e.args), 'parens');
                        }

                        TeX.push(f);
                    } else {
                        TeX.push(LaTeX.latex(e, decimals));
                    }
                } else if (isArray(e)) {
                    TeX.push(LaTeX.brackets(this.toTeX(e)));
                } else if (e === '/') {
                    TeX.push(LaTeX.frac(remBrackets(TeX.pop()), remBrackets(this.toTeX([obj[++i]]))));
                } else {
                    TeX.push(e);
                }
            }

            return TeX.join(' ');
        };

        // Parser.functions ==============================================================
        /* Although parens is not a "real" function it is important in some cases when the
         * symbol must carry parenthesis. Once set you don't have to worry about it anymore
         * as the parser will get rid of it at the first opportunity
         */
        function parens(symbol) {
            if (Settings.PARSE2NUMBER) {
                return symbol;
            }
            return _.symfunction('parens', [symbol]);
        }

        function abs(symbol) {
            // |-∞| = ∞
            if (symbol.isInfinity) {
                return NerdamerSymbol.infinity();
            }
            if (symbol.multiplier.lessThan(0)) {
                symbol.multiplier.negate();
            }

            if (symbol.isImaginary()) {
                const re = symbol.realpart();
                const im = symbol.imagpart();
                if (re.isConstant() && im.isConstant()) {
                    return sqrt(_.add(_.pow(re, new NerdamerSymbol(2)), _.pow(im, new NerdamerSymbol(2))));
                }
            } else if (isNumericSymbol(symbol) || even(symbol.power)) {
                return symbol;
            }
            // Together.math baseunits are presumed positive
            else if (
                isVariableSymbol(symbol) &&
                typeof symbol.value === 'string' &&
                symbol.value.startsWith('baseunit_')
            ) {
                return symbol;
            }

            if (symbol.isComposite()) {
                const ms = [];
                symbol.each(x => {
                    ms.push(x.multiplier);
                });
                const gcd = Math2.QGCD.apply(null, ms);
                if (gcd.lessThan(0)) {
                    symbol.multiplier = symbol.multiplier.multiply(new Frac(-1));
                    symbol.distributeMultiplier();
                }
            }

            // Convert |n*x| to n*|x|
            const m = _.parse(symbol.multiplier);
            symbol.toUnitMultiplier();

            return _.multiply(m, _.symfunction(ABS, [symbol]));
        }
        /**
         * The factorial function
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbol | Vector | Matrix}
         */
        function _factorial(symbol) {
            let retval;
            if (isVector(symbol)) {
                const V = new Vector();
                symbol.each((x, i) => {
                    // I start at one.
                    V.set(/** @type {number} */ (/** @type {unknown} */ (i)) - 1, _factorial(x));
                });
                return V;
            }
            if (isMatrix(symbol)) {
                const M = new Matrix();
                symbol.each((x, i, j) => {
                    // I start at one.
                    M.set(i, j, _factorial(x));
                });
                return M;
            }
            if (Settings.PARSE2NUMBER && symbol.isConstant()) {
                if (isInt(symbol)) {
                    retval = Math2.bigfactorial(symbol);
                } else {
                    retval = Math2.gamma(symbol.multiplier.add(/** @type {FracType} */ (new Frac(1))).toDecimal());
                }

                retval = bigConvert(retval);
                return retval;
            }
            if (symbol.isConstant()) {
                const den = symbol.getDenom();
                if (den.equals(2)) {
                    const num = symbol.getNum();
                    let a;
                    let b;
                    let n;

                    if (symbol.multiplier.isNegative()) {
                        n = _.subtract(num.negate(), new NerdamerSymbol(1)).multiplier.divide(new Frac(2));
                        a = _.pow(new NerdamerSymbol(-4), new NerdamerSymbol(n)).multiplier.multiply(
                            Math2.bigfactorial(n)
                        );
                        b = Math2.bigfactorial(new Frac(2).multiply(n));
                    } else {
                        n = _.add(num, new NerdamerSymbol(1)).multiplier.divide(new Frac(2));
                        a = Math2.bigfactorial(new Frac(2).multiply(n));
                        b = _.pow(new NerdamerSymbol(4), new NerdamerSymbol(n)).multiplier.multiply(
                            Math2.bigfactorial(n)
                        );
                    }
                    const c = a.divide(b);
                    return _.multiply(_.parse('sqrt(pi)'), new NerdamerSymbol(c));
                }
            }
            return _.symfunction(FACTORIAL, [symbol]);
        }
        /**
         * Returns the continued fraction of a number
         *
         * @param {NerdamerSymbolType} symbol
         * @param {NerdamerSymbolType} n
         * @returns {NerdamerSymbolType}
         */
        function continuedFraction(symbol, n) {
            const _symbol = evaluate(symbol);
            if (_symbol.isConstant()) {
                const cf = Math2.continuedFraction(_symbol, n);
                // Convert the fractions array to a new Vector
                const fractions = Vector.fromArray(cf.fractions.map(x => new NerdamerSymbol(x)));
                return Vector.fromArray([new NerdamerSymbol(cf.sign), new NerdamerSymbol(cf.whole), fractions]);
            }
            return _.symfunction('continuedFraction', [symbol, n]);
        }
        /**
         * Returns the error function
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function _erf(symbol) {
            const _symbol = evaluate(symbol);

            if (_symbol.isConstant()) {
                return new NerdamerSymbol(Math2.erf(_symbol));
            }
            if (_symbol.isImaginary()) {
                return complex.erf(symbol);
            }
            return _.symfunction('erf', [symbol]);
        }
        /**
         * The mod function
         *
         * @param {NerdamerSymbolType} symbol1
         * @param {NerdamerSymbolType} symbol2
         * @returns {NerdamerSymbolType}
         */
        function _mod(symbol1, symbol2) {
            if (symbol1.isConstant() && symbol2.isConstant()) {
                const retval = new NerdamerSymbol(1);
                retval.multiplier = retval.multiplier.multiply(symbol1.multiplier.mod(symbol2.multiplier));
                return retval;
            }
            // Try to see if division has remainder of zero
            const r = _.divide(symbol1.clone(), symbol2.clone());
            if (isInt(r)) {
                return new NerdamerSymbol(0);
            }
            return _.symfunction('mod', [symbol1, symbol2]);
        }
        /**
         * A branghing function
         *
         * @param {boolean} condition
         * @param {NerdamerSymbolType} a
         * @param {NerdamerSymbolType} b
         * @returns {NerdamerSymbolType}
         */
        function IF(condition, a, b) {
            if (typeof condition !== 'boolean') {
                if (isNumericSymbol(condition)) {
                    condition = !!Number(condition);
                }
            }
            if (condition) {
                return a;
            }
            return b;
        }
        /**
         * @param {Matrix | Vector | NerdamerSet | Collection} obj
         * @param {NerdamerSymbolType} item
         * @returns {NerdamerSymbolType}
         */
        function isIn(obj, item) {
            if (isMatrix(obj)) {
                for (let i = 0, l = obj.rows(); i < l; i++) {
                    for (let j = 0, l2 = obj.cols(); j < l2; j++) {
                        const element = obj.elements[i][j];
                        if (element.equals(item)) {
                            return new NerdamerSymbol(1);
                        }
                    }
                }
            } else if (obj.elements) {
                for (let i = 0, l = obj.elements.length; i < l; i++) {
                    if (obj.elements[i].equals(item)) {
                        return new NerdamerSymbol(1);
                    }
                }
            }

            return new NerdamerSymbol(0);
        }

        /**
         * A symbolic extension for sinc
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {any}
         */
        function sinc(symbol) {
            if (Settings.PARSE2NUMBER) {
                if (symbol.isConstant()) {
                    return new NerdamerSymbol(Math2.sinc(symbol));
                }
                return _.parse(format('sin({0})/({0})', symbol));
            }
            return _.symfunction('sinc', [symbol]);
        }

        /**
         * A symbolic extension for exp. This will auto-convert all instances of exp(x) to e^x. Thanks @ Happypig375
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {any}
         */
        function exp(symbol) {
            if (symbol.fname === Settings.LOG && symbol.isLinear()) {
                return _.pow(symbol.args[0], NerdamerSymbol.create(symbol.multiplier));
            }
            return _.parse(format('e^({0})', symbol));
        }

        /**
         * Converts value degrees to radians
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {any}
         */
        function radians(symbol) {
            return _.parse(format('({0})*pi/180', symbol));
        }

        /**
         * Converts value from radians to degrees
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {any}
         */
        function degrees(symbol) {
            return _.parse(format('({0})*180/pi', symbol));
        }

        function _nroots(symbol) {
            let a;
            let b;
            let _roots;
            if (symbol.group === FN && symbol.fname === '') {
                a = NerdamerSymbol.unwrapPARENS(_.parse(symbol).toLinear());
                b = _.parse(symbol.power);
            } else if (symbol.group === P) {
                a = _.parse(symbol.value);
                b = _.parse(symbol.power);
            }

            if (a && b && a.group === N && b.group === N) {
                _roots = [];
                const _parts = NerdamerSymbol.toPolarFormArray(symbol);
                const r = _.parse(a).abs().toString();
                // https://en.wikipedia.org/wiki/De_Moivre%27s_formula
                const x = arg(a).toString();
                const n = b.multiplier.den.toString();
                const p = b.multiplier.num.toString();

                const formula = '(({0})^({1})*(cos({3})+({2})*sin({3})))^({4})';
                for (let i = 0; i < Number(n); i++) {
                    const t = evaluate(_.parse(format('(({0})+2*pi*({1}))/({2})', x, i, n))).multiplier.toDecimal();
                    _roots.push(evaluate(_.parse(format(formula, r, n, Settings.IMAGINARY, t, p))));
                }
                return Vector.fromArray(_roots);
            }
            if (symbol.isConstant(true)) {
                const signVal = symbol.sign();
                const x = evaluate(symbol.abs());
                const root = _.sqrt(x);

                _roots = [root.clone(), root.negate()];

                if (signVal < 0) {
                    _roots = _roots.map(r => _.multiply(r, NerdamerSymbol.imaginary()));
                }
            } else {
                _roots = [_.parse(symbol)];
            }

            return Vector.fromArray(_roots);
        }

        /**
         * Rationalizes a symbol
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function rationalize(symbol) {
            if (symbol.isComposite()) {
                let retval = new NerdamerSymbol(0);
                let num;
                let den;
                let retnum;
                let retden;
                let a;
                let b;
                let n;
                let d;
                symbol.each(x => {
                    num = x.getNum();
                    den = x.getDenom();
                    retnum = retval.getNum();
                    retden = retval.getDenom();
                    a = _.multiply(den, retnum);
                    b = _.multiply(num, retden);
                    n = _.expand(_.add(a, b));
                    d = _.multiply(retden, den);
                    retval = _.divide(n, d);
                }, true);

                return retval;
            }
            return symbol;
        }

        /**
         * The square root function
         *
         * @param {any} symbol
         * @returns {any}
         */
        function sqrt(symbol) {
            if (!isSymbol(symbol)) {
                symbol = _.parse(symbol);
            }

            const original = _.symfunction('sqrt', [symbol]);

            // Exit early for EX
            if (symbol.group === EX) {
                return _.symfunction(SQRT, [symbol]);
            }

            if (symbol.fname === '' && symbol.power.equals(1)) {
                symbol = symbol.args[0];
            }

            const isNeg = symbol.multiplier.sign() < 0;

            if (Settings.PARSE2NUMBER) {
                if (symbol.isConstant() && !isNeg) {
                    return new NerdamerSymbol(bigDec.sqrt(symbol.multiplier.toDecimal()));
                }
                if (symbol.isImaginary()) {
                    return complex.sqrt(symbol);
                }
                if (symbol.group === S) {
                    return _.symfunction('sqrt', [symbol]);
                }
            }

            let img;
            let retval;
            const isConstant = symbol.isConstant();

            if (symbol.group === CB && symbol.isLinear()) {
                let m = sqrt(new NerdamerSymbol(symbol.multiplier));
                for (const s in symbol.symbols) {
                    if (!Object.hasOwn(symbol.symbols, s)) {
                        continue;
                    }
                    const x = symbol.symbols[s];
                    m = _.multiply(m, sqrt(x));
                }

                retval = m;
            }
            // If the symbol is already sqrt then it's that symbol^(1/4) and we can unwrap it
            else if (symbol.fname === SQRT) {
                const s = symbol.args[0];
                const ms = symbol.multiplier;
                s.setPower(symbol.power.multiply(new Frac(0.25)));
                retval = s;
                // Grab the multiplier
                if (!ms.equals(1)) {
                    retval = _.multiply(sqrt(_.parse(ms)), retval);
                }
            }
            // If the symbol is a fraction then we don't keep can unwrap it. For instance
            // no need to keep sqrt(x^(1/3))
            else if (!symbol.power.isInteger()) {
                symbol.setPower(symbol.power.multiply(new Frac(0.5)));
                retval = symbol;
            } else if (Number(symbol.multiplier) < 0 && symbol.group === S) {
                const a = _.parse(symbol.multiplier).negate();
                const b = _.parse(symbol).toUnitMultiplier().negate();
                retval = _.multiply(_.symfunction(Settings.SQRT, [b]), sqrt(a));
            } else {
                // Related to issue #401. Since sqrt(a)*sqrt(b^-1) relates in issues, we'll change the form
                // to sqrt(a)*sqrt(b)^1 for better simplification
                // the sign of the power
                const signVal = symbol.power.sign();
                // Remove the sign
                symbol.power = symbol.power.abs();

                // If the symbols is imagary then we place in the imaginary part. We'll return it
                // as a product
                if (isConstant && symbol.multiplier.lessThan(0)) {
                    img = NerdamerSymbol.imaginary();
                    symbol.multiplier = symbol.multiplier.abs();
                }

                let q = Number(symbol.multiplier.toDecimal());
                const qa = Math.abs(q);
                const t = Math.sqrt(qa);

                let m;
                // It's a perfect square so take the square
                if (isInt(t)) {
                    m = new NerdamerSymbol(t);
                } else if (isInt(q)) {
                    const factors = Math2.ifactor(q);
                    let tw = 1;
                    for (const x in factors) {
                        if (!Object.hasOwn(factors, x)) {
                            continue;
                        }
                        const n = factors[x];
                        const nn = n - (n % 2); // Get out the whole numbers
                        if (nn) {
                            // If there is a whole number ...
                            const w = Number(x) ** nn;
                            tw *= Number(x) ** (nn / 2); // Add to total wholes
                            q /= w; // Reduce the number by the wholes
                        }
                    }
                    m = _.multiply(_.symfunction(SQRT, [new NerdamerSymbol(q)]), new NerdamerSymbol(tw));
                } else {
                    // Reduce the numerator and denominator using prime factorization
                    const c = [new NerdamerSymbol(symbol.multiplier.num), new NerdamerSymbol(symbol.multiplier.den)];
                    const r = [new NerdamerSymbol(1), new NerdamerSymbol(1)];
                    const sq = [new NerdamerSymbol(1), new NerdamerSymbol(1)];
                    // Capture _ to avoid no-loop-func warning
                    const parserRef = _;
                    for (let i = 0; i < 2; i++) {
                        const n = c[i];
                        // Get the prime factors and loop through each.
                        pfactor(n).each(factor => {
                            factor = NerdamerSymbol.unwrapPARENS(factor);
                            const b = factor.clone().toLinear();
                            const p = Number(factor.power);
                            // We'll consider it safe to use the native Number since 2^1000 is already a pretty huge number
                            const rem = p % 2; // Get the remainder. This will be 1 if 3 since sqrt(n^2) = n where n is positive
                            const w = (p - rem) / 2; // Get the whole numbers of n/2
                            r[i] = parserRef.multiply(r[i], parserRef.pow(b, new NerdamerSymbol(w)));
                            sq[i] = parserRef.multiply(sq[i], sqrt(parserRef.pow(b, new NerdamerSymbol(rem))));
                        });
                    }
                    m = _.divide(_.multiply(r[0], sq[0]), _.multiply(r[1], sq[1]));
                }

                // Strip the multiplier since we already took the sqrt
                symbol = symbol.toUnitMultiplier(true);
                // If the symbol is one just return one and not the sqrt function
                if (symbol.isOne()) {
                    retval = symbol;
                } else if (even(symbol.power.toString())) {
                    // Just raise it to the 1/2
                    retval = _.pow(symbol.clone(), new NerdamerSymbol(0.5));
                } else {
                    retval = _.symfunction(SQRT, [symbol]);
                }

                // Put back the sign that was removed earlier
                if (signVal < 0) {
                    retval.power.negate();
                }

                if (m) {
                    retval = _.multiply(m, retval);
                }

                if (img) {
                    retval = _.multiply(img, retval);
                }
            }

            if (isNegative && Settings.PARSE2NUMBER && retval.text() !== original.text()) {
                return _.parse(retval);
            }

            return retval;
        }

        /**
         * The cube root function
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function cbrt(symbol) {
            if (!symbol.isConstant(true)) {
                let retval;

                const n = Number(symbol.power) / 3;
                // Take the cube root of the multplier
                const m = _.pow(_.parse(symbol.multiplier), new NerdamerSymbol(1 / 3));
                // Strip the multiplier
                const sym = symbol.toUnitMultiplier();

                // Simplify the power
                if (isInt(n)) {
                    retval = _.pow(sym.toLinear(), _.parse(String(n)));
                } else if (sym.group === CB) {
                    retval = new NerdamerSymbol(1);
                    sym.each(x => {
                        retval = _.multiply(retval, cbrt(x));
                    });
                } else {
                    retval = _.symfunction('cbrt', [sym]);
                }

                return _.multiply(m, retval);
            }
            return /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (nthroot(symbol, new NerdamerSymbol(3))));
        }

        function scientific(symbol, sigfigs) {
            // Just set the flag and keep it moving. NerdamerSymbol.toString will deal with how to
            // display this
            symbol.scientific = sigfigs || 10;
            return symbol;
        }

        /**
         * @param {NerdamerSymbolType} num - The number being raised
         * @param {NerdamerSymbolType} p - The exponent
         * @param {any} [prec] - The precision wanted
         * @param {boolean} [asbig] - True if a bigDecimal is wanted
         * @returns {NerdamerSymbolType}
         */
        function nthroot(num, p, prec = undefined, asbig = undefined) {
            // Clone p and convert to a number if possible
            p = evaluate(_.parse(p));

            // Cannot calculate if p = 0. nthroot(0, 0) => 0^(1/0) => undefined
            if (p.equals(0)) {
                throw new UndefinedError('Unable to calculate nthroots of zero');
            }

            // Stop computation if it negative and even since we have an imaginary result
            if (Number(num) < 0 && even(p)) {
                throw new Error('Cannot calculate nthroot of negative number for even powers');
            }

            // Return non numeric values unevaluated
            if (!num.isConstant(true)) {
                /** @type {(NerdamerSymbol | boolean | any)[]} */
                const symArgs = [num, p];
                if (typeof prec !== 'undefined') {
                    symArgs.push(prec);
                }
                if (typeof asbig !== 'undefined') {
                    symArgs.push(asbig);
                }
                return _.symfunction('nthroot', symArgs);
            }

            // Evaluate numeric values
            if (num.group !== N) {
                num = evaluate(num);
            }

            // Default is to return a big value
            if (typeof asbig === 'undefined') {
                asbig = true;
            }

            prec ||= 25;

            const signVal = num.sign();
            let retval;
            let ans;

            if (signVal < 0) {
                num = abs(num); // Remove the sign
            }

            if (isInt(num) && p.isConstant()) {
                if (Number(num) < 18446744073709551616) {
                    // 2^64
                    ans = Frac.create(Number(num) ** (1 / Number(p)));
                } else {
                    ans = Math2.nthroot(num, p);
                }

                if (asbig) {
                    retval = new NerdamerSymbol(ans);
                } else {
                    retval = new NerdamerSymbol(ans.toDecimal(prec));
                }

                return _.multiply(new NerdamerSymbol(signVal), retval);
            }
            return undefined;
        }

        function pfactor(symbol) {
            // Fix issue #458 | nerdamer("sqrt(1-(3.3333333550520926e-7)^2)").evaluate().text()
            // More Big Number issues >:(
            if (symbol.greaterThan(9.999999999998891e41) || symbol.equals(-1)) {
                return symbol;
            }
            // Fix issue #298
            if (symbol.equals(Math.PI)) {
                return new NerdamerSymbol(Math.PI);
            }
            // Evaluate the symbol to merge constants
            symbol = evaluate(symbol.clone());

            let retval;
            if (symbol.isConstant()) {
                retval = new NerdamerSymbol(1);
                const m = symbol.toString();
                if (isInt(m)) {
                    const factors = Math2.ifactor(m);
                    for (const factor in factors) {
                        if (!Object.hasOwn(factors, factor)) {
                            continue;
                        }
                        const p = factors[factor];
                        retval = _.multiply(
                            retval,
                            _.symfunction('parens', [
                                /** @type {NerdamerSymbolType} */ (
                                    /** @type {unknown} */ (new NerdamerSymbol(factor))
                                ).setPower(/** @type {FracType} */ (/** @type {unknown} */ (new Frac(p)))),
                            ])
                        );
                    }
                } else {
                    const n = pfactor(new NerdamerSymbol(symbol.multiplier.num));
                    const d = pfactor(new NerdamerSymbol(symbol.multiplier.den));
                    retval = _.multiply(_.symfunction('parens', [n]), _.symfunction('parens', [d]).invert());
                }
            } else {
                retval = _.symfunction('pfactor', [symbol]);
            }
            return retval;
        }

        /**
         * Get's the real part of a complex number. Return number if real
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function realpart(symbol) {
            return /** @type {NerdamerSymbol} */ (symbol.realpart());
        }

        /**
         * Get's the imaginary part of a complex number
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function imagpart(symbol) {
            return /** @type {NerdamerSymbol} */ (symbol.imagpart());
        }

        /**
         * Computes the conjugate of a complex number
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function conjugate(symbol) {
            const re = symbol.realpart();
            const im = symbol.imagpart();
            return _.add(re, _.multiply(im.negate(), NerdamerSymbol.imaginary()));
        }

        /**
         * Returns the arugment of a complex number
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {any}
         */
        function arg(symbol) {
            const re = symbol.realpart();
            const im = symbol.imagpart();
            if (re.isConstant() && im.isConstant()) {
                // Right angles
                if (im.equals(0) && re.equals(1)) {
                    return _.parse('0');
                }
                if (im.equals(1) && re.equals(0)) {
                    return _.parse('pi/2');
                }
                if (im.equals(0) && re.equals(-1)) {
                    return _.parse('pi');
                }
                if (im.equals(-1) && re.equals(0)) {
                    return _.parse('-pi/2');
                }

                // 45 degrees
                if (im.equals(1) && re.equals(1)) {
                    return _.parse('pi/4');
                }
                if (im.equals(1) && re.equals(-1)) {
                    return _.parse('pi*3/4');
                }
                if (im.equals(-1) && re.equals(1)) {
                    return _.parse('-pi/4');
                }
                if (im.equals(-1) && re.equals(-1)) {
                    return _.parse('-pi*3/4');
                }

                // All the rest
                return new NerdamerSymbol(Math.atan2(Number(im), Number(re)));
            }
            return _.symfunction('atan2', [im, re]);
        }

        /**
         * Returns the polarform of a complex number
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function polarform(symbol) {
            const p = NerdamerSymbol.toPolarFormArray(symbol);
            const theta = p[1];
            const r = p[0];
            const e = _.parse(format('e^({0}*({1}))', Settings.IMAGINARY, theta));
            return _.multiply(r, e);
        }

        /**
         * Returns the rectangular form of a complex number. Does not work for symbolic coefficients
         *
         * @param {NerdamerSymbolType} symbol
         * @returns {NerdamerSymbolType}
         */
        function rectform(symbol) {
            // TODO: e^((i*pi)/4)
            const original = symbol.clone();
            try {
                const f = /** @type {{ a: any; x: any; ax: any; b: NerdamerSymbol }} */ (
                    decomposeFn(symbol, 'e', true)
                );
                const p = _.divide(f.x.power, NerdamerSymbol.imaginary());
                const q = evaluate(trig.tan(p));
                const _s = _.pow(f.a, new NerdamerSymbol(2));
                const d = /** @type {NerdamerSymbol} */ (q.getDenom(true));
                const n = /** @type {NerdamerSymbol} */ (q.getNum());
                const h = NerdamerSymbol.hyp(n, d);
                // Check
                if (h.equals(f.a)) {
                    return /** @type {NerdamerSymbol} */ (_.add(d, _.multiply(NerdamerSymbol.imaginary(), n)));
                }
                return /** @type {NerdamerSymbol} */ (original);
            } catch (e) {
                if (e.message === 'timeout') {
                    throw e;
                }
                return /** @type {NerdamerSymbol} */ (original);
            }
        }

        function symMinMax(f, args) {
            args.forEach(x => {
                x.numVal = evaluate(x).multiplier;
            });
            let l;
            let a;
            let b;
            let _a_val;
            let _b_val;
            while (true) {
                l = args.length;
                if (l < 2) {
                    return args[0];
                }
                a = args.pop();
                b = args[l - 2];
                if (f === 'min' ? a.numVal < b.numVal : a.numVal > b.numVal) {
                    args.pop();
                    args.push(a);
                }
            }
        }

        /**
         * Returns maximum of a set of numbers
         *
         * @returns {NerdamerSymbolType}
         */
        function max(...args) {
            if (allSame(args)) {
                return args[0];
            }
            if (allNumbers(args)) {
                return new NerdamerSymbol(Math.max.apply(null, args));
            }
            if (Settings.SYMBOLIC_MIN_MAX && allConstants(args)) {
                return symMinMax('max', args);
            }
            return _.symfunction('max', args);
        }

        /**
         * Returns minimum of a set of numbers
         *
         * @returns {NerdamerSymbolType}
         */
        function min(...args) {
            if (allSame(args)) {
                return args[0];
            }
            if (allNumbers(args)) {
                return new NerdamerSymbol(Math.min.apply(null, args));
            }
            if (Settings.SYMBOLIC_MIN_MAX && allConstants(args)) {
                return symMinMax('min', args);
            }
            return _.symfunction('min', args);
        }

        /**
         * Returns the sign of a number
         *
         * @param {NerdamerSymbolType} x
         * @returns {NerdamerSymbolType}
         */
        function sign(x) {
            if (x.isConstant(true)) {
                return new NerdamerSymbol(Math.sign(evaluate(x)));
            }
            return _.symfunction('sign', [x]);
        }

        function sort(symbol, opt) {
            opt = opt ? opt.toString() : 'asc';
            const getval = function (e) {
                if (e.group === N) {
                    return e.multiplier;
                }
                if (e.group === FN) {
                    if (e.fname === '') {
                        return getval(e.args[0]);
                    }
                    return e.fname;
                }
                if (e.group === S) {
                    return e.power;
                }

                return e.value;
            };
            const symbols = isVector(symbol) ? symbol.elements : symbol.collectSymbols();
            return new Vector(
                symbols.sort((a, b) => {
                    const aval = getval(a);
                    const bval = getval(b);
                    if (opt === 'desc') {
                        return bval - aval;
                    }
                    return aval - bval;
                })
            );
        }

        /**
         * The log function
         *
         * @param {any} symbol
         * @param {any} [base]
         * @returns {any}
         */
        function log(symbol, base = undefined) {
            if (symbol.equals(1)) {
                return new NerdamerSymbol(0);
            }

            /** @type {NerdamerSymbol | undefined} */
            let retval;

            if (symbol.fname === SQRT && symbol.multiplier.equals(1)) {
                retval = _.divide(log(symbol.args[0]), new NerdamerSymbol(2));

                if (symbol.power.sign() < 0) {
                    retval.negate();
                }

                // Exit early
                return retval;
            }

            // Log(0) is undefined so complain
            if (symbol.equals(0)) {
                throw new UndefinedError(`${Settings.LOG}(0) is undefined!`);
            }

            // Deal with imaginary values
            if (symbol.isImaginary()) {
                return complex.evaluate(symbol, Settings.LOG);
            }

            if (symbol.isConstant() && typeof base !== 'undefined' && base.isConstant()) {
                const logSym = Math.log(symbol);
                const logBase = Math.log(base);
                retval = new NerdamerSymbol(logSym / logBase);
            } else if (
                (symbol.group === EX && /** @type {NerdamerSymbol} */ (symbol.power).multiplier.lessThan(0)) ||
                symbol.power.toString() === '-1'
            ) {
                symbol.power.negate();
                // Move the negative outside but keep the positive inside :)
                retval = log(symbol).negate();
            } else if (symbol.value === 'e' && symbol.multiplier.equals(1)) {
                const p = symbol.power;
                retval = isSymbol(p) ? /** @type {NerdamerSymbol} */ (p) : new NerdamerSymbol(p);
            } else if (symbol.group === FN && symbol.fname === 'exp') {
                const s = symbol.args[0];
                if (symbol.multiplier.equals(1)) {
                    retval = _.multiply(s, new NerdamerSymbol(symbol.power));
                } else {
                    retval = _.symfunction(Settings.LOG, [symbol]);
                }
            } else if (Settings.PARSE2NUMBER && isNumericSymbol(symbol)) {
                // Parse for safety.
                symbol = _.parse(symbol);

                let imgPart;
                if (symbol.multiplier.lessThan(0)) {
                    symbol.negate();
                    imgPart = _.multiply(new NerdamerSymbol(Math.PI), new NerdamerSymbol('i'));
                }

                retval = new NerdamerSymbol(Math.log(symbol.multiplier.toDecimal()));

                if (imgPart) {
                    retval = _.add(retval, imgPart);
                }
            } else {
                let s;
                if (!symbol.power.equals(1) && !symbol.contains('e') && symbol.multiplier.isOne()) {
                    s = symbol.group === EX ? symbol.power : new NerdamerSymbol(symbol.power);
                    symbol.toLinear();
                }
                // Log(a,a) = 1 since the base is allowed to be changed.
                // This was pointed out by Happypig375 in issue #280
                const args = typeof base === 'undefined' ? [symbol] : [symbol, base];
                if (args.length > 1 && allSame(args)) {
                    retval = new NerdamerSymbol(1);
                } else {
                    retval = _.symfunction(Settings.LOG, args);
                }

                if (s) {
                    retval = _.multiply(s, retval);
                }
            }

            return retval;
        }

        /**
         * Round a number up to s decimal places
         *
         * @param {NerdamerSymbolType} x
         * @param {NerdamerSymbolType} [s] - The number of decimal places
         * @returns {NerdamerSymbolType}
         */
        function round(x, s) {
            const sIsConstant = (s && s.isConstant()) || typeof s === 'undefined';
            if (x.isConstant() && sIsConstant) {
                let v;
                let e;
                let exponent;
                /** @type {NerdamerSymbol | string} */
                v = x;
                // Round the coefficient of then number but not the actual decimal value
                // we know this because a negative number was passed
                if (s && s.lessThan(0)) {
                    s = abs(s);
                    // Convert the number to exponential form
                    e = Number(x).toExponential().toString().split('e');
                    // Point v to the coefficient of then number
                    v = e[0];
                    // NerdamerSet the expontent
                    exponent = e[1];
                }
                // Round the number to the requested precision
                const retval = new NerdamerSymbol(nround(Number(v), Number(s) || 0));
                // If there's a exponent then put it back
                return _.multiply(retval, _.pow(new NerdamerSymbol(10), new NerdamerSymbol(exponent || 0)));
            }

            const roundArgs = [x];
            if (typeof s !== 'undefined') {
                roundArgs.push(s);
            }
            return _.symfunction('round', roundArgs);
        }

        /**
         * Gets the quadrant of the trig function
         *
         * @param {Frac} m
         * @returns {number}
         */
        function getQuadrant(m) {
            let v = Number(m) % 2;
            let quadrant;

            if (v < 0) {
                v = 2 + v;
            } // Put it in terms of pi

            if (v >= 0 && v <= 0.5) {
                quadrant = 1;
            } else if (v > 0.5 && v <= 1) {
                quadrant = 2;
            } else if (v > 1 && v <= 1.5) {
                quadrant = 3;
            } else {
                quadrant = 4;
            }
            return quadrant;
        }

        /*
         * Serves as a bridge between numbers and bigNumbers
         * @param {Frac|number} n
         * @returns {NerdamerSymbolType}
         */
        function bigConvert(n) {
            if (!isFinite(n)) {
                const signVal = Math.sign(n);
                const r = new NerdamerSymbol(String(Math.abs(n)));
                r.multiplier = r.multiplier.multiply(
                    /** @type {FracType} */ (/** @type {unknown} */ (new Frac(signVal)))
                );
                return r;
            }
            if (isSymbol(n)) {
                return n;
            }
            if (typeof n === 'number') {
                try {
                    n = Frac.simple(n);
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    n = new Frac(n);
                }
            }

            const symbol = new NerdamerSymbol(0);
            symbol.multiplier = n;
            return symbol;
        }
        function clean(symbol) {
            // Handle functions with numeric values
            // handle denominator within denominator
            // handle trig simplifications
            const g = symbol.group;
            let retval;
            // Now let's get to work
            if (g === CP) {
                const num = symbol.getNum();
                const den = symbol.getDenom() || new NerdamerSymbol(1);
                const p = Number(symbol.power);
                let factor = new NerdamerSymbol(1);
                if (Math.abs(p) === 1) {
                    den.each(x => {
                        if (x.group === CB) {
                            factor = _.multiply(factor, clean(x.getDenom()));
                        } else if (x.power.lessThan(0)) {
                            factor = _.multiply(factor, clean(x.clone().toUnitMultiplier()));
                        }
                    });

                    let newDen = new NerdamerSymbol(0);
                    // Now divide out the factor and add to new den
                    den.each(x => {
                        newDen = _.add(_.divide(x, factor.clone()), newDen);
                    });

                    factor.invert(); // Invert so it can be added to the top
                    let newNum;
                    if (num.isComposite()) {
                        newNum = new NerdamerSymbol(0);
                        num.each(x => {
                            newNum = _.add(_.multiply(clean(x), factor.clone()), newNum);
                        });
                    } else {
                        newNum = _.multiply(factor, num);
                    }

                    retval = _.divide(newNum, newDen);
                }
            } else if (g === CB) {
                retval = new NerdamerSymbol(1);
                symbol.each(x => {
                    retval = _.multiply(retval, _.clean(x));
                });
            } else if (g === FN) {
                if (symbol.args.length === 1 && symbol.args[0].isConstant()) {
                    retval = block('PARSE2NUMBER', () => _.parse(symbol), true);
                }
            }

            retval ||= symbol;

            return retval;
        }

        /**
         * A wrapper for the expand function
         *
         * @param {any} symbol
         * @returns {any}
         */
        function expandall(symbol, opt) {
            opt ||= {
                expand_denominator: true,
                expand_functions: true,
            };
            return expand(symbol, opt);
        }
        /**
         * Expands a symbol
         *
         * @param {any} symbol
         * @param {any} [opt]
         * @returns {any}
         */
        // Old expand
        function expand(symbol, opt) {
            if (Array.isArray(symbol)) {
                return symbol.map(x => expand(x, opt));
            }
            if (symbol.expand) {
                return symbol.expand(opt);
            }
            opt ||= {};
            // Deal with parenthesis
            if (symbol.group === FN && symbol.fname === '') {
                const f = expand(symbol.args[0], opt);
                const x = expand(_.pow(f, _.parse(symbol.power)), opt);
                return _.multiply(_.parse(symbol.multiplier), x).distributeMultiplier();
            }
            // We cannot expand these groups so no need to waste time. Just return and be done.
            if ([N, P, S].indexOf(symbol.group) !== -1) {
                return symbol; // Nothing to do
            }

            const original = symbol.clone();

            // NerdamerSet up a try-catch block. If anything goes wrong then we simply return the original symbol
            try {
                // Store the power and multiplier
                const m = symbol.multiplier.toString();
                const p = Number(symbol.power);
                let retval = symbol;

                // Handle (a+b)^2 | (x+x^2)^2
                if (symbol.isComposite() && isInt(symbol.power) && symbol.power > 0) {
                    const n = p - 1;
                    // Strip the expression of it's multiplier and power. We'll call it f. The power will be p and the multiplier m.
                    /** @type {NerdamerSymbol} */
                    let f = new NerdamerSymbol(0);

                    symbol.each((/** @type {NerdamerSymbol} */ x) => {
                        f = _.add(f, expand(_.parse(x), opt));
                    });

                    /** @type {NerdamerSymbolType} */
                    let expanded = _.parse(f);

                    for (let i = 0; i < n; i++) {
                        expanded = /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (mix(expanded, f, opt)));
                    }

                    retval = _.multiply(_.parse(m), expanded).distributeMultiplier();
                } else if (symbol.group === FN && opt.expand_functions === true) {
                    const args = [];
                    // Expand function the arguments
                    symbol.args.forEach(x => {
                        args.push(expand(x, opt));
                    });
                    // Put back the power and multiplier
                    retval = _.pow(_.symfunction(symbol.fname, args), _.parse(symbol.power));
                    retval = _.multiply(retval, _.parse(symbol.multiplier));
                } else if (
                    symbol.isComposite() &&
                    isInt(symbol.power) &&
                    symbol.power < 0 &&
                    opt.expand_denominator === true
                ) {
                    // Invert it. Expand it and then re-invert it.
                    symbol = symbol.invert();
                    retval = expand(symbol, opt);
                    retval.invert();
                } else if (symbol.group === CB) {
                    const rank = function (s) {
                        switch (s.group) {
                            case CP:
                                return 0;
                            case PL:
                                return 1;
                            case CB:
                                return 2;
                            case FN:
                                return 3;
                            default:
                                return 4;
                        }
                    };
                    // Consider (a+b)(c+d). The result will be (a*c+a*d)+(b*c+b*d).
                    // We start by moving collecting the symbols. We want others>FN>CB>PL>CP
                    const symbols = symbol
                        .collectSymbols()
                        .sort((a, b) => rank(b) - rank(a))
                        // Distribute the power to each symbol and expand
                        .map(s => {
                            const x = _.pow(s, _.parse(String(p)));
                            const e = expand(x, opt);
                            return e;
                        });

                    let f = symbols.pop();

                    // If the first symbols isn't a composite then we're done
                    if (f.isComposite() && f.isLinear()) {
                        symbols.forEach(s => {
                            f = mix(f, s, opt);
                        });

                        // If f is of group PL or CP then we can expand some more
                        if (f.isComposite()) {
                            if (f.power > 1) {
                                f = expand(_.pow(f, _.parse(f.power)), opt);
                            }
                            // Put back the multiplier
                            retval = _.multiply(_.parse(m), f).distributeMultiplier();
                        } else {
                            // Everything is expanded at this point so if it's still a CB
                            // then just return the symbol
                            retval = f;
                        }
                    } else {
                        // Just multiply back in the expanded form of each
                        retval = f;
                        symbols.forEach(s => {
                            retval = _.multiply(retval, s);
                        });
                        // Put back the multiplier
                        retval = _.multiply(retval, _.parse(m)).distributeMultiplier();
                    }

                    // TODO: This exists solely as a quick fix for sqrt(11)*sqrt(33) not simplifying.
                    if (retval.group === CB) {
                        retval = _.parse(retval);
                    }
                } else {
                    // Otherwise just return the expression
                    retval = symbol;
                }
                // Final cleanup and return
                return retval;
            } catch (e) {
                if (e.message === 'timeout') {
                    throw e;
                }
                return original;
            }
        }

        /**
         * Returns an identity matrix of nxn
         *
         * @param {number} n
         * @returns {Matrix}
         */
        function imatrix(n) {
            return Matrix.identity(n);
        }

        /**
         * Retrieves and item from a vector
         *
         * @param {Vector} vec
         * @param {NerdamerSymbolType} index
         * @returns {Vector | NerdamerSymbol}
         */
        function vecget(vec, index) {
            if (index.isConstant() && isInt(index)) {
                return vec.elements[Number(index)];
            }
            return _.symfunction('vecget', [vec, index]);
        }

        /**
         * Removes duplicates from a vector
         *
         * @param {Vector} vec
         * @param {number} tolerance
         * @returns {Vector}
         */
        function vectrim(vec, tolerance) {
            tolerance = typeof tolerance === 'undefined' ? 1e-14 : tolerance;

            vec = vec.clone();

            tolerance = Number(tolerance);
            // Place algebraic solutions first
            vec.elements.sort((a, b) => b.group - a.group);
            // Depending on the start point we may have duplicates so we need to clean those up a bit.
            // start by creating an object with the solution and the numeric value. This way we don't destroy algebraic values
            vec.elements = removeDuplicates(vec.elements, (a, b) => {
                const diff = Number(_.subtract(evaluate(a), evaluate(b)).abs());
                return diff <= tolerance;
            });

            return vec;
        }

        /**
         * NerdamerSet a value for a vector at a given index
         *
         * @param {Vector} vec
         * @param {NerdamerSymbolType} index
         * @param {NerdamerSymbolType} value
         * @returns {Vector}
         */
        function vecset(vec, index, value) {
            if (!index.isConstant) {
                return _.symfunction('vecset', [vec, index, value]);
            }
            vec.elements[Number(index)] = value;
            return vec;
        }

        function matget(mat, i, j) {
            if (i.isConstant() && j.isConstant()) {
                return mat.elements[Number(i)][Number(j)];
            }
            return _.symfunction('matget', [mat, i, j]);
        }

        function matgetrow(mat, i) {
            if (i.isConstant()) {
                return new Matrix(mat.elements[i]);
            }
            return _.symfunction('matgetrow', [mat, i]);
        }

        /**
         * Sets a row in a matrix
         *
         * @param {Matrix} mat
         * @param {NerdamerSymbolType} i
         * @param {Vector} x
         * @returns {Matrix}
         */
        function matsetrow(mat, i, x) {
            // Handle symbolics
            if (!i.isConstant()) {
                return _.symfunction('matsetrow', [mat, i, x]);
            }
            if (mat.elements[Number(i)].length !== x.elements.length) {
                throw new DimensionError('Matrix row must match row dimensions!');
            }
            const M = mat.clone();
            M.elements[Number(i)] = x.clone().elements;
            return M;
        }

        /**
         * Gets a column from a matrix
         *
         * @param {MatrixType} mat
         * @param {NerdamerSymbolType} colIndex
         * @returns {MatrixType}
         */
        function matgetcol(mat, colIndex) {
            // Handle symbolics
            if (!colIndex.isConstant()) {
                return _.symfunction('matgetcol', [mat, colIndex]);
            }
            const colIndexNum = Number(colIndex);
            /** @type {MatrixType} */
            const M = /** @type {MatrixType} */ (/** @type {unknown} */ (Matrix.fromArray([])));
            mat.each((x, i, j) => {
                if (j === colIndexNum) {
                    M.elements.push([x.clone()]);
                }
            });
            return M;
        }

        /**
         * Sets a column in a matrix
         *
         * @param {MatrixType} mat
         * @param {NerdamerSymbolType} j
         * @param {MatrixType} col
         * @returns {MatrixType}
         */
        function matsetcol(mat, j, col) {
            // Handle symbolics
            if (!j.isConstant()) {
                return _.symfunction('matsetcol', [mat, j, col]);
            }
            const jNum = Number(j);
            if (mat.rows() !== col.elements.length) {
                throw new DimensionError('Matrix column length must match number of rows!');
            }
            col.each(
                /** @type {(element: NerdamerSymbolType, row: number, col: number) => void} */ (
                    /** @type {unknown} */ (
                        (/** @type {VectorType} */ x, i) => {
                            mat.set(i - 1, jNum, x.elements[0].clone());
                        }
                    )
                )
            );
            return mat;
        }

        function matset(mat, i, j, value) {
            mat.elements[i][j] = value;
            return mat;
        }

        // The constructor for vectors
        function vector(...args) {
            return new Vector(args);
        }

        // The constructor for matrices
        function matrix(...args) {
            return Matrix.fromArray(args);
        }

        // The constructor for sets
        // eslint-disable-next-line no-shadow -- intentionally shadows outer set for parser function
        function set(...args) {
            return NerdamerSet.fromArray(args);
        }

        function determinant(symbol) {
            if (isMatrix(symbol)) {
                return symbol.determinant();
            }
            return symbol;
        }

        function size(symbol) {
            let retval;
            if (isMatrix(symbol)) {
                retval = [new NerdamerSymbol(symbol.cols()), new NerdamerSymbol(symbol.rows())];
            } else if (isVector(symbol) || isSet(symbol)) {
                retval = new NerdamerSymbol(symbol.elements.length);
            } else {
                err('size expects a matrix or a vector');
            }
            return retval;
        }

        function dot(vec1, vec2) {
            if (isMatrix(vec1)) {
                vec1 = new Vector(vec1);
            }
            if (isMatrix(vec2)) {
                vec2 = new Vector(vec2);
            }

            if (isVector(vec1) && isVector(vec2)) {
                return vec1.dot(vec2);
            }

            return _.multiply(vec1.clone(), vec2.clone());
            // Err('function dot expects 2 vectors');
        }

        function cross(vec1, vec2) {
            if (isMatrix(vec1)) {
                vec1 = new Vector(vec1);
            }
            if (isMatrix(vec2)) {
                vec2 = new Vector(vec2);
            }

            if (isVector(vec1) && isVector(vec2)) {
                return vec1.cross(vec2);
            }

            return _.multiply(vec1.clone(), vec2.clone());
            // Err('function cross expects 2 vectors');
        }

        function transpose(mat) {
            if (isMatrix(mat)) {
                return mat.transpose();
            }
            return err('function transpose expects a matrix');
        }

        function invert(mat) {
            if (isMatrix(mat)) {
                return mat.invert();
            }
            return err('invert expects a matrix');
        }

        // Basic set functions
        function union(set1, set2) {
            return set1.union(set2);
        }

        function intersection(set1, set2) {
            return set1.intersection(set2);
        }

        function contains(set1, e) {
            return set1.contains(e);
        }

        function difference(set1, set2) {
            return set1.difference(set2);
        }

        function intersects(set1, set2) {
            return new NerdamerSymbol(Number(set1.intersects(set2)));
        }

        function isSubset(set1, set2) {
            return new NerdamerSymbol(Number(set1.isSubset(set2)));
        }
        function primes(a, b) {
            b ??= a;
            const primeList = PRIMES.slice(a, b).map(p => new NerdamerSymbol(p));
            if (primeList.length === 1) {
                return primeList[0];
            }
            if (primeList.length === 0) {
                return new NerdamerSymbol(0);
            }
            return new Vector(primeList);
        }

        function print(...args) {
            args.forEach(x => {
                // eslint-disable-next-line no-console
                console.log(x.toString());
            });
        }

        function testSQRT(symbol) {
            // Wrap the symbol in sqrt. This eliminates one more check down the line.
            if (!isSymbol(symbol.power) && symbol.power.absEquals(0.5)) {
                const signVal = symbol.power.sign();
                // Don't devide the power directly. Notice the use of toString. This makes it possible
                // to use a bigNumber library in the future
                const retval = sqrt(symbol.group === P ? new NerdamerSymbol(symbol.value) : symbol.toLinear());
                // Place back the sign of the power
                if (signVal < 0) {
                    retval.invert();
                }
                return retval;
            }
            return symbol;
        }

        // Try to reduce a symbol by pulling its power
        function testPow(symbol) {
            if (symbol.group === P) {
                const v = symbol.value;

                const fct = primeFactors(v)[0];

                // Safety
                if (!fct) {
                    warn('Unable to compute prime factors. This should not happen. Please review and report.');
                    return symbol;
                }

                const n = new Frac(Math.log(v) / Math.log(fct));
                const p = n.multiply(symbol.power);

                // We don't want a more complex number than before
                if (p.den > symbol.power.den) {
                    return symbol;
                }

                if (isInt(p)) {
                    symbol = new NerdamerSymbol(fct ** Number(p));
                } else {
                    symbol = /** @type {NerdamerSymbolType} */ (
                        /** @type {unknown} */ (new NerdamerSymbol(fct))
                    ).setPower(p);
                }
            }

            return symbol;
        }

        // Link the functions to the parse so they're available outside of the library.
        // This is strictly for convenience and may be deprecated.
        this.expand = expand;
        this.round = /** @type {ParserType['round']} */ (/** @type {unknown} */ (round));
        this.clean = /** @type {ParserType['clean']} */ (clean);
        this.sqrt = sqrt;
        this.cbrt = cbrt;
        this.abs = /** @type {ParserType['abs']} */ (abs);
        this.log = log;
        this.rationalize = /** @type {ParserType['rationalize']} */ (rationalize);
        this.nthroot = /** @type {ParserType['nthroot']} */ (nthroot);
        this.arg = /** @type {ParserType['arg']} */ (arg);
        this.conjugate = /** @type {ParserType['conjugate']} */ (conjugate);
        this.imagpart = /** @type {ParserType['imagpart']} */ (imagpart);
        this.realpart = /** @type {ParserType['realpart']} */ (realpart);

        // TODO:
        // Utilize the function below instead of the linked function
        this.getFunction = function getFunction(name) {
            return functions[name][0];
        };

        // Parser.methods ===============================================================
        this.addPreprocessor = function addPreprocessor(name, action, order, shiftCells) {
            const { names } = preprocessors;
            const { actions } = preprocessors;
            if (typeof action !== 'function') // The person probably forgot to specify a name
            {
                throw new Error('Incorrect parameters. Function expected!');
            }
            if (!order) {
                names.push(name);
                actions.push(action);
            } else if (shiftCells) {
                names.splice(order, 0, name);
                actions.splice(order, 0, action);
            } else {
                names[order] = name;
                actions[order] = action;
            }
        };

        this.getPreprocessors = function getPreprocessors() {
            const result = {};
            for (let i = 0, l = preprocessors.names.length; i < l; i++) {
                const name = preprocessors.names[i];
                result[name] = {
                    order: i,
                    action: preprocessors.actions[i],
                };
            }
            return result;
        };

        this.removePreprocessor = function removePreprocessor(name, shiftCells) {
            const i = preprocessors.names.indexOf(name);
            if (shiftCells) {
                remove(preprocessors.names, i);
                remove(preprocessors.actions, i);
            } else {
                preprocessors.names[i] = undefined;
                preprocessors.actions[i] = undefined;
            }
        };

        // The loader for functions which are not part of Math2
        /** @this {{ params: string[]; body: string }} */
        this.mappedFunction = function mappedFunction(...args) {
            /** @type {Record<string, string>} */
            const subs = {};
            const { params } = this;

            for (let i = 0; i < params.length; i++) {
                subs[params[i]] = String(args[i]);
            }

            return _.parse(this.body, subs);
        };
        /**
         * Adds two symbols
         *
         * @param {any} a
         * @param {any} b
         * @returns {any}
         */
        this.add = function add(a, b) {
            let aIsSymbol = isSymbol(a);
            let bIsSymbol = isSymbol(b);
            // We're dealing with two symbols
            if (aIsSymbol && bIsSymbol) {
                // Forward the adding of symbols with units to the Unit module
                if (a.unit || b.unit) {
                    return _.Unit.add(a, b);
                }
                // Handle Infinity
                // https://www.encyclopediaofmath.org/index.php/Infinity
                if (a.isInfinity || b.isInfinity) {
                    const aneg = a.multiplier.lessThan(0);
                    const bneg = b.multiplier.lessThan(0);

                    if (a.isInfinity && b.isInfinity && aneg !== bneg) {
                        throw new UndefinedError(`(${a})+(${b}) is not defined!`);
                    }

                    const inf = NerdamerSymbol.infinity();
                    if (bneg) {
                        inf.negate();
                    }
                    return inf;
                }

                if (a.isComposite() && a.isLinear() && b.isComposite() && b.isLinear()) {
                    a.distributeMultiplier();
                    b.distributeMultiplier();
                    // Fix for issue #606
                    if (b.length > a.length && a.group === b.group) {
                        [a, b] = [b, a];
                    }
                }

                // No need to waste time on zeroes
                if (a.multiplier.equals(0)) {
                    return b;
                }
                if (b.multiplier.equals(0)) {
                    return a;
                }

                if (a.isConstant() && b.isConstant() && Settings.PARSE2NUMBER) {
                    const result = new NerdamerSymbol(a.multiplier.add(b.multiplier).toDecimal(Settings.PRECISION));
                    return result;
                }

                let g1 = a.group;
                let g2 = b.group;
                let ap = a.power.toString();
                let bp = b.power.toString();

                // Always keep the greater group on the left.
                if (g1 < g2 || (g1 === g2 && Number(ap) > Number(bp) && Number(bp) > 0)) {
                    return this.add(b, a);
                }

                /* Note to self: Please don't forget about this dilemma ever again. In this model PL and CB goes crazy
                 * because it doesn't know which one to prioritize. */
                // correction to PL dilemma
                if (g1 === CB && g2 === PL && a.value === b.value) {
                    // Swap
                    const t = a;
                    a = b;
                    b = t;
                    g1 = a.group;
                    g2 = b.group;
                    ap = a.power.toString();
                    bp = b.power.toString();
                }

                const powEQ = ap === bp;
                let v1 = a.value;
                let v2 = b.value;
                const aIsComposite = a.isComposite();
                const bIsComposite = b.isComposite();
                let h1;
                let h2;
                let result;

                if (aIsComposite) {
                    h1 = text(a, 'hash');
                }
                if (bIsComposite) {
                    h2 = text(b, 'hash');
                }

                if (g1 === CP && g2 === CP && b.isLinear() && !a.isLinear() && h1 !== h2) {
                    return this.add(b, a);
                }

                // PL & PL should compare hashes and not values e.g. compare x+x^2 with x+x^3 and not x with x
                if (g1 === PL && g2 === PL) {
                    v1 = h1;
                    v2 = h2;
                }

                const PN = g1 === P && g2 === N;
                const PNEQ = a.value === b.multiplier.toString();
                const valEQ = v1 === v2 || (h1 === h2 && h1 !== undefined) || (PN && PNEQ);

                // Equal values, equal powers
                if (valEQ && powEQ && g1 === g2) {
                    // Make sure to convert N to something P can work with
                    if (PN) {
                        b = b.convert(P);
                    } // CL

                    // handle PL
                    if (g1 === PL && (g2 === S || g2 === P)) {
                        a.distributeMultiplier();
                        result = a.attach(b);
                    } else {
                        result = a; // CL
                        if (a.multiplier.isOne() && b.multiplier.isOne() && g1 === CP && a.isLinear() && b.isLinear()) {
                            for (const s in b.symbols) {
                                if (!Object.hasOwn(b.symbols, s)) {
                                    continue;
                                }
                                const x = b.symbols[s];
                                result.attach(x);
                            }
                        } else {
                            result.multiplier = result.multiplier.add(b.multiplier);
                        }
                    }
                }
                // Equal values uneven powers
                else if (valEQ && g1 !== PL) {
                    // Break the tie for e.g. (x+1)+((x+1)^2+(x+1)^3)
                    if (g1 === CP && g2 === PL) {
                        b.insert(a, 'add');
                        result = b;
                    } else {
                        result = NerdamerSymbol.shell(PL).attach([a, b]);
                        // Update the hash
                        result.value = g1 === PL ? h1 : v1;
                    }
                } else if (aIsComposite && a.isLinear()) {
                    let canIterate = g1 === g2;
                    const bothPL = g1 === PL && g2 === PL;

                    // We can only iterate group PL if they values match
                    if (bothPL) {
                        canIterate = a.value === b.value;
                    }
                    // Distribute the multiplier over the entire symbol
                    a.distributeMultiplier();

                    if (b.isComposite() && b.isLinear() && canIterate) {
                        b.distributeMultiplier();
                        // CL
                        for (const s in b.symbols) {
                            if (!Object.hasOwn(b.symbols, s)) {
                                continue;
                            }
                            const x = b.symbols[s];
                            a.attach(x);
                        }
                        result = a;
                    }
                    // Handle cases like 2*(x+x^2)^2+2*(x+x^2)^3+4*(x+x^2)^2
                    else if ((bothPL && a.value !== h2) || (g1 === PL && !valEQ)) {
                        result = NerdamerSymbol.shell(CP).attach([a, b]);
                        result.updateHash();
                    } else {
                        result = a.attach(b);
                    }
                } else {
                    if (g1 === FN && a.fname === SQRT && g2 !== EX && b.power.equals(0.5)) {
                        const m = b.multiplier.clone();
                        b = sqrt(b.toUnitMultiplier().toLinear());
                        b.multiplier = m;
                    }
                    // Fix for issue #3 and #159
                    if (a.length === 2 && b.length === 2 && even(a.power) && even(b.power)) {
                        result = _.add(expand(a), expand(b));
                    } else {
                        result = NerdamerSymbol.shell(CP).attach([a, b]);
                        result.updateHash();
                    }
                }

                if (result.multiplier.equals(0)) {
                    result = new NerdamerSymbol(0);
                }

                // Make sure to remove unnecessary wraps
                if (result.length === 1) {
                    const m = result.multiplier;
                    result = firstObject(result.symbols);
                    result.multiplier = result.multiplier.multiply(m);
                }

                return result;
            }
            // Keep symbols to the right
            if (bIsSymbol && !aIsSymbol) {
                let t = a;
                a = b;
                b = t; // Swap
                t = bIsSymbol;
                bIsSymbol = aIsSymbol;
                aIsSymbol = t;
            }

            const bIsMatrix = isMatrix(b);

            if (aIsSymbol && bIsMatrix) {
                const M = new Matrix();
                b.eachElement((e, i, j) => {
                    M.set(i, j, _.add(a.clone(), e));
                });

                b = M;
            } else if (isMatrix(a) && bIsMatrix) {
                b = a.add(b);
            } else if (aIsSymbol && isVector(b)) {
                b.each((el, i) => {
                    i--;
                    b.elements[i] = _.add(a.clone(), b.elements[i]);
                });
            } else if (isVector(a) && isVector(b)) {
                b.each((el, i) => {
                    i--;
                    b.elements[i] = _.add(a.elements[i], b.elements[i]);
                });
            } else if (isVector(a) && isMatrix(b)) {
                // Try to convert a to a matrix
                return _.add(b, a);
            } else if (isMatrix(a) && isVector(b)) {
                if (b.elements.length === a.rows()) {
                    const M = new Matrix();
                    const l = a.cols();
                    b.each((e, i) => {
                        const row = [];
                        if (isVector(e)) {
                            for (let j = 0; j < l; j++) {
                                row.push(_.add(a.elements[i - 1][j].clone(), e.elements[j].clone()));
                            }
                        } else {
                            for (let j = 0; j < l; j++) {
                                row.push(_.add(a.elements[i - 1][j].clone(), e.clone()));
                            }
                        }
                        M.elements.push(row);
                    });
                    return M;
                }
                err('Dimensions must match!');
            }
            return b;
        };
        /**
         * Gets called when the parser finds the - operator. Not the prefix operator. See this.add
         *
         * @param {NerdamerSymbolType} a
         * @param {any} b
         * @returns {any}
         */
        this.subtract = function subtract(a, b) {
            const aIsSymbol = isSymbol(a);
            const bIsSymbol = isSymbol(b);
            let _t;

            if (aIsSymbol && bIsSymbol) {
                const aSymbol = /** @type {NerdamerSymbolType} */ (a);
                const bSymbol = /** @type {NerdamerSymbolType} */ (b);
                if (aSymbol.unit || bSymbol.unit) {
                    return _.Unit.subtract(aSymbol, bSymbol);
                }
                return this.add(aSymbol, bSymbol.negate());
            }
            if (bIsSymbol && isVector(a)) {
                b = a.map(x => _.subtract(x, b.clone()));
            } else if (aIsSymbol && isVector(b)) {
                b = b.map(x => _.subtract(a.clone(), x));
            } else if ((isVector(a) && isVector(b)) || (isCollection(a) && isCollection(b))) {
                if (a.dimensions() === b.dimensions()) {
                    b = a.subtract(b);
                } else {
                    _.error('Unable to subtract vectors/collections. Dimensions do not match.');
                }
            } else if (isMatrix(a) && isVector(b)) {
                if (b.elements.length === a.rows()) {
                    const M = new Matrix();
                    const l = a.cols();
                    b.each((e, i) => {
                        const row = [];
                        for (let j = 0; j < l; j++) {
                            row.push(_.subtract(a.elements[i - 1][j].clone(), e.clone()));
                        }
                        M.elements.push(row);
                    });
                    return M;
                }
                err('Dimensions must match!');
            } else if (isVector(a) && isMatrix(b)) {
                const M = b.clone().negate();
                return _.add(M, a);
            } else if (isMatrix(a) && isMatrix(b)) {
                b = a.subtract(b);
            } else if (isMatrix(a) && bIsSymbol) {
                const M = new Matrix();
                a.each((x, i, j) => {
                    M.set(i, j, _.subtract(x, b.clone()));
                });
                b = M;
            } else if (aIsSymbol && isMatrix(b)) {
                const M = new Matrix();
                b.each((x, i, j) => {
                    M.set(i, j, _.subtract(a.clone(), x));
                });
                b = M;
            }
            return b;
        };
        /**
         * Gets called when the parser finds the * operator. See this.add
         *
         * @param {any} a
         * @param {any} b
         * @returns {any}
         */
        this.multiply = function multiply(a, b) {
            let aIsSymbol = isSymbol(a);
            let bIsSymbol = isSymbol(b);
            // We're dealing with function assignment here
            if (aIsSymbol && b instanceof Collection) {
                b.elements.push(a);
                return b;
            }
            if (aIsSymbol && bIsSymbol) {
                // If it has a unit then add it and return it right away.
                if (b.isUnit) {
                    const result = a.clone();
                    a.unit = b;
                    return result;
                }

                // If it has units then just forward that problem to the unit module
                if (a.unit || b.unit) {
                    return _.Unit.multiply(a, b);
                }

                // Handle Infinty
                if (a.isInfinity || b.isInfinity) {
                    if (a.equals(0) || b.equals(0)) {
                        throw new UndefinedError(`${a}*${b} is undefined!`);
                    }
                    // X/infinity
                    if (b.power.lessThan(0)) {
                        if (!a.isInfinity) {
                            return new NerdamerSymbol(0);
                        }
                        throw new UndefinedError('Infinity/Infinity is not defined!');
                    }

                    const signVal = a.multiplier.multiply(b.multiplier).sign();
                    const inf = NerdamerSymbol.infinity();
                    if (a.isConstant() || b.isConstant() || (a.isInfinity && b.isInfinity)) {
                        if (signVal < 0) {
                            inf.negate();
                        }

                        return inf;
                    }
                }

                // The quickies
                if (a.multiplier.equals(0) || b.multiplier.equals(0)) {
                    return new NerdamerSymbol(0);
                }

                if (a.isOne()) {
                    return b.clone();
                }
                if (b.isOne()) {
                    return a.clone();
                }

                // Now we know that neither is 0
                if (a.isConstant() && b.isConstant() && Settings.PARSE2NUMBER) {
                    let retval;

                    // Check if either fraction has magnitude outside the precision range.
                    // If so, toDecimal() would lose significant digits, so we must use
                    // exact fraction arithmetic instead.
                    //
                    // The magnitude of a fraction num/den is approximately:
                    //   log10(num) - log10(den) ≈ numDigits - denDigits
                    //
                    // With PRECISION decimal places, we can only represent numbers in
                    // the range [10^(-PRECISION), 10^(+PRECISION)] accurately.
                    // We use a buffer of 5 digits to ensure we have enough significant
                    // digits for accurate multiplication.
                    const aNumDigits = a.multiplier.num.abs().toString().length;
                    const aDenDigits = a.multiplier.den.toString().length;
                    const aMagnitude = aNumDigits - aDenDigits;

                    const bNumDigits = b.multiplier.num.abs().toString().length;
                    const bDenDigits = b.multiplier.den.toString().length;
                    const bMagnitude = bNumDigits - bDenDigits;

                    const magnitudeLimit = Settings.PRECISION - 5; // Need at least 5 significant digits
                    const needsExactArithmetic =
                        aMagnitude < -magnitudeLimit ||
                        aMagnitude > magnitudeLimit ||
                        bMagnitude < -magnitudeLimit ||
                        bMagnitude > magnitudeLimit;

                    if (needsExactArithmetic) {
                        // Use exact fraction arithmetic via bigDec to avoid precision loss
                        const anum = new bigDec(String(a.multiplier.num));
                        const aden = new bigDec(String(a.multiplier.den));
                        const bnum = new bigDec(String(b.multiplier.num));
                        const bden = new bigDec(String(b.multiplier.den));
                        retval = new NerdamerSymbol(anum.times(bnum).dividedBy(aden).dividedBy(bden).toFixed());
                    } else {
                        // Safe to use decimal approximation
                        const ad = new bigDec(a.multiplier.toDecimal());
                        const bd = new bigDec(b.multiplier.toDecimal());
                        const t = ad.times(bd).toFixed();
                        retval = new NerdamerSymbol(t);
                    }
                    return retval;
                }

                if (b.group > a.group && !(b.group === CP)) {
                    return this.multiply(b, a);
                }
                // Correction for PL/CB dilemma
                if (a.group === CB && b.group === PL && a.value === b.value) {
                    const t = a;
                    a = b;
                    b = t; // Swap
                }

                let g1 = a.group;
                const g2 = b.group;
                const bnum = b.multiplier.num;
                const bden = b.multiplier.den;

                if (
                    g1 === FN &&
                    a.fname === SQRT &&
                    !b.isConstant() &&
                    a.args[0].value === b.value &&
                    !a.args[0].multiplier.lessThan(0)
                ) {
                    // Unwrap sqrt
                    const aPow = a.power;
                    const aMultiplier = _.parse(a.multiplier);
                    a = _.multiply(aMultiplier, a.args[0].clone());
                    a.setPower(new Frac(0.5).multiply(aPow));
                    g1 = a.group;
                }
                // Simplify n/sqrt(n). Being very specific
                else if (
                    g1 === FN &&
                    a.fname === SQRT &&
                    a.multiplier.equals(1) &&
                    a.power.equals(-1) &&
                    b.isConstant() &&
                    a.args[0].equals(b)
                ) {
                    a = _.symfunction(SQRT, [b.clone()]);
                    b = new NerdamerSymbol(1);
                }
                let v1 = a.value;
                let v2 = b.value;
                /** @type {FracType} */
                let signVal = /** @type {FracType} */ (/** @type {unknown} */ (new Frac(a.sign())));
                // Since P is just a morphed version of N we need to see if they relate
                const ONN = g1 === P && g2 === N && b.multiplier.equals(a.value);
                // Don't multiply the multiplier of b since that's equal to the value of a
                const m = ONN ? new Frac(1).multiply(a.multiplier).abs() : a.multiplier.multiply(b.multiplier).abs();
                let result = a.clone().toUnitMultiplier();
                b = b.clone().toUnitMultiplier(true);

                // Further simplification of sqrt
                if (g1 === FN && g2 === FN) {
                    const u = a.args[0].clone();
                    const v = b.args[0].clone();
                    if (a.fname === SQRT && b.fname === SQRT && a.isLinear() && b.isLinear()) {
                        const q = _.divide(u, v).invert();
                        if (q.gt(1) && isInt(q)) {
                            // B contains a factor a which can be moved to a
                            result = _.multiply(a.args[0].clone(), sqrt(q.clone()));
                            b = new NerdamerSymbol(1);
                        }
                    }
                    // Simplify factorial but only if
                    // 1 - It's division so b will have a negative power
                    // 2 - We're not dealing with factorials of numbers
                    else if (
                        a.fname === FACTORIAL &&
                        b.fname === FACTORIAL &&
                        !u.isConstant() &&
                        !v.isConstant() &&
                        /** @type {number} */ (b.power) < 0
                    ) {
                        // Assume that n = positive
                        const d = _.subtract(u.clone(), v.clone());

                        // If it's not numeric then we don't know if we can simplify so just return
                        if (d.isConstant()) {
                            // There will never be a case where d == 0 since this will already have
                            // been handled at the beginning of this function
                            let t = new NerdamerSymbol(1);
                            if (d < 0) {
                                // If d is negative then the numerator is larger so expand that
                                for (let i = 0, n = Math.abs(d); i <= n; i++) {
                                    const s = _.add(u.clone(), new NerdamerSymbol(i));
                                    t = _.multiply(t, s);
                                }

                                result = _.multiply(
                                    _.pow(u, new NerdamerSymbol(a.power)),
                                    _.pow(t, new NerdamerSymbol(b.power))
                                );

                                b = new NerdamerSymbol(1);
                            } else {
                                // Otherwise the denominator is larger so expand that
                                for (let i = 0, n = Math.abs(d); i <= n; i++) {
                                    const s = _.add(v.clone(), new NerdamerSymbol(i));
                                    t = _.multiply(t, s);
                                }

                                result = _.multiply(
                                    _.pow(t, new NerdamerSymbol(a.power)),
                                    _.pow(v, new NerdamerSymbol(b.power))
                                );

                                b = new NerdamerSymbol(1);
                            }
                        }
                    }
                }

                // If both are PL then their hashes have to match
                if (v1 === v2 && g1 === PL && g1 === g2) {
                    v1 = a.text('hash');
                    v2 = b.text('hash');
                }

                // Same issue with (x^2+1)^x*(x^2+1)
                // EX needs an exception when multiplying because it needs to recognize
                // that (x+x^2)^x has the same hash as (x+x^2). The latter is kept as x
                if (g2 === EX && b.previousGroup === PL && g1 === PL) {
                    v1 = text(a, 'hash', EX);
                }

                if (
                    (v1 === v2 || ONN) &&
                    !(g1 === PL && (g2 === S || g2 === P || g2 === FN)) &&
                    !(g1 === PL && g2 === CB)
                ) {
                    const p1 = a.power;
                    const p2 = b.power;
                    const isSymbolP1 = isSymbol(p1);
                    const isSymbolP2 = isSymbol(p2);
                    const toEX = isSymbolP1 || isSymbolP2;
                    // TODO: this needs cleaning up
                    if (g1 === PL && g2 !== PL && b.previousGroup !== PL && p1.equals(1)) {
                        result = new NerdamerSymbol(0);
                        a.each(x => {
                            result = _.add(result, _.multiply(x, b.clone()));
                        }, true);
                    } else {
                        // Add the powers
                        if (toEX) {
                            result.power = _.add(
                                isSymbol(p1) ? p1 : new NerdamerSymbol(p1),
                                isSymbol(p2) ? p2 : new NerdamerSymbol(p2)
                            );
                        } else if (g1 === N) {
                            // Don't add powers for N
                            result.power = p1;
                        } else {
                            result.power = p1.add(p2);
                        }

                        // Eliminate zero power values and convert them to numbers
                        if (result.power.equals(0)) {
                            result = result.convert(N);
                        }

                        // Properly convert to EX
                        if (toEX) {
                            result.convert(EX);
                        }

                        // Take care of imaginaries
                        if (a.imaginary && b.imaginary) {
                            const isEven = even(Number(result.power) % 2);
                            if (isEven) {
                                result = new NerdamerSymbol(1);
                                m.negate();
                            }
                        }

                        // Cleanup: this causes the LaTeX generator to get confused as to how to render the symbol
                        if (result.group !== EX && result.previousGroup) {
                            result.previousGroup = undefined;
                        }
                        // The sign for b is floating around. Remember we are assuming that the odd variable will carry
                        // the sign but this isn't true if they're equals symbols
                        result.multiplier = result.multiplier.multiply(b.multiplier);
                    }
                } else if (g1 === CB && a.isLinear()) {
                    if (g2 === CB) {
                        b.distributeExponent();
                    }
                    if (g2 === CB && b.isLinear()) {
                        for (const s in b.symbols) {
                            if (!Object.hasOwn(b.symbols, s)) {
                                continue;
                            }
                            const x = b.symbols[s];
                            result = result.combine(x);
                        }
                        result.multiplier = result.multiplier.multiply(b.multiplier);
                    } else {
                        result.combine(b);
                    }
                    // The multiplier was already handled so nothing left to do
                } else if (g1 === N) {
                    result = b.clone().toUnitMultiplier(true);
                } else if (g1 === CB) {
                    result.distributeExponent();
                    result.combine(b);
                } else if (!b.isOne()) {
                    const bm = b.multiplier.clone();
                    b.toUnitMultiplier();
                    result = NerdamerSymbol.shell(CB).combine([result, b]);
                    // Transfer the multiplier to the outside
                    result.multiplier = result.multiplier.multiply(bm);
                }

                if (result.group === P) {
                    const logV = Math.log(result.value);
                    const n1 = Math.log(/** @type {number} */ (bnum)) / logV;
                    const n2 = Math.log(/** @type {number} */ (bden)) / logV;
                    const ndiv = /** @type {number} */ (m.num) / /** @type {number} */ (bnum);
                    const ddiv = /** @type {number} */ (m.den) / /** @type {number} */ (bden);
                    // We don't want to divide by zero no do we? Strange things happen.
                    if (n1 !== 0 && isInt(n1) && isInt(ndiv)) {
                        result.power = result.power.add(new Frac(n1));
                        /** @type {number} */ (m.num) /= /** @type {number} */ (bnum); // BigInt? Keep that in mind for the future.
                    }
                    if (n2 !== 0 && isInt(n2) && isInt(ddiv)) {
                        result.power = result.power.subtract(new Frac(n2));
                        /** @type {number} */ (m.den) /= /** @type {number} */ (bden); // BigInt? Keep that in mind for the future.
                    }
                }

                // Unpack CB if length is only one
                if (result.length === 1) {
                    const t = result.multiplier;
                    // Transfer the multiplier
                    result = firstObject(result.symbols);
                    result.multiplier = result.multiplier.multiply(t);
                }

                // Reduce square root
                const ps = result.power.toString();
                if (even(ps) && result.fname === SQRT) {
                    // Grab the sign of the symbol
                    signVal = signVal.multiply(
                        /** @type {FracType} */ (/** @type {unknown} */ (new Frac(result.sign())))
                    );
                    const p = result.power;
                    result = result.args[0];
                    result = _.multiply(
                        new NerdamerSymbol(m),
                        _.pow(result, new NerdamerSymbol(p.divide(new Frac(2))))
                    );
                    // Flip it back to the correct sign
                    if (signVal.lessThan(0)) {
                        result.negate();
                    }
                } else {
                    result.multiplier = result.multiplier.multiply(m).multiply(signVal);
                    if (result.group === CP && result.isImaginary()) {
                        result.distributeMultiplier();
                    }
                }

                // Back convert group P to a simpler group N if possible
                if (result.group === P && isInt(result.power.toDecimal())) {
                    result = result.convert(N);
                }

                return result;
            }
            //* ***** Matrices & Vector *****//
            if (bIsSymbol && !aIsSymbol) {
                // Keep symbols to the right
                let t = a;
                a = b;
                b = t; // Swap
                t = bIsSymbol;
                bIsSymbol = aIsSymbol;
                aIsSymbol = t;
            }

            const isMatrixB = isMatrix(b);
            const isMatrixA = isMatrix(a);
            if (aIsSymbol && isMatrixB) {
                const M = new Matrix();
                b.eachElement((e, row, col) => {
                    M.set(row, col, _.multiply(a.clone(), e));
                });

                b = M;
            } else if (isMatrixA && isMatrixB) {
                b = a.multiply(b);
            } else if (aIsSymbol && isVector(b)) {
                b.each((el, idx) => {
                    idx--;
                    b.elements[idx] = _.multiply(a.clone(), b.elements[idx]);
                });
            } else if (isVector(a) && isVector(b)) {
                b.each((el, idx) => {
                    idx--;
                    b.elements[idx] = _.multiply(a.elements[idx], b.elements[idx]);
                });
            } else if (isVector(a) && isMatrix(b)) {
                // Try to convert a to a matrix
                return this.multiply(b, a);
            } else if (isMatrix(a) && isVector(b)) {
                if (b.elements.length === a.rows()) {
                    const M = new Matrix();
                    const l = a.cols();
                    b.each((e, idx) => {
                        const row = [];
                        for (let j = 0; j < l; j++) {
                            row.push(_.multiply(a.elements[idx - 1][j].clone(), e.clone()));
                        }
                        M.elements.push(row);
                    });
                    return M;
                }
                err('Dimensions must match!');
            }

            return b;
        };
        /**
         * Gets called when the parser finds the / operator. See this.add
         *
         * @param {any} a
         * @param {any} b
         * @returns {any}
         */
        this.divide = function divide(a, b) {
            const aIsSymbol = isSymbol(a);
            const bIsSymbol = isSymbol(b);

            if (aIsSymbol && bIsSymbol) {
                // Forward to Unit division
                if (a.unit || b.unit) {
                    return _.Unit.divide(a, b);
                }
                let result;
                if (b.equals(0)) {
                    throw new DivisionByZero('Division by zero not allowed!');
                }

                if (a.isConstant() && b.isConstant()) {
                    result = a.clone();
                    result.multiplier = result.multiplier.divide(b.multiplier);
                } else {
                    b.invert();
                    result = _.multiply(a, b);
                }
                return result;
            }
            //* ****** Vectors & Matrices *********//
            const isVectorA = isVector(a);
            const isVectorB = isVector(b);
            if (aIsSymbol && isVectorB) {
                b = b.map(x => _.divide(a.clone(), x));
            } else if (isVectorA && bIsSymbol) {
                b = a.map(x => _.divide(x, b.clone()));
            } else if (isVectorA && isVectorB) {
                if (a.dimensions() === b.dimensions()) {
                    b = b.map((x, i) => _.divide(a.elements[--i], x));
                } else {
                    _.error('Cannot divide vectors. Dimensions do not match!');
                }
            } else {
                const isMatrixA = isMatrix(a);
                const isMatrixB = isMatrix(b);
                if (isMatrixA && bIsSymbol) {
                    const M = new Matrix();
                    a.eachElement((x, i, j) => {
                        M.set(i, j, _.divide(x, b.clone()));
                    });
                    b = M;
                } else if (aIsSymbol && isMatrixB) {
                    const M = new Matrix();
                    b.eachElement((x, i, j) => {
                        M.set(i, j, _.divide(a.clone(), x));
                    });
                    b = M;
                } else if (isMatrixA && isMatrixB) {
                    const M = new Matrix();
                    if (a.rows() === b.rows() && a.cols() === b.cols()) {
                        a.eachElement((x, i, j) => {
                            M.set(i, j, _.divide(x, b.elements[i][j]));
                        });
                        b = M;
                    } else {
                        _.error('Dimensions do not match!');
                    }
                } else if (isMatrixA && isVectorB) {
                    if (a.cols() === b.dimensions()) {
                        const M = new Matrix();
                        a.eachElement((x, i, j) => {
                            M.set(i, j, _.divide(x, b.elements[i].clone()));
                        });
                        b = M;
                    } else {
                        _.error('Unable to divide matrix by vector.');
                    }
                }
            }
            return b;
        };
        /**
         * Gets called when the parser finds the ^ operator. See this.add
         *
         * @param {any} a
         * @param {any} b
         * @returns {any}
         */
        this.pow = function pow(a, b) {
            const aIsSymbol = isSymbol(a);
            const bIsSymbol = isSymbol(b);
            if (aIsSymbol && bIsSymbol) {
                // It has units then it's the Unit module's problem
                if (a.unit || b.unit) {
                    return _.Unit.pow(a, b);
                }

                // Handle abs
                if (a.group === FN && a.fname === ABS && even(b)) {
                    const m = a.multiplier.clone();
                    const raised = _.pow(a.args[0], b);
                    raised.multiplier = m;
                    return raised;
                }

                // Handle infinity
                if (a.isInfinity || b.isInfinity) {
                    if (a.isInfinity && b.isInfinity) {
                        throw new UndefinedError(`(${a})^(${b}) is undefined!`);
                    }

                    if (a.isConstant() && b.isInfinity) {
                        if (a.equals(0)) {
                            if (b.lessThan(0)) {
                                throw new UndefinedError('0^Infinity is undefined!');
                            }
                            return new NerdamerSymbol(0);
                        }
                        if (a.equals(1)) {
                            throw new UndefinedError(`1^${b.toString()} is undefined!`);
                        }
                        // A^-oo
                        if (b.lessThan(0)) {
                            return new NerdamerSymbol(0);
                        }
                        // A^oo
                        if (!a.lessThan(0)) {
                            return NerdamerSymbol.infinity();
                        }
                    }

                    if (a.isInfinity && b.isConstant()) {
                        if (b.equals(0)) {
                            throw new UndefinedError(`${a}^0 is undefined!`);
                        }
                        if (b.lessThan(0)) {
                            return new NerdamerSymbol(0);
                        }
                        return _.multiply(NerdamerSymbol.infinity(), _.pow(new NerdamerSymbol(a.sign()), b.clone()));
                    }
                }

                const aIsZero = a.equals(0);
                const bIsZero = b.equals(0);
                if (aIsZero && bIsZero) {
                    throw new UndefinedError('0^0 is undefined!');
                }

                // Return 0 right away if possible
                if (aIsZero && b.isConstant() && b.multiplier.greaterThan(0)) {
                    return new NerdamerSymbol(0);
                }

                if (bIsZero) {
                    return new NerdamerSymbol(1);
                }

                const bIsConstant = b.isConstant();
                const aIsConstant = a.isConstant();
                const bIsInt = b.isInteger();
                const m = a.multiplier;
                let result = a.clone();

                // 0^0, 1/0, etc. Complain.
                if (aIsConstant && bIsConstant && a.equals(0) && b.lessThan(0)) {
                    throw new UndefinedError('Division by zero is not allowed!');
                }

                // Compute imaginary numbers right away
                if (Settings.PARSE2NUMBER && aIsConstant && bIsConstant && a.sign() < 0 && evenFraction(b)) {
                    const k = Math.PI * Number(b.multiplier.toDecimal());
                    const re = new NerdamerSymbol(Math.cos(k));
                    const im = _.multiply(NerdamerSymbol.imaginary(), new NerdamerSymbol(Math.sin(k)));
                    return _.add(re, im);
                }

                // Imaginary number under negative nthroot or to the n
                if (Settings.PARSE2NUMBER && a.isImaginary() && bIsConstant && isInt(b) && !b.lessThan(0)) {
                    let r;
                    let theta;
                    let nre;
                    let nim;
                    let phi;
                    const re = a.realpart();
                    const im = a.imagpart();
                    if (re.isConstant('all') && im.isConstant('all')) {
                        phi = Settings.USE_BIG
                            ? new NerdamerSymbol(
                                  bigDec.atan2(im.multiplier.toDecimal(), re.multiplier.toDecimal()).times(b.toString())
                              )
                            : Math.atan2(Number(im.multiplier.toDecimal()), Number(re.multiplier.toDecimal())) *
                              Number(b.multiplier.toDecimal());
                        theta = new NerdamerSymbol(phi);
                        r = _.pow(NerdamerSymbol.hyp(re, im), b);
                        nre = _.multiply(r.clone(), _.trig.cos(theta.clone()));
                        nim = _.multiply(r, _.trig.sin(theta));
                        return _.add(nre, _.multiply(NerdamerSymbol.imaginary(), nim));
                    }
                }

                // Take care of the symbolic part
                result.toUnitMultiplier();
                let signVal;
                // Simpifly sqrt
                if (result.group === FN && result.fname === SQRT && !bIsConstant) {
                    const s = result.args[0];
                    s.multiplyPower(new NerdamerSymbol(0.5));
                    s.multiplier.multiply(result.multiplier);
                    s.multiplyPower(b);
                    result = s;
                } else {
                    signVal = m.sign();
                    // Handle cases such as (-a^3)^(1/4)
                    if (evenFraction(b) && signVal < 0) {
                        // Swaperoo
                        // First put the sign back on the symbol
                        result.negate();
                        // Wrap it in brackets
                        result = _.symfunction(PARENTHESIS, [result]);
                        // Move the sign back the exterior and let nerdamer handle the rest
                        result.negate();
                    }

                    result.multiplyPower(b);
                }

                let num;
                let den;
                if (aIsConstant && bIsConstant && Settings.PARSE2NUMBER) {
                    let c;
                    // Remove the sign
                    if (signVal < 0) {
                        a.negate();
                        if (b.multiplier.den.equals(2)) // We know that the numerator has to be odd and therefore it's i
                        {
                            c = new NerdamerSymbol(Settings.IMAGINARY);
                        } else if (isInt(b.multiplier)) {
                            if (even(b.multiplier)) {
                                c = new NerdamerSymbol(1);
                            } else {
                                c = new NerdamerSymbol(-1);
                            }
                        } else if (even(b.multiplier.den)) {
                            c = _.pow(_.symfunction(PARENTHESIS, [new NerdamerSymbol(signVal)]), b.clone());
                        } else {
                            c = new NerdamerSymbol(signVal ** /** @type {number} */ (b.multiplier.num));
                        }
                    }

                    const _pow = Number(a.multiplier.toDecimal()) ** Number(b.multiplier.toDecimal());
                    if (_pow !== 0 || a.multiplier.equals(0)) {
                        result = new NerdamerSymbol(_pow);
                    } else {
                        // Should not be here, must have underflowed precision
                        const ad = new bigDec(a.multiplier.toDecimal());
                        const bd = new bigDec(b.multiplier.toDecimal());
                        result = new NerdamerSymbol(ad.pow(bd).toFixed());
                    }
                    // Put the back sign
                    if (c) {
                        result = _.multiply(result, c);
                    }
                } else if (bIsInt && !m.equals(1)) {
                    const absB = b.abs();
                    // Provide fall back to JS until big number implementation is improved
                    if (absB.gt(Settings.MAX_EXP)) {
                        if (b.sign() < 0) {
                            return new NerdamerSymbol(0);
                        }
                        return NerdamerSymbol.infinity();
                    }
                    const p = b.multiplier.toDecimal();
                    const sgn = Math.sign(Number(p));
                    const absP = Math.abs(Number(p));
                    const multiplier = new Frac(1);
                    multiplier.num = m.num.pow(absP);
                    multiplier.den = m.den.pow(absP);
                    if (sgn < 0) {
                        multiplier.invert();
                    }
                    // Multiplying is justified since after mulltiplyPower if it was of group P it will now be of group N
                    result.multiplier = result.multiplier.multiply(multiplier);
                } else {
                    const aSignVal = a.sign();
                    if (b.isConstant() && a.isConstant() && !b.multiplier.den.equals(1) && aSignVal < 0) {
                        // We know the sign is negative so if the denominator for b == 2 then it's i
                        if (b.multiplier.den.equals(2)) {
                            const i = new NerdamerSymbol(Settings.IMAGINARY);
                            a.negate(); // Remove the sign
                            // if the power is negative then i is negative
                            if (b.lessThan(0)) {
                                i.negate();
                                b.negate(); // Remove the sign from the power
                            }
                            // Pull the power normally and put back the imaginary
                            result = _.multiply(_.pow(a, b), i);
                        } else {
                            const aa = a.clone();
                            aa.multiplier.negate();
                            result = _.pow(_.symfunction(PARENTHESIS, [new NerdamerSymbol(signVal)]), b.clone());
                            const _a = _.pow(new NerdamerSymbol(aa.multiplier.num), b.clone());
                            const _b = _.pow(new NerdamerSymbol(aa.multiplier.den), b.clone());
                            const r = _.divide(_a, _b);
                            result = _.multiply(result, r);
                        }
                    } else if (Settings.PARSE2NUMBER && b.isImaginary()) {
                        // 4^(i + 2) = e^(- (2 - 4 i) π n + (2 + i) log(4))

                        const re = b.realpart();
                        const im = b.imagpart();
                        /*
                         If(b.group === CP && false) {
                         let ex = _.pow(a.clone(), re);
                         let xi = _.multiply(_.multiply(ex.clone(), trig.sin(im.clone())), NerdamerSymbol.imaginary());
                         let xa = _.multiply(trig.cos(im), ex);
                         result = _.add(xi, xa);
                         }
                         else {
                         */
                        const aa = a.clone().toLinear();
                        const a1 = _.pow(aa.clone(), re);
                        const logA = log(aa.clone());
                        const b1 = trig.cos(_.multiply(im.clone(), logA));
                        const c1 = _.multiply(trig.sin(_.multiply(im, log(aa))), NerdamerSymbol.imaginary());
                        result = _.multiply(a1, _.add(b1, c1));
                        result = _.expand(_.parse(result));
                        /*
                         }   
                         */
                    } else {
                        // B is a symbol
                        const negNum = a.group === N && aSignVal < 0;
                        num = testSQRT(
                            /** @type {NerdamerSymbolType} */ (
                                /** @type {unknown} */ (new NerdamerSymbol(negNum ? m.num : Math.abs(m.num)))
                            ).setPower(b.clone())
                        );
                        den = testSQRT(
                            /** @type {NerdamerSymbolType} */ (/** @type {unknown} */ (new NerdamerSymbol(m.den)))
                                .setPower(b.clone())
                                .invert()
                        );

                        // Eliminate imaginary if possible
                        if (a.imaginary) {
                            if (bIsInt) {
                                const s = Math.sign(b);
                                const p = abs(b);
                                const n = p % 4;
                                result = new NerdamerSymbol(even(n) ? -1 : Settings.IMAGINARY);
                                if (n === 0 || (s < 0 && n === 1) || (s > 0 && n === 3)) {
                                    result.negate();
                                }
                            } else {
                                // Assume i = sqrt(-1) -> (-1)^(1/2)
                                const nr = b.multiplier.multiply(Frac.quick(1, 2));
                                // The denominator denotes the power so raise to it. It will turn positive it round
                                const tn = (-1) ** /** @type {number} */ (nr.num);
                                result = even(nr.den)
                                    ? /** @type {NerdamerSymbolType} */ (
                                          /** @type {unknown} */ (new NerdamerSymbol(-1))
                                      ).setPower(nr, true)
                                    : new NerdamerSymbol(tn);
                            }
                        }
                        // Ensure that the sign is carried by the symbol and not the multiplier
                        // this enables us to check down the line if the multiplier can indeed be transferred
                        if (aSignVal < 0 && !negNum) {
                            result.negate();
                        }

                        // Retain the absolute value
                        if (bIsConstant && a.group !== EX) {
                            const evenr = even(b.multiplier.den);
                            const evenp = even(a.power);
                            const n = result.power.toDecimal();
                            const evennp = even(n);
                            if (evenr && evenp && !evennp) {
                                if (n === '1' || n === '1') {
                                    // Check for together.math baseunits
                                    // don't have to wrap them in abs()
                                    if (typeof result.value === 'string' && result.value.startsWith('baseunit_')) {
                                        // Don't wrap baseunits in abs()
                                    } else {
                                        result = _.symfunction(ABS, [result]);
                                    }
                                } else if (isInt(n)) {
                                    result = _.multiply(
                                        _.symfunction(ABS, [result.clone().toLinear()]),
                                        result.clone().setPower(new Frac(Number(n) - 1))
                                    );
                                } else {
                                    const p = result.power;
                                    result = _.symfunction(ABS, [result.toLinear()]).setPower(p);
                                }
                                // Quick workaround. Revisit
                                if (Settings.POSITIVE_MULTIPLIERS && result.fname === ABS) {
                                    result = result.args[0];
                                }
                            }
                        }
                        // Multiply out sqrt
                        if (b.equals(2) && result.group === CB) {
                            let _result = new NerdamerSymbol(1);
                            result.each(sym => {
                                _result = _.multiply(_result, _.pow(sym, b));
                            });
                            result = _result;
                        }
                    }
                }

                result = testSQRT(result);

                // Don't multiply until we've tested the remaining symbol
                if (num && den) {
                    result = _.multiply(result, testPow(_.multiply(num, den)));
                }

                // Reduce square root
                if (result.fname === SQRT) {
                    const isEX = result.group === EX;
                    const t = isEX
                        ? /** @type {NerdamerSymbol} */ (result.power).multiplier.toString()
                        : result.power.toString();
                    if (even(t)) {
                        const pt = isEX
                            ? _.divide(result.power, new NerdamerSymbol(2))
                            : new NerdamerSymbol(/** @type {Frac} */ (result.power).divide(new Frac(2)));
                        const resultMult = result.multiplier;
                        result = _.pow(result.args[0], pt);
                        result.multiplier = result.multiplier.multiply(resultMult);
                    }
                }
                // Detect Euler's identity
                else if (
                    !Settings.IGNORE_E &&
                    result.isE() &&
                    result.group === EX &&
                    result.power.contains('pi') &&
                    result.power.contains(Settings.IMAGINARY) &&
                    b.group === CB
                ) {
                    const theta = b.stripVar(Settings.IMAGINARY);
                    result = _.add(trig.cos(theta), _.multiply(NerdamerSymbol.imaginary(), trig.sin(theta)));
                }

                return result;
            }
            if (isVector(a) && bIsSymbol) {
                a = a.map(x => _.pow(x, b.clone()));
            } else if (isMatrix(a) && bIsSymbol) {
                const M = new Matrix();
                a.eachElement((x, row, col) => {
                    M.set(row, col, _.pow(x, b.clone()));
                });
                a = M;
            } else if (aIsSymbol && isMatrix(b)) {
                const M = new Matrix();
                b.eachElement((x, row, col) => {
                    M.set(row, col, _.pow(a.clone(), x));
                });
                a = M;
            }
            return a;
        };
        // Gets called when the parser finds the , operator.
        // Commas return a Collector object which is roughly an array
        this.comma = function comma(a, b) {
            if (!(a instanceof Collection)) {
                a = Collection.create(a);
            }
            a.append(b);
            return a;
        };
        // Link to modulus
        this.mod = function mod(a, b) {
            return _mod(a, b);
        };
        // Used to slice elements from arrays
        this.slice = function slice(a, b) {
            return new Slice(a, b);
        };
        // The equality setter
        this.equals = function equals(a, b) {
            // Equality can only be set for group S so complain it's not
            if (a.group !== S && !a.isLinear()) {
                err(`Cannot set equality for ${a.toString()}`);
            }
            VARS[a.value] = b.clone();
            return b;
        };
        // Percent
        this.percent = function percent(a) {
            return _.divide(a, new NerdamerSymbol(100));
        };
        // NerdamerSet variable
        this.assign = function assign(a, b) {
            if (a instanceof Collection && b instanceof Collection) {
                a.elements.map((x, i) => _.assign(x, b.elements[i]));
                return Vector.fromArray(b.elements);
            }
            if (a.parent) {
                // It's referring to the parent instead. The current item can be discarded
                const e = a.parent;
                e.elements[e.getter] = b;
                delete e.getter;
                return e;
            }

            if (a.group !== S) {
                throw new NerdamerValueError(`Cannot complete operation. Incorrect LH value for ${a}`);
            }
            VARS[a.value] = b;
            return b;
        };
        this.functionAssign = function functionAssign(a, b) {
            const f = a.elements.pop();
            return _setFunction(f, a.elements, b);
        };
        // Function to quickly convert bools to Symbols
        const bool2Symbol = function bool2Symbol(x) {
            return new NerdamerSymbol(x === true ? 1 : 0);
        };
        // Check for equality
        this.eq = function eq(a, b) {
            return bool2Symbol(a.equals(b));
        };
        // Checks for greater than
        this.gt = function gt(a, b) {
            return bool2Symbol(a.gt(b));
        };
        // Checks for greater than equal
        this.gte = function gte(a, b) {
            return bool2Symbol(a.gte(b));
        };
        // Checks for less than
        this.lt = function lt(a, b) {
            return bool2Symbol(a.lt(b));
        };
        // Checks for less than equal
        this.lte = function lte(a, b) {
            return bool2Symbol(a.lte(b));
        };
        // Wraps the factorial
        this.factorial = function factorial(a) {
            return this.symfunction(FACTORIAL, [a]);
        };
        // Wraps the double factorial
        this.dfactorial = function dfactorial(a) {
            return this.symfunction(DOUBLEFACTORIAL, [a]);
        };
    }

    // Inits ========================================================================
    _ = /** @type {ParserType} */ (/** @type {unknown} */ (new Parser())); // Nerdamer's parser

    // Initialize EvaluateDeps with parser reference
    EvaluateDeps._ = _;

    // Supported is now defined outside IIFE
    // Initialize SupportedDeps with _.functions reference (use getter for lazy access)
    Object.defineProperty(SupportedDeps, 'functions', {
        get: () => _.functions,
        configurable: true,
    });

    // GetConstant is now defined outside IIFE
    // Initialize GetConstantDeps with _.CONSTANTS reference (use getter for lazy access)
    Object.defineProperty(GetConstantDeps, 'CONSTANTS', {
        get: () => _.CONSTANTS,
        configurable: true,
    });

    // GetVar is now defined outside IIFE
    // Initialize GetVarDeps with VARS reference (use getter since VARS can be reassigned)
    Object.defineProperty(GetVarDeps, 'VARS', {
        get: () => VARS,
        configurable: true,
    });

    // ChainDeps initialization - use getters for VARS since it can be reassigned
    Object.defineProperty(ChainDeps, 'VARS', {
        get: () => VARS,
        configurable: true,
    });
    ChainDeps._clearFunctions = _clearFunctions;
    ChainDeps._initConstants = () => _.initConstants();

    // ConvertToLaTeX is now defined outside IIFE
    // Initialize ConvertToLaTeXDeps with _ and C references
    ConvertToLaTeXDeps._ = _;
    ConvertToLaTeXDeps.C = C;

    /* "STATIC" */
    // converts a number to a fraction.
    Fraction = {
        /**
         * Converts a decimal to a fraction
         *
         * @param {number} value
         * @param {object} _opts
         * @returns {Array} - An array containing the denominator and the numerator
         */
        convert(value, _opts) {
            let frac;
            if (value === 0) {
                frac = [0, 1];
            } else if (Math.abs(value) < 1e-6 || Math.abs(value) > 1e20) {
                const qc = this.quickConversion(Number(value));
                if (qc[1] <= 1e16) {
                    const abs = Math.abs(value);
                    const sign = value / abs;
                    frac = this.fullConversion(abs.toFixed(`${qc[1]}`.length - 1));
                    frac[0] *= sign;
                } else {
                    frac = qc;
                }
            } else {
                frac = this.fullConversion(value);
            }
            return frac;
        },
        /**
         * If the fraction is too small or too large this gets called instead of fullConversion method
         *
         * @param {number} value
         * @returns {Array} - An array containing the denominator and the numerator
         */
        quickConversion(value) {
            const stripSign = function (s) {
                // Explicitely convert to a string
                if (typeof s !== 'string') {
                    s = s.toString();
                }

                let sign = '';

                // Remove and store the sign
                const start = s.charAt(0);
                if (start === '-') {
                    s = s.substr(1, s.length);
                    sign = '-';
                } else if (start === '+') {
                    // Just remove the plus sign
                    s = s.substr(1, s.length);
                }

                return {
                    sign,
                    value: s,
                };
            };

            function convert(val) {
                // Explicitely convert to a decimal
                if (Scientific.isScientific(val)) {
                    val = scientificToDecimal(val);
                }

                // Split the value into the sign and the value
                const nparts = stripSign(val);

                // Split it at the decimal. We'll refer to it as the coeffient parts
                const cparts = nparts.value.split('.');

                // Combine the entire number by removing leading zero and adding the decimal part
                // This would be teh same as moving the decimal point to the end
                let num;
                // We're dealing with integers
                if (cparts.length === 1) {
                    num = cparts[0];
                } else {
                    num = cparts[0] + cparts[1];
                }
                const n = cparts[1] ? cparts[1].length : 0;
                // Generate the padding for the zeros
                const den = `1${'0'.repeat(n)}`;

                if (num !== '0') {
                    num = num.replace(/^0+/u, '');
                }
                return [nparts.sign + num, den];
            }

            return convert(value);
        },
        /**
         * Returns a good approximation of a fraction. This method gets called by convert
         * http://mathforum.org/library/drmath/view/61772.html Decimal To Fraction Conversion - A Simpler Version Dr
         * Peterson
         *
         * @param {number} dec
         * @returns {Array} - An array containing the denominator and the numerator
         */
        fullConversion(dec) {
            // This doesn't work for values approaching as small as epsilon
            const epsilon = Math.abs(dec) > 1e10 ? 1e-16 : 1e-30;
            let done = false;
            // You can adjust the epsilon to a larger number if you don't need very high precision
            let n1 = 0;
            let d1 = 1;
            let n2 = 1;
            let d2 = 0;
            let n = 0;
            let q = dec;
            let num;
            let den;
            // Relative epsilon for rounding large q values to nearest integer.
            // This fixes floating-point precision errors in reciprocals (e.g., 1/1e-15 = 999999999999999.9).
            // We use ~45x Number.EPSILON to allow for accumulated rounding errors.
            // This is independent of Settings.PRECISION since we're dealing with IEEE 754 double limits.
            const roundingEpsilon = 1e-14; // ~45 * Number.EPSILON (2.2e-16)
            while (!done) {
                n++;
                // For very large q values, round to nearest integer if within floating-point error
                let a;
                if (Math.abs(q) > 1e10) {
                    const rounded = Math.round(q);
                    const relDiff = Math.abs(q - rounded) / Math.abs(rounded);
                    a = relDiff < roundingEpsilon ? rounded : Math.floor(q);
                } else {
                    a = Math.floor(q);
                }
                num = n1 + a * n2;
                den = d1 + a * d2;
                const e = q - a;
                if (e < epsilon) {
                    done = true;
                }
                q = 1 / e;
                n1 = n2;
                d1 = d2;
                n2 = num;
                d2 = den;
                if (Math.abs(num / den - dec) < epsilon || n > 30) {
                    done = true;
                }
            }
            return [num, den];
        },
    };

    // Complete FracDeps initialization now that Fraction is defined
    FracDeps.Fraction = Fraction;

    // The latex generator
    LaTeX = {
        parser: (function createLaTeXParser() {
            // Create a parser and strip it from everything except the items that you need
            const keep = [
                'classes',
                'setOperator',
                'getOperators',
                'getBrackets',
                'tokenize',
                'toRPN',
                'tree',
                'units',
            ];
            const parser = new Parser();
            for (const x in parser) {
                if (keep.indexOf(x) === -1) {
                    delete parser[x];
                }
            }
            // Declare the operators
            parser.setOperator({
                precedence: 8,
                operator: '\\',
                action: 'slash',
                prefix: true,
                postfix: false,
                leftAssoc: true,
                operation(e) {
                    return e; // Bypass the slash
                },
            });
            parser.setOperator({
                precedence: 8,
                operator: '\\,',
                action: 'slash_comma',
                prefix: true,
                postfix: false,
                leftAssoc: true,
                operation(e) {
                    return e; // Bypass the slash
                },
            });
            // Have braces not map to anything. We want them to be return as-is
            const brackets = parser.getBrackets();
            brackets['{'].maps_to = undefined;
            return parser;
        })(),
        space: '~',
        dot: ' \\cdot ',
        // Grab a list of supported functions but remove the excluded ones found in exclFN

        latex(symbol, option) {
            // It might be an array
            if (symbol.clone) {
                symbol = symbol.clone(); // Leave original as-is
            }
            if (symbol instanceof _.classes.Collection) {
                symbol = symbol.elements;
            }

            if (isArray(symbol)) {
                const LaTeXArray = [];
                for (let i = 0; i < symbol.length; i++) {
                    let sym = symbol[i];
                    // This way I can generate LaTeX on an array of strings.
                    if (!isSymbol(sym)) {
                        sym = _.parse(sym);
                    }
                    LaTeXArray.push(this.latex(sym, option));
                }
                return this.brackets(LaTeXArray.join(', '), 'square');
            }
            if (isMatrix(symbol)) {
                let TeX = '\\begin{pmatrix}\n';
                for (let i = 0; i < symbol.elements.length; i++) {
                    const rowTeX = [];
                    const e = symbol.elements[i];
                    for (let j = 0; j < e.length; j++) {
                        rowTeX.push(this.latex(e[j], option));
                    }
                    TeX += rowTeX.join(' & ');
                    if (i < symbol.elements.length - 1) {
                        TeX += '\\\\\n';
                    }
                }
                TeX += '\\end{pmatrix}';
                return TeX;
            }
            if (isVector(symbol)) {
                let TeX = '\\left[';
                for (let i = 0; i < symbol.elements.length; i++) {
                    TeX += `${this.latex(symbol.elements[i], option)} ${i === symbol.elements.length - 1 ? '' : ',\\,'}`;
                }
                TeX += '\\right]';
                return TeX;
            }
            if (isSet(symbol)) {
                let TeX = '\\{';
                for (let i = 0; i < symbol.elements.length; i++) {
                    TeX += `${this.latex(symbol.elements[i], option)} ${i === symbol.elements.length - 1 ? '' : ',\\,'}`;
                }
                TeX += '\\}';
                return TeX;
            }

            symbol = symbol.clone();

            const decimal = option === 'decimal' || option === 'decimals';
            const { power } = symbol;
            const invert = isNegative(power);
            const negative = symbol.multiplier.lessThan(0);

            if (symbol.group === P && decimal) {
                return String(symbol.multiplier.toDecimal() * symbol.value ** symbol.power.toDecimal());
            }
            symbol.multiplier = symbol.multiplier.abs();

            // If the user wants the result in decimal format then return it as such by placing it at the top part
            let mArray;

            if (decimal) {
                const m = String(symbol.multiplier.toDecimal());
                // If(String(m) === '1' && !decimal) m = '';
                mArray = [m, ''];
            } else {
                mArray = [symbol.multiplier.num, symbol.multiplier.den];
            }
            // Get the value as a two part array
            const vArray = this.value(symbol, invert, option, negative);
            let p;
            // Make it all positive since we know whether to push the power to the numerator or denominator already.
            if (invert) {
                power.negate();
            }
            // The power is simple since it requires no additional formatting. We can get it to a
            // string right away. pass in true to neglect unit powers
            if (decimal) {
                p = isSymbol(power) ? LaTeX.latex(power, option) : String(power.toDecimal());
                if (String(p) === '1') {
                    p = '';
                }
            }
            // Get the latex representation
            else if (isSymbol(power)) {
                p = this.latex(power, option);
            }
            // Get it as a fraction
            else {
                p = this.formatFrac(power, true);
            }
            // Use this array to specify if the power is getting attached to the top or the bottom
            const pArray = ['', ''];
            // Stick it to the top or the bottom. If it's negative then the power gets placed on the bottom
            const index = invert ? 1 : 0;
            pArray[index] = p;

            // Special case group P and decimal
            const retval = (negative ? '-' : '') + this.set(mArray, vArray, pArray, symbol.group === CB);

            return retval.replace(/\+-/giu, '-');
        },
        // Greek mapping
        greek: {
            alpha: '\\alpha',
            beta: '\\beta',
            gamma: '\\gamma',
            delta: '\\delta',
            epsilon: '\\epsilon',
            zeta: '\\zeta',
            eta: '\\eta',
            theta: '\\theta',
            iota: '\\iota',
            kappa: '\\kappa',
            lambda: '\\lambda',
            mu: '\\mu',
            nu: '\\nu',
            xi: '\\xi',
            omnikron: '\\omnikron',
            pi: '\\pi',
            rho: '\\rho',
            sigma: '\\sigma',
            tau: '\\tau',
            upsilon: '\\upsilon',
            phi: '\\phi',
            chi: '\\chi',
            psi: '\\psi',
            omega: '\\omega',
            Gamma: '\\Gamma',
            Delta: '\\Delta',
            Epsilon: '\\Epsilon',
            Theta: '\\Theta',
            Lambda: '\\Lambda',
            Xi: '\\Xi',
            Pi: '\\Pi',
            Sigma: '\\Sigma',
            Phi: '\\Phi',
            Psi: '\\Psi',
            Omega: '\\Omega',
        },
        symbols: {
            arccos: '\\arccos',
            cos: '\\cos',
            csc: '\\csc',
            exp: '\\exp',
            ker: '\\ker',
            limsup: '\\limsup',
            min: '\\min',
            sinh: '\\sinh',
            arcsin: '\\arcsin',
            cosh: '\\cosh',
            deg: '\\deg',
            gcd: '\\gcd',
            lg: '\\lg',
            ln: '\\ln',
            Pr: '\\Pr',
            sqrt: '\\sqrt',
            sup: '\\sup',
            arctan: '\\arctan',
            cot: '\\cot',
            det: '\\det',
            hom: '\\hom',
            lim: '\\lim',
            log: '\\log',
            LN: '\\LN',
            sec: '\\sec',
            tan: '\\tan',
            arg: '\\arg',
            coth: '\\coth',
            dim: '\\dim',
            inf: '\\inf',
            liminf: '\\liminf',
            max: '\\max',
            sin: '\\sin',
            tanh: '\\tanh',
        },
        // Get the raw value of the symbol as an array
        value(symbol, inverted, option, negative) {
            const { group } = symbol;
            const { previousGroup } = symbol;
            const v = ['', ''];
            const index = inverted ? 1 : 0;
            /* If(group === N) // do nothing since we want to return top & bottom blank; */
            if (symbol.isInfinity) {
                v[index] = '\\infty';
            } else if (
                group === S ||
                group === P ||
                previousGroup === S ||
                previousGroup === P ||
                previousGroup === N
            ) {
                let value = this.formatSubscripts(symbol.value);
                if (value.replace) {
                    value = value.replace(/(?<prefix>.+)_$/u, '$1\\_');
                }
                // Split it so we can check for instances of alpha as well as alpha_b
                const tVarray = String(value).split('_');
                const greek = this.greek[tVarray[0]];
                if (greek) {
                    tVarray[0] = greek;
                    value = tVarray.join('_');
                }
                const symbolEntry = this.symbols[tVarray[0]];
                if (symbolEntry) {
                    tVarray[0] = symbolEntry;
                    value = tVarray.join('_');
                }
                v[index] = value;
            } else if (group === FN || previousGroup === FN) {
                const input = [];
                const { fname } = symbol;
                // Collect the arguments
                for (let i = 0; i < symbol.args.length; i++) {
                    const arg = symbol.args[i];
                    let item;
                    if (typeof arg === 'string') {
                        item = arg;
                    } else {
                        item = this.latex(arg, option);
                    }
                    input.push(item);
                }

                if (fname === SQRT) {
                    v[index] = `\\sqrt${this.braces(input.join(','))}`;
                } else if (fname === ABS) {
                    v[index] = this.brackets(input.join(','), 'abs');
                } else if (fname === PARENTHESIS) {
                    v[index] = this.brackets(input.join(','), 'parens');
                } else if (fname === 'limit') {
                    v[index] = ` \\lim\\limits_{${input[1]} \\to ${input[2]}} ${input[0]}`;
                } else if (fname === 'integrate') {
                    v[index] = `\\int${this.braces(input[0])}${this.braces(`d${input[1]}`)}`;
                } else if (fname === 'defint') {
                    v[index] = `\\int\\limits_${this.braces(input[1])}^${this.braces(input[2])} ${input[0]} d${
                        input[3]
                    }`;
                } else if (fname === FACTORIAL || fname === DOUBLEFACTORIAL) {
                    const arg = symbol.args[0];
                    if (arg.power.equals(1) && (arg.isComposite() || arg.isCombination())) {
                        input[0] = this.brackets(input[0]);
                    }
                    v[index] = input[0] + (fname === FACTORIAL ? '!' : '!!');
                } else if (fname === 'floor') {
                    v[index] = `\\left \\lfloor${this.braces(input[0])}\\right \\rfloor`;
                } else if (fname === 'ceil') {
                    v[index] = `\\left \\lceil${this.braces(input[0])}\\right \\rceil`;
                }
                // Capture log(a, b)
                else if (fname === Settings.LOG && input.length > 1) {
                    v[index] =
                        `\\mathrm${this.braces(Settings.LOG)}_${this.braces(input[1])}${this.brackets(input[0])}`;
                }
                // Capture log(a, b)
                else if (fname === Settings.LOG10) {
                    v[index] = `\\mathrm${this.braces(Settings.LOG)}_${this.braces(10)}${this.brackets(input[0])}`;
                } else if (fname === Settings.LOG2) {
                    v[index] = `\\mathrm${this.braces(Settings.LOG)}_${this.braces(2)}${this.brackets(input[0])}`;
                } else if (fname === Settings.LOG1P) {
                    v[index] = `\\ln${this.brackets(`1 + ${input[0]}`)}`;
                } else if (fname === 'sum') {
                    const a = input[0];
                    const b = input[1];
                    const c = input[2];
                    const d = input[3];
                    v[index] = `\\sum\\limits_{${this.braces(b)}=${this.braces(c)}}^${this.braces(d)} ${this.braces(
                        a
                    )}`;
                } else if (fname === 'product') {
                    const a = input[0];
                    const b = input[1];
                    const c = input[2];
                    const d = input[3];
                    v[index] = `\\prod\\limits_{${this.braces(b)}=${this.braces(c)}}^${this.braces(d)} ${this.braces(
                        a
                    )}`;
                } else if (fname === 'nthroot') {
                    v[index] = `\\sqrt[${input[1]}]${this.braces(input[0])}`;
                } else if (fname === 'mod') {
                    v[index] = `${input[0]} \\bmod ${input[1]}`;
                } else if (fname === 'realpart') {
                    v[index] = `\\operatorname{Re}${this.brackets(input[0])}`;
                } else if (fname === 'imagpart') {
                    v[index] = `\\operatorname{Im}${this.brackets(input[0])}`;
                } else {
                    const name = fname === '' ? '' : `\\mathrm${this.braces(fname.replace(/_/gu, '\\_'))}`;
                    if (symbol.isConversion) {
                        v[index] = name + this.brackets(input.join(''), 'parens');
                    } else {
                        v[index] = name + this.brackets(input.join(','), 'parens');
                    }
                }
            } else if (symbol.isComposite()) {
                const collected = symbol.collectSymbols().sort(
                    group === CP || previousGroup === CP
                        ? (x, y) => y.group - x.group
                        : (x, y) => {
                              const px = isSymbol(x.power) ? -1 : x.power;
                              const py = isSymbol(y.power) ? -1 : y.power;
                              return py - px;
                          }
                );
                const symbols = [];
                const l = collected.length;
                for (let i = 0; i < l; i++) {
                    symbols.push(LaTeX.latex(collected[i], option));
                }
                const value = symbols.join('+');

                v[index] =
                    !(symbol.isLinear() && symbol.multiplier.equals(1)) || negative
                        ? this.brackets(value, 'parens')
                        : value;
            } else if (group === CB || previousGroup === EX || previousGroup === CB) {
                if (group === CB) {
                    symbol.distributeExponent();
                }
                // This almost feels a little like cheating but I need to know if I should be wrapping the symbol
                // in brackets or not. We'll do this by checking the value of the numerator and then comparing it
                // to whether the symbol value is "simple" or not.
                const denominator = [];
                const numerator = [];
                // Generate a profile
                const denMap = [];
                const numMap = [];
                let numC = 0;
                let denC = 0;
                const setBrackets = function (container, map, counter) {
                    if (counter > 1 && map.length > 0) {
                        const l = map.length;
                        for (let idx = 0; idx < l; idx++) {
                            const mapIdx = map[idx];
                            const containerItem = container[mapIdx];
                            if (
                                !(
                                    /^\\left\(.+\\right\)\^\{.+\}$/gu.test(containerItem) ||
                                    /^\\left\(.+\\right\)$/gu.test(containerItem)
                                )
                            ) {
                                container[mapIdx] = LaTeX.brackets(containerItem, 'parens');
                            }
                        }
                    }
                    return container;
                };

                // Generate latex for each of them
                symbol.each(x => {
                    const isDenom = isNegative(x.power);
                    let laTex;

                    if (isDenom) {
                        laTex = LaTeX.latex(x.invert(), option);
                        denC++;
                        if (x.isComposite()) {
                            if (!symbol.multiplier.den.equals(1) && Math.abs(x.power) === 1) {
                                laTex = LaTeX.brackets(laTex, 'parens');
                            }
                            denMap.push(denominator.length); // Make a note of where the composite was found
                        }

                        denominator.push(laTex);
                    } else {
                        laTex = LaTeX.latex(x, option);
                        numC++;
                        if (x.isComposite()) {
                            if (!symbol.multiplier.num.equals(1) && Math.abs(x.power) === 1) {
                                laTex = LaTeX.brackets(laTex, 'parens');
                            }
                            numMap.push(numerator.length); // Make a note of where the composite was found
                        }
                        numerator.push(laTex);
                    }
                });

                // Apply brackets
                setBrackets(numerator, numMap, numC);
                v[0] = numerator.join(this.dot); // Collapse the numerator into one string

                setBrackets(denominator, denMap, denC);
                v[1] = denominator.join(this.dot);
            }

            return v;
        },
        set(m, v, p, combinePower) {
            const isBracketed = function (str) {
                return /^\\left\(.+\\right\)$/u.test(str);
            };
            // Format the power if it exists
            p &&= this.formatP(p);
            // Group CB will have to be wrapped since the power applies to both it's numerator and denominator
            let tp;
            if (combinePower) {
                // POSSIBLE BUG: If powers for group CB format wrong, investigate this since I might have overlooked something
                // the assumption is that in every case the denonimator should be empty when dealing with CB. I can't think
                // of a case where this isn't true
                tp = p[0];
                p[0] = ''; // Temporarily make p blank
            }

            // Merge v and p. Not that v MUST be first since the order matters
            v = this.merge(v, p);
            let mn = m[0];
            let md = m[1];
            const vn = v[0];
            const vd = v[1];
            // Filters
            // if the top has a variable but the numerator is one drop it
            if (vn && Number(mn) === 1) {
                mn = '';
            }
            // If denominator is 1 drop it always
            if (Number(md) === 1) {
                md = '';
            }
            // Prepare the top portion but check that it's not already bracketed. If it is then leave out the cdot
            const top = this.join(mn, vn, isBracketed(vn) ? '' : this.dot);

            // Prepare the bottom portion but check that it's not already bracketed. If it is then leave out the cdot
            const bottom = this.join(md, vd, isBracketed(vd) ? '' : this.dot);
            // Format the power if it exists
            // make it a fraction if both top and bottom exists
            if (top && bottom) {
                let frac = this.frac(top, bottom);
                if (combinePower && tp) {
                    frac = this.brackets(frac) + tp;
                }
                return frac;
            }
            // Otherwise only the top exists so return that

            return top;
        },
        merge(a, b) {
            const r = [];
            for (let i = 0; i < 2; i++) {
                r[i] = a[i] + b[i];
            }
            return r;
        },
        // Joins together two strings if both exist
        join(n, d, glue) {
            if (!n && !d) {
                return '';
            }
            if (n && !d) {
                return n;
            }
            if (d && !n) {
                return d;
            }
            return n + glue + d;
        },
        /**
         * Places subscripts in braces for proper formatting
         *
         * @param {string} v
         * @returns {string}
         */
        formatSubscripts(v) {
            // Split it at the underscore
            const arr = v.toString().split('_');

            let name = '';

            // Loop over all entries except the first one
            while (arr.length > 1) {
                // Wrap all in braces except for the last one
                if (arr.length > 0) {
                    name = `_${this.braces(arr.pop() + name)}`;
                }
            }

            return arr[0] + name;
        },
        formatP(pArray) {
            for (let i = 0; i < 2; i++) {
                const p = pArray[i];
                if (p) {
                    pArray[i] = `^${this.braces(p)}`;
                }
            }
            return pArray;
        },
        /**
         * Formats the fractions accordingly.
         *
         * @param {Frac} f
         * @param {boolean} isPow
         */
        formatFrac(f, isPow) {
            const n = f.num.toString();
            const d = f.den.toString();
            // No need to have x^1
            if (isPow && n === '1' && d === '1') {
                return '';
            }
            // No need to have x/1
            if (d === '1') {
                return n;
            }
            return this.frac(n, d);
        },
        frac(n, d) {
            return `\\frac${this.braces(n)}${this.braces(d)}`;
        },
        braces(e) {
            return `{${e}}`;
        },
        brackets(e, typ) {
            typ ||= 'parens';
            const bracketTypes = {
                parens: ['(', ')'],
                square: ['[', ']'],
                brace: ['{', '}'],
                abs: ['|', '|'],
                angle: ['\\langle', '\\rangle'],
            };
            const bracket = bracketTypes[typ];
            return `\\left${bracket[0]}${e}\\right${bracket[1]}`;
        },
        /**
         * Removes extreneous tokens
         *
         * @param {{ type: string; value: string }[] & { type?: string }} tokens
         * @returns {{ type: string; value: string }[] & { type?: string }}
         */
        filterTokens(tokens) {
            /** @type {{ type: string; value: string }[] & { type?: string }} */
            const filtered = /** @type {{ type: string; value: string }[] & { type?: string }} */ ([]);

            // Copy over the type of the scope
            if (isArray(tokens)) {
                filtered.type = tokens.type;
            }

            // The items that need to be disposed
            const d = ['\\', 'left', 'right', 'big', 'Big', 'large', 'Large'];
            for (let i = 0, l = tokens.length; i < l; i++) {
                const token = tokens[i];
                const nextToken = tokens[i + 1];
                if (token.value === '\\' && nextToken.value === '\\') {
                    filtered.push(token);
                } else if (isArray(token)) {
                    filtered.push(LaTeX.filterTokens(token));
                } else if (d.indexOf(token.value) === -1) {
                    filtered.push(token);
                }
            }
            return filtered;
        },
        /*
         * Parses tokens from LaTeX string. Does not do any error checking
         * @param {Tokens[]} rpn
         * @returns {string}
         */
        parse(rawTokens) {
            let i;
            let l;
            let retval = '';
            const tokens = this.filterTokens(rawTokens);
            const replace = {
                cdot: '',
                times: '',
                infty: 'Infinity',
            };
            // Get the next token
            const next = function (n) {
                return tokens[typeof n === 'undefined' ? ++i : (i += n)];
            };
            const parseNext = function () {
                return LaTeX.parse(next());
            };
            const get = function (token) {
                if (token in replace) {
                    return replace[token];
                }
                // A quirk with implicit multiplication forces us to check for *
                if (token === '*' && tokens[i + 1].value === '&') {
                    next(2); // Skip this and the &
                    return ',';
                }

                if (token === '&') {
                    next();
                    return ','; // Skip the *
                }
                // If it's the end of a row, return the row separator
                if (token === '\\') {
                    return '],[';
                }
                return token;
            };

            // Start parsing the tokens
            for (i = 0, l = tokens.length; i < l; i++) {
                const token = tokens[i];
                // Fractions
                if (token.value === 'frac') {
                    // Parse and wrap it in brackets
                    const n = parseNext();
                    const d = parseNext();
                    retval += `${n}/${d}`;
                } else if (token.value in LaTeX.symbols) {
                    if (
                        token.value === SQRT &&
                        tokens[i + 1].type === 'vector' &&
                        tokens[i + 2].type === 'NerdamerSet'
                    ) {
                        const base = parseNext();
                        const expr = parseNext();
                        retval += `${expr}^${inBrackets(`1/${base}`)}`;
                    } else {
                        retval += token.value + parseNext();
                    }
                } else if (token.value === 'int') {
                    const f = parseNext();
                    // Skip the comma
                    i++;
                    // Get the variable of integration
                    let dx = next().value;
                    dx = get(dx.substring(1, dx.length));
                    retval += `integrate${inBrackets(`${f},${dx}`)}`;
                } else if (token.value === 'int_') {
                    const lower = parseNext(); // Lower
                    i++; // Skip the ^
                    let u = next().value; // Upper
                    // if it is in brackets
                    if (u === undefined) {
                        i--;
                        u = parseNext();
                    }
                    const f = parseNext(); // Function

                    // get the variable of integration
                    let dx = next().value;
                    // Skip the comma
                    if (dx === ',') {
                        dx = next().value;
                    }
                    // If 'd', skip
                    if (dx === 'differentialD') {
                        // Skip the *
                        i++;
                        dx = next().value;
                    }
                    if (dx === 'mathrm') {
                        // Skip the mathrm{d}
                        i++;
                        dx = next().value;
                    }
                    retval += `defint${inBrackets(`${f},${lower},${u},${dx}`)}`;
                } else if (token.value && token.value.startsWith('int_')) {
                    // Var l = parseNext(); // lower
                    const intLower = token.value.replace('int_', '');
                    i++; // Skip the ^
                    let u = next().value; // Upper
                    // if it is in brackets
                    if (u === undefined) {
                        i--;
                        u = parseNext();
                    }
                    const f = parseNext(); // Function

                    // get the variable of integration
                    let dx = next().value;
                    // Skip the comma
                    if (dx === ',') {
                        dx = next().value;
                    }
                    // If 'd', skip
                    if (dx === 'differentialD') {
                        // Skip the *
                        i++;
                        dx = next().value;
                    }
                    if (dx === 'mathrm') {
                        // Skip the mathrm{d}
                        i++;
                        dx = next().value;
                    }
                    retval += `defint${inBrackets(`${f},${intLower},${u},${dx}`)}`;
                } else if (token.value === 'mathrm') {
                    const f = tokens[++i][0].value;
                    retval += f + parseNext();
                }
                // Sum and product
                else if (token.value === 'sum_' || token.value === 'prod_') {
                    const fn = token.value === 'sum_' ? 'sum' : 'product';
                    const nxt = next();
                    i++; // Skip the caret
                    const end = parseNext();
                    const f = parseNext();
                    retval += fn + inBrackets([f, get(nxt[0]), get(nxt[2]), get(end)].join(','));
                } else if (token.value === 'lim_') {
                    const nxt = next();
                    retval += `limit${inBrackets([parseNext(), get(nxt[0]), get(nxt[2])].join(','))}`;
                } else if (token.value === 'begin') {
                    const nxt = next();
                    if (Array.isArray(nxt)) {
                        const v = nxt[0].value;
                        if (v === 'matrix') {
                            // Start a matrix
                            retval += 'matrix([';
                        }
                    }
                } else if (token.value === 'end') {
                    const nxt = next();
                    if (Array.isArray(nxt)) {
                        const v = nxt[0].value;
                        if (v === 'matrix') {
                            // End a matrix
                            retval += '])';
                        }
                    }
                } else if (Array.isArray(token)) {
                    retval += get(LaTeX.parse(token));
                } else {
                    retval += get(token.value.toString());
                }
            }

            return inBrackets(retval);
        },
    };

    // Initialize ExpressionsDeps with references
    // Use getters for EXPRESSIONS and USER_FUNCTIONS since they can be reassigned
    Object.defineProperty(ExpressionsDeps, 'EXPRESSIONS', {
        get: () => EXPRESSIONS,
        configurable: true,
    });
    Object.defineProperty(ExpressionsDeps, 'USER_FUNCTIONS', {
        get: () => USER_FUNCTIONS,
        configurable: true,
    });
    ExpressionsDeps.LaTeX = LaTeX;
    ExpressionsDeps.text = text;
    ExpressionsDeps.functions = _.functions;
    ExpressionsDeps._ = _;
    // Note: ExpressionsDeps.Math2 and ExpressionsDeps.Expression are initialized later after C is defined

    // Vector =======================================================================
    /**
     * @class
     * @param {any} [v]
     * @param {...any} rest
     */
    function Vector(v, ...rest) {
        this.multiplier = new Frac(1);
        if (isVector(v)) {
            this.elements = /** @type {any[]} */ (v.elements)?.slice(0) ?? [];
        } else if (isArray(v)) {
            this.elements = v.slice(0);
        } else if (isMatrix(v)) {
            if (v.elements.length === 1) {
                this.elements = [...v.elements[0]];
                this.rowVector = true;
            } else if (v.elements.length > 1 && Array.isArray(v.elements[0]) && v.elements[0].length === 1) {
                this.elements = v.elements.map(row => row[0]);
                this.rowVector = false;
            }
        } else if (typeof v === 'undefined') {
            this.elements = [];
        } else {
            this.elements = [v, ...rest];
        }
    }
    /*
     * Generates a pre-filled array
     * @param {*} n
     * @param {*} val
     * @returns {*}
     */
    Vector.arrayPrefill = function arrayPrefill(n, val) {
        const a = [];
        val ||= 0;
        for (let i = 0; i < n; i++) {
            a[i] = val;
        }
        return a;
    };
    /**
     * Generate a vector from and array
     *
     * @param {any} a
     * @returns {any}
     */
    Vector.fromArray = function fromArray(a) {
        const v = new Vector();
        v.elements = a;
        return v;
    };

    /**
     * Convert a NerdamerSet to a Vector
     *
     * @param {SetType} nerdamerSet
     * @returns {Vector}
     */
    Vector.fromSet = function fromSet(nerdamerSet) {
        return Vector.fromArray(nerdamerSet.elements);
    };

    // Ported from Sylvester.js
    Vector.prototype = {
        custom: true,
        // Returns element i of the vector
        e(i) {
            return i < 1 || i > this.elements.length ? null : this.elements[i - 1];
        },

        set(i, val) {
            if (!isSymbol(val)) {
                val = new NerdamerSymbol(val);
            }
            this.elements[i] = val;
        },

        // Returns the number of elements the vector has
        dimensions() {
            return this.elements.length;
        },

        // Returns the modulus ('length') of the vector
        modulus() {
            return block('SAFE', () => _.pow(this.dot(this.clone()), new NerdamerSymbol(0.5)), undefined, this);
        },

        // Returns true iff the vector is equal to the argument
        eql(vector) {
            let n = this.elements.length;
            const V = vector.elements || vector;
            if (n !== V.length) {
                return false;
            }
            do {
                if (Math.abs(_.subtract(this.elements[n - 1], V[n - 1]).valueOf()) > Settings.PRECISION) {
                    return false;
                }
            } while (--n);
            return true;
        },

        // Returns a clone of the vector
        clone() {
            const V = new Vector();
            const l = this.elements.length;
            for (let i = 0; i < l; i++) {
                // Rule: all items within the vector must have a clone method.
                V.elements.push(this.elements[i].clone());
            }
            V.rowVector = this.rowVector;
            return V;
        },

        expand(options) {
            this.elements = this.elements.map(e => _.expand(e, options));
            return this;
        },

        // Maps the vector to another vector according to the given function
        map(fn) {
            const elements = [];
            this.each((x, i) => {
                elements.push(fn(x, i));
            });

            return new Vector(elements);
        },

        // Calls the iterator for each element of the vector in turn
        each(fn) {
            let n = this.elements.length;
            const k = n;
            let i;
            do {
                i = k - n;
                fn(this.elements[i], i + 1);
            } while (--n);
        },

        // Returns a new vector created by normalizing the receiver
        toUnitVector() {
            return block(
                'SAFE',
                () => {
                    const r = this.modulus();
                    if (r.valueOf() === 0) {
                        return this.clone();
                    }
                    return this.map(x => _.divide(x, r));
                },
                undefined,
                this
            );
        },

        // Returns the angle between the vector and the argument (also a vector)
        angleFrom(vector) {
            return block(
                'SAFE',
                () => {
                    const V = vector.elements || vector;
                    const n = this.elements.length;
                    if (n !== V.length) {
                        return null;
                    }
                    let dot = new NerdamerSymbol(0);
                    let mod1 = new NerdamerSymbol(0);
                    let mod2 = new NerdamerSymbol(0);
                    // Work things out in parallel to save time
                    this.each((x, i) => {
                        dot = _.add(dot, _.multiply(x, V[i - 1]));
                        mod1 = _.add(mod1, _.multiply(x, x)); // Will not conflict in safe block
                        mod2 = _.add(mod2, _.multiply(V[i - 1], V[i - 1])); // Will not conflict in safe block
                    });
                    mod1 = _.pow(mod1, new NerdamerSymbol(0.5));
                    mod2 = _.pow(mod2, new NerdamerSymbol(0.5));
                    const product = _.multiply(mod1, mod2);
                    if (product.valueOf() === 0) {
                        return null;
                    }
                    /** @type {NerdamerSymbol | number} */
                    let theta = _.divide(dot, product);
                    const thetaVal = /** @type {number} */ (theta.valueOf());
                    if (thetaVal < -1) {
                        theta = -1;
                    }
                    if (thetaVal > 1) {
                        theta = 1;
                    }
                    return new NerdamerSymbol(Math.acos(/** @type {number} */ (theta)));
                },
                undefined,
                this
            );
        },

        // Returns true iff the vector is parallel to the argument
        isParallelTo(vector) {
            const angle = this.angleFrom(vector).valueOf();
            return angle === null ? null : angle <= Settings.PRECISION;
        },

        // Returns true iff the vector is antiparallel to the argument
        isAntiparallelTo(vector) {
            const angle = this.angleFrom(vector).valueOf();
            return angle === null ? null : Math.abs(angle - Math.PI) <= Settings.PRECISION;
        },

        // Returns true iff the vector is perpendicular to the argument
        isPerpendicularTo(vector) {
            const dot = this.dot(vector);
            return dot === null ? null : Math.abs(dot) <= Settings.PRECISION;
        },

        // Returns the result of adding the argument to the vector
        add(vector) {
            return block(
                'SAFE',
                () => {
                    const V = vector.elements || vector;
                    if (this.elements.length !== V.length) {
                        return null;
                    }
                    return this.map((x, i) => _.add(x, V[i - 1]));
                },
                undefined,
                this
            );
        },

        // Returns the result of subtracting the argument from the vector
        subtract(vector) {
            return block(
                'SAFE',
                () => {
                    const V = vector.elements || vector;
                    if (this.elements.length !== V.length) {
                        return null;
                    }
                    return this.map((x, i) => _.subtract(x, V[i - 1]));
                },
                undefined,
                this
            );
        },

        // Returns the result of multiplying the elements of the vector by the argument
        multiply(k) {
            return this.map(x => x.clone() * k.clone());
        },

        x(k) {
            return this.multiply(k);
        },

        // Returns the scalar product of the vector with the argument
        // Both vectors must have equal dimensionality
        dot(vector) {
            return block(
                'SAFE',
                () => {
                    const V = vector.elements || vector;
                    let product = new NerdamerSymbol(0);
                    let n = this.elements.length;
                    if (n !== V.length) {
                        return null;
                    }
                    do {
                        product = _.add(product, _.multiply(this.elements[n - 1], V[n - 1]));
                    } while (--n);
                    return product;
                },
                undefined,
                this
            );
        },

        // Returns the vector product of the vector with the argument
        // Both vectors must have dimensionality 3
        cross(vector) {
            const B = vector.elements || vector;
            if (this.elements.length !== 3 || B.length !== 3) {
                return null;
            }
            const rowVector = this.rowVector && vector.rowVector;
            const A = this.elements;
            return block(
                'SAFE',
                () => {
                    const result = new Vector([
                        _.subtract(_.multiply(A[1], B[2]), _.multiply(A[2], B[1])),
                        _.subtract(_.multiply(A[2], B[0]), _.multiply(A[0], B[2])),
                        _.subtract(_.multiply(A[0], B[1]), _.multiply(A[1], B[0])),
                    ]);
                    result.rowVector = rowVector;
                    return result;
                },
                undefined,
                this
            );
        },

        toUnitMultiplier() {
            return this;
        },

        // Returns the (absolute) largest element of the vector
        max() {
            let m = 0;
            let n = this.elements.length;
            const k = n;
            let i;
            do {
                i = k - n;
                if (Math.abs(this.elements[i].valueOf()) > Math.abs(m.valueOf())) {
                    m = this.elements[i];
                }
            } while (--n);
            return m;
        },
        magnitude() {
            let magnitude = new NerdamerSymbol(0);
            this.each(e => {
                magnitude = _.add(magnitude, _.pow(e, new NerdamerSymbol(2)));
            });
            return _.sqrt(magnitude);
        },
        // Returns the index of the first match found
        indexOf(x) {
            let index = null;
            let n = this.elements.length;
            const k = n;
            let i;
            do {
                i = k - n;
                if (index === null && this.elements[i].valueOf() === x.valueOf()) {
                    index = i + 1;
                }
            } while (--n);
            return index;
        },
        text_(x, options) {
            const result = text(this, options);
            return (this.rowVector ? '[' : '') + result + (this.rowVector ? ']' : '');
        },
        text(x, options) {
            const result = text(this, options);
            return (this.rowVector ? '[' : '') + result + (this.rowVector ? ']' : '');
        },
        toString() {
            return this.text();
        },
        latex(option) {
            const tex = [];
            for (let i = 0; i < this.elements.length; i++) {
                tex.push(LaTeX.latex(this.elements[i], option));
            }
            return `[${tex.join(', ')}]`;
        },
    };

    // Matrix =======================================================================
    /**
     * @class
     * @param {...any} args
     */
    function Matrix(...args) {
        this.multiplier = new Frac(1);
        const m = args;
        const l = m.length;
        let i;
        const el = [];
        if (isMatrix(m)) {
            // If it's a matrix then make a clone
            for (i = 0; i < l; i++) {
                el.push(m[i].slice(0));
            }
        } else {
            let row;
            let lw;
            let rl;
            for (i = 0; i < l; i++) {
                row = m[i];
                if (isVector(row)) {
                    row = row.elements;
                }
                if (!isArray(row)) {
                    row = [row];
                }
                rl = row.length;
                if (lw && lw !== rl) {
                    err('Unable to create Matrix. Row dimensions do not match!');
                }
                el.push(row);
                lw = rl;
            }
        }
        this.elements = el;
    }
    Matrix.identity = function identity(n) {
        const m = new Matrix();
        for (let i = 0; i < n; i++) {
            m.elements.push([]);
            for (let j = 0; j < n; j++) {
                m.set(i, j, i === j ? new NerdamerSymbol(1) : new NerdamerSymbol(0));
            }
        }
        return m;
    };
    Matrix.fromArray = function fromArray(arr) {
        /** @class */
        function F(args) {
            return Matrix.apply(this, args);
        }
        F.prototype = Matrix.prototype;

        return new F(arr);
    };
    Matrix.zeroMatrix = function zeroMatrix(rows, cols) {
        const m = new Matrix();
        for (let i = 0; i < rows; i++) {
            m.elements.push(Vector.arrayPrefill(cols, new NerdamerSymbol(0)));
        }
        return m;
    };
    Matrix.prototype = {
        // Needs be true to let the parser know not to try to cast it to a symbol
        custom: true,
        get(row, column) {
            if (!this.elements[row]) {
                return undefined;
            }
            return this.elements[row][column];
        },
        map(f, rawValues) {
            const M = new Matrix();
            this.each((e, i, j) => {
                M.set(i, j, f.call(M, e), rawValues);
            });
            return M;
        },
        set(row, column, value, raw) {
            this.elements[row] ||= [];
            if (raw || isSymbol(value)) {
                this.elements[row][column] = value;
            } else {
                this.elements[row][column] = new NerdamerSymbol(value);
            }
        },
        cols() {
            return this.elements[0].length;
        },
        rows() {
            return this.elements.length;
        },
        row(n) {
            if (!n || n > this.cols()) {
                return [];
            }
            return this.elements[n - 1];
        },
        col(n) {
            const nr = this.rows();
            const col = [];
            if (n > this.cols() || !n) {
                return col;
            }
            for (let i = 0; i < nr; i++) {
                col.push(this.elements[i][n - 1]);
            }
            return col;
        },
        eachElement(fn) {
            const nr = this.rows();
            const nc = this.cols();
            let i;
            let j;
            for (i = 0; i < nr; i++) {
                for (j = 0; j < nc; j++) {
                    fn.call(this, this.elements[i][j], i, j);
                }
            }
        },
        // Ported from Sylvester.js
        determinant() {
            if (!this.isSquare()) {
                return null;
            }
            const M = this.toRightTriangular();
            let det = M.elements[0][0];
            let n = M.elements.length - 1;
            const k = n;
            let i;
            do {
                i = k - n + 1;
                det = _.multiply(det, M.elements[i][i]);
            } while (--n);
            return det;
        },
        isSquare() {
            return this.elements.length === this.elements[0].length;
        },
        isSingular() {
            return this.isSquare() && this.determinant() === 0;
        },
        augment(m) {
            const r = this.rows();
            const rr = m.rows();
            if (r !== rr) {
                err("Cannot augment matrix. Rows don't match.");
            }
            for (let i = 0; i < r; i++) {
                this.elements[i] = this.elements[i].concat(m.elements[i]);
            }

            return this;
        },
        clone() {
            const r = this.rows();
            const c = this.cols();
            const m = new Matrix();
            for (let i = 0; i < r; i++) {
                m.elements[i] = [];
                for (let j = 0; j < c; j++) {
                    const symbol = this.elements[i][j];
                    m.elements[i][j] = isSymbol(symbol) ? symbol.clone() : symbol;
                }
            }
            return m;
        },
        toUnitMultiplier() {
            return this;
        },
        expand(options) {
            this.eachElement(e => _.expand(e, options));
            return this;
        },
        evaluate(options) {
            this.eachElement(e => _.evaluate(e, options));
            return this;
        },

        // Ported from Sylvester.js
        invert() {
            if (!this.isSquare()) {
                err('Matrix is not square!');
            }
            return block(
                'SAFE',
                () => {
                    let ni = this.elements.length;
                    const ki = ni;
                    let i;
                    let j;
                    const imatrix = Matrix.identity(ni);
                    const M = this.augment(imatrix).toRightTriangular();
                    let np;
                    const kp = M.elements[0].length;
                    let p;
                    let els;
                    let divisor;
                    const inverseElements = [];
                    let newElement;
                    // Matrix is non-singular so there will be no zeros on the diagonal
                    // Cycle through rows from last to first
                    do {
                        i = ni - 1;
                        // First, normalise diagonal elements to 1
                        els = [];
                        np = kp;
                        inverseElements[i] = [];
                        divisor = M.elements[i][i];
                        do {
                            p = kp - np;
                            newElement = _.divide(M.elements[i][p], divisor.clone());
                            els.push(newElement);
                            // Shuffle of the current row of the right hand side into the results
                            // array as it will not be modified by later runs through this loop
                            if (p >= ki) {
                                inverseElements[i].push(newElement);
                            }
                        } while (--np);
                        M.elements[i] = els;
                        // Then, subtract this row from those above it to
                        // give the identity matrix on the left hand side
                        for (j = 0; j < i; j++) {
                            els = [];
                            np = kp;
                            do {
                                p = kp - np;
                                els.push(
                                    _.subtract(
                                        M.elements[j][p].clone(),
                                        _.multiply(M.elements[i][p].clone(), M.elements[j][i].clone())
                                    )
                                );
                            } while (--np);
                            M.elements[j] = els;
                        }
                    } while (--ni);
                    return Matrix.fromArray(inverseElements);
                },
                undefined,
                this
            );
        },
        // Ported from Sylvester.js
        toRightTriangular() {
            return block(
                'SAFE',
                () => {
                    const M = this.clone();
                    let els;
                    let fel;
                    let nel;
                    let n = this.elements.length;
                    const k = n;
                    let i;
                    let np;
                    const kp = this.elements[0].length;
                    let p;
                    do {
                        i = k - n;
                        fel = M.elements[i][i];
                        if (fel.valueOf() === 0) {
                            for (let j = i + 1; j < k; j++) {
                                nel = M.elements[j][i];
                                if (nel && nel.valueOf() !== 0) {
                                    els = [];
                                    np = kp;
                                    do {
                                        p = kp - np;
                                        els.push(_.add(M.elements[i][p].clone(), M.elements[j][p].clone()));
                                    } while (--np);
                                    M.elements[i] = els;
                                    break;
                                }
                            }
                        }
                        fel = M.elements[i][i];
                        if (fel.valueOf() !== 0) {
                            for (let j = i + 1; j < k; j++) {
                                const multiplier = _.divide(M.elements[j][i].clone(), M.elements[i][i].clone());
                                els = [];
                                np = kp;
                                do {
                                    p = kp - np;
                                    // Elements with column numbers up to an including the number
                                    // of the row that we're subtracting can safely be set straight to
                                    // zero, since that's the point of this routine and it avoids having
                                    // to loop over and correct rounding errors later
                                    els.push(
                                        p <= i
                                            ? new NerdamerSymbol(0)
                                            : _.subtract(
                                                  M.elements[j][p].clone(),
                                                  _.multiply(M.elements[i][p].clone(), multiplier.clone())
                                              )
                                    );
                                } while (--np);
                                M.elements[j] = els;
                            }
                        }
                    } while (--n);

                    return M;
                },
                undefined,
                this
            );
        },
        transpose() {
            const rows = this.elements.length;
            const cols = this.elements[0].length;
            const M = new Matrix();
            let ni = cols;
            let i;
            let nj;
            let j;

            do {
                i = cols - ni;
                M.elements[i] = [];
                nj = rows;
                do {
                    j = rows - nj;
                    M.elements[i][j] = this.elements[j][i].clone();
                } while (--nj);
            } while (--ni);
            return M;
        },
        // Returns true if the matrix can multiply the argument from the left
        canMultiplyFromLeft(matrix) {
            const l = isMatrix(matrix) ? matrix.elements.length : matrix.length;
            // This.columns should equal matrix.rows
            return this.elements[0].length === l;
        },
        sameSize(matrix) {
            return this.rows() === matrix.rows() && this.cols() === matrix.cols();
        },
        multiply(matrix) {
            return block(
                'SAFE',
                () => {
                    const M = matrix.elements || matrix;
                    if (!this.canMultiplyFromLeft(M)) {
                        if (this.sameSize(matrix)) {
                            const MM = new Matrix();
                            const rows = this.rows();
                            for (let i = 0; i < rows; i++) {
                                const e = _.multiply(new Vector(this.elements[i]), new Vector(matrix.elements[i]));
                                MM.elements[i] = e.elements;
                            }
                            return MM;
                        }
                        return null;
                    }
                    let ni = this.elements.length;
                    const ki = ni;
                    let i;
                    let nj;
                    const kj = M[0].length;
                    let j;
                    const cols = this.elements[0].length;
                    const elements = [];
                    let sum;
                    let nc;
                    let c;
                    do {
                        i = ki - ni;
                        elements[i] = [];
                        nj = kj;
                        do {
                            j = kj - nj;
                            sum = new NerdamerSymbol(0);
                            nc = cols;
                            do {
                                c = cols - nc;
                                sum = _.add(sum, _.multiply(this.elements[i][c], M[c][j]));
                            } while (--nc);
                            elements[i][j] = sum;
                        } while (--nj);
                    } while (--ni);
                    return Matrix.fromArray(elements);
                },
                undefined,
                this
            );
        },
        add(matrix, callback) {
            const M = new Matrix();
            if (this.sameSize(matrix)) {
                this.eachElement((e, i, j) => {
                    let result = _.add(e.clone(), matrix.elements[i][j].clone());
                    if (callback) {
                        result = callback.call(M, result, e, matrix.elements[i][j]);
                    }
                    M.set(i, j, result);
                });
            }
            return M;
        },
        subtract(matrix, callback) {
            const M = new Matrix();
            if (this.sameSize(matrix)) {
                this.eachElement((e, i, j) => {
                    let result = _.subtract(e.clone(), matrix.elements[i][j].clone());
                    if (callback) {
                        result = callback.call(M, result, e, matrix.elements[i][j]);
                    }
                    M.set(i, j, result);
                });
            }
            return M;
        },
        negate() {
            this.each(e => e.negate());
            return this;
        },
        toVector() {
            if (this.rows() === 1 || this.cols() === 1) {
                const v = new Vector();
                v.elements = this.elements;
                return v;
            }
            return this;
        },
        toString(newline, toDecimal) {
            const l = this.rows();
            const s = [];
            newline = newline === undefined ? '\n' : newline;
            for (let i = 0; i < l; i++) {
                s.push(
                    `[${this.elements[i]
                        .map(x => {
                            const v = toDecimal ? x.multiplier.toDecimal() : x.toString();
                            return x === undefined ? '' : v;
                        })
                        .join(',')}]`
                );
            }
            return `matrix${inBrackets(s.join(','))}`;
        },
        text() {
            return `matrix(${this.elements.map(row => `[${row.toString('')}]`)})`;
        },
        latex(option) {
            const cols = this.cols();
            const { elements } = this;
            return format('\\begin{vmatrix}{0}\\end{vmatrix}', () => {
                const tex = [];
                for (const row in elements) {
                    if (!Object.hasOwn(elements, row)) {
                        continue;
                    }
                    const rowTex = [];
                    for (let i = 0; i < cols; i++) {
                        rowTex.push(LaTeX.latex(elements[row][i], option));
                    }
                    tex.push(rowTex.join(' & '));
                }
                return tex.join(' \\cr ');
            });
        },
    };
    // Aliases
    Matrix.prototype.each = Matrix.prototype.eachElement;

    // NerdamerSet class is now defined outside the IIFE (see above).
    // Initialize its dependencies now that they're available.
    SetDeps.isVector = isVector;
    SetDeps.Vector = Vector;
    SetDeps.remove = remove;

    // Collection class is now defined outside the IIFE (see above).
    // Initialize its dependencies now that they're available.
    CollectionDeps._ = _;
    CollectionDeps.block = block;

    // Build ========================================================================
    Build = {
        dependencies: {
            _rename: {
                'Math2.factorial': 'factorial',
            },
            factorial: {
                'Math2.gamma': Math2.gamma,
            },
            gamma_incomplete: {
                'Math2.factorial': Math2.factorial,
            },
            Li: {
                'Math2.Ei': Math2.Ei,
                'Math2.bigLog': Math2.bigLog,
                Frac,
            },
            Ci: {
                'Math2.factorial': Math2.factorial,
            },
            Ei: {
                'Math2.factorial': Math2.factorial,
            },
            Si: {
                'Math2.factorial': Math2.factorial,
            },
            Shi: {
                'Math2.factorial': Math2.factorial,
            },
            Chi: {
                isInt,
                nround,
                'Math2.num_integrate': Math2.num_integrate,
            },
            factor: {
                'Math2.ifactor': Math2.ifactor,
                NerdamerSymbol,
            },
            num_integrate: {
                'Math2.simpson': Math2.simpson,
                nround,
            },
            fib: {
                even,
            },
        },
        /* Some functions need to be made numeric safe. Build checks if there's a
         * reformat option and calls that instead when compiling the function string.
         */
        reformat: {
            // This simply extends the build function
            diff(symbol, deps) {
                const v = symbol.args[1].toString();
                const f = `let f = ${Build.build(symbol.args[0].toString(), [v])};`;
                let diffStr = Math2.diff.toString();
                // Handle ES6 method shorthand
                if (!diffStr.startsWith('function') && !diffStr.startsWith('(') && !diffStr.startsWith('async')) {
                    diffStr = `function ${diffStr}`;
                }
                deps[1] += `let diff = ${diffStr};`;
                deps[1] += f;

                return [`diff(f)(${v})`, deps];
            },
        },
        getProperName(f) {
            const map = {
                continuedFraction: 'continuedFraction',
            };
            return map[f] || f;
        },
        // Assumes that dependences are at max 2 levels
        compileDependencies(f, deps) {
            // Grab the predefined dependiences
            const dependencies = Build.dependencies[f];

            // The dependency string
            let depString = deps && deps[1] ? deps[1] : '';

            // The functions to be replaced
            const replacements = deps && deps[0] ? deps[0] : {};

            // Loop through them and add them to the list
            for (const x in dependencies) {
                if (typeof dependencies[x] === 'object') {
                    continue;
                } // Skip object
                const components = x.split('.'); // Math.f becomes f
                // if the function isn't part of an object then reference the function itself
                let depValue = dependencies[x];
                // If it's a function, convert method shorthand to function expression
                if (typeof depValue === 'function') {
                    let fnStr = depValue.toString();
                    // Handle ES6 method shorthand like "gamma(z) { ... }" -> "function gamma(z) { ... }"
                    if (!fnStr.startsWith('function') && !fnStr.startsWith('(') && !fnStr.startsWith('async')) {
                        fnStr = `function ${fnStr}`;
                    }
                    depValue = fnStr;
                }
                depString += `let ${components.length > 1 ? components[1] : components[0]}=${depValue};`;
                replacements[x] = components.pop();
            }

            return [replacements, depString];
        },
        getArgsDeps(symbol, dependencies) {
            const { args } = symbol;
            let deps = dependencies;
            const processFn = function (x) {
                if (x.group === FN) {
                    deps = Build.compileDependencies(x.fname, deps);
                }
            };
            for (let i = 0; i < args.length; i++) {
                symbol.args[i].each(processFn);
            }
            return deps;
        },
        build(symbol, argArray) {
            symbol = block('PARSE2NUMBER', () => _.parse(symbol), true);
            let args = variables(symbol);
            const supplements = [];
            let dependencies = [];
            const ftext = function (sym, xports) {
                // Fix for #545 - Parentheses confuse build.
                if (sym.fname === '') {
                    sym = NerdamerSymbol.unwrapPARENS(sym);
                }
                xports ||= [];
                const c = [];
                const { group } = sym;
                let prefix = '';

                const ftextComplex = function (grp) {
                    const d = grp === CB ? '*' : '+';
                    const cc = [];

                    for (const x in sym.symbols) {
                        if (!Object.hasOwn(sym.symbols, x)) {
                            continue;
                        }
                        const s = sym.symbols[x];
                        let ft = ftext(s, xports)[0];
                        // Wrap it in brackets if it's group PL or CP
                        if (s.isComposite()) {
                            ft = inBrackets(ft);
                        }
                        cc.push(ft);
                    }
                    let retval = cc.join(d);
                    retval = retval && !sym.multiplier.equals(1) ? inBrackets(retval) : retval;
                    return retval;
                };
                const ftextFunction = function (bn) {
                    let retval;
                    if (bn in Math) {
                        retval = `Math.${bn}`;
                    } else {
                        bn = Build.getProperName(bn);
                        if (supplements.indexOf(bn) === -1) {
                            // Make sure you're not adding the function twice
                            // Math2 functions aren't part of the standard javascript
                            // Math library and must be exported.
                            let fnStr = Math2[bn].toString();
                            // Handle ES6 method shorthand like "factorial(x) { ... }" -> "function factorial(x) { ... }"
                            if (!fnStr.startsWith('function') && !fnStr.startsWith('(') && !fnStr.startsWith('async')) {
                                fnStr = `function ${fnStr}`;
                            }
                            xports.push(`let ${bn} = ${fnStr}; `);
                            supplements.push(bn);
                        }
                        retval = bn;
                    }
                    retval += inBrackets(sym.args.map(x => ftext(x, xports)[0]).join(','));

                    return retval;
                };

                // The multiplier
                if (group === N) {
                    c.push(sym.multiplier.toDecimal());
                } else if (sym.multiplier.equals(-1)) {
                    prefix = '-';
                } else if (!sym.multiplier.equals(1)) {
                    c.push(sym.multiplier.toDecimal());
                }
                // The value
                let value;

                if (group === S || group === P) {
                    value = sym.value;
                } else if (group === FN) {
                    dependencies = Build.compileDependencies(sym.fname, dependencies);
                    dependencies = Build.getArgsDeps(sym, dependencies);
                    if (Build.reformat[sym.fname]) {
                        const components = Build.reformat[sym.fname](sym, dependencies);
                        dependencies = components[1];
                        value = components[0];
                    } else {
                        value = ftextFunction(sym.fname);
                    }
                } else if (group === EX) {
                    const pg = sym.previousGroup;
                    if (pg === N || pg === S) {
                        value = sym.value;
                    } else if (pg === FN) {
                        value = ftextFunction(sym.fname);
                        dependencies = Build.compileDependencies(sym.fname, dependencies);
                        dependencies = Build.getArgsDeps(sym, dependencies);
                    } else {
                        value = ftextComplex(sym.previousGroup);
                    }
                } else {
                    value = ftextComplex(sym.group);
                }

                if (sym.group !== N && !sym.power.equals(1)) {
                    const pow = ftext(_.parse(sym.power));
                    xports.push(pow[1]);
                    value = `Math.pow${inBrackets(`${value},${pow[0]}`)}`;
                }

                if (value) {
                    c.push(prefix + value);
                }

                return [c.join('*'), xports.join('').replace(/\n+\s+/gu, ' ')];
            };
            if (argArray) {
                // Fix for issue #546
                // Disable argument checking since it's a bit presumptuous.
                // Consider f(x) = 5; If I explicitely pass in an argument array contain x
                // this check will fail and complain since the function doesn't contain x.
                /*
                 for (let i = 0; i < args.length; i++) {
                 let arg = args[i];
                 if (argArray.indexOf(arg) === -1)
                 err(arg + ' not found in argument array');
                 }
                 */
                args = argArray;
            }

            const fArray = ftext(symbol);

            // Make all the substitutions;
            for (const x in dependencies[0]) {
                if (!Object.hasOwn(dependencies[0], x)) {
                    continue;
                }
                const alias = dependencies[0][x];
                fArray[1] = fArray[1].replace(x, alias);
                dependencies[1] = dependencies[1].replace(x, alias);
            }

            // eslint-disable-next-line no-new-func -- Dynamic function generation is intentional for compiling math expressions
            const f = new Function(...args, `${(dependencies[1] || '') + fArray[1]} return ${fArray[0]};`);

            return f;
        },
    };

    // Finalize =====================================================================
    /* FINALIZE */
    (function finalizeParser() {
        reserveNames(_.CONSTANTS);
        reserveNames(_.functions);
        _.initConstants();
        // Bug fix for error but needs to be revisited
        _.error ||= err;

        // Store the log and log10 functions
        Settings.LOG_FNS = {
            log: _.functions.log,
            log10: _.functions.log10,
        };
    })();

    /* END FINALIZE */

    // Core =========================================================================
    const Utils = {
        allSame,
        allNumeric,
        arguments2Array,
        armTimeout,
        arrayAddSlices,
        arrayClone,
        arrayMax,
        arrayMin,
        arrayEqual,
        arrayUnique,
        arrayGetVariables,
        arraySum,
        block,
        build: Build.build,
        checkTimeout,
        clearU,
        comboSort,
        compare,
        convertToVector,
        customError,
        customType,
        decompose_fn: decomposeFn,
        disarmTimeout,
        each,
        evaluate,
        even,
        evenFraction,
        fillHoles,
        firstObject,
        format,
        generatePrimes,
        getCoeffs,
        getU,
        importFunctions,
        inBrackets,
        isArray,
        isExpression,
        isFraction,
        isInt,
        isMatrix,
        isNegative,
        isNumericSymbol,
        isPrime,
        isReserved,
        isSymbol,
        isVariableSymbol,
        isVector,
        isCollection,
        keys,
        knownVariable,
        nroots,
        remove,
        reserveNames,
        range,
        round: nround,
        sameSign,
        scientificToDecimal,
        separate,
        stringReplace,
        text,
        validateName,
        variables,
        warn,
    };

    // This contains all the parts of nerdamer and enables nerdamer's internal functions
    // to be used.
    C = {
        groups: Groups,
        NerdamerSymbol,
        Expression,
        Collection,
        Frac,
        Vector,
        Matrix,
        Parser,
        Scientific,
        Fraction,
        Math2,
        LaTeX,
        Utils,
        PARSER: _,
        PARENTHESIS,
        Settings,
        err,
        bigInt,
        bigDec,
        exceptions,
    };

    // Complete ExpressionsDeps initialization (Math2 and Expression are part of C which is now defined)
    ExpressionsDeps.Math2 = C.Math2;
    ExpressionsDeps.Expression = Expression;

    // LibExports ===================================================================
    /**
     * @param {string} expression The expression to be evaluated
     * @param {object} subs The object containing the variable values
     * @param {string | string[]} option Additional options
     * @param {number} location A specific location in the equation list to insert the evaluated expression
     * @returns {any}
     */
    const libExports = function (expression, subs, option, location) {
        armTimeout();
        try {
            // Initiate the numer flag
            let numer = false;

            // Is the user declaring a function? Try to add user function
            if (_setFunction(expression)) {
                return nerdamer;
            }

            // Var variable, fn, args;
            // Convert any expression passed in to a string
            if (
                expression !== null &&
                typeof expression === 'object' &&
                /** @type {any} */ (expression) instanceof Expression
            ) {
                expression = /** @type {Expression} */ (expression).toString();
            }

            // Convert it to an array for simplicity
            if (!isArray(option)) {
                option = typeof option === 'undefined' ? [] : [option];
            }

            option.forEach(o => {
                // Turn on the numer flag if requested
                if (o === 'numer') {
                    numer = true;
                    return;
                }
                // Wrap it in a function if requested. This only holds true for
                // functions that take a single argument which is the expression
                const f = _.functions[o];
                // If there's a function and it takes a single argument, then wrap
                // the expression in it
                if (f && f[1] === 1) {
                    expression = `${o}(${/** @type {string} */ (expression)})`;
                }
            });

            const e = block('PARSE2NUMBER', () => _.parse(expression, subs), numer || Settings.PARSE2NUMBER);

            if (location) {
                EXPRESSIONS[location - 1] = e;
            } else {
                EXPRESSIONS.push(e);
            }

            return new Expression(e);
        } finally {
            disarmTimeout();
        }
    };

    // Initialize ChainDeps.libExports for chain functions
    ChainDeps.libExports = libExports;

    // Initialize SetConstantDeps for setConstant function
    SetConstantDeps.libExports = libExports;
    SetConstantDeps.CONSTANTS = _.CONSTANTS;

    // Initialize SetVarDeps for setVar function
    SetVarDeps.libExports = libExports;
    SetVarDeps.VARS = VARS;
    SetVarDeps.CONSTANTS = _.CONSTANTS;
    SetVarDeps.parse = _.parse.bind(_);
    SetVarDeps.isSymbol = isSymbol;

    // Initialize SetFunctionDeps for setFunction function
    SetFunctionDeps.libExports = libExports;
    SetFunctionDeps._setFunction = _setFunction;

    // Initialize ClearDeps for clear function
    ClearDeps.libExports = libExports;
    ClearDeps.EXPRESSIONS = EXPRESSIONS;

    // Initialize RegisterDeps for register function
    RegisterDeps.libExports = libExports;
    RegisterDeps.Settings = Settings;
    RegisterDeps.functions = _.functions;

    // Initialize SettingsDeps for set function
    SettingsDeps.bigDec = bigDec;
    SettingsDeps.Settings = Settings;
    SettingsDeps.functions = _.functions;
    SettingsDeps.symfunction = _.symfunction.bind(_);
    SettingsDeps.NerdamerSymbol = NerdamerSymbol;

    // Initialize UpdateAPIDeps for updateAPI function
    UpdateAPIDeps.libExports = libExports;
    UpdateAPIDeps.functions = _.functions;
    UpdateAPIDeps.parse = _.parse.bind(_);
    UpdateAPIDeps.callfunction = _.callfunction.bind(_);
    UpdateAPIDeps.Expression = Expression;

    /**
     * Converts expression into rpn form
     *
     * @param {string} expression
     * @returns {object[]}
     */
    // rpn - uses extracted function
    libExports.rpn = rpn;

    // ConvertToLaTeX - uses extracted function
    libExports.convertToLaTeX = convertToLaTeX;

    /**
     * Converts latex to text - Very very very basic at the moment
     *
     * @param {string} e
     * @returns {Expression}
     */
    // convertFromLaTeX is now defined outside IIFE
    // Uses ExpressionsDeps.LaTeX.parse, ExpressionsDeps._.tokenize/parse, and ExpressionsDeps.Expression
    libExports.convertFromLaTeX = convertFromLaTeX;

    /**
     * Get the version of nerdamer or a loaded add-on
     *
     * @param {string} addOn - The add-on being checked
     * @returns {string} Returns the version of nerdamer
     */
    // version is now defined outside IIFE
    // Uses VersionDeps._version and VersionDeps.C which are already initialized
    libExports.version = version;

    /**
     * Get nerdamer generated warnings
     *
     * @returns {string[]}
     */
    // getWarnings is now defined outside IIFE
    // Uses WarnDeps.WARNINGS which is already initialized with WARNINGS reference
    libExports.getWarnings = getWarnings;

    /**
     * @param {string} constant The name of the constant to be set
     * @param {any} value The value of the constant
     * @returns {object} Returns the nerdamer object
     */
    // setConstant is now defined outside IIFE
    // Uses SetConstantDeps for dependency injection
    libExports.setConstant = setConstant;

    /**
     * Returns the value of a previously set constant
     *
     * @param {any} constant
     * @returns {string}
     */
    // getConstant is now defined outside IIFE
    // Uses GetConstantDeps.CONSTANTS which is already initialized with _.CONSTANTS reference
    libExports.getConstant = getConstant;

    /**
     * Clear added constants from the CONSTANTS object
     *
     * @returns {object} Returns the nerdamer object
     */
    // clearConstants is now defined outside IIFE
    // Uses ChainDeps._initConstants and ChainDeps.libExports for chaining
    libExports.clearConstants = clearConstants;

    /**
     * @example
     *     nerdamer.setFunction('f',['x'], 'x^2+2');
     *     OR nerdamer.setFunction('f(x)=x^2+2');
     *     OR function custom(x , y) {
     *     return x + y;
     *     }
     *     nerdamer.setFunction(custom);
     *
     * @param {string | Function} fnName The name of the function
     * @param {string[] | undefined} fnParams A list containing the parameter name of the functions
     * @param {string | undefined} fnBody The body of the function
     * @returns {nerdamer} Returns nerdamer if succeeded and falls on fail
     */
    // setFunction is now defined outside IIFE
    // Uses SetFunctionDeps for dependency injection
    libExports.setFunction = setFunction;

    /**
     * Clears all added functions
     *
     * @returns {libExports}
     */
    // clearFunctions is now defined outside IIFE
    // Uses ChainDeps._clearFunctions and ChainDeps.libExports for chaining
    libExports.clearFunctions = clearFunctions;

    /** @returns {C} Exports the nerdamer core functions and objects */
    // getCore is now defined outside IIFE
    // Uses VersionDeps.C which is already initialized with the Core object
    libExports.getCore = getCore;

    libExports.getExpression = libExports.getEquation = Expression.getExpression;

    /**
     * @param {boolean} asArray The returned names are returned as an array if this is set to true;
     * @returns {string | Array}
     */
    // reserved is now defined outside IIFE
    // Uses ClearUDeps.RESERVED which is already initialized
    libExports.reserved = reserved;

    /**
     * @param {number} equationNumber The number of the equation to clear. If 'all' is supplied then all equations are
     *   cleared
     * @param {boolean} [keepExpressionsFixed] Use true if you don't want to keep EXPRESSIONS length fixed
     * @returns {object} Returns the nerdamer object
     */
    // clear is now defined outside IIFE
    // Uses ClearDeps for dependency injection
    libExports.clear = clear;

    // Initialize ChainDeps.clear now that clear is defined
    ChainDeps.clear = clear;

    /**
     * Alias for nerdamer.clear('all')
     *
     * @this {typeof libExports}
     */
    // flush is now defined outside IIFE
    // Uses ChainDeps.clear and ChainDeps.libExports for chaining
    libExports.flush = flush;

    /**
     * @param {boolean} asObject
     * @param {boolean} asLaTeX
     * @param {string | string[]} option
     * @returns {Array | object}
     */
    // expressions is now defined outside IIFE
    // Uses ExpressionsDeps for EXPRESSIONS, LaTeX.latex, and text references
    libExports.expressions = expressions;

    /**
     * @param {boolean} asObject
     * @param {string | string[]} option
     * @returns {any}
     */
    // functions is now defined outside IIFE as getFunctions
    // Uses ExpressionsDeps for USER_FUNCTIONS, _.functions, C.Math2, and text references
    libExports.functions = getFunctions;

    // The method for registering modules
    // register is now defined outside IIFE
    // Uses RegisterDeps for libExports, Settings, and _.functions references
    libExports.register = register;

    /**
     * @param {string} name Variable name
     * @returns {boolean} Validates if the profided string is a valid variable name
     */
    libExports.validateName = validateName;

    /**
     * @param {string} varname Variable name
     * @returns {boolean} Validates if the profided string is a valid variable name
     */
    // validVarName is now defined outside IIFE
    // Uses ClearUDeps.RESERVED (already initialized) and validateName (already external)
    libExports.validVarName = validVarName;

    /** @returns {Array} Array of functions currently supported by nerdamer */
    // supported is now defined outside IIFE
    // Uses SupportedDeps.functions which is already initialized with _.functions reference
    libExports.supported = supported;

    /** @returns {number} The number equations/expressions currently loaded */
    // numExpressions is now defined outside IIFE
    // Uses NumExpressionsDeps.EXPRESSIONS which is already initialized with EXPRESSIONS reference
    libExports.numEquations = libExports.numExpressions = numExpressions;
    /* END EXPORTS */

    /**
     * @param {string} v Variable to be set
     * @param {string} val Value of variable. This can be a variable expression or number
     * @returns {object} Returns the nerdamer object
     */
    // setVar is now defined outside IIFE
    // Uses SetVarDeps for dependency injection
    libExports.setVar = setVar;

    /**
     * Returns the value of a set variable
     *
     * @param {any} v
     * @returns {any}
     */
    // getVar is now defined outside IIFE
    // Uses GetVarDeps.VARS which is already initialized with VARS reference
    libExports.getVar = getVar;
    /**
     * Clear the variables from the VARS object
     *
     * @returns {object} Returns the nerdamer object
     */
    // clearVars is now defined outside IIFE
    // Uses ChainDeps.VARS and ChainDeps.libExports for chaining
    libExports.clearVars = clearVars;

    /**
     * @param {Function} loader
     * @returns {nerdamer}
     */
    // load is now defined outside IIFE
    // Uses ChainDeps.libExports for `this` context and chaining
    libExports.load = load;

    /**
     * @param {string} output - Output format. Can be 'object' (just returns the VARS object), 'text' or 'latex'.
     *   Default: 'text'
     * @param {string | string[]} option
     * @returns {object} Returns an object with the variables
     */
    // getVars is now defined outside IIFE
    // Uses GetVarDeps.VARS which is already initialized with VARS reference
    libExports.getVars = getVars;

    /**
     * Set the value of a setting
     *
     * @param {string} setting The setting to be changed
     * @param {boolean | number} value
     */
    // set is now defined outside IIFE
    // Uses SettingsDeps for bigDec, Settings, _.functions, and _.symfunction references
    libExports.set = set;

    /**
     * Get the value of a setting
     *
     * @param {any} setting
     * @returns {undefined}
     */
    // getSetting is now defined outside IIFE
    // Uses GetSettingDeps.Settings which is already initialized with Settings reference
    libExports.get = getSetting;

    /**
     * This functions makes internal functions available externally
     *
     * @param {boolean} [override] Override the functions when calling updateAPI if it exists
     */
    // updateAPI is now defined outside IIFE
    // Uses UpdateAPIDeps for libExports, _.functions, _.parse, _.callfunction, and Expression references
    libExports.updateAPI = updateAPI;

    // ReplaceFunction - uses extracted function
    // Uses ConvertToLaTeXDeps._.functions and ConvertToLaTeXDeps.C
    libExports.replaceFunction = replaceFunction;

    // SetOperator - uses extracted function
    libExports.setOperator = setOperator;

    // GetOperator - uses extracted function
    libExports.getOperator = getOperator;

    // AliasOperator - uses extracted function
    libExports.aliasOperator = aliasOperator;

    // Tree - uses extracted function
    libExports.tree = tree;

    // HtmlTree - uses extracted function
    libExports.htmlTree = htmlTree;

    // AddPeeker - uses extracted function
    libExports.addPeeker = addPeeker;

    // RemovePeeker - uses extracted function
    libExports.removePeeker = removePeeker;

    // Parse - uses extracted function
    libExports.parse = parse;

    libExports.updateAPI();

    return libExports; // Done
    // imports ======================================================================
})({
    bigInt: nerdamerBigInt,
    bigDec: nerdamerBigDecimal,
    constants: nerdamerConstants,
});

if (typeof module !== 'undefined') {
    module.exports = nerdamer;
}
