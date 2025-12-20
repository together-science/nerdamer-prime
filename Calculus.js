// @ts-nocheck

/*
 * Author : Martin Donk
 * Website : http://www.nerdamer.com
 * Email : martin.r.donk@gmail.com
 * Source : https://github.com/jiggzson/nerdamer
 */

// Check if nerdamer exists globally (browser) or needs to be required (Node.js)
let nerdamer = typeof globalThis !== 'undefined' && globalThis.nerdamer ? globalThis.nerdamer : undefined;
if (typeof module !== 'undefined' && nerdamer === undefined) {
    nerdamer = require('./nerdamer.core.js');
    require('./Algebra.js');
}

(function () {
    const core = nerdamer.getCore();
    const _ = core.PARSER;
    const { Frac } = core;
    const { Settings } = core;
    const { isSymbol } = core.Utils;
    const { FN } = core.groups;
    const { NerdamerSymbol } = core;
    const { text } = core.Utils;
    const { inBrackets } = core.Utils;
    const { isInt } = core.Utils;
    const { format } = core.Utils;
    const { even } = core.Utils;
    const { evaluate } = core.Utils;
    const { N } = core.groups;
    const { S } = core.groups;
    const { PL } = core.groups;
    const { CP } = core.groups;
    const { CB } = core.groups;
    const { EX } = core.groups;
    const { P } = core.groups;
    const { LOG } = Settings;
    const EXP = 'exp';
    const ABS = 'abs';
    const SQRT = 'sqrt';
    const SIN = 'sin';
    const COS = 'cos';
    const TAN = 'tan';
    const SEC = 'sec';
    const CSC = 'csc';
    const COT = 'cot';
    const ASIN = 'asin';
    const ACOS = 'acos';
    const ATAN = 'atan';
    const ASEC = 'asec';
    const ACSC = 'acsc';
    const ACOT = 'acot';
    const SINH = 'sinh';
    const COSH = 'cosh';
    const TANH = 'tanh';
    const CSCH = 'csch';
    const SECH = 'sech';
    const COTH = 'coth';
    const ASECH = 'asech';
    const ACSCH = 'acsch';
    const ACOTH = 'acoth';

    // Custom errors
    function NoIntegralFound(msg) {
        this.message = msg || '';
    }
    NoIntegralFound.prototype = new Error();

    // Preparations
    NerdamerSymbol.prototype.hasIntegral = function () {
        return this.containsFunction('integrate');
    };
    // Transforms a function
    NerdamerSymbol.prototype.fnTransform = function () {
        if (this.group !== FN) {
            return this;
        }
        let retval;
        const a = this.args[0];
        const m = new NerdamerSymbol(this.multiplier);
        const sym = this.clone().toUnitMultiplier();
        if (this.isLinear()) {
            switch (this.fname) {
                case SINH:
                    retval = _.parse(format('(e^({0})-e^(-({0})))/2', a));
                    break;
                case COSH:
                    retval = _.parse(format('(e^({0})+e^(-({0})))/2', a));
                    break;
                case TANH:
                    retval = _.parse(format('(e^({0})-e^(-({0})))/(e^({0})+e^(-({0})))', a));
                    break;
                case TAN:
                    retval = _.parse(format('sin({0})/cos({0})', a));
                    break;
                case CSC:
                    retval = _.parse(format('1/sin({0})', a));
                    break;
                case SEC:
                    retval = _.parse(format('1/cos({0})', a));
                    break;
                default:
                    retval = sym;
            }
        } else if (this.power.equals(2)) {
            switch (this.fname) {
                case SIN:
                    retval = _.parse(format('1/2-cos(2*({0}))/2', a));
                    break;
                case COS:
                    retval = _.parse(format('1/2+cos(2*({0}))/2', a));
                    break;
                case TAN:
                    // Retval = _.parse(format('(1-cos(2*({0})))/(1+cos(2*({0})))', a));
                    retval = _.parse(format('sin({0})^2/cos({0})^2', a));
                    break;
                case COSH:
                    retval = _.parse(format('1/2+cosh(2*({0}))/2', a));
                    break;
                case SINH:
                    retval = _.parse(format('-1/2+cosh(2*({0}))/2', a));
                    break;
                case TANH:
                    retval = _.parse(format('(1+cosh(2*({0})))/(-1+cosh(2*({0})))', a));
                    break;
                case SEC:
                    retval = _.parse(format('(1-cos(2*({0})))/(1+cos(2*({0})))+1', a));
                    break;
                default:
                    retval = sym;
            }
        } else if (this.fname === SEC) {
            retval = _.parse(format('1/cos({0})^({1})', this.args[0], this.power));
        } else if (this.fname === CSC) {
            retval = _.parse(format('1/sin({0})^({1})', this.args[0], this.power));
        } else if (this.fname === TAN) {
            if (this.power.lessThan(0)) {
                retval = _.parse(format('cos({0})^(-({1}))/sin({0})^({1})', this.args[0], this.power.negate()));
            } else {
                retval = _.parse(format('sin({0})^({1})/cos({0})^({1})', this.args[0], this.power));
            }
        } else if (this.fname === SIN && this.power.lessThan(0)) {
            retval = _.parse(format('csc({0})^(-({1}))', this.args[0], this.power.negate()));
        } else if (this.fname === COS && this.power.lessThan(0)) {
            retval = _.parse(format('sec({0})^(-({1}))', this.args[0], this.power.negate()));
        } else if (this.fname === SIN && this.power.equals(3)) {
            retval = _.parse(format('(3*sin({0})-sin(3*({0})))/4', this.args[0]));
        } else if (this.fname === COS && this.power.equals(3)) {
            retval = _.parse(format('(cos(3*({0}))+3*cos({0}))/4', this.args[0]));
        }
        // Cos(a*x)^(2*n) or sin(a*x)^(2*n)
        else if ((this.fname === COS || this.fname === SIN) && even(this.power)) {
            const n = this.power / 2;
            // Convert to a double angle
            const double_angle = _.pow(this.clone().toLinear(), _.parse(2)).fnTransform();
            // Raise to the n and expand
            const transformed = _.expand(_.pow(double_angle, _.parse(n)));

            retval = new NerdamerSymbol(0);

            transformed.each(s => {
                const t = s.fnTransform();
                retval = _.add(retval, t);
            }, true);
        } else {
            retval = sym;
        }

        return _.multiply(retval, m);
    };

    NerdamerSymbol.prototype.hasTrig = function () {
        if (this.isConstant(true) || this.group === S) {
            return false;
        }
        if (this.fname && (core.Utils.in_trig(this.fname) || core.Utils.in_inverse_trig(this.fname))) {
            return true;
        }
        if (this.symbols) {
            for (const x in this.symbols) {
                if (this.symbols[x].hasTrig()) {
                    return true;
                }
            }
        }
        return false;
    };

    core.Expression.prototype.hasIntegral = function () {
        return this.symbol.hasIntegral();
    };
    /**
     * Attempts to rewrite a symbol under one common denominator
     *
     * @param {NerdamerSymbol} symbol
     */
    core.Utils.toCommonDenominator = function (symbol) {
        // Transform x/a+x -> (ax+x)/a
        if (symbol.isComposite() && symbol.isLinear()) {
            const m = new NerdamerSymbol(symbol.multiplier);
            let denominator = new NerdamerSymbol(1);
            let numerator = new NerdamerSymbol(0);
            symbol.each(x => {
                denominator = _.multiply(denominator, x.getDenom());
            }, true);

            // Remove the denomitor in each term
            symbol.each(x => {
                const num = x.getNum();
                const den = x.getDenom();
                const factor = _.multiply(num, _.divide(denominator.clone(), den));
                numerator = _.add(numerator, factor);
            });
            const retval = _.multiply(m, core.Algebra.divide(_.expand(numerator), _.expand(denominator)));
            return retval;
        }
        return symbol;
    };
    // A function to check if a function name is an inverse trig function
    core.Utils.in_inverse_trig = function (x) {
        const inv_trig_fns = [ASIN, ACOS, ATAN, ACSC, ASEC, ACOT];
        return inv_trig_fns.indexOf(x) !== -1;
    };
    // A function to check if a function name is a trig function
    core.Utils.in_trig = function (x) {
        const trig_fns = [COS, SIN, TAN, SEC, CSC, COT];
        return trig_fns.indexOf(x) !== -1;
    };

    core.Utils.in_htrig = function (x) {
        const trig_fns = [SINH, COSH, TANH, ACSCH, ASECH, ACOTH];
        return trig_fns.indexOf(x) !== -1;
    };

    // Matrix functions
    core.Matrix.jacobian = function (eqns, vars) {
        const jacobian = new core.Matrix();
        // Get the variables if not supplied
        vars ||= core.Utils.arrayGetVariables(eqns);

        vars.forEach((v, i) => {
            eqns.forEach((eq, j) => {
                const e = core.Calculus.diff(eq.clone(), v);
                jacobian.set(j, i, e);
            });
        });

        return jacobian;
    };

    core.Matrix.prototype.max = function () {
        let max = new NerdamerSymbol(0);
        this.each(x => {
            const e = x.abs();
            if (e.gt(max)) {
                max = e;
            }
        });
        return max;
    };

    core.Matrix.cMatrix = function (value, vars) {
        const m = new core.Matrix();
        // Make an initial guess
        vars.forEach((v, i) => {
            m.set(i, 0, _.parse(value));
        });
        return m;
    };

    const all_functions = (core.Utils.all_functions = function (arr) {
        for (let i = 0, l = arr.length; i < l; i++) {
            if (arr[i].group !== FN) {
                return false;
            }
        }
        return true;
    });
    const cosAsinBtransform = (core.Utils.cosAsinBtranform = function (symbol1, symbol2) {
        const a = symbol1.args[0];
        const b = symbol2.args[0];
        return _.parse(format('(sin(({0})+({1}))-sin(({0})-({1})))/2', a, b));
    });
    const cosAsinAtransform = (core.Utils.cosAsinAtranform = function (symbol1, symbol2) {
        // TODO: temporary fix for integrate(e^x*sin(x)*cos(x)^2).
        // we technically know how to do this transform but more is needed for correct output
        if (Number(symbol2.power) !== 1) {
            return _.multiply(symbol1, symbol2);
        }
        const a = symbol1.args[0];
        return _.parse(format('(sin(2*({0})))/2', a));
    });
    const sinAsinBtransform = (core.Utils.cosAsinBtranform = function (symbol1, symbol2) {
        const a = symbol1.args[0];
        const b = symbol2.args[0];
        return _.parse(format('(cos(({0})+({1}))-cos(({0})-({1})))/2', a, b));
    });
    const trigTransform = (core.Utils.trigTransform = function (arr) {
        const map = {};
        let symbol;
        let t;
        let retval = new NerdamerSymbol(1);
        for (let i = 0, l = arr.length; i < l; i++) {
            symbol = arr[i];

            if (symbol.group === FN) {
                const { fname } = symbol;

                if (fname === COS && map[SIN]) {
                    if (map[SIN].args[0].toString() !== symbol.args[0].toString()) {
                        t = cosAsinBtransform(symbol, map[SIN]);
                    } else {
                        t = cosAsinAtransform(symbol, map[SIN]);
                    }
                    delete map[SIN];

                    retval = _.multiply(retval, t);
                } else if (fname === SIN && map[COS]) {
                    if (map[COS].args[0].toString() !== symbol.args[0].toString()) {
                        t = cosAsinBtransform(symbol, map[COS]);
                    } else {
                        t = cosAsinAtransform(symbol, map[COS]);
                    }
                    delete map[COS];

                    retval = _.multiply(retval, t);
                } else if (fname === SIN && map[SIN]) {
                    if (map[SIN].args[0].toString() !== symbol.args[0].toString()) {
                        t = sinAsinBtransform(symbol, map[SIN]);
                        delete map[SIN];
                    } else {
                        // This should actually be redundant code but let's put just in case
                        t = _.multiply(symbol, map[SIN]);
                        delete map[SIN];
                    }

                    retval = t;
                } else {
                    map[fname] = symbol;
                }
            } else {
                retval = _.multiply(retval, symbol);
            }
        }

        // Put back the remaining functions
        for (const x in map) {
            retval = _.multiply(retval, map[x]);
        }

        return retval;
    });

    core.Settings.integration_depth = 10;

    core.Settings.max_lim_depth = 10;

    const __ = (core.Calculus = {
        version: '1.4.6',

        sum(fn, index, start, end) {
            if (!(index.group === core.groups.S)) {
                throw new core.exceptions.NerdamerTypeError(`Index must be symbol. ${text(index)} provided`);
            }
            index = index.value;
            let retval;
            if (core.Utils.isNumericSymbol(start) && core.Utils.isNumericSymbol(end)) {
                const modifier = end - start < 200 ? '' : 'PARSE2NUMBER';
                start = Number(start);
                end = Number(end);
                retval = core.Utils.block(modifier, () => {
                    const f = fn.text();
                    const subs = { '~': true }; // Lock subs. Is this even being used?
                    let result = new core.NerdamerSymbol(0);

                    for (let i = start; i <= end; i++) {
                        subs[index] = new NerdamerSymbol(i);
                        const ans = _.parse(f, subs);
                        result = _.add(result, ans);
                    }
                    return result;
                });
            } else {
                retval = _.symfunction('sum', arguments);
            }

            return retval;
        },
        product(fn, index, start, end) {
            if (!(index.group === core.groups.S)) {
                throw new core.exceptions.NerdamerTypeError(`Index must be symbol. ${text(index)} provided`);
            }
            index = index.value;
            let retval;
            if (core.Utils.isNumericSymbol(start) && core.Utils.isNumericSymbol(end)) {
                const modifier = end - start < 200 ? '' : 'PARSE2NUMBER';
                retval = core.Utils.block(modifier, () => {
                    start = Number(start);
                    end = Number(end.multiplier);

                    const f = fn.text();
                    const subs = {};
                    let result = new core.NerdamerSymbol(1);

                    for (let i = start; i <= end; i++) {
                        subs[index] = new NerdamerSymbol(i);
                        result = _.multiply(result, _.parse(f, subs));
                    }
                    return result;
                });
            } else {
                retval = _.symfunction('product', arguments);
            }

            return retval;
        },
        diff(symbol, wrt, nth) {
            if (core.Utils.isVector(symbol)) {
                const vector = new core.Vector([]);
                symbol.each(x => {
                    vector.elements.push(__.diff(x, wrt, nth));
                });
                return vector;
            }
            if (core.Utils.isMatrix(symbol)) {
                const matrix = new core.Matrix();
                symbol.each((x, i, j) => {
                    matrix.set(i, j, __.diff(x, wrt, nth));
                });
                return matrix;
            }
            if (symbol.LHS && symbol.RHS) {
                // Equation, diff both sides
                const result = new core.Equation(
                    __.diff(symbol.LHS.clone(), wrt, nth),
                    __.diff(symbol.RHS.clone(), wrt, nth)
                );
                return result;
            }

            let d = isSymbol(wrt) ? wrt.text() : wrt;
            // The nth derivative
            nth = isSymbol(nth) ? nth.multiplier : nth || 1;

            if (d === undefined) {
                d = core.Utils.variables(symbol)[0];
            }

            // Unwrap sqrt
            if (symbol.group === FN && symbol.fname === SQRT) {
                const s = symbol.args[0];
                const sp = symbol.power.clone();
                // These groups go to zero anyway so why waste time?
                if (s.group !== N || s.group !== P) {
                    s.power = isSymbol(s.power)
                        ? _.multiply(s.power, _.multiply(new NerdamerSymbol(1 / 2)), sp)
                        : s.power.multiply(new Frac(0.5)).multiply(sp);
                    s.multiplier = s.multiplier.multiply(symbol.multiplier);
                }

                symbol = s;
            }

            if (symbol.group === FN && !isSymbol(symbol.power)) {
                const a = derive(_.parse(symbol));
                const b = __.diff(symbol.args[0].clone(), d);
                symbol = _.multiply(a, b); // Chain rule
            } else {
                symbol = derive(symbol);
            }

            if (nth > 1) {
                nth--;
                symbol = __.diff(symbol, wrt, nth);
            }

            return symbol;

            // Equivalent to "derivative of the outside".
            function polydiff(s) {
                if (s.value === d || s.contains(d, true)) {
                    s.multiplier = s.multiplier.multiply(s.power);
                    s.power = s.power.subtract(new Frac(1));
                    if (s.power.equals(0)) {
                        s = NerdamerSymbol(s.multiplier);
                    }
                }

                return s;
            }

            function derive(s) {
                const g = s.group;
                let _a;
                let b;
                let cp;

                if (g === N || (g === S && s.value !== d) || g === P) {
                    s = NerdamerSymbol(0);
                } else if (g === S) {
                    s = polydiff(s);
                } else if (g === CB) {
                    const m = s.multiplier.clone();
                    s.toUnitMultiplier();
                    const retval = _.multiply(product_rule(s), polydiff(s));
                    retval.multiplier = retval.multiplier.multiply(m);
                    return retval;
                } else if (g === FN && s.power.equals(1)) {
                    // Table of known derivatives
                    const m = s.multiplier.clone();
                    s.toUnitMultiplier();

                    switch (s.fname) {
                        case LOG:
                            cp = s.clone();
                            s = s.args[0].clone(); // Get the arguments
                            s.power = s.power.negate();
                            s.multiplier = cp.multiplier.divide(s.multiplier);
                            break;
                        case COS:
                            // Cos -> -sin
                            s.fname = SIN;
                            s.multiplier.negate();
                            break;
                        case SIN:
                            // Sin -> cos
                            s.fname = COS;
                            break;
                        case TAN:
                            // Tan -> sec^2
                            s.fname = SEC;
                            s.power = new Frac(2);
                            break;
                        case SEC:
                            // Use a clone if this gives errors
                            s = qdiff(s, TAN);
                            break;
                        case CSC:
                            s = qdiff(s, '-cot');
                            break;
                        case COT:
                            s.fname = CSC;
                            s.multiplier.negate();
                            s.power = new Frac(2);
                            break;
                        case ASIN:
                            s = _.parse(`(sqrt(1-(${text(s.args[0])})^2))^(-1)`);
                            break;
                        case ACOS:
                            s = _.parse(`-(sqrt(1-(${text(s.args[0])})^2))^(-1)`);
                            break;
                        case ATAN:
                            s = _.parse(`(1+(${text(s.args[0])})^2)^(-1)`);
                            break;
                        case ABS:
                            // Depending on the complexity of the symbol it's easier to just parse it into a new symbol
                            // this should really be readdressed soon
                            b = s.args[0].clone();
                            b.toUnitMultiplier();
                            s = _.parse(`${inBrackets(text(s.args[0]))}/abs${inBrackets(text(b))}`);
                            break;
                        case 'parens':
                            // See product rule: f'.g goes to zero since f' will return zero. This way we only get back
                            // 1*g'
                            s = NerdamerSymbol(1);
                            break;
                        case 'cosh':
                            // Cosh -> -sinh
                            s.fname = 'sinh';
                            break;
                        case 'sinh':
                            // Sinh -> cosh
                            s.fname = 'cosh';
                            break;
                        case TANH:
                            // Tanh -> sech^2
                            s.fname = SECH;
                            s.power = new Frac(2);
                            break;
                        case SECH:
                            // Use a clone if this gives errors
                            s = qdiff(s, '-tanh');
                            break;
                        case CSCH: {
                            const cschArg = String(s.args[0]);
                            s = _.parse(`-coth(${cschArg})*csch(${cschArg})`);
                            break;
                        }
                        case COTH: {
                            const cothArg = String(s.args[0]);
                            s = _.parse(`-csch(${cothArg})^2`);
                            break;
                        }
                        case 'asinh':
                            s = _.parse(`(sqrt(1+(${text(s.args[0])})^2))^(-1)`);
                            break;
                        case 'acosh':
                            s = _.parse(`(sqrt(-1+(${text(s.args[0])})^2))^(-1)`);
                            break;
                        case 'atanh':
                            s = _.parse(`(1-(${text(s.args[0])})^2)^(-1)`);
                            break;
                        case ASECH: {
                            const asechArg = String(s.args[0]);
                            s = _.parse(`-1/(sqrt(1/(${asechArg})^2-1)*(${asechArg})^2)`);
                            break;
                        }
                        case ACOTH:
                            s = _.parse(`-1/((${s.args[0]})^2-1)`);
                            break;
                        case ACSCH: {
                            const arg = String(s.args[0]);
                            s = _.parse(`-1/(sqrt(1/(${arg})^2+1)*(${arg})^2)`);
                            break;
                        }
                        case ASEC: {
                            const arg = String(s.args[0]);
                            s = _.parse(`1/(sqrt(1-1/(${arg})^2)*(${arg})^2)`);
                            break;
                        }
                        case ACSC: {
                            const arg = String(s.args[0]);
                            s = _.parse(`-1/(sqrt(1-1/(${arg})^2)*(${arg})^2)`);
                            break;
                        }
                        case ACOT:
                            s = _.parse(`-1/((${s.args[0]})^2+1)`);
                            break;
                        case 'S': {
                            const arg = String(s.args[0]);
                            s = _.parse(`sin((pi*(${arg})^2)/2)`);
                            break;
                        }
                        case 'C': {
                            const arg = String(s.args[0]);
                            s = _.parse(`cos((pi*(${arg})^2)/2)`);
                            break;
                        }
                        case 'Si': {
                            const arg = s.args[0];
                            s = _.parse(`sin(${arg})/(${arg})`);
                            break;
                        }
                        case 'Shi': {
                            const arg = s.args[0];
                            s = _.parse(`sinh(${arg})/(${arg})`);
                            break;
                        }
                        case 'Ci': {
                            const arg = s.args[0];
                            s = _.parse(`cos(${arg})/(${arg})`);
                            break;
                        }
                        case 'Chi': {
                            const arg = s.args[0];
                            s = _.parse(`cosh(${arg})/(${arg})`);
                            break;
                        }
                        case 'Ei': {
                            const arg = s.args[0];
                            s = _.parse(`e^(${arg})/(${arg})`);
                            break;
                        }
                        case 'Li': {
                            const arg = s.args[0];
                            s = _.parse(`1/${Settings.LOG}(${arg})`);
                            break;
                        }
                        case 'erf':
                            s = _.parse(`(2*e^(-(${s.args[0]})^2))/sqrt(pi)`);
                            break;
                        case 'atan2': {
                            const x_ = String(s.args[0]);
                            const y_ = String(s.args[1]);
                            s = _.parse(`(${y_})/((${y_})^2+(${x_})^2)`);
                            break;
                        }
                        case 'sign':
                            s = new NerdamerSymbol(0);
                            break;
                        case 'sinc':
                            s = _.parse(format('(({0})*cos({0})-sin({0}))*({0})^(-2)', s.args[0]));
                            break;
                        case Settings.LOG10:
                            s = _.parse(`1/((${s.args[0]})*${Settings.LOG}(10))`);
                            break;
                        default:
                            s = _.symfunction('diff', [s, wrt]);
                    }
                    s.multiplier = s.multiplier.multiply(m);
                } else if (g === EX || (g === FN && isSymbol(s.power))) {
                    let value;
                    if (g === EX) {
                        value = s.value;
                    } else if (g === FN && s.contains(d)) {
                        value = s.fname + inBrackets(text(s.args[0]));
                    } else {
                        value = s.value + inBrackets(text(s.args[0]));
                    }
                    b = __.diff(_.multiply(_.parse(LOG + inBrackets(value)), s.power.clone()), d);
                    s = _.multiply(s, b);
                } else if (g === FN && !s.power.equals(1)) {
                    b = s.clone();
                    b.toLinear();
                    b.toUnitMultiplier();
                    s = _.multiply(polydiff(s.clone()), derive(b));
                } else if (g === CP || g === PL) {
                    // Note: Do not use `parse` since this puts back the sqrt and causes a bug as in #610. Use clone.
                    const c = s.clone();
                    let result = new NerdamerSymbol(0);
                    for (const x in s.symbols) {
                        result = _.add(result, __.diff(s.symbols[x].clone(), d));
                    }
                    s = _.multiply(polydiff(c), result);
                }

                s.updateHash();

                return s;
            }
            function qdiff(s, val, altVal) {
                return _.multiply(s, _.parse(val + inBrackets(altVal || text(s.args[0]))));
            }
            function product_rule(s) {
                // Grab all the symbols within the CB symbol
                const symbols = s.collectSymbols();
                let result = new NerdamerSymbol(0);
                const l = symbols.length;
                // Loop over all the symbols
                for (let i = 0; i < l; i++) {
                    let df = __.diff(symbols[i].clone(), d);
                    for (let j = 0; j < l; j++) {
                        // Skip the symbol of which we just pulled the derivative
                        if (i !== j) {
                            // Multiply out the remaining symbols
                            df = _.multiply(df, symbols[j].clone());
                        }
                    }
                    // Add the derivative to the result
                    result = _.add(result, df);
                }
                return result; // Done
            }
        },
        integration: {
            u_substitution(symbols, dx) {
                // May cause problems if person is using this already. Will need
                // to find algorithm for detecting conflict
                const u = '__u__';

                function try_combo(a, b, f) {
                    const d = __.diff(b, dx);
                    const q = f ? f(a, b) : _.divide(a.clone(), d);
                    if (!q.contains(dx, true)) {
                        return q;
                    }
                    return null;
                }
                function do_fn_sub(fname, arg) {
                    let subbed = __.integrate(_.symfunction(fname, [new NerdamerSymbol(u)]), u, 0);
                    subbed = subbed.sub(new NerdamerSymbol(u), arg);
                    subbed.updateHash();
                    return subbed;
                }

                const a = symbols[0].clone();
                const b = symbols[1].clone();
                const g1 = a.group;
                const g2 = b.group;
                let Q;
                if (g1 === FN && g2 !== FN) {
                    // E.g. 2*x*cos(x^2)
                    const arg = a.args[0];
                    Q = try_combo(b, arg.clone());
                    if (Q) {
                        return _.multiply(Q, do_fn_sub(a.fname, arg));
                    }
                    Q = try_combo(b, a);
                    if (Q) {
                        return __.integration.poly_integrate(a);
                    }
                } else if (g2 === FN && g1 !== FN) {
                    // E.g. 2*(x+1)*cos((x+1)^2
                    const arg = b.args[0];
                    Q = try_combo(a, arg.clone());
                    if (Q) {
                        return _.multiply(Q, do_fn_sub(b.fname, arg));
                    }
                } else if (g1 === FN && g2 === FN) {
                    Q = try_combo(a.clone(), b.clone());
                    if (Q) {
                        return _.multiply(__.integration.poly_integrate(b), Q);
                    }
                    Q = try_combo(b.clone(), a.clone());
                    if (Q) {
                        return _.multiply(__.integration.poly_integrate(b), Q);
                    }
                } else if (g1 === EX && g2 !== EX) {
                    const p = a.power;
                    Q = try_combo(b, p.clone());
                    if (!Q) {
                        // One more try
                        const dc = __.integration.decompose_arg(p.clone(), dx);
                        // Consider the possibility of a^x^(n-1)*x^n dx
                        const xp = __.diff(dc[2].clone(), dx);
                        const dc2 = __.integration.decompose_arg(xp.clone(), dx);
                        // If their powers equal, so if dx*p == b
                        if (_.multiply(dc[1], dc2[1]).power.equals(b.power)) {
                            const m = _.divide(dc[0].clone(), dc2[0].clone());

                            let new_val = _.multiply(
                                m.clone(),
                                _.pow(new NerdamerSymbol(a.value), _.multiply(dc[0], new NerdamerSymbol(u)))
                            );
                            new_val = _.multiply(new_val, new NerdamerSymbol(u));
                            return __.integration.by_parts(new_val, u, 0, {}).sub(u, dc[1].clone());
                        }
                    }
                    const integrated = __.integrate(a.sub(p.clone(), new NerdamerSymbol(u)), u, 0);
                    const retval = _.multiply(integrated.sub(new NerdamerSymbol(u), p), Q);

                    return retval;
                } else if (g2 === EX && g1 !== EX) {
                    const p = b.power;
                    Q = try_combo(a, p.clone());
                    const integrated = __.integrate(b.sub(p, new NerdamerSymbol(u)), u, 0);
                    return _.multiply(integrated.sub(new NerdamerSymbol(u), p), Q);
                } else if (a.isComposite() || b.isComposite()) {
                    const f = function (sym1, sym2) {
                        const d = __.diff(sym2, dx);
                        const A = core.Algebra.Factor.factorInner(sym1);
                        const B = core.Algebra.Factor.factorInner(d);
                        const q = _.divide(A, B);
                        return q;
                    };
                    const f1 = a.isComposite() ? a.clone().toLinear() : a.clone();
                    const f2 = b.isComposite() ? b.clone().toLinear() : b.clone();
                    Q = try_combo(f1.clone(), f2.clone(), f);
                    if (Q) {
                        return _.multiply(__.integration.poly_integrate(b), Q);
                    }
                    Q = try_combo(f2.clone(), f1.clone(), f);
                    if (Q) {
                        return _.multiply(__.integration.poly_integrate(a), Q);
                    }
                }
            },
            // Simple integration of a single polynomial x^(n+1)/(n+1)
            poly_integrate(x) {
                const p = x.power.toString();
                const m = x.multiplier.toDecimal();
                const s = x.toUnitMultiplier().toLinear();
                if (Number(p) === -1) {
                    return _.multiply(new NerdamerSymbol(m), _.symfunction(LOG, [s]));
                }
                return _.parse(format('({0})*({1})^(({2})+1)/(({2})+1)', m, s, p));
            },
            // If we're just spinning wheels we want to stop. This is why we
            // wrap integration in a try catch block and call this to stop.
            stop(msg) {
                msg ||= 'Unable to compute integral!';
                core.Utils.warn(msg);
                throw new NoIntegralFound(msg);
            },
            partial_fraction(input, dx, depth, opt) {
                // TODO: This whole thing needs to be rolled into one but for now I'll leave it as two separate parts
                if (!isSymbol(dx)) {
                    dx = _.parse(dx);
                }

                let result;
                result = new NerdamerSymbol(0);
                const partial_fractions = core.Algebra.PartFrac.partfrac(input, dx);

                if (partial_fractions.group === CB && partial_fractions.isLinear()) {
                    // Perform a quick check to make sure that all partial fractions are linear
                    partial_fractions.each(x => {
                        if (!x.isLinear()) {
                            __.integration.stop();
                        }
                    });
                    partial_fractions.each(x => {
                        result = _.add(result, __.integrate(x, dx, depth, opt));
                    });
                } else {
                    result = _.add(result, __.integrate(partial_fractions, dx, depth, opt));
                }
                return result;
            },
            get_udv(symbol) {
                const parts = [
                    [
                        /* L*/
                    ],
                    [
                        /* I*/
                    ],
                    [
                        /* A*/
                    ],
                    [
                        /* T*/
                    ],
                    [
                        /* E*/
                    ],
                ];
                // First we sort them
                const setSymbol = function (x) {
                    const g = x.group;
                    if (g === FN) {
                        const { fname } = x;
                        if (core.Utils.in_trig(fname) || core.Utils.in_htrig(fname)) {
                            parts[3].push(x);
                        } else if (core.Utils.in_inverse_trig(fname)) {
                            parts[1].push(x);
                        } else if (fname === LOG) {
                            parts[0].push(x);
                        } else {
                            __.integration.stop();
                        }
                    } else if (g === S || (x.isComposite() && x.isLinear()) || (g === CB && x.isLinear())) {
                        parts[2].push(x);
                    } else if (g === EX || (x.isComposite() && !x.isLinear())) {
                        parts[4].push(x);
                    } else {
                        __.integration.stop();
                    }
                };

                if (symbol.group === CB) {
                    symbol.each(x => {
                        setSymbol(NerdamerSymbol.unwrapSQRT(x, true));
                    });
                } else {
                    setSymbol(symbol);
                }
                let u;
                let dv = new NerdamerSymbol(1);
                // Compile u and dv
                for (let i = 0; i < 5; i++) {
                    const part = parts[i];
                    let t;
                    const l = part.length;
                    if (l > 0) {
                        if (l > 1) {
                            t = new NerdamerSymbol(1);
                            for (let j = 0; j < l; j++) {
                                t = _.multiply(t, part[j].clone());
                            }
                        } else {
                            t = part[0].clone();
                        }

                        if (!u) {
                            u = t; // The first u encountered gets chosen
                            u.multiplier = u.multiplier.multiply(symbol.multiplier); // The first one gets the mutliplier
                        } else {
                            dv = _.multiply(dv, t);
                        } // Everything else belongs to dv
                    }
                }

                return [u, dv];
            },

            trig_sub(symbol, dx, depth, opt, parts, _symbols) {
                parts ||= __.integration.decompose_arg(symbol.clone().toLinear(), dx);
                const _b = parts[3];
                const _ax = parts[2];
                const a = parts[0];
                const x = parts[1];
                if (x.power.equals(2) && a.greaterThan(0)) {
                    // Use tan(x)
                    const t = core.Utils.getU(symbol); // Get an appropriate u
                    const u = _.parse(TAN + inBrackets(t)); // U
                    const du = _.parse(`${SEC + inBrackets(t)}^2`); // Du
                    const f = _.multiply(symbol.sub(x, u), du);
                    const integral = __.integrate(f, t, depth, opt).sub(u, x);
                    core.Utils.clearU(u);
                    return integral;
                }
            },

            by_parts(symbol, dx, depth, o) {
                o.previous = o.previous || [];
                let retval;
                // First LIATE
                const udv = __.integration.get_udv(symbol);
                const u = udv[0];
                const dv = udv[1];
                let du = NerdamerSymbol.unwrapSQRT(_.expand(__.diff(u.clone(), dx)), true);
                const c = du.clone().stripVar(dx);
                // Strip any coefficients
                du = _.divide(du, c.clone());
                const v = __.integrate(dv.clone(), dx, depth || 0);
                const vdu = _.multiply(v.clone(), du);
                const vdu_s = vdu.toString();
                // Currently only supports e^x*(some trig)
                if (o.previous.indexOf(vdu_s) !== -1 && core.Utils.in_trig(u.fname) && dv.isE()) {
                    // We're going to exploit the fact that vdu can never be constant
                    // to work out way out of this cycle. We'll return the length of
                    // the this.previous array until we're back at level one
                    o.is_cyclic = true;
                    // Return the integral.
                    return new NerdamerSymbol(1);
                }
                o.previous.push(vdu_s);

                const uv = _.multiply(u, v);
                // Clear the multiplier so we're dealing with a bare integral
                const m = vdu.multiplier.clone();
                vdu.toUnitMultiplier();
                const integral_vdu = _.multiply(__.integrate(vdu.clone(), dx, depth, o), c);
                integral_vdu.multiplier = integral_vdu.multiplier.multiply(m);
                retval = _.subtract(uv, integral_vdu);
                // We know that there cannot be constants so they're a holdover from a cyclic integral
                if (o.is_cyclic) {
                    // Start popping the previous stack so we know how deep in we are
                    o.previous.pop();
                    if (o.previous.length === 0) {
                        retval = _.expand(retval);
                        let rem = new NerdamerSymbol(0);
                        retval.each(x => {
                            if (!x.contains(dx)) {
                                rem = _.add(rem, x.clone());
                            }
                        });
                        // Get the actual uv
                        retval = _.divide(_.subtract(retval, rem.clone()), _.subtract(new NerdamerSymbol(1), rem));
                    }
                }

                return retval;
            },
            /*
             * Dependents: [Solve, integrate]
             */
            decompose_arg: core.Utils.decompose_fn,
        },
        // TODO: nerdamer.integrate('-e^(-a*t)*sin(t)', 't') -> gives incorrect output
        integrate(original_symbol, dt, depth, opt) {
            // Assume integration wrt independent variable if expression only has one variable
            if (!dt) {
                const vars = core.Utils.variables(original_symbol);
                if (vars.length === 1) {
                    dt = vars[0];
                }
                // Defaults to x
                dt ||= 'x';
            }
            // Add support for integrating vectors
            if (core.Utils.isVector(original_symbol)) {
                const vector = new core.Vector([]);
                original_symbol.each(x => {
                    vector.elements.push(__.integrate(x, dt));
                });
                return vector;
            }
            if (!isNaN(dt)) {
                _.error(`variable expected but received ${dt}`);
            }
            // Get rid of constants right away
            if (original_symbol.isConstant(true)) {
                return _.multiply(original_symbol.clone(), _.parse(dt));
            }

            // Configurations options for integral. This is needed for tracking extra options
            // e.g. cyclic integrals or additional settings
            opt ||= {};
            return core.Utils.block(
                'PARSE2NUMBER',
                () => {
                    // Make a note of the original symbol. Set only if undefined
                    depth ||= 0;
                    const dx = isSymbol(dt) ? dt.toString() : dt;
                    // We don't want the symbol in sqrt form. x^(1/2) is prefererred
                    let symbol = NerdamerSymbol.unwrapSQRT(original_symbol.clone(), true);
                    const g = symbol.group;
                    let retval;

                    try {
                        // We stop integration after x amount of recursive calls
                        if (++depth > core.Settings.integration_depth) {
                            __.integration.stop('Maximum depth reached. Exiting!');
                        }

                        // Constants. We first eliminate anything that doesn't have dx. Everything after this has
                        // to have dx or else it would have been taken care of below
                        if (!symbol.contains(dx, true)) {
                            retval = _.multiply(symbol.clone(), _.parse(dx));
                        }
                        // E.g. 2*x
                        else if (g === S) {
                            retval = __.integration.poly_integrate(symbol, dx, depth);
                        } else if (g === EX) {
                            if (
                                symbol.previousGroup === FN &&
                                !(symbol.fname === 'sqrt' || symbol.fname === Settings.PARENTHESIS)
                            ) {
                                __.integration.stop();
                            }
                            // Check the base
                            if (symbol.contains(dx) && symbol.previousGroup !== FN) {
                                // If the symbol also contains dx then we stop since we currently
                                // don't know what to do with it e.g. x^x
                                if (symbol.power.contains(dx)) {
                                    __.integration.stop();
                                } else {
                                    const t = __.diff(symbol.clone().toLinear(), dx);
                                    if (t.contains(dx)) {
                                        __.integration.stop();
                                    }
                                    // Since at this point it's the base only then we do standard single poly integration
                                    // e.g. x^y
                                    retval = __.integration.poly_integrate(symbol, dx, depth);
                                }
                            }
                            // E.g. a^x or 9^x
                            else {
                                const a = __.diff(symbol.power.clone(), dx);
                                if (a.contains(dx)) {
                                    const aa = a.stripVar(dx);
                                    const x = _.divide(a.clone(), aa.clone());
                                    if (x.group === S && x.isLinear()) {
                                        aa.multiplier = aa.multiplier.divide(new Frac(2));
                                        return _.parse(
                                            format(
                                                '({2})*(sqrt(pi)*erf(sqrt(-{0})*{1}))/(2*sqrt(-{0}))',
                                                aa,
                                                dx,
                                                symbol.multiplier
                                            )
                                        );
                                    }
                                    __.integration.stop();
                                }
                                if (symbol.isE()) {
                                    if (a.isLinear()) {
                                        retval = symbol;
                                    } else if (a.isE() && a.power.group === S && a.power.power.equals(1)) {
                                        retval = _.multiply(_.symfunction('Ei', [symbol.power.clone()]), symbol.power);
                                    } else {
                                        __.integration.stop();
                                    }
                                } else {
                                    const d = _.symfunction(LOG, [_.parse(symbol.value)]);
                                    retval = _.divide(symbol, d);
                                }
                                retval = _.divide(retval, a);
                            }
                        } else if (symbol.isComposite() && symbol.isLinear()) {
                            const m = _.parse(symbol.multiplier);
                            symbol.toUnitMultiplier();
                            retval = new NerdamerSymbol(0);
                            symbol.each(elem => {
                                retval = _.add(retval, __.integrate(elem, dx, depth));
                            });
                            retval = _.multiply(m, retval);
                        } else if (g === CP) {
                            if (symbol.power.greaterThan(1)) {
                                symbol = _.expand(symbol);
                            }
                            if (symbol.power.equals(1)) {
                                retval = new NerdamerSymbol(0);
                                symbol.each(elem => {
                                    retval = _.add(retval, __.integrate(elem, dx, depth));
                                }, true);
                            } else {
                                const p = Number(symbol.power);
                                const m = symbol.multiplier.clone(); // Temporarily remove the multiplier
                                symbol.toUnitMultiplier();
                                const // Below we consider the form ax+b
                                    fn = symbol.clone().toLinear(); // Get just the pure function without the power
                                const decomp = __.integration.decompose_arg(fn, dx);
                                // I have no idea why I used bx+a and not ax+b. TODO change this to something that makes sense
                                const b = decomp[3];
                                const ax = decomp[2];
                                const a = decomp[0];
                                const x = decomp[1];
                                if (p === -1 && x.group !== PL && x.power.equals(2)) {
                                    const b_is_positive = isInt(b) ? b > 0 : true;
                                    // We can now check for atan
                                    if (x.group === S && x.power.equals(2) && b_is_positive) {
                                        /// /then we have atan
                                        // abs is redundants since the sign appears in both denom and num.
                                        const unwrapAbs = function (s) {
                                            let result = new NerdamerSymbol(1);
                                            s.each(elem => {
                                                result = _.multiply(result, elem.fname === 'abs' ? elem.args[0] : elem);
                                            });
                                            return result;
                                        };
                                        let A = a.clone();
                                        let B = b.clone();
                                        A = _.pow(A, new NerdamerSymbol(1 / 2));
                                        B = _.pow(B, new NerdamerSymbol(1 / 2));
                                        // Unwrap abs

                                        const d = _.multiply(unwrapAbs(B), unwrapAbs(A));
                                        const f = _.symfunction(ATAN, [
                                            _.divide(_.multiply(a, x.toLinear()), d.clone()),
                                        ]);
                                        retval = _.divide(f, d);
                                    } else if (x.group === S && x.isLinear()) {
                                        retval = _.divide(__.integration.poly_integrate(symbol), a);
                                    } else {
                                        // 1/(x^4+1)
                                        if (x.power.equals(4)) {
                                            // https://www.freemathhelp.com/forum/threads/55678-difficult-integration-int-1-(1-x-4)-dx
                                            const br = inBrackets;
                                            // Apply rule: ax^4+b = (√ax^2+√2∜a∜bx+√b)(√ax^2-√2∜a∜bx+√b)
                                            // get quadratic factors
                                            const A = _.parse(`${SQRT + br(a)}*${dx}^2`);
                                            const B = _.parse(
                                                `${SQRT + br(2)}*${br(a)}^${br('1/4')}*${br(b)}^${br('1/4')}*${dx}`
                                            );
                                            const C = _.parse(SQRT + br(b));
                                            const f1 = _.add(_.add(A.clone(), B.clone()), C.clone());
                                            const f2 = _.add(_.subtract(A, B), C);
                                            // Calculate numerators: [D+E, D-E] -> [√2*b^(3/4)+√b∜ax, √2*b^(3/4)-√b∜ax]
                                            const D = _.parse(`${SQRT + br(2)}*${br(b)}^${br('3/4')}`);
                                            const E = _.parse(`${SQRT + br(b)}*${br(b)}^${br('1/4')}*${dx}`);
                                            // Let F = 2b√2∜b
                                            const F = _.parse(`${2}*${br(b)}*${SQRT}${br(2)}*${br(b)}^${br('1/4')}`);
                                            // Calculate the factors
                                            const L1 = _.divide(
                                                _.subtract(D.clone(), E.clone()),
                                                _.multiply(F.clone(), f2)
                                            );
                                            const L2 = _.divide(_.add(D, E), _.multiply(F, f1.clone()));
                                            retval = _.add(
                                                __.integrate(L1, dx, depth, opt),
                                                __.integrate(L2, dx, depth, opt)
                                            );
                                        } else // Let's try partial fractions
                                        {
                                            retval = __.integration.partial_fraction(symbol, dx, depth);
                                        }
                                    }
                                } else if (p === -1 / 2) {
                                    // Detect asin and atan
                                    if (x.group === S && x.power.equals(2)) {
                                        if (ax.multiplier.lessThan(0) && !b.multiplier.lessThan(0)) {
                                            a.negate();
                                            // It's asin
                                            if (b.isConstant() && a.isConstant()) {
                                                const d = _.symfunction(SQRT, [a.clone()]);
                                                const d2 = _.symfunction(SQRT, [_.multiply(a.clone(), b)]);
                                                retval = _.divide(
                                                    _.symfunction(ASIN, [_.divide(ax.toLinear(), d2)]),
                                                    d
                                                );
                                            }
                                            // I'm not sure about this one. I'm trusting Wolfram Alpha here
                                            else {
                                                const sqrt_a = _.symfunction(SQRT, [a]);
                                                const sqrt_ax = _.multiply(sqrt_a.clone(), x.clone().toLinear());
                                                retval = _.divide(
                                                    _.symfunction(ATAN, [
                                                        _.divide(sqrt_ax, _.symfunction(SQRT, [fn.clone()])),
                                                    ]),
                                                    sqrt_a
                                                );
                                            }
                                        } else {
                                            /* WHAT HAPPENS HERE???? e.g. integrate(3/sqrt(-a+b*x^2),x) or integrate(3/sqrt(a+b*x^2),x)*/
                                            __.integration.stop();
                                        }
                                    } else {
                                        // This would be a case like 1/(sqrt(1-x^3) or 1/(1-(x+1)^2)
                                        __.integration.stop();
                                    }
                                } else if (p === 1 / 2 && x.power.equals(2) && a.greaterThan(0)) {
                                    // TODO: Revisit
                                    // should become (sinh(2*acosh(x))/4-acosh(x)/2))
                                    __.integration.stop();
                                } else if (x.isLinear() && x.group !== PL) {
                                    retval = _.divide(__.integration.poly_integrate(symbol), a);
                                } else if (x.power.equals(2) && a.greaterThan(0)) {
                                    // 1/(a*x^2+b^2)^n
                                    // strip the value of b so b = 1
                                    const sqa = _.parse(SQRT + inBrackets(a)); // Strip a so b = 1
                                    const sqb = _.parse(SQRT + inBrackets(b));
                                    const aob = _.multiply(sqa.clone(), sqb.clone()).invert();
                                    const bsqi = _.pow(b, new NerdamerSymbol(symbol.power));
                                    const uv = core.Utils.getU(symbol);
                                    const u = _.multiply(aob, x.clone().toLinear());
                                    // Use symfunction instead of _.parse(ATAN + inBrackets(u)) to preserve
                                    // exact fractions. String concatenation triggers valueOf() which converts
                                    // fractions to decimals, and parsing them back loses precision.
                                    // e.g., 1/3 → "0.333..." → 321685687669321/965057063007964
                                    const v = _.symfunction(ATAN, [u]);
                                    // The conversion will be 1+tan(x)^2 -> sec(x)^2
                                    // since the denominator is now (sec(x)^2)^n and the numerator is sec(x)^2
                                    // then the remaining sec will be (n-1)*2;
                                    const n = (Math.abs(symbol.power) - 1) * 2;
                                    // 1/sec(x)^n can now be converted to cos(x)^n and we can pull the integral of that
                                    const integral = __.integrate(_.parse(`${COS + inBrackets(uv)}^${n}`));
                                    core.Utils.clearU(uv);
                                    return _.multiply(integral.sub(uv, v), bsqi);
                                } else if (symbol.group !== CB && !symbol.power.lessThan(0)) {
                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                } else {
                                    const f = symbol.clone().toLinear();
                                    const factored = core.Algebra.Factor.factorInner(f);
                                    const was_factored = factored.toString() !== f.toString();
                                    if (core.Algebra.degree(f, _.parse(dx)).equals(2) && !was_factored) {
                                        try {
                                            const sq = core.Algebra.sqComplete(f, dx);
                                            const u = core.Utils.getU(f);
                                            const f1 = sq.f.sub(sq.a, u);
                                            const fx = _.pow(f1, _.parse(symbol.power));
                                            retval = __.integrate(fx, u).sub(u, sq.a);
                                        } catch (e) {
                                            if (e.message === 'timeout') {
                                                throw e;
                                            }
                                            __.integration.stop();
                                        }
                                    } else {
                                        retval = __.integration.partial_fraction(symbol, dx, depth, opt);
                                    }
                                }
                                retval.multiplier = retval.multiplier.multiply(m);
                            }
                        } else if (g === FN) {
                            const arg = symbol.args[0];
                            const m = symbol.multiplier.clone();
                            symbol.toUnitMultiplier();
                            const decomp = __.integration.decompose_arg(arg, dx);
                            // Easies way I can think of to get the coefficient and to make sure
                            // that the symbol is linear wrt dx. I'm not actually trying to get the
                            // derivative
                            const a = decomp[0];
                            const x = decomp[1];
                            const { fname } = symbol;
                            // Log is a special case that can be handled with integration by parts
                            if (fname === LOG || fname === ASIN || fname === ACOS || (fname === ATAN && x.isLinear())) {
                                /* Integration by parts */
                                const p = symbol.power.toString();
                                if (isInt(p)) {
                                    depth -= p;
                                } // It needs more room to find the integral

                                if (!arg.isComposite()) {
                                    retval = _.multiply(_.parse(m), __.integration.by_parts(symbol, dx, depth, opt));
                                } else {
                                    // Integral u du
                                    const u = core.Utils.getU(symbol);
                                    const f = _.pow(_.parse(LOG + inBrackets(u)), new NerdamerSymbol(p));
                                    const du = __.diff(arg, dx);
                                    const u_du = _.multiply(f, du);
                                    const integral = __.integrate(u_du, u, depth, opt);
                                    retval = _.multiply(_.parse(m), integral.sub(u, arg));
                                }
                            } else if (fname === TAN && symbol.power.lessThan(0)) {
                                // Convert to cotangent
                                const sym = symbol.clone();
                                sym.power.negate();
                                sym.fname = COT;
                                return _.multiply(_.parse(m), __.integrate(sym, dx, depth));
                            } else {
                                if (!a.contains(dx, true) && symbol.isLinear()) {
                                    // Perform a deep search for safety
                                    // first handle the special cases
                                    if (fname === ABS) {
                                        // REVISIT **TODO**
                                        const absX = _.divide(arg.clone(), a.clone());
                                        if (absX.group === S && !absX.power.lessThan(0)) {
                                            if (core.Utils.even(absX.power)) {
                                                retval = __.integrate(arg, dx, depth);
                                            } else {
                                                const integrated = __.integrate(absX, dx, depth);
                                                integrated.power = integrated.power.subtract(new Frac(1));
                                                retval = _.multiply(
                                                    _.multiply(_.symfunction(ABS, [absX.toLinear()]), integrated),
                                                    a
                                                );
                                            }
                                        } else {
                                            __.integration.stop();
                                        }
                                    } else {
                                        const ag = symbol.args[0].group;
                                        const decomposed = __.integration.decompose_arg(arg, dx);

                                        if (
                                            !(ag === CP || ag === S || ag === CB) ||
                                            !decomposed[1].power.equals(1) ||
                                            arg.hasFunc()
                                        ) {
                                            __.integration.stop();
                                        }
                                        /** TODO */ // ASIN, ACOS, ATAN
                                        switch (fname) {
                                            case COS:
                                                retval = _.symfunction(SIN, [arg]);
                                                break;
                                            case SIN:
                                                retval = _.symfunction(COS, [arg]);
                                                retval.negate();
                                                break;
                                            case TAN:
                                                retval = _.parse(format(`${Settings.LOG}(sec({0}))`, arg));
                                                break;
                                            case SEC:
                                                retval = _.parse(format(`${Settings.LOG}(tan({0})+sec({0}))`, arg));
                                                break;
                                            case CSC:
                                                retval = _.parse(format(`-${Settings.LOG}(csc({0})+cot({0}))`, arg));
                                                break;
                                            case COT:
                                                retval = _.parse(format(`${Settings.LOG}(sin({0}))`, arg));
                                                break;
                                            case SINH:
                                                retval = _.symfunction(COSH, [arg]);
                                                break;
                                            case COSH:
                                                retval = _.symfunction(SINH, [arg]);
                                                break;
                                            case TANH:
                                                retval = _.parse(format(`${Settings.LOG}(cosh({0}))`, arg));
                                                break;
                                            case ASEC:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            case ACSC:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            case ACOT:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            // Inverse htrig
                                            case ASECH:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            case ACSCH:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            case ACOTH:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            // End inverse htrig
                                            // htrigh
                                            case SECH:
                                                retval = _.parse(format('atan(sinh({0}))', arg));
                                                break;
                                            case CSCH:
                                                retval = _.parse(format(`${Settings.LOG}(tanh(({0})/2))`, arg));
                                                break;
                                            case COTH:
                                                retval = _.parse(format(`${Settings.LOG}(sinh({0}))`, arg));
                                                break;
                                            // End htrig
                                            case EXP:
                                                retval = __.integrate(_.parse(format('e^({0})', arg)), dx, depth);
                                                break;
                                            case 'S': {
                                                const sArg = symbol.args[0].clone();
                                                const sDc = __.integration.decompose_arg(sArg, dx);
                                                const _sX_ = sDc[1]; // unused, x is used in format string
                                                const sA_ = sDc[0];
                                                const sB_ = sDc[3];
                                                retval = _.parse(
                                                    format(
                                                        '(cos((1/2)*pi*(({1})+({0})*({2}))^2)+pi*(({1})+({0})*({2}))*S(({1})+({0})*({2})))/(({0})*pi)',
                                                        sA_,
                                                        sB_,
                                                        x
                                                    )
                                                );
                                                break;
                                            }
                                            case 'C': {
                                                const cArg = symbol.args[0].clone();
                                                const cDc = __.integration.decompose_arg(cArg, dx);
                                                const cX_ = cDc[1];
                                                const cA_ = cDc[0];
                                                const cB_ = cDc[3];
                                                retval = _.parse(
                                                    format(
                                                        '(pi*(({1})+({0})*({2}))*C(({1})+({0})*({2}))-sin((1/2)*pi*(({1})+({0})*({2}))^2))/(({0})*pi)',
                                                        cA_,
                                                        cB_,
                                                        cX_
                                                    )
                                                );
                                                break;
                                            }
                                            case 'erf': {
                                                const erfArg = symbol.args[0].clone();
                                                const erfDc = __.integration.decompose_arg(erfArg, dx);
                                                const erfX_ = erfDc[1];
                                                const erfA_ = erfDc[0];
                                                retval = _.parse(
                                                    format(
                                                        'e^(-(({2}))^2)/(({0})*sqrt(pi))+(1/({0})+({1}))*erf(({2}))',
                                                        erfA_,
                                                        erfX_,
                                                        erfArg
                                                    )
                                                );
                                                break;
                                            }
                                            case 'sign':
                                                retval = _.multiply(symbol.clone(), arg.clone());
                                                break;
                                            default:
                                                __.integration.stop();
                                        }

                                        retval = _.divide(retval, a);
                                    }
                                } else if (x.isLinear()) {
                                    if (fname === COS || fname === SIN) {
                                        const p = Number(symbol.power);
                                        // Check to see if it's negative and then just transform it to sec or csc
                                        if (p < 0) {
                                            symbol.fname = fname === SIN ? CSC : SEC;
                                            symbol.invert().updateHash();
                                            retval = __.integrate(symbol, dx, depth);
                                        } else {
                                            const _innerArg = symbol.args[0];
                                            const rd = symbol.clone(); // Cos^(n-1)
                                            const rd2 = symbol.clone(); // Cos^(n-2)
                                            const q = new NerdamerSymbol((p - 1) / p); //
                                            const na = _.multiply(a.clone(), new NerdamerSymbol(p)).invert(); // 1/(n*a)
                                            rd.power = rd.power.subtract(new Frac(1));
                                            rd2.power = rd2.power.subtract(new Frac(2));

                                            const t = _.symfunction(fname === COS ? SIN : COS, [arg.clone()]);
                                            if (fname === SIN) {
                                                t.negate();
                                            }
                                            retval = _.add(
                                                _.multiply(_.multiply(na, rd), t),
                                                _.multiply(q, __.integrate(_.parse(rd2), dx, depth))
                                            );
                                        }
                                    }
                                    // Tan(x)^n or cot(x)^n
                                    else if (fname === TAN || fname === COT) {
                                        // http://www.sosmath.com/calculus/integration/moretrigpower/moretrigpower.html
                                        if (symbol.args[0].isLinear(dx)) {
                                            const n = symbol.power.subtract(new Frac(1)).toString();
                                            let r = symbol.clone().toUnitMultiplier();
                                            const w = _.parse(
                                                format(
                                                    `${fname === COT ? '-' : ''}1/({2}*{0})*{3}({1})^({0})`,
                                                    n,
                                                    arg,
                                                    a,
                                                    fname
                                                )
                                            );
                                            r.power = r.power.subtract(new Frac(2));
                                            if (r.power.equals(0)) {
                                                r = _.parse(r);
                                            }
                                            retval = _.subtract(w, __.integrate(r, dx, depth));
                                        }
                                    }
                                    // Sec(x)^n or csc(x)^n
                                    else if (fname === SEC || fname === CSC) {
                                        // http://www.sosmath.com/calculus/integration/moretrigpower/moretrigpower.html
                                        const n1 = symbol.power.subtract(new Frac(1)).toString();
                                        const n2 = symbol.power.subtract(new Frac(2)).toString();
                                        const f2 = fname === SEC ? TAN : COT;
                                        let r = symbol.clone().toUnitMultiplier();
                                        const parse_str = format(
                                            `${fname === CSC ? '-' : ''}1/({0}*{1})*{4}({3})^({2})*{5}({3})`,
                                            a,
                                            n1,
                                            n2,
                                            arg,
                                            fname,
                                            f2
                                        );
                                        const w = _.parse(parse_str);
                                        r.power = r.power.subtract(new Frac(2));
                                        if (r.power.equals(0)) {
                                            r = _.parse(r);
                                        }
                                        retval = _.add(
                                            w,
                                            _.multiply(new NerdamerSymbol(n2 / n1), __.integrate(r, dx, depth))
                                        );
                                    } else if ((fname === COSH || fname === SINH) && symbol.power.equals(2)) {
                                        retval = __.integrate(symbol.fnTransform(), dx, depth);
                                    } else {
                                        __.integration.stop();
                                    }
                                } else {
                                    __.integration.stop();
                                }

                                retval.multiplier = retval.multiplier.multiply(m);
                            }
                        } else if (g === PL) {
                            retval = __.integration.partial_fraction(symbol, dx, depth);
                        } else if (g === CB) {
                            const den = symbol.getDenom();
                            if (den.group === S) {
                                symbol = _.expand(symbol);
                            }

                            // Separate the coefficient since all we care about are symbols containing dx
                            let coeff = symbol.stripVar(dx);
                            // Now get only those that apply
                            let cfsymbol = _.divide(symbol.clone(), coeff.clone()); // A coeff free symbol
                            // peform a correction for stripVar. This is a serious TODO!
                            if (coeff.contains(dx)) {
                                cfsymbol = _.multiply(cfsymbol, coeff);
                                coeff = new NerdamerSymbol(1);
                            }

                            // If we only have one symbol left then let's not waste time. Just pull the integral
                            // and let the chips fall where they may
                            if (cfsymbol.group !== CB) {
                                if (cfsymbol.equals(1)) {
                                    return __.integrate(_.expand(symbol), dx, depth);
                                }

                                // Only factor for multivariate which are polynomials
                                if (
                                    cfsymbol.clone().toLinear().isPoly(true) &&
                                    core.Utils.variables(cfsymbol).length > 1
                                ) {
                                    cfsymbol = core.Algebra.Factor.factorInner(cfsymbol);
                                }

                                retval = __.integrate(cfsymbol, dx, depth);
                            } else {
                                // We collect the symbols and sort them descending group, descending power, descending alpabethically
                                const symbols = cfsymbol
                                    .collectSymbols()
                                    .sort((s1, s2) => {
                                        if (s1.group === s2.group) {
                                            if (Number(s1.power) === Number(s2.power)) {
                                                if (s1 < s2) {
                                                    return 1;
                                                } // I want sin first

                                                return -1;
                                            }
                                            return s2.power - s1.power; // Descending power
                                        }
                                        return s2.group - s1.group; // Descending groups
                                    })
                                    .map(elem => {
                                        const unwrapped = NerdamerSymbol.unwrapSQRT(elem, true);
                                        if (unwrapped.fname === EXP) {
                                            return _.parse(
                                                format('({1})*e^({0})', unwrapped.args[0], unwrapped.multiplier)
                                            );
                                        }
                                        return unwrapped;
                                    });
                                const l = symbols.length;
                                if (symbol.power < 0) {
                                    if (l === 2) {
                                        return __.integrate(_.expand(symbol), dx, depth, opt);
                                    }
                                }
                                // Otherwise the denominator is one lumped together symbol
                                else {
                                    // Generate an image for
                                    if (l === 2) {
                                        // Try u substitution
                                        try {
                                            retval = __.integration.u_substitution(symbols, dx);
                                        } catch (e) {
                                            /* Failed :`(*/
                                            if (e.message === 'timeout') {
                                                throw e;
                                            }
                                        }

                                        if (!retval) {
                                            // No success with u substitution so let's try known combinations
                                            // are they two functions
                                            const g1 = symbols[0].group;
                                            const g2 = symbols[1].group;
                                            let sym1 = symbols[0];
                                            let sym2 = symbols[1];
                                            const fn1 = sym1.fname;
                                            const fn2 = sym2.fname;
                                            // Reset the symbol minus the coeff
                                            symbol = _.multiply(sym1.clone(), sym2.clone());
                                            if (g1 === FN && g2 === FN) {
                                                if (fn1 === LOG || fn2 === LOG) {
                                                    retval = __.integration.by_parts(symbol.clone(), dx, depth, opt);
                                                } else {
                                                    symbols.sort((s1, s2) => s2.fname > s1.fname);
                                                    const arg1 = sym1.args[0];
                                                    // Make sure the arguments are suitable. We don't know how to integrate non-linear arguments
                                                    if (
                                                        !arg1.isLinear() ||
                                                        !(arg1.group === CP || arg1.group === CB || arg1.group === S)
                                                    ) {
                                                        __.integration.stop();
                                                    }

                                                    const decomp = __.integration.decompose_arg(arg1, dx);
                                                    const x = decomp[1];
                                                    const a = decomp[0];
                                                    if (!x.isLinear()) // Again... linear arguments only wrt x
                                                    {
                                                        __.integration.stop();
                                                    }

                                                    // They have to have the same arguments and then we have cleared all the check to
                                                    // make sure we can integrate FN & FN
                                                    const arg2 = sym2.args[0];
                                                    // Make sure that their argument matches
                                                    if (arg1.equals(arg2)) {
                                                        if (
                                                            (fn1 === SIN && fn2 === COS) ||
                                                            (fn1 === COS && fn2 === SIN)
                                                        ) {
                                                            if (sym1.power.lessThan(0)) {
                                                                __.integration.stop();
                                                            } // We don't know how to handle, sin(x)^n/cos(x)^m where m > n,  yet
                                                            // if it's in the form sin(x)^n*cos(x)^n then we can just return tan(x)^n which we know how to integrate
                                                            if (fn1 === SIN && sym1.power.add(sym2.power).equals(0)) {
                                                                sym1.fname = TAN;
                                                                sym1.updateHash();
                                                                retval = __.integrate(sym1, dx, depth);
                                                            } else if (
                                                                even(sym1.power) &&
                                                                fn2 === COS &&
                                                                sym2.power.lessThan(0)
                                                            ) {
                                                                // Transform sin^(2*n) to (1-cos^2)^n
                                                                const n = Number(sym1.power) / 2;
                                                                const new_sym = _.parse(
                                                                    format('(1-cos({0})^2)^({1})', sym1.args[0], n)
                                                                );
                                                                retval = __.integrate(
                                                                    _.expand(_.multiply(new_sym, sym2.clone())),
                                                                    dx,
                                                                    depth,
                                                                    opt
                                                                );
                                                            } else if (
                                                                even(sym1.power) &&
                                                                fn2 === SIN &&
                                                                sym2.power.lessThan(0)
                                                            ) {
                                                                // Transform cos^(2*n) to (1-sin^2)^n
                                                                const n = Number(sym1.power) / 2;
                                                                const new_sym = _.parse(
                                                                    format('(1-sin({0})^2)^({1})', sym1.args[0], n)
                                                                );
                                                                retval = __.integrate(
                                                                    _.expand(_.multiply(new_sym, sym2.clone())),
                                                                    dx,
                                                                    depth,
                                                                    opt
                                                                );
                                                            } else {
                                                                const p1_even = core.Utils.even(sym1.power);
                                                                const p2_even = core.Utils.even(sym2.power);
                                                                retval = new NerdamerSymbol(0);
                                                                if (!p1_even || !p2_even) {
                                                                    let u;
                                                                    let r;
                                                                    // Since cos(x) is odd it carries du. If sin was odd then it would be the other way around
                                                                    // know that p1 satifies the odd portion in this case. If p2 did than it would contain r
                                                                    if (!p1_even) {
                                                                        // U = sin(x)
                                                                        u = sym2;
                                                                        r = sym1;
                                                                    } else {
                                                                        u = sym1;
                                                                        r = sym2;
                                                                    }
                                                                    // Get the sign of du. In this case r carries du as stated before and D(cos(x),x) = -sin(x)
                                                                    const sign = u.fname === COS ? -1 : 1;
                                                                    const n = r.power;
                                                                    // Remove the du e.g. cos(x)^2*sin(x)^3 dx -> cos(x)^2*sin(x)^2*sin(x). We're left with two
                                                                    // even powers afterwards which can be transformed
                                                                    const k = (n - 1) / 2;
                                                                    // Make the transformation cos(x)^2 = 1 - sin(x)^2
                                                                    const trigTrans = _.parse(
                                                                        `(1-${u.fname}${core.Utils.inBrackets(
                                                                            arg1
                                                                        )}^2)^${k}`
                                                                    );
                                                                    const sym = _.expand(
                                                                        _.multiply(
                                                                            new NerdamerSymbol(sign),
                                                                            _.multiply(u.clone(), trigTrans)
                                                                        )
                                                                    );
                                                                    // We can now just loop through and integrate each since it's now just a polynomial with functions
                                                                    sym.each(elem => {
                                                                        retval = _.add(
                                                                            retval,
                                                                            __.integration.poly_integrate(elem.clone())
                                                                        );
                                                                    });
                                                                } else {
                                                                    // Performs double angle transformation
                                                                    const double_angle = function (s) {
                                                                        const pow = s.power;
                                                                        const k = pow / 2;
                                                                        let e;
                                                                        if (s.fname === COS) {
                                                                            e = `((1/2)+(cos(2*(${
                                                                                s.args[0]
                                                                            }))/2))^${k}`;
                                                                        } else {
                                                                            e = `((1/2)-(cos(2*(${
                                                                                s.args[0]
                                                                            }))/2))^${k}`;
                                                                        }

                                                                        return _.parse(e);
                                                                    };
                                                                    // They're both even so transform both using double angle identities and we'll just
                                                                    // be able to integrate by the sum of integrals
                                                                    const daA = double_angle(sym1);
                                                                    const daB = double_angle(sym2);
                                                                    const t = _.multiply(daA, daB);
                                                                    const sym = _.expand(t);
                                                                    sym.each(elem => {
                                                                        retval = _.add(
                                                                            retval,
                                                                            __.integrate(elem, dx, depth)
                                                                        );
                                                                    });
                                                                    return _.multiply(retval, coeff);
                                                                }
                                                            }
                                                        }
                                                        // Tan(x)*sec(x)^n
                                                        else if (
                                                            fn1 === SEC &&
                                                            fn2 === TAN &&
                                                            x.isLinear() &&
                                                            sym2.isLinear()
                                                        ) {
                                                            retval = _.parse(
                                                                format('sec({0})^({1})/({1})', sym1.args[0], sym1.power)
                                                            );
                                                        } else if (fn1 === TAN && fn2 === SEC && x.isLinear()) {
                                                            // Remaining: tan(x)^3*sec(x)^6
                                                            if (sym1.isLinear() && sym2.isLinear()) {
                                                                retval = _.divide(
                                                                    _.symfunction(SEC, [arg1.clone()]),
                                                                    a
                                                                );
                                                            } else if (even(sym1.power)) {
                                                                const p = Number(sym1.power) / 2;
                                                                // Transform tangent
                                                                const t = _.parse(
                                                                    format('(sec({0})^2-1)^({1})', sym1.args[0], p)
                                                                );
                                                                retval = __.integrate(
                                                                    _.expand(_.multiply(t, sym2)),
                                                                    dx,
                                                                    depth
                                                                );
                                                            } else {
                                                                __.integration.stop();
                                                            }
                                                        } else if (fn1 === SEC && fn2 === COS) {
                                                            sym1.fname = COS;
                                                            sym1.invert().updateHash();
                                                            retval = __.integrate(_.multiply(sym1, sym2), dx, depth);
                                                        } else if (fn1 === SIN && fn2 === CSC) {
                                                            sym2.fname = SIN;
                                                            sym2.invert().updateHash();
                                                            retval = __.integrate(_.multiply(sym1, sym2), dx, depth);
                                                        }
                                                        // Tan/cos
                                                        else if (
                                                            fn1 === TAN &&
                                                            (fn2 === COS || fn2 === SIN) &&
                                                            sym2.power.lessThan(0)
                                                        ) {
                                                            const t = _.multiply(sym1.fnTransform(), sym2);
                                                            retval = __.integrate(_.expand(t), dx, depth);
                                                        } else {
                                                            const t = _.multiply(
                                                                sym1.fnTransform(),
                                                                sym2.fnTransform()
                                                            );
                                                            retval = __.integrate(_.expand(t), dx, depth);
                                                        }
                                                    }
                                                    // TODO: In progress
                                                    else if (
                                                        (fn1 === SIN || fn1 === COS) &&
                                                        (fn2 === SIN || fn2 === COS)
                                                    ) {
                                                        if (sym1.isLinear() && sym2.isLinear()) {
                                                            // If in the form cos(a*x)*sin(b*x)
                                                            if (sym1.args[0].isLinear() && sym2.args[0].isLinear()) {
                                                                // Use identity (sin(b*x+a*x)+sin(b*x-a*x))/2
                                                                let ax;
                                                                let bx;
                                                                if (fn2 === SIN) {
                                                                    ax = sym1.args[0];
                                                                    bx = sym2.args[0];
                                                                } else {
                                                                    bx = sym1.args[0];
                                                                    ax = sym2.args[0];
                                                                }

                                                                // Make the transformation
                                                                const f = _.parse(
                                                                    format(
                                                                        '(sin(({1})+({0}))+sin(({1})-({0})))/2',
                                                                        ax.toString(),
                                                                        bx.toString()
                                                                    )
                                                                );

                                                                // Integrate it
                                                                retval = __.integrate(f, dx, depth);
                                                            } else {
                                                                const transformed = trigTransform(symbols);
                                                                retval = __.integrate(_.expand(transformed), dx, depth);
                                                            }
                                                        } else {
                                                            let transformed = new NerdamerSymbol(1);
                                                            symbols.map(s => {
                                                                const transformed_s = s.fnTransform();
                                                                transformed = _.multiply(transformed, transformed_s);
                                                            });
                                                            const t = _.expand(transformed);

                                                            retval = __.integrate(t, dx, depth);

                                                            if (retval.hasIntegral()) {
                                                                retval = __.integrate(
                                                                    trigTransform(transformed.collectSymbols()),
                                                                    dx,
                                                                    depth
                                                                );
                                                            }
                                                        }
                                                    } else {
                                                        __.integration.stop();
                                                    }
                                                }
                                            } else if (g1 === FN && g2 === S) {
                                                const sym1_is_linear = sym1.isLinear();
                                                if (sym1.fname === COS && sym1_is_linear && sym2.power.equals(-1)) {
                                                    retval = _.symfunction('Ci', [sym1.args[0]]);
                                                } else if (sym1.fname === COS && sym2.power.equals(-1)) {
                                                    retval = __.integrate(
                                                        _.multiply(sym1.fnTransform(), sym2.clone()),
                                                        dx,
                                                        depth
                                                    );
                                                } else if (
                                                    sym1.fname === COSH &&
                                                    sym1_is_linear &&
                                                    sym2.power.equals(-1)
                                                ) {
                                                    retval = _.symfunction('Chi', [sym1.args[0]]);
                                                } else if (sym1.fname === COSH && sym2.power.equals(-1)) {
                                                    retval = __.integrate(
                                                        _.multiply(sym1.fnTransform(), sym2.clone()),
                                                        dx,
                                                        depth
                                                    );
                                                } else if (
                                                    sym1.fname === SIN &&
                                                    sym1_is_linear &&
                                                    sym2.power.equals(-1)
                                                ) {
                                                    retval = _.symfunction('Si', [sym1.args[0]]);
                                                } else if (sym1.fname === SIN && sym2.power.equals(-1)) {
                                                    retval = __.integrate(
                                                        _.multiply(sym1.fnTransform(), sym2.clone()),
                                                        dx,
                                                        depth
                                                    );
                                                } else if (
                                                    sym1.fname === SINH &&
                                                    sym1_is_linear &&
                                                    sym2.power.equals(-1)
                                                ) {
                                                    retval = _.symfunction('Shi', [sym1.args[0]]);
                                                } else if (sym1.fname === SINH && sym2.power.equals(-1)) {
                                                    retval = __.integrate(
                                                        _.multiply(sym1.fnTransform(), sym2.clone()),
                                                        dx,
                                                        depth
                                                    );
                                                } else if (sym1.fname === LOG && sym2.power.equals(-1)) {
                                                    // Log(x)^n/x = log(x)^(n+1)/(n+1)
                                                    retval = __.integration.poly_integrate(sym1, dx, depth);
                                                } else if (sym1.fname === 'erf') {
                                                    if (sym2.power.equals(1)) {
                                                        const dc = __.integration.decompose_arg(sym1.args[0], dx);
                                                        const a_ = dc[0];
                                                        const x_ = dc[1];
                                                        const arg = sym1.args[0].toString();
                                                        retval = _.parse(
                                                            format(
                                                                '(e^(-(({2}))^2)*(sqrt(pi)*e^((({2}))^2)*(2*({0})^2*({1})^2-3)*erf(({2}))+2*({0})*({1})-2))/(4*sqrt(pi)*({0})^2)',
                                                                a_,
                                                                x_,
                                                                arg
                                                            )
                                                        );
                                                    }
                                                } else {
                                                    // Since group S is guaranteed convergence we need not worry about tracking depth of integration
                                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                }
                                            } else if (g1 === EX && g2 === S) {
                                                const x =
                                                    fn1 === LOG
                                                        ? __.integration.decompose_arg(sym1.args[0], dx)[1]
                                                        : null;
                                                if (
                                                    sym1.isE() &&
                                                    (sym1.power.group === S || sym1.power.group === CB) &&
                                                    sym2.power.equals(-1)
                                                ) {
                                                    retval = _.symfunction('Ei', [sym1.power.clone()]);
                                                } else if (fn1 === LOG && x.value === sym2.value) {
                                                    retval = __.integration.poly_integrate(sym1, dx, depth);
                                                } else {
                                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                }
                                            } else if (g1 === PL && g2 === S) {
                                                // First try to reduce the top
                                                if (sym2.value === sym1.value && sym1.power.equals(-1)) {
                                                    // Find the lowest power in the denominator
                                                    const pd = Math.min.apply(null, core.Utils.keys(sym1.symbols));
                                                    // Get the lowest common value between denominator and numerator
                                                    const pc = Math.min(pd, sym2.power);
                                                    // Reduce both denominator and numerator by that factor
                                                    const factor = sym2.clone();
                                                    factor.power = new Frac(pc);
                                                    sym2 = _.divide(sym2, factor.clone()); // Reduce the denominator
                                                    let t = new NerdamerSymbol(0);
                                                    sym1.each(elem => {
                                                        t = _.add(t, _.divide(elem.clone(), factor.clone()));
                                                    });
                                                    t.multiplier = sym1.multiplier;
                                                    symbol = _.divide(sym2, t);
                                                } else {
                                                    symbol = _.expand(symbol);
                                                }
                                                retval = __.integration.partial_fraction(symbol, dx, depth);
                                            } else if (g1 === CP && g2 === S) {
                                                const f = sym1.clone().toLinear();
                                                const f_is_linear = core.Algebra.degree(f, _.parse(dx)).equals(1);
                                                // Handle cases x^(2*n)/sqrt(1-x^2)
                                                if (sym1.power.equals(-1 / 2)) {
                                                    const decomp = __.integration.decompose_arg(
                                                        sym1.clone().toLinear(),
                                                        dx
                                                    );
                                                    const a = decomp[0].negate();
                                                    const x = decomp[1];
                                                    const b = decomp[3];
                                                    const p1 = Number(sym1.power);
                                                    const p2 = Number(sym2.power);
                                                    if (isInt(p2) && core.Utils.even(p2) && x.power.equals(2)) {
                                                        // If the substitution
                                                        let c = _.divide(
                                                            _.multiply(
                                                                _.pow(b.clone(), new NerdamerSymbol(2)),
                                                                _.symfunction(SQRT, [_.divide(b.clone(), a.clone())])
                                                            ),
                                                            _.pow(a.clone(), new NerdamerSymbol(2))
                                                        );
                                                        c = _.multiply(c, _.symfunction(SQRT, [b]).invert());
                                                        const dummy = _.parse('sin(u)');
                                                        dummy.power = dummy.power.multiply(sym2.power);
                                                        const integral = __.integrate(dummy, 'u', depth);
                                                        const bksub = _.parse(`${ASIN}(${SQRT}(${a}/${b})*${dx})`);
                                                        retval = _.multiply(
                                                            c,
                                                            integral.sub(new NerdamerSymbol('u'), bksub)
                                                        );
                                                    } else if (p1 === -1 / 2) {
                                                        const u_transform = function (func, subst) {
                                                            const intg = _.parse(
                                                                __.integrate(func, dx, depth, opt).sub(
                                                                    dx,
                                                                    format(subst, dx)
                                                                )
                                                            );
                                                            if (!intg.hasIntegral()) {
                                                                return intg;
                                                            }
                                                        };
                                                        if (p2 === -1) {
                                                            retval = u_transform(
                                                                _.expand(
                                                                    _.expand(
                                                                        _.pow(
                                                                            _.multiply(sym1.invert(), sym2.invert()),
                                                                            new NerdamerSymbol(2)
                                                                        )
                                                                    )
                                                                ).invert(),
                                                                'sqrt(1-1/({0})^2)'
                                                            );
                                                        } else if (p2 === -2) {
                                                            // Apply transformation to see if it matches asin(x)
                                                            retval = u_transform(
                                                                _.sqrt(
                                                                    _.expand(
                                                                        _.divide(
                                                                            _.pow(
                                                                                symbol,
                                                                                new NerdamerSymbol(2)
                                                                            ).invert(),
                                                                            _.pow(
                                                                                new NerdamerSymbol(dx),
                                                                                new NerdamerSymbol(2)
                                                                            )
                                                                        ).negate()
                                                                    )
                                                                ).invert(),
                                                                'sqrt(1-1/({0})^2)'
                                                            );
                                                        }
                                                    }
                                                } else if (sym1.power.equals(-1) && sym2.isLinear() && f_is_linear) {
                                                    retval = __.integration.partial_fraction(symbol, dx, depth);
                                                } else if (!sym1.power.lessThan(0) && isInt(sym1.power)) {
                                                    // Sum of integrals
                                                    const expanded = _.expand(sym1);
                                                    retval = new NerdamerSymbol(0);
                                                    expanded.each(elem => {
                                                        if (elem.group === PL) {
                                                            elem.each(inner => {
                                                                retval = _.add(
                                                                    retval,
                                                                    __.integrate(
                                                                        _.multiply(sym2.clone(), inner),
                                                                        dx,
                                                                        depth
                                                                    )
                                                                );
                                                            });
                                                        } else {
                                                            retval = _.add(
                                                                retval,
                                                                __.integrate(_.multiply(sym2.clone(), elem), dx, depth)
                                                            );
                                                        }
                                                    });
                                                } else if (sym1.power.lessThan(-2)) {
                                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                } else if (sym1.power.lessThan(0) && sym2.power.greaterThan(1)) {
                                                    const decomp = __.integration.decompose_arg(
                                                        sym1.clone().toLinear(),
                                                        dx
                                                    );
                                                    const _a = decomp[0].negate();
                                                    const x = decomp[1];
                                                    const b = decomp[3];
                                                    const fn = sym1.clone().toLinear();

                                                    if (x.group !== PL && x.isLinear()) {
                                                        const p = Number(sym2.power);
                                                        const du = '_u_';
                                                        const u = new NerdamerSymbol(du);
                                                        // Pull the integral with the subsitution
                                                        const U = _.expand(
                                                            _.divide(
                                                                _.pow(
                                                                    _.subtract(u.clone(), b.clone()),
                                                                    new NerdamerSymbol(p)
                                                                ),
                                                                u.clone()
                                                            )
                                                        );
                                                        const scope = {};

                                                        // Generate a scope for resubbing the symbol
                                                        scope[du] = fn;
                                                        const U2 = _.parse(U, scope);
                                                        retval = __.integrate(U2, dx, 0);
                                                    } else if (
                                                        sym2.power.greaterThan(x.power) ||
                                                        sym2.power.equals(x.power)
                                                    ) {
                                                        // Factor out coefficients
                                                        const factors = new core.Algebra.Classes.Factors();
                                                        sym1 = core.Algebra.Factor.coeffFactor(sym1.invert(), factors);
                                                        const div = core.Algebra.divide(sym2, sym1);
                                                        // It assumed that the result will be of group CB
                                                        if (div.group !== CB) {
                                                            retval = new NerdamerSymbol(0);
                                                            div.each(elem => {
                                                                retval = _.add(retval, __.integrate(elem, dx, depth));
                                                            });
                                                            // Put back the factors
                                                            factors.each(factor => {
                                                                retval = _.divide(retval, factor);
                                                            });

                                                            retval = _.expand(retval);
                                                        } else {
                                                            // Try something else
                                                            retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                        }
                                                    } else {
                                                        retval = __.integration.partial_fraction(symbol, dx, depth);
                                                    }
                                                } else {
                                                    // Handle cases such as (1-x^2)^(n/2)*x^(m) where n is odd ___ cracking knuckles... This can get a little hairy
                                                    if (sym1.power.den.equals(2)) {
                                                        // Assume the function is in the form (a^2-b*x^n)^(m/2)
                                                        const dc = __.integration.decompose_arg(
                                                            sym1.clone().toLinear(),
                                                            dx
                                                        );
                                                        // Using the above definition
                                                        const a = dc[3];
                                                        const x = dc[1];
                                                        const b = dc[0];
                                                        const _bx = dc[2];
                                                        if (x.power.equals(2) && b.lessThan(0)) {
                                                            // If n is even && b is negative
                                                            // make a equal 1 so we can do a trig sub
                                                            if (!a.equals(1)) {
                                                                // Divide a out of everything
                                                                // move a to the coeff
                                                                coeff = _.multiply(
                                                                    coeff,
                                                                    _.pow(a, new NerdamerSymbol(2))
                                                                );
                                                            }
                                                            const u = dx;
                                                            const c = _.divide(
                                                                _.pow(b.clone().negate(), new NerdamerSymbol(1 / 2)),
                                                                _.pow(a, new NerdamerSymbol(1 / 2))
                                                            );
                                                            const du = _.symfunction(COS, [new NerdamerSymbol(u)]);
                                                            const cosn = _.pow(
                                                                _.symfunction(COS, [new NerdamerSymbol(u)]),
                                                                new NerdamerSymbol(sym1.power.num)
                                                            );
                                                            const X = _.pow(
                                                                _.symfunction(SIN, [new NerdamerSymbol(u)]),
                                                                new NerdamerSymbol(sym2.power)
                                                            );
                                                            const val = _.multiply(_.multiply(cosn, du), X);
                                                            const integral = __.integrate(val, u, depth);
                                                            // But remember that u = asin(sqrt(b)*a*x)
                                                            retval = integral.sub(
                                                                u,
                                                                _.symfunction(ASIN, [
                                                                    _.multiply(new NerdamerSymbol(dx), c),
                                                                ])
                                                            );
                                                        } else {
                                                            retval = __.integration.partial_fraction(
                                                                symbol,
                                                                dx,
                                                                depth,
                                                                opt
                                                            );
                                                        }
                                                    } else if (f_is_linear) {
                                                        retval = __.integration.partial_fraction(symbol, dx, depth);
                                                    }
                                                }
                                            } else if (sym1.isComposite() && sym2.isComposite()) {
                                                // Sum of integrals
                                                retval = new NerdamerSymbol(0);
                                                if (sym1.power.greaterThan(0) && sym2.power.greaterThan(0)) {
                                                    // Combine and pull the integral of each
                                                    const sym = _.expand(symbol);
                                                    sym.each(elem => {
                                                        retval = _.add(retval, __.integrate(elem, dx, depth));
                                                    }, true);
                                                } else {
                                                    const p1 = Number(sym1.power);
                                                    const p2 = Number(sym2.power);
                                                    if (p1 < 0 && p2 > 0) {
                                                        // Swap
                                                        const t = sym1;
                                                        sym1 = sym2;
                                                        sym2 = t;
                                                    }
                                                    if (p1 === -1 && p2 === -1) {
                                                        retval = __.integration.partial_fraction(symbol, dx);
                                                    } else {
                                                        sym1.each(elem => {
                                                            const k = _.multiply(elem, sym2.clone());
                                                            const intg = __.integrate(k, dx, depth);
                                                            retval = _.add(retval, intg);
                                                        });
                                                    }
                                                }
                                            } else if (g1 === CP && symbols[0].power.greaterThan(0)) {
                                                sym1 = _.expand(sym1);
                                                retval = new NerdamerSymbol(0);
                                                sym1.each(elem => {
                                                    retval = _.add(
                                                        retval,
                                                        __.integrate(_.multiply(elem, sym2.clone()), dx, depth)
                                                    );
                                                }, true);
                                            } else if (g1 === FN && g2 === EX && core.Utils.in_htrig(sym1.fname)) {
                                                sym1 = sym1.fnTransform();
                                                retval = __.integrate(_.expand(_.multiply(sym1, sym2)), dx, depth);
                                            } else if ((g1 === FN && g2 === CP) || (g2 === FN && g1 === CP)) {
                                                if (g2 === FN && g1 === CP) {
                                                    const t = sym1;
                                                    sym1 = sym2;
                                                    sym2 = t; // Swap
                                                }
                                                let p;
                                                let q;
                                                let sa;
                                                let sb;
                                                const du = NerdamerSymbol.unwrapSQRT(__.diff(sym1.clone(), dx), true);
                                                const sym2_clone = NerdamerSymbol.unwrapSQRT(sym2, true);
                                                if (du.power.equals(sym2_clone.power)) {
                                                    p = new NerdamerSymbol(sym2.power);
                                                    sa = du.clone().toLinear();
                                                    sb = sym2.clone().toLinear();
                                                    q = core.Algebra.divide(sa.toLinear(), sb);
                                                    if (q.isConstant()) {
                                                        const nq = _.pow(q, p.negate());
                                                        retval = _.multiply(
                                                            nq,
                                                            __.integration.poly_integrate(sym1.clone())
                                                        );
                                                    }
                                                } else {
                                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                }
                                            } else {
                                                const syma = sym1.clone().toLinear();
                                                const symb = sym2.clone().toLinear();
                                                if (
                                                    g1 === EX &&
                                                    g2 === EX &&
                                                    sym1.power.contains(dx) &&
                                                    sym2.power.contains(dx) &&
                                                    !syma.contains(dx) &&
                                                    !symb.contains(dx)
                                                ) {
                                                    retval = _.parse(
                                                        format(
                                                            '(({0})^(({2})*({4}))*({1})^(({3})*({4})))/(log(({0})^({2}))+log(({1})^({3})))',
                                                            syma.toString(),
                                                            symb.toString(),
                                                            sym1.power.multiplier.toString(),
                                                            sym2.power.multiplier.toString(),
                                                            dx
                                                        )
                                                    );
                                                } else {
                                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                }
                                            }
                                        }
                                    } else if (
                                        l === 3 &&
                                        ((symbols[2].group === S && symbols[2].power.lessThan(2)) ||
                                            symbols[0].group === CP)
                                    ) {
                                        let first = symbols[0];
                                        if (first.group === CP) {
                                            // TODO {support higher powers of x in the future}
                                            if (first.power.greaterThan(1)) {
                                                first = _.expand(first);
                                            }
                                            const r = _.multiply(symbols[1], symbols[2]);
                                            retval = new NerdamerSymbol(0);
                                            first.each(elem => {
                                                const prod = _.multiply(elem, r.clone());
                                                const intg = __.integrate(prod, dx, depth);
                                                retval = _.add(retval, intg);
                                            }, true);
                                        } else {
                                            // Try integration by parts although technically it will never work
                                            retval = __.integration.by_parts(symbol, dx, depth, opt);
                                        }
                                    } else if (all_functions(symbols)) {
                                        let t = new NerdamerSymbol(1);
                                        for (let i = 0, len = symbols.length; i < len; i++) {
                                            t = _.multiply(t, symbols[i].fnTransform());
                                        }
                                        t = _.expand(t);
                                        retval = __.integrate(t, dx, depth);
                                    } else {
                                        // One more go
                                        const transformed = trigTransform(symbols);
                                        retval = __.integrate(_.expand(transformed), dx, depth);
                                    }
                                }
                            }

                            retval = _.multiply(retval, coeff);
                        }
                        // If an integral was found then we return it
                        if (retval) {
                            return retval;
                        }
                    } catch (error) {
                        if (error.message === 'timeout') {
                            throw error;
                        }
                        // Do nothing if it's a NoIntegralFound error otherwise let it bubble
                        if (!(error instanceof NoIntegralFound || error instanceof core.exceptions.DivisionByZero)) {
                            throw error;
                        }
                    }

                    // No symbol found so we return the integral again
                    return _.symfunction('integrate', [original_symbol, dt]);
                },
                false
            );
        },
        defint(symbol, from, to, dx) {
            dx ||= 'x'; // Make x the default variable of integration
            const get_value = function (integral, vars, point) {
                try {
                    return _.parse(integral, vars);
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    // It failed for some reason so return the limit
                    const lim = __.Limit.limit(integral, dx, point);
                    return lim;
                }
            };

            const vars = core.Utils.variables(symbol);
            const hasTrig = symbol.hasTrig();
            let retval;
            let integral;

            // Fix #593 - Only assume the first variable if dx is not defined.
            if (vars.length === 1 && !dx) {
                dx = vars[0];
            }

            if (!hasTrig) {
                integral = __.integrate(symbol, dx);
            }

            if (!hasTrig && !integral.hasIntegral()) {
                const upper = {};
                const lower = {};
                upper[dx] = to;
                lower[dx] = from;

                const a = get_value(integral, upper, to, dx);
                const b = get_value(integral, lower, from, dx);
                retval = _.subtract(a, b);
            } else if (vars.length === 1 && from.isConstant() && to.isConstant()) {
                const f = core.Utils.build(symbol);
                retval = new NerdamerSymbol(core.Math2.num_integrate(f, Number(from), Number(to)));
            } else {
                retval = _.symfunction('defint', [symbol, from, to, dx]);
            }
            return retval;
        },

        Limit: {
            interval(start, end) {
                return _.parse(format('[{0}, {1}]', start, end));
            },
            diverges() {
                return __.Limit.interval('-Infinity', 'Infinity');
            },
            divide(f, g, x, lim, depth) {
                if (depth++ > Settings.max_lim_depth) {
                    return;
                }

                const _fin = f.clone();
                const gin = g.clone();

                // But first a little "cheating". x/|x| ends up in an infinite loop since the d/dx |x| -> x/|x|
                // To break this loop we simply provide the answer. Keep in mind that currently limit only provides
                // the two-sided limit.
                // Known limit
                if (g.fname === ABS) {
                    const sign = f.sign();
                    const lim_sign = lim.sign();

                    if (lim.isInfinity) {
                        return _.multiply(new NerdamerSymbol(sign), new NerdamerSymbol(lim_sign));
                    }
                    if (lim.equals(0)) {
                        const fm = _.parse(f.multiplier);
                        const gm = _.parse(g.multiplier);
                        return _.divide(_.multiply(fm, __.Limit.interval('-1', '1')), gm);
                    }
                    // TODO: Support more limits
                    __.Limit.diverges();
                }

                const isInfinity = function (L) {
                    if (core.Utils.isVector(L)) {
                        for (let i = 0; i < L.elements.length; i++) {
                            if (!L.elements[i].isInfinity) {
                                return false;
                            }
                        }
                        return true;
                    }
                    return L.isInfinity;
                };

                const equals = function (L, v) {
                    if (core.Utils.isVector(L)) {
                        return false;
                    }
                    return L.equals(v);
                };

                let retval;
                let count = 0;
                let lim1;
                let lim2;
                let indeterminate;
                // Let fOrig = f.clone();
                // let gOrig = g.clone();
                do {
                    lim1 = evaluate(__.Limit.limit(f.clone(), x, lim, depth));
                    lim2 = evaluate(__.Limit.limit(g.clone(), x, lim, depth));

                    // If it's in indeterminate form apply L'Hopital's rule
                    indeterminate = (isInfinity(lim1) && isInfinity(lim2)) || (equals(lim1, 0) && equals(lim2, 0));
                    // Pull the derivatives
                    if (indeterminate) {
                        const ft = __.diff(f.clone(), x);
                        const gt = __.diff(g.clone(), x);

                        // Expanding here causes issue #12.
                        // there is something fishy with expand that we will
                        // have to find some day.
                        // let t_symbol = _.expand(_.divide(ft, gt));
                        const t_symbol = _.divide(ft, gt);
                        f = t_symbol.getNum();
                        g = t_symbol.getDenom();
                    }
                } while (indeterminate && ++count < Settings.max_lim_depth);

                if (count >= Settings.max_lim_depth) {
                    // Console.log("L'Hospital likely endless loop");
                    // console.log("  f:"+f);
                    // console.log("  g:"+g);
                    return;
                }

                // REMEMBER:
                // - 1/cos(x)
                // n/0 is still possible since we only checked for 0/0
                const den_is_zero = lim2.equals(0);
                const p = Number(gin.power);

                if (lim.isConstant(true) && den_is_zero) {
                    retval = NerdamerSymbol.infinity(core.Utils.even(p) && lim1.lessThan(0) ? -1 : undefined);
                } else if (den_is_zero) {
                    retval = __.Limit.diverges();
                } else {
                    retval = _.divide(lim1, lim2);
                }

                return retval;
            },
            rewriteToLog(symbol) {
                const p = symbol.power.clone();
                symbol.toLinear();
                return _.pow(new NerdamerSymbol('e'), _.multiply(p, _.symfunction(`${Settings.LOG}`, [symbol])));
            },
            getSubbed(f, x, lim) {
                let retval;
                // 1. rewrite EX with base e
                if (f.group === EX) {
                    f = __.rewriteToLog(f);
                }
                // 2. try simple substitution
                try {
                    retval = f.sub(x, lim);
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    // Nope. No go, so just return the unsubbed function so we can test the limit instead.
                    retval = f;
                }

                return retval;
            },
            isInterval(limit) {
                return core.Utils.isVector(limit);
            },
            isConvergent(limit) {
                // It's not convergent if it lies on the interval -Infinity to Infinity
                if (
                    // It lies on the interval -Infinity to Infinity
                    (__.Limit.isInterval(limit) && limit.elements[0].isInfinity && limit.elements[1].isInfinity) ||
                    // We weren't able to calculate the limit
                    limit.containsFunction('limit')
                ) {
                    return false; // Then no
                }
                return true; // It is
            },
            limit(symbol, x, lim, depth) {
                // Simplify the symbol
                if (symbol.isLinear() && symbol.isComposite()) {
                    // Apply sum of limits
                    let limit = new NerdamerSymbol(0);
                    symbol.each(s => {
                        limit = _.add(limit, __.Limit.limit(s, x, lim, depth));
                    }, true);

                    return limit;
                }
                symbol = core.Algebra.Simplify.simplify(symbol);

                depth ||= 1;

                if (depth++ > Settings.max_lim_depth) {
                    return;
                }

                // Store the multiplier
                const m = _.parse(symbol.multiplier);
                // Strip the multiplier
                symbol.toUnitMultiplier();
                // https://en.wikipedia.org/wiki/List_of_limits
                let retval;
                try {
                    // We try the simplest option first where c is some limit
                    // lim a as x->c = a where c
                    if (symbol.isConstant(true)) {
                        retval = symbol;
                    } else {
                        const point = {};
                        point[x] = lim;
                        // Lim x as x->c = c where c

                        try {
                            // Evaluate the function at the given limit
                            const t = _.parse(symbol.sub(x, lim), point);

                            // A constant or infinity is known so we're done
                            if (t.isConstant(true) || t.isInfinity) {
                                retval = t;
                            }
                        } catch (e) {
                            /* Nothing. Maybe we tried to divide by zero.*/
                            if (e.message === 'timeout') {
                                throw e;
                            }
                        }
                        if (!retval) {
                            // Split the symbol in the numerator and the denominator
                            const num = symbol.getNum();
                            const den = symbol.getDenom();

                            if (den.isConstant(true)) {
                                // We still don't have a limit so we generate tests.
                                if (symbol.group === EX) {
                                    // https://en.wikipedia.org/wiki/List_of_limits
                                    // Speed boost for exponentials by detecting patterns
                                    const f = symbol.clone().toLinear();
                                    const _p = symbol.power.clone();
                                    const _num = f.getNum();
                                    const _den = f.getDenom();
                                    const fn = core.Utils.decompose_fn(_den, x, true);
                                    // Start detection of pattern (x/(x+1))^x
                                    if (
                                        _num.group === S &&
                                        _num.multiplier.isOne() &&
                                        fn.ax.group === S &&
                                        fn.b.isConstant(true) &&
                                        fn.a.isOne() &&
                                        fn.b.isConstant(true)
                                    ) {
                                        retval = _.parse(format('(1/e^({0}))', fn.b));
                                    } else {
                                        const symbol_ = __.Limit.rewriteToLog(symbol.clone());
                                        // Get the base
                                        const pow = symbol_.power.clone();
                                        const base = symbol_.clone().toLinear();
                                        const lim_base = __.Limit.limit(base, x, lim, depth);
                                        const lim_pow = __.Limit.limit(pow, x, lim, depth);
                                        retval = _.pow(lim_base, lim_pow);
                                    }
                                } else if (symbol.group === FN && symbol.args.length === 1) {
                                    let evaluates;
                                    // Squeeze theorem lim f(g(x)) = lim f(lim g))
                                    const arg = __.Limit.limit(symbol.args[0], x, lim, depth);
                                    if (core.Utils.isVector(arg)) {
                                        // Get the limit over that interval
                                        retval = arg.map(e => {
                                            const clone = symbol.clone();
                                            clone.args[0] = e;
                                            return __.Limit.limit(_.symfunction(symbol.fname, [e]), x, lim, depth);
                                        });

                                        return _.multiply(m, retval);
                                    }
                                    // If the argument is constant then we're done
                                    let trial;
                                    if (arg.isConstant(true)) {
                                        // Double check that it evaluates
                                        trial = _.symfunction(symbol.fname, [arg]);
                                        // Trial evaluation
                                        try {
                                            evaluate(trial);
                                            evaluates = true;
                                        } catch (e) {
                                            if (e.message === 'timeout') {
                                                throw e;
                                            }

                                            evaluates = false;
                                        }
                                    }
                                    if (evaluates) {
                                        retval = trial;
                                    } else {
                                        // If the limit converges. We'll deal with non-convergent ones later
                                        if (__.Limit.isConvergent(arg)) {
                                            if (symbol.fname === LOG) {
                                                switch (arg.toString()) {
                                                    // Lim -> 0
                                                    case '0':
                                                        retval = NerdamerSymbol.infinity().negate();
                                                        break;
                                                    case 'Infinity':
                                                        retval = NerdamerSymbol.infinity();
                                                        break;
                                                    case '-Infinity':
                                                        retval = NerdamerSymbol.infinity();
                                                        break;
                                                }
                                            } else if (
                                                (symbol.fname === COS || symbol.fname === SIN) &&
                                                lim.isInfinity
                                            ) {
                                                retval = __.Limit.interval(-1, 1);
                                            } else if (symbol.fname === TAN) {
                                                const s_arg = symbol.args[0];
                                                const n = s_arg.getNum();
                                                const d = s_arg.getDenom();
                                                const pi = n.toUnitMultiplier();
                                                if (lim.isInfinity || (pi.equals('pi') && d.equals(2))) {
                                                    retval = __.Limit.diverges();
                                                }
                                            } else if (symbol.fname === Settings.FACTORIAL) {
                                                if (arg.isInfinity) {
                                                    return NerdamerSymbol.infinity();
                                                }
                                            }
                                        }
                                    }
                                } else if (symbol.group === S) {
                                    if (symbol.power > 0) // These functions always converge to the limit
                                    {
                                        return _.parse(symbol, point);
                                    }
                                    // We're dealing with 1/x^n but remember that infinity has already been dealt
                                    // with by substitution
                                    if (core.Utils.even(symbol.power)) {
                                        // Even powers converge to infinity
                                        retval = NerdamerSymbol.infinity();
                                    } else {
                                        // Odd ones don't
                                        retval = __.Limit.diverges();
                                    }
                                } else if (symbol.group === CB) {
                                    let lim1;
                                    let lim2;
                                    // Loop through all the symbols
                                    // thus => lim f*g*h = lim (f*g)*h = (lim f*g)*(lim h)
                                    // symbols of lower groups are generally easier to differentiatee so get them to the right by first sorting
                                    const symbols = symbol.collectSymbols().sort((a, b) => a.group - b.group);

                                    let f = symbols.pop();
                                    // Calculate the first limit so we can keep going down the list
                                    lim1 = evaluate(__.Limit.limit(f, x, lim, depth));

                                    // Reduces all the limits one at a time
                                    while (symbols.length) {
                                        // Get the second limit
                                        let g = symbols.pop();
                                        // Get the limit of g
                                        lim2 = evaluate(__.Limit.limit(g, x, lim, depth));

                                        // If the limit is in indeterminate form aplly L'Hospital by inverting g and then f/(1/g)
                                        if (
                                            lim1.isInfinity ||
                                            (!__.Limit.isConvergent(lim1) && lim2.equals(0)) ||
                                            (lim1.equals(0) && __.Limit.isConvergent(lim2))
                                        ) {
                                            if (g.containsFunction(LOG)) {
                                                // Swap them
                                                g = [f, (f = g)][0];
                                            }
                                            // Invert the symbol
                                            g.invert();

                                            // Product of infinities
                                            if (lim1.isInfinity && lim2.isInfinity) {
                                                lim1 = NerdamerSymbol.infinity();
                                            } else {
                                                lim1 = __.Limit.divide(f, g, x, lim, depth);
                                            }
                                        } else {
                                            // Lim f*g = (lim f)*(lim g)
                                            lim1 = _.multiply(lim1, lim2);
                                            // Let f*g equal f and h equal g
                                            f = _.multiply(f, g);
                                        }
                                    }

                                    // Done, lim1 is the limit we're looking for
                                    retval = lim1;
                                } else if (symbol.isComposite()) {
                                    let _lim;
                                    if (!symbol.isLinear()) {
                                        symbol = _.expand(symbol);
                                    }
                                    // Apply lim f+g = (lim f)+(lim g)
                                    retval = new NerdamerSymbol(0);

                                    let symbols = symbol.collectSymbols().sort((a, b) => b.group - a.group);

                                    const _symbols = [];
                                    // Analyze the functions first
                                    let fns = new NerdamerSymbol(0);
                                    for (let i = 0, l = symbols.length; i < l; i++) {
                                        const sym = symbols[i].clone();
                                        if (sym.group === FN || (sym.group === CB && sym.hasFunc())) {
                                            fns = _.add(fns, sym);
                                        } else {
                                            _symbols.push(sym);
                                        }
                                    }
                                    _symbols.unshift(fns);

                                    // Make sure that we didn't just repackage the exact same symbol
                                    if (_symbols.length !== 1) {
                                        symbols = _symbols;
                                    }

                                    for (let i = 0, l = symbols.length; i < l; i++) {
                                        const sym = symbols[i];
                                        // If the addition of the limits is undefined then the limit diverges so return -infinity to infinity
                                        try {
                                            _lim = __.Limit.limit(sym, x, lim, depth);
                                        } catch (e) {
                                            if (e.message === 'timeout') {
                                                throw e;
                                            }
                                            _lim = __.Limit.diverges();
                                        }

                                        try {
                                            retval = _.add(retval, _lim);
                                        } catch (e) {
                                            if (e.message === 'timeout') {
                                                throw e;
                                            }
                                            if (depth++ > Settings.max_lim_depth) {
                                                return;
                                            }
                                            retval = __.Limit.limit(__.diff(symbol, x), x, lim, depth);
                                        }
                                    }
                                }
                            } else {
                                retval = __.Limit.divide(num, den, x, lim, depth);
                            }
                        }
                    }

                    // If we still don't have a solution
                    if (!retval) // Return it symbolically
                    {
                        retval = _.symfunction('limit', [symbol, x, lim]);
                    }
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    // If all else fails return the symbolic function
                    retval = _.symfunction('limit', [symbol, x, lim]);
                }

                return _.multiply(m, retval);
            },
        },
        Fresnel: {
            S(x) {
                if (x.isConstant(true)) {
                    return __.defint(_.parse('sin(pi*x^2/2)'), NerdamerSymbol(0), x, 'x');
                }
                return _.symfunction('S', arguments);
            },
            C(x) {
                if (x.isConstant(true)) {
                    return __.defint(_.parse('cos(pi*x^2/2)'), NerdamerSymbol(0), x, 'x');
                }
                return _.symfunction('C', arguments);
            },
        },
    });

    nerdamer.register([
        {
            name: 'diff',
            visible: true,
            numargs: [1, 3],
            build() {
                return __.diff;
            },
        },
        {
            name: 'sum',
            visible: true,
            numargs: 4,
            build() {
                return __.sum;
            },
        },
        {
            name: 'product',
            visible: true,
            numargs: 4,
            build() {
                return __.product;
            },
        },
        {
            name: 'integrate',
            visible: true,
            numargs: [1, 2],
            build() {
                return __.integrate;
            },
        },
        {
            name: 'defint',
            visible: true,
            numargs: [3, 4],
            build() {
                return __.defint;
            },
        },
        {
            name: 'S',
            visible: true,
            numargs: 1,
            build() {
                return __.Fresnel.S;
            },
        },
        {
            name: 'C',
            visible: true,
            numargs: 1,
            build() {
                return __.Fresnel.C;
            },
        },
        {
            name: 'limit',
            visible: true,
            numargs: [3, 4],
            build() {
                return __.Limit.limit;
            },
        },
    ]);
    // Link registered functions externally
    nerdamer.updateAPI();
})();
