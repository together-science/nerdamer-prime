// @ts-nocheck
/* global module */

/*
 * Author : Martin Donk
 * Website : http://www.nerdamer.com
 * Email : martin.r.donk@gmail.com
 * Source : https://github.com/jiggzson/nerdamer
 */

if (typeof module !== 'undefined' && typeof nerdamer === 'undefined') {
    var nerdamer = require('./nerdamer.core.js');
    require('./Algebra.js');
}

(function () {
    'use strict';

    var core = nerdamer.getCore(),
        _ = core.PARSER,
        Frac = core.Frac,
        Settings = core.Settings,
        isSymbol = core.Utils.isSymbol,
        FN = core.groups.FN,
        NerdamerSymbol = core.NerdamerSymbol,
        text = core.Utils.text,
        inBrackets = core.Utils.inBrackets,
        isInt = core.Utils.isInt,
        format = core.Utils.format,
        even = core.Utils.even,
        evaluate = core.Utils.evaluate,
        N = core.groups.N,
        S = core.groups.S,
        FN = core.groups.FN,
        PL = core.groups.PL,
        CP = core.groups.CP,
        CB = core.groups.CB,
        EX = core.groups.EX,
        P = core.groups.P,
        LOG = Settings.LOG,
        EXP = 'exp',
        ABS = 'abs',
        SQRT = 'sqrt',
        SIN = 'sin',
        COS = 'cos',
        TAN = 'tan',
        SEC = 'sec',
        CSC = 'csc',
        COT = 'cot',
        ASIN = 'asin',
        ACOS = 'acos',
        ATAN = 'atan',
        ASEC = 'asec',
        ACSC = 'acsc',
        ACOT = 'acot',
        SINH = 'sinh',
        COSH = 'cosh',
        TANH = 'tanh',
        CSCH = 'csch',
        SECH = 'sech',
        COTH = 'coth',
        ASECH = 'asech',
        ACSCH = 'acsch',
        ACOTH = 'acoth';

    //custom errors
    function NoIntegralFound(msg) {
        this.message = msg || '';
    }
    NoIntegralFound.prototype = new Error();

    //Preparations
    NerdamerSymbol.prototype.hasIntegral = function () {
        return this.containsFunction('integrate');
    };
    //transforms a function
    NerdamerSymbol.prototype.fnTransform = function () {
        if (this.group !== FN) {
            return this;
        }
        let retval,
            a = this.args[0];
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
                    //retval = _.parse(format('(1-cos(2*({0})))/(1+cos(2*({0})))', a));
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
        //cos(a*x)^(2*n) or sin(a*x)^(2*n)
        else if ((this.fname === COS || this.fname === SIN) && even(this.power)) {
            const n = this.power / 2;
            //convert to a double angle
            const double_angle = _.pow(this.clone().toLinear(), _.parse(2)).fnTransform();
            //raise to the n and expand
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
        //transform x/a+x -> (ax+x)/a
        if (symbol.isComposite() && symbol.isLinear()) {
            const m = new NerdamerSymbol(symbol.multiplier);
            let denominator = new NerdamerSymbol(1);
            let numerator = new NerdamerSymbol(0);
            symbol.each(x => {
                denominator = _.multiply(denominator, x.getDenom());
            }, true);

            //remove the denomitor in each term
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
    //A function to check if a function name is an inverse trig function
    core.Utils.in_inverse_trig = function (x) {
        const inv_trig_fns = [ASIN, ACOS, ATAN, ACSC, ASEC, ACOT];
        return inv_trig_fns.indexOf(x) !== -1;
    };
    //A function to check if a function name is a trig function
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
        //get the variables if not supplied
        if (!vars) {
            vars = core.Utils.arrayGetVariables(eqns);
        }

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
        //make an initial guess
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
        }),
        cosAsinBtransform = (core.Utils.cosAsinBtranform = function (symbol1, symbol2) {
            let a, b;
            a = symbol1.args[0];
            b = symbol2.args[0];
            return _.parse(format('(sin(({0})+({1}))-sin(({0})-({1})))/2', a, b));
        }),
        cosAsinAtransform = (core.Utils.cosAsinAtranform = function (symbol1, symbol2) {
            //TODO: temporary fix for integrate(e^x*sin(x)*cos(x)^2).
            //we technically know how to do this transform but more is needed for correct output
            if (Number(symbol2.power) !== 1) {
                return _.multiply(symbol1, symbol2);
            }
            let a;
            a = symbol1.args[0];
            return _.parse(format('(sin(2*({0})))/2', a));
        }),
        sinAsinBtransform = (core.Utils.cosAsinBtranform = function (symbol1, symbol2) {
            let a, b;
            a = symbol1.args[0];
            b = symbol2.args[0];
            return _.parse(format('(cos(({0})+({1}))-cos(({0})-({1})))/2', a, b));
        }),
        trigTransform = (core.Utils.trigTransform = function (arr) {
            let map = {},
                symbol,
                t,
                retval = new NerdamerSymbol(1);
            for (let i = 0, l = arr.length; i < l; i++) {
                symbol = arr[i];

                if (symbol.group === FN) {
                    const fname = symbol.fname;

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
                            //This should actually be redundant code but let's put just in case
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

            //put back the remaining functions
            for (const x in map) {
                retval = _.multiply(retval, map[x]);
            }

            return retval;
        });

    core.Settings.integration_depth = 10;

    core.Settings.max_lim_depth = 10;

    var __ = (core.Calculus = {
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
                    let f = fn.text(),
                        subs = { '~': true }, //lock subs. Is this even being used?
                        retval = new core.NerdamerSymbol(0);

                    for (let i = start; i <= end; i++) {
                        subs[index] = new NerdamerSymbol(i);
                        const ans = _.parse(f, subs);
                        retval = _.add(retval, ans);
                    }
                    return retval;
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

                    let f = fn.text(),
                        subs = {},
                        retval = new core.NerdamerSymbol(1);

                    for (let i = start; i <= end; i++) {
                        subs[index] = new NerdamerSymbol(i);
                        retval = _.multiply(retval, _.parse(f, subs));
                    }
                    return retval;
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
            } else if (core.Utils.isMatrix(symbol)) {
                const matrix = new core.Matrix();
                symbol.each((x, i, j) => {
                    matrix.set(i, j, __.diff(x, wrt, nth));
                });
                return matrix;
            } else if (symbol.LHS && symbol.RHS) {
                // equation, diff both sides
                const result = new core.Equation(
                    __.diff(symbol.LHS.clone(), wrt, nth),
                    __.diff(symbol.RHS.clone(), wrt, nth)
                );
                return result;
            }

            let d = isSymbol(wrt) ? wrt.text() : wrt;
            //the nth derivative
            nth = isSymbol(nth) ? nth.multiplier : nth || 1;

            if (d === undefined) {
                d = core.Utils.variables(symbol)[0];
            }

            //unwrap sqrt
            if (symbol.group === FN && symbol.fname === SQRT) {
                const s = symbol.args[0],
                    sp = symbol.power.clone();
                //these groups go to zero anyway so why waste time?
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
                symbol = _.multiply(a, b); //chain rule
            } else {
                symbol = derive(symbol);
            }

            if (nth > 1) {
                nth--;
                symbol = __.diff(symbol, wrt, nth);
            }

            return symbol;

            // Equivalent to "derivative of the outside".
            function polydiff(symbol) {
                if (symbol.value === d || symbol.contains(d, true)) {
                    symbol.multiplier = symbol.multiplier.multiply(symbol.power);
                    symbol.power = symbol.power.subtract(new Frac(1));
                    if (symbol.power.equals(0)) {
                        symbol = NerdamerSymbol(symbol.multiplier);
                    }
                }

                return symbol;
            }

            function derive(symbol) {
                let g = symbol.group,
                    _a,
                    b,
                    cp;

                if (g === N || (g === S && symbol.value !== d) || g === P) {
                    symbol = NerdamerSymbol(0);
                } else if (g === S) {
                    symbol = polydiff(symbol);
                } else if (g === CB) {
                    const m = symbol.multiplier.clone();
                    symbol.toUnitMultiplier();
                    const retval = _.multiply(product_rule(symbol), polydiff(symbol));
                    retval.multiplier = retval.multiplier.multiply(m);
                    return retval;
                } else if (g === FN && symbol.power.equals(1)) {
                    // Table of known derivatives
                    const m = symbol.multiplier.clone();
                    symbol.toUnitMultiplier();

                    switch (symbol.fname) {
                        case LOG:
                            cp = symbol.clone();
                            symbol = symbol.args[0].clone(); //get the arguments
                            symbol.power = symbol.power.negate();
                            symbol.multiplier = cp.multiplier.divide(symbol.multiplier);
                            break;
                        case COS:
                            //cos -> -sin
                            symbol.fname = SIN;
                            symbol.multiplier.negate();
                            break;
                        case SIN:
                            //sin -> cos
                            symbol.fname = COS;
                            break;
                        case TAN:
                            //tan -> sec^2
                            symbol.fname = SEC;
                            symbol.power = new Frac(2);
                            break;
                        case SEC:
                            // Use a clone if this gives errors
                            symbol = qdiff(symbol, TAN);
                            break;
                        case CSC:
                            symbol = qdiff(symbol, '-cot');
                            break;
                        case COT:
                            symbol.fname = CSC;
                            symbol.multiplier.negate();
                            symbol.power = new Frac(2);
                            break;
                        case ASIN:
                            symbol = _.parse(`(sqrt(1-(${text(symbol.args[0])})^2))^(-1)`);
                            break;
                        case ACOS:
                            symbol = _.parse(`-(sqrt(1-(${text(symbol.args[0])})^2))^(-1)`);
                            break;
                        case ATAN:
                            symbol = _.parse(`(1+(${text(symbol.args[0])})^2)^(-1)`);
                            break;
                        case ABS:
                            //depending on the complexity of the symbol it's easier to just parse it into a new symbol
                            //this should really be readdressed soon
                            b = symbol.args[0].clone();
                            b.toUnitMultiplier();
                            symbol = _.parse(`${inBrackets(text(symbol.args[0]))}/abs${inBrackets(text(b))}`);
                            break;
                        case 'parens':
                            //see product rule: f'.g goes to zero since f' will return zero. This way we only get back
                            //1*g'
                            symbol = NerdamerSymbol(1);
                            break;
                        case 'cosh':
                            //cosh -> -sinh
                            symbol.fname = 'sinh';
                            break;
                        case 'sinh':
                            //sinh -> cosh
                            symbol.fname = 'cosh';
                            break;
                        case TANH:
                            //tanh -> sech^2
                            symbol.fname = SECH;
                            symbol.power = new Frac(2);
                            break;
                        case SECH:
                            // Use a clone if this gives errors
                            symbol = qdiff(symbol, '-tanh');
                            break;
                        case CSCH:
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`-coth(${arg})*csch(${arg})`);
                            break;
                        case COTH:
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`-csch(${arg})^2`);
                            break;
                        case 'asinh':
                            symbol = _.parse(`(sqrt(1+(${text(symbol.args[0])})^2))^(-1)`);
                            break;
                        case 'acosh':
                            symbol = _.parse(`(sqrt(-1+(${text(symbol.args[0])})^2))^(-1)`);
                            break;
                        case 'atanh':
                            symbol = _.parse(`(1-(${text(symbol.args[0])})^2)^(-1)`);
                            break;
                        case ASECH:
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`-1/(sqrt(1/(${arg})^2-1)*(${arg})^2)`);
                            break;
                        case ACOTH:
                            symbol = _.parse(`-1/((${symbol.args[0]})^2-1)`);
                            break;
                        case ACSCH:
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`-1/(sqrt(1/(${arg})^2+1)*(${arg})^2)`);
                            break;
                        case ASEC:
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`1/(sqrt(1-1/(${arg})^2)*(${arg})^2)`);
                            break;
                        case ACSC:
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`-1/(sqrt(1-1/(${arg})^2)*(${arg})^2)`);
                            break;
                        case ACOT:
                            symbol = _.parse(`-1/((${symbol.args[0]})^2+1)`);
                            break;
                        case 'S':
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`sin((pi*(${arg})^2)/2)`);
                            break;
                        case 'C':
                            var arg = String(symbol.args[0]);
                            symbol = _.parse(`cos((pi*(${arg})^2)/2)`);
                            break;
                        case 'Si':
                            var arg = symbol.args[0];
                            symbol = _.parse(`sin(${arg})/(${arg})`);
                            break;
                        case 'Shi':
                            var arg = symbol.args[0];
                            symbol = _.parse(`sinh(${arg})/(${arg})`);
                            break;
                        case 'Ci':
                            var arg = symbol.args[0];
                            symbol = _.parse(`cos(${arg})/(${arg})`);
                            break;
                        case 'Chi':
                            var arg = symbol.args[0];
                            symbol = _.parse(`cosh(${arg})/(${arg})`);
                            break;
                        case 'Ei':
                            var arg = symbol.args[0];
                            symbol = _.parse(`e^(${arg})/(${arg})`);
                            break;
                        case 'Li':
                            var arg = symbol.args[0];
                            symbol = _.parse(`1/${Settings.LOG}(${arg})`);
                            break;
                        case 'erf':
                            symbol = _.parse(`(2*e^(-(${symbol.args[0]})^2))/sqrt(pi)`);
                            break;
                        case 'atan2':
                            var x_ = String(symbol.args[0]),
                                y_ = String(symbol.args[1]);
                            symbol = _.parse(`(${y_})/((${y_})^2+(${x_})^2)`);
                            break;
                        case 'sign':
                            symbol = new NerdamerSymbol(0);
                            break;
                        case 'sinc':
                            symbol = _.parse(format('(({0})*cos({0})-sin({0}))*({0})^(-2)', symbol.args[0]));
                            break;
                        case Settings.LOG10:
                            symbol = _.parse(`1/((${symbol.args[0]})*${Settings.LOG}(10))`);
                            break;
                        default:
                            symbol = _.symfunction('diff', [symbol, wrt]);
                    }
                    symbol.multiplier = symbol.multiplier.multiply(m);
                } else if (g === EX || (g === FN && isSymbol(symbol.power))) {
                    let value;
                    if (g === EX) {
                        value = symbol.value;
                    } else if (g === FN && symbol.contains(d)) {
                        value = symbol.fname + inBrackets(text(symbol.args[0]));
                    } else {
                        value = symbol.value + inBrackets(text(symbol.args[0]));
                    }
                    b = __.diff(_.multiply(_.parse(LOG + inBrackets(value)), symbol.power.clone()), d);
                    symbol = _.multiply(symbol, b);
                } else if (g === FN && !symbol.power.equals(1)) {
                    b = symbol.clone();
                    b.toLinear();
                    b.toUnitMultiplier();
                    symbol = _.multiply(polydiff(symbol.clone()), derive(b));
                } else if (g === CP || g === PL) {
                    // Note: Do not use `parse` since this puts back the sqrt and causes a bug as in #610. Use clone.
                    const c = symbol.clone();
                    let result = new NerdamerSymbol(0);
                    for (const x in symbol.symbols) {
                        result = _.add(result, __.diff(symbol.symbols[x].clone(), d));
                    }
                    symbol = _.multiply(polydiff(c), result);
                }

                symbol.updateHash();

                return symbol;
            }
            function qdiff(symbol, val, altVal) {
                return _.multiply(symbol, _.parse(val + inBrackets(altVal || text(symbol.args[0]))));
            }
            function product_rule(symbol) {
                //grab all the symbols within the CB symbol
                let symbols = symbol.collectSymbols(),
                    result = new NerdamerSymbol(0),
                    l = symbols.length;
                //loop over all the symbols
                for (let i = 0; i < l; i++) {
                    let df = __.diff(symbols[i].clone(), d);
                    for (let j = 0; j < l; j++) {
                        //skip the symbol of which we just pulled the derivative
                        if (i !== j) {
                            //multiply out the remaining symbols
                            df = _.multiply(df, symbols[j].clone());
                        }
                    }
                    //add the derivative to the result
                    result = _.add(result, df);
                }
                return result; //done
            }
        },
        integration: {
            u_substitution(symbols, dx) {
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

                var a = symbols[0].clone(),
                    b = symbols[1].clone(),
                    g1 = a.group,
                    g2 = b.group,
                    //may cause problems if person is using this already. Will need
                    //to find algorithm for detecting conflict
                    u = '__u__',
                    Q;
                if (g1 === FN && g2 !== FN) {
                    //e.g. 2*x*cos(x^2)
                    var arg = a.args[0];
                    Q = try_combo(b, arg.clone());
                    if (Q) {
                        return _.multiply(Q, do_fn_sub(a.fname, arg));
                    }
                    Q = try_combo(b, a);
                    if (Q) {
                        return __.integration.poly_integrate(a);
                    }
                } else if (g2 === FN && g1 !== FN) {
                    //e.g. 2*(x+1)*cos((x+1)^2
                    var arg = b.args[0];
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
                    var p = a.power;
                    Q = try_combo(b, p.clone());
                    if (!Q) {
                        //one more try
                        const dc = __.integration.decompose_arg(p.clone(), dx);
                        //consider the possibility of a^x^(n-1)*x^n dx
                        const xp = __.diff(dc[2].clone(), dx);
                        const dc2 = __.integration.decompose_arg(xp.clone(), dx);
                        //if their powers equal, so if dx*p == b
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
                    var integrated = __.integrate(a.sub(p.clone(), new NerdamerSymbol(u)), u, 0),
                        retval = _.multiply(integrated.sub(new NerdamerSymbol(u), p), Q);

                    return retval;
                } else if (g2 === EX && g1 !== EX) {
                    var p = b.power;
                    Q = try_combo(a, p.clone());
                    var integrated = __.integrate(b.sub(p, new NerdamerSymbol(u)), u, 0);
                    return _.multiply(integrated.sub(new NerdamerSymbol(u), p), Q);
                } else if (a.isComposite() || b.isComposite()) {
                    const f = function (a, b) {
                        const d = __.diff(b, dx);
                        const A = core.Algebra.Factor.factorInner(a),
                            B = core.Algebra.Factor.factorInner(d);
                        const q = _.divide(A, B);
                        return q;
                    };
                    const f1 = a.isComposite() ? a.clone().toLinear() : a.clone(),
                        f2 = b.isComposite() ? b.clone().toLinear() : b.clone();
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
            //simple integration of a single polynomial x^(n+1)/(n+1)
            poly_integrate(x) {
                const p = x.power.toString(),
                    m = x.multiplier.toDecimal(),
                    s = x.toUnitMultiplier().toLinear();
                if (Number(p) === -1) {
                    return _.multiply(new NerdamerSymbol(m), _.symfunction(LOG, [s]));
                }
                return _.parse(format('({0})*({1})^(({2})+1)/(({2})+1)', m, s, p));
            },
            //If we're just spinning wheels we want to stop. This is why we
            //wrap integration in a try catch block and call this to stop.
            stop(msg) {
                msg = msg || 'Unable to compute integral!';
                core.Utils.warn(msg);
                throw new NoIntegralFound(msg);
            },
            partial_fraction(input, dx, depth, opt) {
                //TODO: This whole thing needs to be rolled into one but for now I'll leave it as two separate parts
                if (!isSymbol(dx)) {
                    dx = _.parse(dx);
                }

                let result, partial_fractions;
                result = new NerdamerSymbol(0);
                partial_fractions = core.Algebra.PartFrac.partfrac(input, dx);

                if (partial_fractions.group === CB && partial_fractions.isLinear()) {
                    //perform a quick check to make sure that all partial fractions are linear
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
                        /*L*/
                    ],
                    [
                        /*I*/
                    ],
                    [
                        /*A*/
                    ],
                    [
                        /*T*/
                    ],
                    [
                        /*E*/
                    ],
                ];
                //first we sort them
                const setSymbol = function (x) {
                    const g = x.group;
                    if (g === FN) {
                        const fname = x.fname;
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
                let u,
                    dv = new NerdamerSymbol(1);
                //compile u and dv
                for (let i = 0; i < 5; i++) {
                    var part = parts[i],
                        t,
                        l = part.length;
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
                            u = t; //the first u encountered gets chosen
                            u.multiplier = u.multiplier.multiply(symbol.multiplier); //the first one gets the mutliplier
                        } else {
                            dv = _.multiply(dv, t);
                        } //everything else belongs to dv
                    }
                }

                return [u, dv];
            },

            trig_sub(symbol, dx, depth, opt, parts, _symbols) {
                parts = parts || __.integration.decompose_arg(symbol.clone().toLinear(), dx);
                const _b = parts[3],
                    _ax = parts[2],
                    a = parts[0],
                    x = parts[1];
                if (x.power.equals(2) && a.greaterThan(0)) {
                    //use tan(x)
                    const t = core.Utils.getU(symbol), //get an appropriate u
                        u = _.parse(TAN + inBrackets(t)), //u
                        du = _.parse(`${SEC + inBrackets(t)}^2`), //du
                        f = _.multiply(symbol.sub(x, u), du);
                    const integral = __.integrate(f, t, depth, opt).sub(u, x);
                    core.Utils.clearU(u);
                    return integral;
                }
            },

            by_parts(symbol, dx, depth, o) {
                o.previous = o.previous || [];
                let udv, u, dv, du, v, vdu, uv, retval, integral_vdu, m, c, vdu_s;
                //first LIATE
                udv = __.integration.get_udv(symbol);
                u = udv[0];
                dv = udv[1];
                du = NerdamerSymbol.unwrapSQRT(_.expand(__.diff(u.clone(), dx)), true);
                c = du.clone().stripVar(dx);
                //strip any coefficients
                du = _.divide(du, c.clone());
                v = __.integrate(dv.clone(), dx, depth || 0);
                vdu = _.multiply(v.clone(), du);
                vdu_s = vdu.toString();
                //currently only supports e^x*(some trig)
                if (o.previous.indexOf(vdu_s) !== -1 && core.Utils.in_trig(u.fname) && dv.isE()) {
                    //We're going to exploit the fact that vdu can never be constant
                    //to work out way out of this cycle. We'll return the length of
                    //the this.previous array until we're back at level one
                    o.is_cyclic = true;
                    //return the integral.
                    return new NerdamerSymbol(1);
                } else {
                    o.previous.push(vdu_s);
                }

                uv = _.multiply(u, v);
                //clear the multiplier so we're dealing with a bare integral
                m = vdu.multiplier.clone();
                vdu.toUnitMultiplier();
                integral_vdu = _.multiply(__.integrate(vdu.clone(), dx, depth, o), c);
                integral_vdu.multiplier = integral_vdu.multiplier.multiply(m);
                retval = _.subtract(uv, integral_vdu);
                //we know that there cannot be constants so they're a holdover from a cyclic integral
                if (o.is_cyclic) {
                    //start popping the previous stack so we know how deep in we are
                    o.previous.pop();
                    if (o.previous.length === 0) {
                        retval = _.expand(retval);
                        let rem = new NerdamerSymbol(0);
                        retval.each(x => {
                            if (!x.contains(dx)) {
                                rem = _.add(rem, x.clone());
                            }
                        });
                        //get the actual uv
                        retval = _.divide(_.subtract(retval, rem.clone()), _.subtract(new NerdamerSymbol(1), rem));
                    }
                }

                return retval;
            },
            /*
             * dependents: [Solve, integrate]
             */
            decompose_arg: core.Utils.decompose_fn,
        },
        //TODO: nerdamer.integrate('-e^(-a*t)*sin(t)', 't') -> gives incorrect output
        integrate(original_symbol, dt, depth, opt) {
            //assume integration wrt independent variable if expression only has one variable
            if (!dt) {
                const vars = core.Utils.variables(original_symbol);
                if (vars.length === 1) {
                    dt = vars[0];
                }
                //defaults to x
                dt = dt || 'x';
            }
            //add support for integrating vectors
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
            //get rid of constants right away
            if (original_symbol.isConstant(true)) {
                return _.multiply(original_symbol.clone(), _.parse(dt));
            }

            //configurations options for integral. This is needed for tracking extra options
            //e.g. cyclic integrals or additional settings
            opt = opt || {};
            return core.Utils.block(
                'PARSE2NUMBER',
                () => {
                    //make a note of the original symbol. Set only if undefined
                    depth = depth || 0;
                    let dx = isSymbol(dt) ? dt.toString() : dt,
                        //we don't want the symbol in sqrt form. x^(1/2) is prefererred
                        symbol = NerdamerSymbol.unwrapSQRT(original_symbol.clone(), true),
                        g = symbol.group,
                        retval;

                    try {
                        //We stop integration after x amount of recursive calls
                        if (++depth > core.Settings.integration_depth) {
                            __.integration.stop('Maximum depth reached. Exiting!');
                        }

                        //constants. We first eliminate anything that doesn't have dx. Everything after this has
                        //to have dx or else it would have been taken care of below
                        if (!symbol.contains(dx, true)) {
                            retval = _.multiply(symbol.clone(), _.parse(dx));
                        }
                        //e.g. 2*x
                        else if (g === S) {
                            retval = __.integration.poly_integrate(symbol, dx, depth);
                        } else if (g === EX) {
                            if (
                                symbol.previousGroup === FN &&
                                !(symbol.fname === 'sqrt' || symbol.fname === Settings.PARENTHESIS)
                            ) {
                                __.integration.stop();
                            }
                            //check the base
                            if (symbol.contains(dx) && symbol.previousGroup !== FN) {
                                //if the symbol also contains dx then we stop since we currently
                                //don't know what to do with it e.g. x^x
                                if (symbol.power.contains(dx)) {
                                    __.integration.stop();
                                } else {
                                    var t = __.diff(symbol.clone().toLinear(), dx);
                                    if (t.contains(dx)) {
                                        __.integration.stop();
                                    }
                                    //since at this point it's the base only then we do standard single poly integration
                                    //e.g. x^y
                                    retval = __.integration.poly_integrate(symbol, dx, depth);
                                }
                            }
                            //e.g. a^x or 9^x
                            else {
                                var a = __.diff(symbol.power.clone(), dx);
                                if (a.contains(dx)) {
                                    var aa = a.stripVar(dx),
                                        x = _.divide(a.clone(), aa.clone());
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
                                    } else {
                                        __.integration.stop();
                                    }
                                }
                                if (symbol.isE()) {
                                    if (a.isLinear()) {
                                        retval = symbol;
                                    } else {
                                        if (a.isE() && a.power.group === S && a.power.power.equals(1)) {
                                            retval = _.multiply(
                                                _.symfunction('Ei', [symbol.power.clone()]),
                                                symbol.power
                                            );
                                        } else {
                                            __.integration.stop();
                                        }
                                    }
                                } else {
                                    var d = _.symfunction(LOG, [_.parse(symbol.value)]);
                                    retval = _.divide(symbol, d);
                                }
                                retval = _.divide(retval, a);
                            }
                        } else if (symbol.isComposite() && symbol.isLinear()) {
                            var m = _.parse(symbol.multiplier);
                            symbol.toUnitMultiplier();
                            retval = new NerdamerSymbol(0);
                            symbol.each(x => {
                                retval = _.add(retval, __.integrate(x, dx, depth));
                            });
                            retval = _.multiply(m, retval);
                        } else if (g === CP) {
                            if (symbol.power.greaterThan(1)) {
                                symbol = _.expand(symbol);
                            }
                            if (symbol.power.equals(1)) {
                                retval = new NerdamerSymbol(0);
                                symbol.each(x => {
                                    retval = _.add(retval, __.integrate(x, dx, depth));
                                }, true);
                            } else {
                                var p = Number(symbol.power),
                                    m = symbol.multiplier.clone(); //temporarily remove the multiplier
                                symbol.toUnitMultiplier();
                                var //below we consider the form ax+b
                                    fn = symbol.clone().toLinear(), //get just the pure function without the power
                                    decomp = __.integration.decompose_arg(fn, dx),
                                    //I have no idea why I used bx+a and not ax+b. TODO change this to something that makes sense
                                    b = decomp[3],
                                    ax = decomp[2],
                                    a = decomp[0],
                                    x = decomp[1];
                                if (p === -1 && x.group !== PL && x.power.equals(2)) {
                                    const b_is_positive = isInt(b) ? b > 0 : true;
                                    //we can now check for atan
                                    if (x.group === S && x.power.equals(2) && b_is_positive) {
                                        ////then we have atan
                                        //abs is redundants since the sign appears in both denom and num.
                                        const unwrapAbs = function (s) {
                                            let result = new NerdamerSymbol(1);
                                            s.each(x => {
                                                result = _.multiply(result, x.fname === 'abs' ? x.args[0] : x);
                                            });
                                            return result;
                                        };
                                        var A = a.clone(),
                                            B = b.clone();
                                        A = _.pow(A, new NerdamerSymbol(1 / 2));
                                        B = _.pow(B, new NerdamerSymbol(1 / 2));
                                        //unwrap abs

                                        var d = _.multiply(unwrapAbs(B), unwrapAbs(A)),
                                            f = _.symfunction(ATAN, [_.divide(_.multiply(a, x.toLinear()), d.clone())]);
                                        retval = _.divide(f, d);
                                    } else if (x.group === S && x.isLinear()) {
                                        retval = _.divide(__.integration.poly_integrate(symbol), a);
                                    } else {
                                        //1/(x^4+1)
                                        if (x.power.equals(4)) {
                                            //https://www.freemathhelp.com/forum/threads/55678-difficult-integration-int-1-(1-x-4)-dx
                                            var A, B, C, D, E, F, _f1, _f2, _f3, _f4, L1, L2;
                                            const br = inBrackets;
                                            //apply rule: ax^4+b = (√ax^2+√2∜a∜bx+√b)(√ax^2-√2∜a∜bx+√b)
                                            //get quadratic factors
                                            A = _.parse(`${SQRT + br(a)}*${dx}^2`);
                                            B = _.parse(
                                                `${SQRT + br(2)}*${br(a)}^${br('1/4')}*${br(b)}^${br('1/4')}*${dx}`
                                            );
                                            C = _.parse(SQRT + br(b));
                                            f1 = _.add(_.add(A.clone(), B.clone()), C.clone());
                                            f2 = _.add(_.subtract(A, B), C);
                                            //calculate numerators: [D+E, D-E] -> [√2*b^(3/4)+√b∜ax, √2*b^(3/4)-√b∜ax]
                                            D = _.parse(`${SQRT + br(2)}*${br(b)}^${br('3/4')}`);
                                            E = _.parse(`${SQRT + br(b)}*${br(b)}^${br('1/4')}*${dx}`);
                                            //let F = 2b√2∜b
                                            F = _.parse(`${2}*${br(b)}*${SQRT}${br(2)}*${br(b)}^${br('1/4')}`);
                                            //calculate the factors
                                            L1 = _.divide(_.subtract(D.clone(), E.clone()), _.multiply(F.clone(), f2));
                                            L2 = _.divide(_.add(D, E), _.multiply(F, f1.clone()));
                                            retval = _.add(
                                                __.integrate(L1, dx, depth, opt),
                                                __.integrate(L2, dx, depth, opt)
                                            );
                                        } else //let's try partial fractions
                                        {
                                            retval = __.integration.partial_fraction(symbol, dx, depth);
                                        }
                                    }
                                } else if (p === -1 / 2) {
                                    //detect asin and atan
                                    if (x.group === S && x.power.equals(2)) {
                                        if (ax.multiplier.lessThan(0) && !b.multiplier.lessThan(0)) {
                                            a.negate();
                                            //it's asin
                                            if (b.isConstant() && a.isConstant()) {
                                                var d = _.symfunction(SQRT, [a.clone()]),
                                                    d2 = _.symfunction(SQRT, [_.multiply(a.clone(), b)]);
                                                retval = _.divide(
                                                    _.symfunction(ASIN, [_.divide(ax.toLinear(), d2)]),
                                                    d
                                                );
                                            }
                                            //I'm not sure about this one. I'm trusting Wolfram Alpha here
                                            else {
                                                const sqrt_a = _.symfunction(SQRT, [a]),
                                                    sqrt_ax = _.multiply(sqrt_a.clone(), x.clone().toLinear());
                                                retval = _.divide(
                                                    _.symfunction(ATAN, [
                                                        _.divide(sqrt_ax, _.symfunction(SQRT, [fn.clone()])),
                                                    ]),
                                                    sqrt_a
                                                );
                                            }
                                        } else {
                                            /*WHAT HAPPENS HERE???? e.g. integrate(3/sqrt(-a+b*x^2),x) or integrate(3/sqrt(a+b*x^2),x)*/
                                            __.integration.stop();
                                        }
                                    } else {
                                        //This would be a case like 1/(sqrt(1-x^3) or 1/(1-(x+1)^2)
                                        __.integration.stop();
                                    }
                                } else if (p === 1 / 2 && x.power.equals(2) && a.greaterThan(0)) {
                                    // TODO: Revisit
                                    // should become (sinh(2*acosh(x))/4-acosh(x)/2))
                                    __.integration.stop();
                                } else {
                                    if (x.isLinear() && x.group !== PL) {
                                        retval = _.divide(__.integration.poly_integrate(symbol), a);
                                    } else if (x.power.equals(2) && a.greaterThan(0)) {
                                        var sqa, sqb, aob, bsqi, n, integral, u, v, uv;
                                        //1/(a*x^2+b^2)^n
                                        //strip the value of b so b = 1
                                        sqa = _.parse(SQRT + inBrackets(a)); //strip a so b = 1
                                        sqb = _.parse(SQRT + inBrackets(b));
                                        aob = _.multiply(sqa.clone(), sqb.clone()).invert();
                                        bsqi = _.pow(b, new NerdamerSymbol(symbol.power));
                                        uv = core.Utils.getU(symbol);
                                        u = _.multiply(aob, x.clone().toLinear());
                                        // Use symfunction instead of _.parse(ATAN + inBrackets(u)) to preserve
                                        // exact fractions. String concatenation triggers valueOf() which converts
                                        // fractions to decimals, and parsing them back loses precision.
                                        // e.g., 1/3 → "0.333..." → 321685687669321/965057063007964
                                        v = _.symfunction(ATAN, [u]);
                                        //the conversion will be 1+tan(x)^2 -> sec(x)^2
                                        //since the denominator is now (sec(x)^2)^n and the numerator is sec(x)^2
                                        //then the remaining sec will be (n-1)*2;
                                        var n = (Math.abs(symbol.power) - 1) * 2;
                                        //1/sec(x)^n can now be converted to cos(x)^n and we can pull the integral of that
                                        var integral = __.integrate(_.parse(`${COS + inBrackets(uv)}^${n}`));
                                        core.Utils.clearU(uv);
                                        return _.multiply(integral.sub(uv, v), bsqi);
                                    } else {
                                        if (symbol.group !== CB && !symbol.power.lessThan(0)) {
                                            retval = __.integration.by_parts(symbol, dx, depth, opt);
                                        } else {
                                            var f = symbol.clone().toLinear();
                                            const factored = core.Algebra.Factor.factorInner(f);
                                            const was_factored = factored.toString() !== f.toString();
                                            if (core.Algebra.degree(f, _.parse(dx)).equals(2) && !was_factored) {
                                                try {
                                                    var f1, fx, u, sq;
                                                    sq = core.Algebra.sqComplete(f, dx);
                                                    u = core.Utils.getU(f);
                                                    f1 = sq.f.sub(sq.a, u);
                                                    fx = _.pow(f1, _.parse(symbol.power));
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
                                    }
                                }
                                retval.multiplier = retval.multiplier.multiply(m);
                            }
                        } else if (g === FN) {
                            var arg = symbol.args[0],
                                m = symbol.multiplier.clone();
                            symbol.toUnitMultiplier();
                            var decomp = __.integration.decompose_arg(arg, dx);
                            //easies way I can think of to get the coefficient and to make sure
                            //that the symbol is linear wrt dx. I'm not actually trying to get the
                            //derivative
                            var a = decomp[0],
                                x = decomp[1],
                                fname = symbol.fname;
                            //log is a special case that can be handled with integration by parts
                            if (fname === LOG || fname === ASIN || fname === ACOS || (fname === ATAN && x.isLinear())) {
                                /*integration by parts */
                                var p = symbol.power.toString();
                                if (isInt(p)) {
                                    depth = depth - p;
                                } //it needs more room to find the integral

                                if (!arg.isComposite()) {
                                    retval = _.multiply(_.parse(m), __.integration.by_parts(symbol, dx, depth, opt));
                                } else {
                                    //integral u du
                                    var u = core.Utils.getU(symbol);
                                    var f = _.pow(_.parse(LOG + inBrackets(u)), new NerdamerSymbol(p));
                                    var du = __.diff(arg, dx);
                                    const u_du = _.multiply(f, du);
                                    var integral = __.integrate(u_du, u, depth, opt);
                                    retval = _.multiply(_.parse(m), integral.sub(u, arg));
                                }
                            } else if (fname === TAN && symbol.power.lessThan(0)) {
                                //convert to cotangent
                                var sym = symbol.clone();
                                sym.power.negate();
                                sym.fname = COT;
                                return _.multiply(_.parse(m), __.integrate(sym, dx, depth));
                            } else {
                                if (!a.contains(dx, true) && symbol.isLinear()) {
                                    //perform a deep search for safety
                                    //first handle the special cases
                                    if (fname === ABS) {
                                        //REVISIT **TODO**
                                        var x = _.divide(arg.clone(), a.clone());
                                        if (x.group === S && !x.power.lessThan(0)) {
                                            if (core.Utils.even(x.power)) {
                                                retval = __.integrate(arg, dx, depth);
                                            } else {
                                                const integrated = __.integrate(x, dx, depth);
                                                integrated.power = integrated.power.subtract(new Frac(1));
                                                retval = _.multiply(
                                                    _.multiply(_.symfunction(ABS, [x.toLinear()]), integrated),
                                                    a
                                                );
                                            }
                                        } else {
                                            __.integration.stop();
                                        }
                                    } else {
                                        const ag = symbol.args[0].group,
                                            decomposed = __.integration.decompose_arg(arg, dx);

                                        if (
                                            !(ag === CP || ag === S || ag === CB) ||
                                            !decomposed[1].power.equals(1) ||
                                            arg.hasFunc()
                                        ) {
                                            __.integration.stop();
                                        }
                                        /** TODO* */ //ASIN, ACOS, ATAN
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
                                            //inverse htrig
                                            case ASECH:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            case ACSCH:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            case ACOTH:
                                                retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                break;
                                            //end inverse htrig
                                            //htrigh
                                            case SECH:
                                                retval = _.parse(format('atan(sinh({0}))', arg));
                                                break;
                                            case CSCH:
                                                retval = _.parse(format(`${Settings.LOG}(tanh(({0})/2))`, arg));
                                                break;
                                            case COTH:
                                                retval = _.parse(format(`${Settings.LOG}(sinh({0}))`, arg));
                                                break;
                                            //end htrig
                                            case EXP:
                                                retval = __.integrate(_.parse(format('e^({0})', arg)), dx, depth);
                                                break;
                                            case 'S':
                                                var arg = symbol.args[0].clone(),
                                                    dc = __.integration.decompose_arg(arg, dx),
                                                    x_ = dc[1],
                                                    a_ = dc[0];
                                                var b_ = dc[3];
                                                retval = _.parse(
                                                    format(
                                                        '(cos((1/2)*pi*(({1})+({0})*({2}))^2)+pi*(({1})+({0})*({2}))*S(({1})+({0})*({2})))/(({0})*pi)',
                                                        a_,
                                                        b_,
                                                        x
                                                    )
                                                );
                                                break;
                                            case 'C':
                                                var arg = symbol.args[0].clone(),
                                                    dc = __.integration.decompose_arg(arg, dx),
                                                    x_ = dc[1],
                                                    a_ = dc[0];
                                                var b_ = dc[3];
                                                retval = _.parse(
                                                    format(
                                                        '(pi*(({1})+({0})*({2}))*C(({1})+({0})*({2}))-sin((1/2)*pi*(({1})+({0})*({2}))^2))/(({0})*pi)',
                                                        a_,
                                                        b_,
                                                        x_
                                                    )
                                                );
                                                break;
                                            case 'erf':
                                                var arg = symbol.args[0].clone(),
                                                    dc = __.integration.decompose_arg(arg, dx),
                                                    x_ = dc[1],
                                                    a_ = dc[0];
                                                retval = _.parse(
                                                    format(
                                                        'e^(-(({2}))^2)/(({0})*sqrt(pi))+(1/({0})+({1}))*erf(({2}))',
                                                        a_,
                                                        x_,
                                                        arg
                                                    )
                                                );
                                                break;
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
                                        var p = Number(symbol.power);
                                        //check to see if it's negative and then just transform it to sec or csc
                                        if (p < 0) {
                                            symbol.fname = fname === SIN ? CSC : SEC;
                                            symbol.invert().updateHash();
                                            retval = __.integrate(symbol, dx, depth);
                                        } else {
                                            var arg = symbol.args[0],
                                                rd = symbol.clone(), //cos^(n-1)
                                                rd2 = symbol.clone(), //cos^(n-2)
                                                q = new NerdamerSymbol((p - 1) / p), //
                                                na = _.multiply(a.clone(), new NerdamerSymbol(p)).invert(); //1/(n*a)
                                            rd.power = rd.power.subtract(new Frac(1));
                                            rd2.power = rd2.power.subtract(new Frac(2));

                                            var t = _.symfunction(fname === COS ? SIN : COS, [arg.clone()]);
                                            if (fname === SIN) {
                                                t.negate();
                                            }
                                            retval = _.add(
                                                _.multiply(_.multiply(na, rd), t),
                                                _.multiply(q, __.integrate(_.parse(rd2), dx, depth))
                                            );
                                        }
                                    }
                                    //tan(x)^n or cot(x)^n
                                    else if (fname === TAN || fname === COT) {
                                        //http://www.sosmath.com/calculus/integration/moretrigpower/moretrigpower.html
                                        if (symbol.args[0].isLinear(dx)) {
                                            var n = symbol.power.subtract(new Frac(1)).toString(),
                                                r = symbol.clone().toUnitMultiplier(),
                                                w = _.parse(
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
                                    //sec(x)^n or csc(x)^n
                                    else if (fname === SEC || fname === CSC) {
                                        //http://www.sosmath.com/calculus/integration/moretrigpower/moretrigpower.html
                                        var n1 = symbol.power.subtract(new Frac(1)).toString(),
                                            n2 = symbol.power.subtract(new Frac(2)).toString(),
                                            f2 = fname === SEC ? TAN : COT,
                                            r = symbol.clone().toUnitMultiplier(),
                                            parse_str = format(
                                                `${fname === CSC ? '-' : ''}1/({0}*{1})*{4}({3})^({2})*{5}({3})`,
                                                a,
                                                n1,
                                                n2,
                                                arg,
                                                fname,
                                                f2
                                            ),
                                            w = _.parse(parse_str);
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

                            //separate the coefficient since all we care about are symbols containing dx
                            let coeff = symbol.stripVar(dx);
                            //now get only those that apply
                            let cfsymbol = _.divide(symbol.clone(), coeff.clone()); //a coeff free symbol
                            //peform a correction for stripVar. This is a serious TODO!
                            if (coeff.contains(dx)) {
                                cfsymbol = _.multiply(cfsymbol, coeff);
                                coeff = new NerdamerSymbol(1);
                            }

                            //if we only have one symbol left then let's not waste time. Just pull the integral
                            //and let the chips fall where they may
                            if (cfsymbol.group !== CB) {
                                if (cfsymbol.equals(1)) {
                                    return __.integrate(_.expand(symbol), dx, depth);
                                }

                                //only factor for multivariate which are polynomials
                                if (
                                    cfsymbol.clone().toLinear().isPoly(true) &&
                                    core.Utils.variables(cfsymbol).length > 1
                                ) {
                                    cfsymbol = core.Algebra.Factor.factorInner(cfsymbol);
                                }

                                retval = __.integrate(cfsymbol, dx, depth);
                            } else {
                                //we collect the symbols and sort them descending group, descending power, descending alpabethically
                                const symbols = cfsymbol
                                    .collectSymbols()
                                    .sort((a, b) => {
                                        if (a.group === b.group) {
                                            if (Number(a.power) === Number(b.power)) {
                                                if (a < b) {
                                                    return 1;
                                                } //I want sin first
                                                else {
                                                    return -1;
                                                }
                                            }
                                            return b.power - a.power; //descending power
                                        }
                                        return b.group - a.group; //descending groups
                                    })
                                    .map(x => {
                                        const unwrapped = NerdamerSymbol.unwrapSQRT(x, true);
                                        if (unwrapped.fname === EXP) {
                                            return _.parse(
                                                format('({1})*e^({0})', unwrapped.args[0], unwrapped.multiplier)
                                            );
                                        }
                                        return unwrapped;
                                    });
                                var l = symbols.length;
                                if (symbol.power < 0) {
                                    if (l === 2) {
                                        return __.integrate(_.expand(symbol), dx, depth, opt);
                                    }
                                }
                                //otherwise the denominator is one lumped together symbol
                                else {
                                    //generate an image for
                                    if (l === 2) {
                                        //try u substitution
                                        try {
                                            retval = __.integration.u_substitution(symbols, dx);
                                        } catch (e) {
                                            /* failed :`(*/
                                            if (e.message === 'timeout') {
                                                throw e;
                                            }
                                        }

                                        if (!retval) {
                                            //no success with u substitution so let's try known combinations
                                            //are they two functions
                                            let g1 = symbols[0].group,
                                                g2 = symbols[1].group,
                                                sym1 = symbols[0],
                                                sym2 = symbols[1],
                                                fn1 = sym1.fname,
                                                fn2 = sym2.fname;
                                            //reset the symbol minus the coeff
                                            symbol = _.multiply(sym1.clone(), sym2.clone());
                                            if (g1 === FN && g2 === FN) {
                                                if (fn1 === LOG || fn2 === LOG) {
                                                    retval = __.integration.by_parts(symbol.clone(), dx, depth, opt);
                                                } else {
                                                    symbols.sort((a, b) => b.fname > a.fname);
                                                    const arg1 = sym1.args[0];
                                                    //make sure the arguments are suitable. We don't know how to integrate non-linear arguments
                                                    if (
                                                        !arg1.isLinear() ||
                                                        !(arg1.group === CP || arg1.group === CB || arg1.group === S)
                                                    ) {
                                                        __.integration.stop();
                                                    }

                                                    var decomp = __.integration.decompose_arg(arg1, dx);
                                                    ((x = decomp[1]), (a = decomp[0]));
                                                    if (!x.isLinear()) //again... linear arguments only wrt x
                                                    {
                                                        __.integration.stop();
                                                    }

                                                    //they have to have the same arguments and then we have cleared all the check to
                                                    //make sure we can integrate FN & FN
                                                    const arg2 = sym2.args[0];
                                                    //make sure that their argument matches
                                                    if (arg1.equals(arg2)) {
                                                        if (
                                                            (fn1 === SIN && fn2 === COS) ||
                                                            (fn1 === COS && fn2 === SIN)
                                                        ) {
                                                            if (sym1.power.lessThan(0)) {
                                                                __.integration.stop();
                                                            } //we don't know how to handle, sin(x)^n/cos(x)^m where m > n,  yet
                                                            //if it's in the form sin(x)^n*cos(x)^n then we can just return tan(x)^n which we know how to integrate
                                                            if (fn1 === SIN && sym1.power.add(sym2.power).equals(0)) {
                                                                sym1.fname = TAN;
                                                                sym1.updateHash();
                                                                retval = __.integrate(sym1, dx, depth);
                                                            } else {
                                                                if (
                                                                    even(sym1.power) &&
                                                                    fn2 === COS &&
                                                                    sym2.power.lessThan(0)
                                                                ) {
                                                                    //transform sin^(2*n) to (1-cos^2)^n
                                                                    var n = Number(sym1.power) / 2,
                                                                        new_sym = _.parse(
                                                                            format(
                                                                                '(1-cos({0})^2)^({1})',
                                                                                sym1.args[0],
                                                                                n
                                                                            )
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
                                                                    //transform cos^(2*n) to (1-sin^2)^n
                                                                    var n = Number(sym1.power) / 2,
                                                                        new_sym = _.parse(
                                                                            format(
                                                                                '(1-sin({0})^2)^({1})',
                                                                                sym1.args[0],
                                                                                n
                                                                            )
                                                                        );
                                                                    retval = __.integrate(
                                                                        _.expand(_.multiply(new_sym, sym2.clone())),
                                                                        dx,
                                                                        depth,
                                                                        opt
                                                                    );
                                                                } else {
                                                                    const p1_even = core.Utils.even(sym1.power),
                                                                        p2_even = core.Utils.even(sym2.power);
                                                                    retval = new NerdamerSymbol(0);
                                                                    if (!p1_even || !p2_even) {
                                                                        var u, r, trans;
                                                                        //since cos(x) is odd it carries du. If sin was odd then it would be the other way around
                                                                        //know that p1 satifies the odd portion in this case. If p2 did than it would contain r
                                                                        if (!p1_even) {
                                                                            //u = sin(x)
                                                                            u = sym2;
                                                                            r = sym1;
                                                                        } else {
                                                                            u = sym1;
                                                                            r = sym2;
                                                                        }
                                                                        //get the sign of du. In this case r carries du as stated before and D(cos(x),x) = -sin(x)
                                                                        var sign = u.fname === COS ? -1 : 1,
                                                                            n = r.power,
                                                                            //remove the du e.g. cos(x)^2*sin(x)^3 dx -> cos(x)^2*sin(x)^2*sin(x). We're left with two
                                                                            //even powers afterwards which can be transformed
                                                                            k = (n - 1) / 2,
                                                                            //make the transformation cos(x)^2 = 1 - sin(x)^2
                                                                            trans = _.parse(
                                                                                `(1-${u.fname}${core.Utils.inBrackets(
                                                                                    arg1
                                                                                )}^2)^${k}`
                                                                            ),
                                                                            sym = _.expand(
                                                                                _.multiply(
                                                                                    new NerdamerSymbol(sign),
                                                                                    _.multiply(u.clone(), trans)
                                                                                )
                                                                            );
                                                                        //we can now just loop through and integrate each since it's now just a polynomial with functions
                                                                        sym.each(x => {
                                                                            retval = _.add(
                                                                                retval,
                                                                                __.integration.poly_integrate(x.clone())
                                                                            );
                                                                        });
                                                                    } else {
                                                                        //performs double angle transformation
                                                                        const double_angle = function (symbol) {
                                                                            let p = symbol.power,
                                                                                k = p / 2,
                                                                                e;
                                                                            if (symbol.fname === COS) {
                                                                                e = `((1/2)+(cos(2*(${
                                                                                    symbol.args[0]
                                                                                }))/2))^${k}`;
                                                                            } else {
                                                                                e = `((1/2)-(cos(2*(${
                                                                                    symbol.args[0]
                                                                                }))/2))^${k}`;
                                                                            }

                                                                            return _.parse(e);
                                                                        };
                                                                        //they're both even so transform both using double angle identities and we'll just
                                                                        //be able to integrate by the sum of integrals
                                                                        var a = double_angle(sym1),
                                                                            b = double_angle(sym2),
                                                                            t = _.multiply(a, b);
                                                                        var sym = _.expand(t);
                                                                        sym.each(x => {
                                                                            retval = _.add(
                                                                                retval,
                                                                                __.integrate(x, dx, depth)
                                                                            );
                                                                        });
                                                                        return _.multiply(retval, coeff);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        //tan(x)*sec(x)^n
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
                                                            //remaining: tan(x)^3*sec(x)^6
                                                            if (sym1.isLinear() && sym2.isLinear()) {
                                                                retval = _.divide(
                                                                    _.symfunction(SEC, [arg1.clone()]),
                                                                    a
                                                                );
                                                            } else if (even(sym1.power)) {
                                                                var p = Number(sym1.power) / 2;
                                                                //transform tangent
                                                                var t = _.parse(
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
                                                        //tan/cos
                                                        else if (
                                                            fn1 === TAN &&
                                                            (fn2 === COS || fn2 === SIN) &&
                                                            sym2.power.lessThan(0)
                                                        ) {
                                                            var t = _.multiply(sym1.fnTransform(), sym2);
                                                            retval = __.integrate(_.expand(t), dx, depth);
                                                        } else {
                                                            var t = _.multiply(sym1.fnTransform(), sym2.fnTransform());
                                                            retval = __.integrate(_.expand(t), dx, depth);
                                                        }
                                                    }
                                                    //TODO: In progress
                                                    else if (
                                                        (fn1 === SIN || fn1 === COS) &&
                                                        (fn2 === SIN || fn2 === COS)
                                                    ) {
                                                        if (sym1.isLinear() && sym2.isLinear()) {
                                                            //if in the form cos(a*x)*sin(b*x)
                                                            if (sym1.args[0].isLinear() && sym2.args[0].isLinear()) {
                                                                //use identity (sin(b*x+a*x)+sin(b*x-a*x))/2
                                                                var ax, bx;
                                                                if (fn2 === SIN) {
                                                                    ax = sym1.args[0];
                                                                    bx = sym2.args[0];
                                                                } else {
                                                                    bx = sym1.args[0];
                                                                    ax = sym2.args[0];
                                                                }

                                                                //make the transformation
                                                                f = _.parse(
                                                                    format(
                                                                        '(sin(({1})+({0}))+sin(({1})-({0})))/2',
                                                                        ax.toString(),
                                                                        bx.toString()
                                                                    )
                                                                );

                                                                //integrate it
                                                                retval = __.integrate(f, dx, depth);
                                                            } else {
                                                                var transformed = trigTransform(symbols);
                                                                retval = __.integrate(_.expand(transformed), dx, depth);
                                                            }
                                                        } else {
                                                            var transformed = new NerdamerSymbol(1);
                                                            symbols.map(sym => {
                                                                const s = sym.fnTransform();
                                                                transformed = _.multiply(transformed, s);
                                                            });
                                                            var t = _.expand(transformed);

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
                                                    //log(x)^n/x = log(x)^(n+1)/(n+1)
                                                    retval = __.integration.poly_integrate(sym1, dx, depth);
                                                } else if (sym1.fname === 'erf') {
                                                    if (sym2.power.equals(1)) {
                                                        var dc = __.integration.decompose_arg(sym1.args[0], dx),
                                                            a_ = dc[0],
                                                            x_ = dc[1],
                                                            arg = sym1.args[0].toString();
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
                                                    //since group S is guaranteed convergence we need not worry about tracking depth of integration
                                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                }
                                            } else if (g1 === EX && g2 === S) {
                                                var x =
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
                                                //first try to reduce the top
                                                if (sym2.value === sym1.value && sym1.power.equals(-1)) {
                                                    //find the lowest power in the denominator
                                                    const pd = Math.min.apply(null, core.Utils.keys(sym1.symbols));
                                                    //get the lowest common value between denominator and numerator
                                                    const pc = Math.min(pd, sym2.power);
                                                    //reduce both denominator and numerator by that factor
                                                    const factor = sym2.clone();
                                                    factor.power = new Frac(pc);
                                                    sym2 = _.divide(sym2, factor.clone()); //reduce the denominator
                                                    var t = new NerdamerSymbol(0);
                                                    sym1.each(x => {
                                                        t = _.add(t, _.divide(x.clone(), factor.clone()));
                                                    });
                                                    t.multiplier = sym1.multiplier;
                                                    symbol = _.divide(sym2, t);
                                                } else {
                                                    symbol = _.expand(symbol);
                                                }
                                                retval = __.integration.partial_fraction(symbol, dx, depth);
                                            } else if (g1 === CP && g2 === S) {
                                                var f = sym1.clone().toLinear(),
                                                    f_is_linear = core.Algebra.degree(f, _.parse(dx)).equals(1);
                                                //handle cases x^(2*n)/sqrt(1-x^2)
                                                if (sym1.power.equals(-1 / 2)) {
                                                    var decomp = __.integration.decompose_arg(
                                                        sym1.clone().toLinear(),
                                                        dx
                                                    );
                                                    var a = decomp[0].negate(),
                                                        x = decomp[1],
                                                        b = decomp[3],
                                                        p1 = Number(sym1.power),
                                                        p2 = Number(sym2.power);
                                                    if (isInt(p2) && core.Utils.even(p2) && x.power.equals(2)) {
                                                        //if the substitution
                                                        var c = _.divide(
                                                            _.multiply(
                                                                _.pow(b.clone(), new NerdamerSymbol(2)),
                                                                _.symfunction(SQRT, [_.divide(b.clone(), a.clone())])
                                                            ),
                                                            _.pow(a.clone(), new NerdamerSymbol(2))
                                                        );
                                                        c = _.multiply(c, _.symfunction(SQRT, [b]).invert());
                                                        const dummy = _.parse('sin(u)');
                                                        dummy.power = dummy.power.multiply(sym2.power);
                                                        var integral = __.integrate(dummy, 'u', depth);
                                                        const bksub = _.parse(`${ASIN}(${SQRT}(${a}/${b})*${dx})`);
                                                        retval = _.multiply(
                                                            c,
                                                            integral.sub(new NerdamerSymbol('u'), bksub)
                                                        );
                                                    } else if (p1 === -1 / 2) {
                                                        const u_transform = function (f, u) {
                                                            const integral = _.parse(
                                                                __.integrate(f, dx, depth, opt).sub(dx, format(u, dx))
                                                            );
                                                            if (!integral.hasIntegral()) {
                                                                return integral;
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
                                                            //apply transformation to see if it matches asin(x)
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
                                                    //sum of integrals
                                                    const expanded = _.expand(sym1);
                                                    retval = new NerdamerSymbol(0);
                                                    expanded.each(x => {
                                                        if (x.group === PL) {
                                                            x.each(y => {
                                                                retval = _.add(
                                                                    retval,
                                                                    __.integrate(_.multiply(sym2.clone(), y), dx, depth)
                                                                );
                                                            });
                                                        } else {
                                                            retval = _.add(
                                                                retval,
                                                                __.integrate(_.multiply(sym2.clone(), x), dx, depth)
                                                            );
                                                        }
                                                    });
                                                } else if (sym1.power.lessThan(-2)) {
                                                    retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                } else if (sym1.power.lessThan(0) && sym2.power.greaterThan(1)) {
                                                    var decomp = __.integration.decompose_arg(
                                                            sym1.clone().toLinear(),
                                                            dx
                                                        ),
                                                        a = decomp[0].negate(),
                                                        x = decomp[1],
                                                        b = decomp[3],
                                                        fn = sym1.clone().toLinear();

                                                    if (x.group !== PL && x.isLinear()) {
                                                        var p = Number(sym2.power),
                                                            du = '_u_',
                                                            u = new NerdamerSymbol(du),
                                                            //pull the integral with the subsitution
                                                            U = _.expand(
                                                                _.divide(
                                                                    _.pow(
                                                                        _.subtract(u.clone(), b.clone()),
                                                                        new NerdamerSymbol(p)
                                                                    ),
                                                                    u.clone()
                                                                )
                                                            ),
                                                            scope = {};

                                                        //generate a scope for resubbing the symbol
                                                        scope[du] = fn;
                                                        const U2 = _.parse(U, scope);
                                                        retval = __.integrate(U2, dx, 0);
                                                    } else if (
                                                        sym2.power.greaterThan(x.power) ||
                                                        sym2.power.equals(x.power)
                                                    ) {
                                                        //factor out coefficients
                                                        const factors = new core.Algebra.Classes.Factors();
                                                        sym1 = core.Algebra.Factor.coeffFactor(sym1.invert(), factors);
                                                        const div = core.Algebra.divide(sym2, sym1);
                                                        //it assumed that the result will be of group CB
                                                        if (div.group !== CB) {
                                                            retval = new NerdamerSymbol(0);
                                                            div.each(t => {
                                                                retval = _.add(retval, __.integrate(t, dx, depth));
                                                            });
                                                            //put back the factors
                                                            factors.each(factor => {
                                                                retval = _.divide(retval, factor);
                                                            });

                                                            retval = _.expand(retval);
                                                        } else {
                                                            //try something else
                                                            retval = __.integration.by_parts(symbol, dx, depth, opt);
                                                        }
                                                    } else {
                                                        retval = __.integration.partial_fraction(symbol, dx, depth);
                                                    }
                                                } else {
                                                    //handle cases such as (1-x^2)^(n/2)*x^(m) where n is odd ___ cracking knuckles... This can get a little hairy
                                                    if (sym1.power.den.equals(2)) {
                                                        //assume the function is in the form (a^2-b*x^n)^(m/2)
                                                        var dc = __.integration.decompose_arg(
                                                                sym1.clone().toLinear(),
                                                                dx
                                                            ),
                                                            //using the above definition
                                                            a = dc[3],
                                                            x = dc[1],
                                                            b = dc[0],
                                                            bx = dc[2];
                                                        if (x.power.equals(2) && b.lessThan(0)) {
                                                            //if n is even && b is negative
                                                            //make a equal 1 so we can do a trig sub
                                                            if (!a.equals(1)) {
                                                                //divide a out of everything
                                                                //move a to the coeff
                                                                coeff = _.multiply(
                                                                    coeff,
                                                                    _.pow(a, new NerdamerSymbol(2))
                                                                );
                                                            }
                                                            var u = dx;
                                                            var c = _.divide(
                                                                    _.pow(
                                                                        b.clone().negate(),
                                                                        new NerdamerSymbol(1 / 2)
                                                                    ),
                                                                    _.pow(a, new NerdamerSymbol(1 / 2))
                                                                ),
                                                                du = _.symfunction(COS, [new NerdamerSymbol(u)]),
                                                                cosn = _.pow(
                                                                    _.symfunction(COS, [new NerdamerSymbol(u)]),
                                                                    new NerdamerSymbol(sym1.power.num)
                                                                ),
                                                                X = _.pow(
                                                                    _.symfunction(SIN, [new NerdamerSymbol(u)]),
                                                                    new NerdamerSymbol(sym2.power)
                                                                ),
                                                                val = _.multiply(_.multiply(cosn, du), X),
                                                                integral = __.integrate(val, u, depth);
                                                            //but remember that u = asin(sqrt(b)*a*x)
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
                                                //sum of integrals
                                                retval = new NerdamerSymbol(0);
                                                if (sym1.power.greaterThan(0) && sym2.power.greaterThan(0)) {
                                                    //combine and pull the integral of each
                                                    var sym = _.expand(symbol);
                                                    sym.each(x => {
                                                        retval = _.add(retval, __.integrate(x, dx, depth));
                                                    }, true);
                                                } else {
                                                    var p1 = Number(sym1.power),
                                                        p2 = Number(sym2.power);
                                                    if (p1 < 0 && p2 > 0) {
                                                        //swap
                                                        var t = sym1;
                                                        sym1 = sym2;
                                                        sym2 = t;
                                                    }
                                                    if (p1 === -1 && p2 === -1) {
                                                        retval = __.integration.partial_fraction(symbol, dx);
                                                    } else {
                                                        sym1.each(x => {
                                                            const k = _.multiply(x, sym2.clone());
                                                            const integral = __.integrate(k, dx, depth);
                                                            retval = _.add(retval, integral);
                                                        });
                                                    }
                                                }
                                            } else if (g1 === CP && symbols[0].power.greaterThan(0)) {
                                                sym1 = _.expand(sym1);
                                                retval = new NerdamerSymbol(0);
                                                sym1.each(x => {
                                                    retval = _.add(
                                                        retval,
                                                        __.integrate(_.multiply(x, sym2.clone()), dx, depth)
                                                    );
                                                }, true);
                                            } else if (g1 === FN && g2 === EX && core.Utils.in_htrig(sym1.fname)) {
                                                sym1 = sym1.fnTransform();
                                                retval = __.integrate(_.expand(_.multiply(sym1, sym2)), dx, depth);
                                            } else if ((g1 === FN && g2 === CP) || (g2 === FN && g1 === CP)) {
                                                if (g2 === FN && g1 === CP) {
                                                    var t = sym1;
                                                    sym1 = sym2;
                                                    sym2 = t; //swap
                                                }
                                                var du, sym2_clone, p, q, sa, sb;
                                                du = NerdamerSymbol.unwrapSQRT(__.diff(sym1.clone(), dx), true);
                                                sym2_clone = NerdamerSymbol.unwrapSQRT(sym2, true);
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
                                            //TODO {support higher powers of x in the future}
                                            if (first.power.greaterThan(1)) {
                                                first = _.expand(first);
                                            }
                                            var r = _.multiply(symbols[1], symbols[2]);
                                            retval = new NerdamerSymbol(0);
                                            first.each(x => {
                                                const t = _.multiply(x, r.clone());
                                                const intg = __.integrate(t, dx, depth);
                                                retval = _.add(retval, intg);
                                            }, true);
                                        } else {
                                            //try integration by parts although technically it will never work
                                            retval = __.integration.by_parts(symbol, dx, depth, opt);
                                        }
                                    } else if (all_functions(symbols)) {
                                        var t = new NerdamerSymbol(1);
                                        for (var i = 0, l = symbols.length; i < l; i++) {
                                            t = _.multiply(t, symbols[i].fnTransform());
                                        }
                                        t = _.expand(t);
                                        retval = __.integrate(t, dx, depth);
                                    } else {
                                        //one more go
                                        var transformed = trigTransform(symbols);
                                        retval = __.integrate(_.expand(transformed), dx, depth);
                                    }
                                }
                            }

                            retval = _.multiply(retval, coeff);
                        }
                        //if an integral was found then we return it
                        if (retval) {
                            return retval;
                        }
                    } catch (error) {
                        if (error.message === 'timeout') {
                            throw error;
                        }
                        //do nothing if it's a NoIntegralFound error otherwise let it bubble
                        if (!(error instanceof NoIntegralFound || error instanceof core.exceptions.DivisionByZero)) {
                            throw error;
                        }
                    }

                    //no symbol found so we return the integral again
                    return _.symfunction('integrate', [original_symbol, dt]);
                },
                false
            );
        },
        defint(symbol, from, to, dx) {
            dx = dx || 'x'; //make x the default variable of integration
            const get_value = function (integral, vars, point) {
                try {
                    return _.parse(integral, vars);
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    //it failed for some reason so return the limit
                    const lim = __.Limit.limit(integral, dx, point);
                    return lim;
                }
            };

            const vars = core.Utils.variables(symbol),
                hasTrig = symbol.hasTrig();
            let retval, integral;

            // Fix #593 - Only assume the first variable if dx is not defined.
            if (vars.length === 1 && !dx) {
                dx = vars[0];
            }

            if (!hasTrig) {
                integral = __.integrate(symbol, dx);
            }

            if (!hasTrig && !integral.hasIntegral()) {
                let upper = {},
                    lower = {},
                    a,
                    b;
                upper[dx] = to;
                lower[dx] = from;

                a = get_value(integral, upper, to, dx);
                b = get_value(integral, lower, from, dx);
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

                const _fin = f.clone(),
                    gin = g.clone();

                //But first a little "cheating". x/|x| ends up in an infinite loop since the d/dx |x| -> x/|x|
                //To break this loop we simply provide the answer. Keep in mind that currently limit only provides
                //the two-sided limit.
                //Known limit
                if (g.fname === ABS) {
                    const sign = f.sign();
                    const lim_sign = lim.sign();

                    if (lim.isInfinity) {
                        return _.multiply(new NerdamerSymbol(sign), new NerdamerSymbol(lim_sign));
                    } else if (lim.equals(0)) {
                        const fm = _.parse(f.multiplier);
                        const gm = _.parse(g.multiplier);
                        return _.divide(_.multiply(fm, __.Limit.interval('-1', '1')), gm);
                    } else {
                        //TODO: Support more limits
                        __.Limit.diverges();
                    }
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
                // let fOrig = f.clone();
                // let gOrig = g.clone();
                do {
                    var lim1 = evaluate(__.Limit.limit(f.clone(), x, lim, depth));
                    var lim2 = evaluate(__.Limit.limit(g.clone(), x, lim, depth));

                    //if it's in indeterminate form apply L'Hopital's rule
                    var indeterminate = (isInfinity(lim1) && isInfinity(lim2)) || (equals(lim1, 0) && equals(lim2, 0));
                    //pull the derivatives
                    if (indeterminate) {
                        const ft = __.diff(f.clone(), x);
                        const gt = __.diff(g.clone(), x);

                        // expanding here causes issue #12.
                        // there is something fishy with expand that we will
                        // have to find some day.
                        // var t_symbol = _.expand(_.divide(ft, gt));
                        const t_symbol = _.divide(ft, gt);
                        f = t_symbol.getNum();
                        g = t_symbol.getDenom();
                    }
                } while (indeterminate && ++count < Settings.max_lim_depth);

                if (count >= Settings.max_lim_depth) {
                    // console.log("L'Hospital likely endless loop");
                    // console.log("  f:"+f);
                    // console.log("  g:"+g);
                    return;
                }

                //REMEMBER:
                //- 1/cos(x)
                //n/0 is still possible since we only checked for 0/0
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
                //1. rewrite EX with base e
                if (f.group === EX) {
                    f = __.rewriteToLog(f);
                }
                //2. try simple substitution
                try {
                    retval = f.sub(x, lim);
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    //Nope. No go, so just return the unsubbed function so we can test the limit instead.
                    retval = f;
                }

                return retval;
            },
            isInterval(limit) {
                return core.Utils.isVector(limit);
            },
            isConvergent(limit) {
                //it's not convergent if it lies on the interval -Infinity to Infinity
                if (
                    //It lies on the interval -Infinity to Infinity
                    (__.Limit.isInterval(limit) && limit.elements[0].isInfinity && limit.elements[1].isInfinity) ||
                    //We weren't able to calculate the limit
                    limit.containsFunction('limit')
                ) {
                    return false; //Then no
                }
                return true; //It is
            },
            limit(symbol, x, lim, depth) {
                //Simplify the symbol
                if (symbol.isLinear() && symbol.isComposite()) {
                    //Apply sum of limits
                    let limit = new NerdamerSymbol(0);
                    symbol.each(s => {
                        limit = _.add(limit, __.Limit.limit(s, x, lim, depth));
                    }, true);

                    return limit;
                }
                symbol = core.Algebra.Simplify.simplify(symbol);

                depth = depth || 1;

                if (depth++ > Settings.max_lim_depth) {
                    return;
                }

                //store the multiplier
                const m = _.parse(symbol.multiplier);
                //strip the multiplier
                symbol.toUnitMultiplier();
                try {
                    //https://en.wikipedia.org/wiki/List_of_limits
                    var retval;
                    //we try the simplest option first where c is some limit
                    //lim a as x->c = a where c
                    if (symbol.isConstant(true)) {
                        retval = symbol;
                    } else {
                        const point = {};
                        point[x] = lim;
                        //lim x as x->c = c where c

                        try {
                            //evaluate the function at the given limit
                            const t = _.parse(symbol.sub(x, lim), point);

                            //a constant or infinity is known so we're done
                            if (t.isConstant(true) || t.isInfinity) {
                                retval = t;
                            }
                        } catch (e) {
                            /*Nothing. Maybe we tried to divide by zero.*/
                            if (e.message === 'timeout') {
                                throw e;
                            }
                        }
                        if (!retval) {
                            //split the symbol in the numerator and the denominator
                            const num = symbol.getNum();
                            const den = symbol.getDenom();

                            if (den.isConstant(true)) {
                                //We still don't have a limit so we generate tests.
                                if (symbol.group === EX) {
                                    //https://en.wikipedia.org/wiki/List_of_limits
                                    //Speed boost for exponentials by detecting patterns
                                    var f = symbol.clone().toLinear();
                                    const _p = symbol.power.clone();
                                    const _num = f.getNum();
                                    const _den = f.getDenom();
                                    const fn = core.Utils.decompose_fn(_den, x, true);
                                    //start detection of pattern (x/(x+1))^x
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
                                        //get the base
                                        const pow = symbol_.power.clone();
                                        const base = symbol_.clone().toLinear();
                                        const lim_base = __.Limit.limit(base, x, lim, depth);
                                        const lim_pow = __.Limit.limit(pow, x, lim, depth);
                                        retval = _.pow(lim_base, lim_pow);
                                    }
                                } else if (symbol.group === FN && symbol.args.length === 1) {
                                    let evaluates;
                                    //Squeeze theorem lim f(g(x)) = lim f(lim g))
                                    const arg = __.Limit.limit(symbol.args[0], x, lim, depth);
                                    if (core.Utils.isVector(arg)) {
                                        //get the limit over that interval
                                        retval = arg.map(e => {
                                            const clone = symbol.clone();
                                            clone.args[0] = e;
                                            return __.Limit.limit(_.symfunction(symbol.fname, [e]), x, lim, depth);
                                        });

                                        return _.multiply(m, retval);
                                    }
                                    //if the argument is constant then we're done
                                    else if (arg.isConstant(true)) {
                                        //double check that it evaluates
                                        var trial = _.symfunction(symbol.fname, [arg]);
                                        //trial evaluation
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
                                        //if the limit converges. We'll deal with non-convergent ones later
                                        if (__.Limit.isConvergent(arg)) {
                                            if (symbol.fname === LOG) {
                                                switch (arg.toString()) {
                                                    //lim -> 0
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
                                    if (symbol.power > 0) //these functions always converge to the limit
                                    {
                                        return _.parse(symbol, point);
                                    } else {
                                        //we're dealing with 1/x^n but remember that infinity has already been dealt
                                        //with by substitution
                                        if (core.Utils.even(symbol.power)) {
                                            //even powers converge to infinity
                                            retval = NerdamerSymbol.infinity();
                                        } else {
                                            //odd ones don't
                                            retval = __.Limit.diverges();
                                        }
                                    }
                                } else if (symbol.group === CB) {
                                    let lim1, lim2;
                                    //loop through all the symbols
                                    //thus => lim f*g*h = lim (f*g)*h = (lim f*g)*(lim h)
                                    //symbols of lower groups are generally easier to differentiatee so get them to the right by first sorting
                                    var symbols = symbol.collectSymbols().sort((a, b) => a.group - b.group);

                                    var f = symbols.pop();
                                    //calculate the first limit so we can keep going down the list
                                    lim1 = evaluate(__.Limit.limit(f, x, lim, depth));

                                    //reduces all the limits one at a time
                                    while (symbols.length) {
                                        //get the second limit
                                        let g = symbols.pop();
                                        //get the limit of g
                                        lim2 = evaluate(__.Limit.limit(g, x, lim, depth));

                                        //if the limit is in indeterminate form aplly L'Hospital by inverting g and then f/(1/g)
                                        if (
                                            lim1.isInfinity ||
                                            (!__.Limit.isConvergent(lim1) && lim2.equals(0)) ||
                                            (lim1.equals(0) && __.Limit.isConvergent(lim2))
                                        ) {
                                            if (g.containsFunction(LOG)) {
                                                //swap them
                                                g = [f, (f = g)][0];
                                            }
                                            //invert the symbol
                                            g.invert();

                                            // Product of infinities
                                            if (lim1.isInfinity && lim2.isInfinity) {
                                                lim1 = NerdamerSymbol.infinity();
                                            } else {
                                                lim1 = __.Limit.divide(f, g, x, lim, depth);
                                            }
                                        } else {
                                            //lim f*g = (lim f)*(lim g)
                                            lim1 = _.multiply(lim1, lim2);
                                            //let f*g equal f and h equal g
                                            f = _.multiply(f, g);
                                        }
                                    }

                                    //Done, lim1 is the limit we're looking for
                                    retval = lim1;
                                } else if (symbol.isComposite()) {
                                    let _lim;
                                    if (!symbol.isLinear()) {
                                        symbol = _.expand(symbol);
                                    }
                                    //Apply lim f+g = (lim f)+(lim g)
                                    retval = new NerdamerSymbol(0);

                                    var symbols = symbol.collectSymbols().sort((a, b) => b.group - a.group);

                                    const _symbols = [];
                                    //Analyze the functions first
                                    let fns = new NerdamerSymbol(0);
                                    for (var i = 0, l = symbols.length; i < l; i++) {
                                        var sym = symbols[i].clone();
                                        if (sym.group === FN || (sym.group === CB && sym.hasFunc())) {
                                            fns = _.add(fns, sym);
                                        } else {
                                            _symbols.push(sym);
                                        }
                                    }
                                    _symbols.unshift(fns);

                                    //make sure that we didn't just repackage the exact same symbol
                                    if (_symbols.length !== 1) {
                                        symbols = _symbols;
                                    }

                                    for (var i = 0, l = symbols.length; i < l; i++) {
                                        var sym = symbols[i];
                                        //If the addition of the limits is undefined then the limit diverges so return -infinity to infinity
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

                    //if we still don't have a solution
                    if (!retval) //return it symbolically
                    {
                        retval = _.symfunction('limit', [symbol, x, lim]);
                    }
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    //if all else fails return the symbolic function
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
    //link registered functions externally
    nerdamer.updateAPI();
})();
