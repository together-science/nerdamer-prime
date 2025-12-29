// @ts-nocheck
/*
 * Author : Martin Donk
 * Website : http://www.nerdamer.com
 * Email : martin.r.donk@gmail.com
 * License : MIT
 * Source : https://github.com/jiggzson/nerdamer
 */

let nerdamer;
if (typeof module !== 'undefined') {
    nerdamer = require('./nerdamer.core.js');
    require('./Calculus');
    require('./Algebra');
}

(function initExtraModule() {
    const core = nerdamer.getCore();
    const _ = core.PARSER;
    const { NerdamerSymbol } = core;
    const { format } = core.Utils;
    const { isVector } = core.Utils;
    const { isArray } = core.Utils;
    const _Vector = core.Vector;
    const { S } = core.groups;
    const _EX = core.groups.EX;
    const { CP } = core.groups;
    const { PL } = core.groups;
    const { CB } = core.groups;
    const { FN } = core.groups;
    core.Settings.Laplace_integration_depth = 40;

    NerdamerSymbol.prototype.findFunction = function findFunction(fname) {
        // This is what we're looking for
        if (this.group === FN && this.fname === fname) {
            return this.clone();
        }
        let found;
        if (this.symbols) {
            for (const x in this.symbols) {
                if (!Object.hasOwn(this.symbols, x)) {
                    continue;
                }
                found = this.symbols[x].findFunction(fname);
                if (found) {
                    break;
                }
            }
        }

        return found;
    };

    const __ = (core.Extra = {
        version: '1.4.2',
        // http://integral-table.com/downloads/LaplaceTable.pdf
        // Laplace assumes all coefficients to be positive
        LaPlace: {
            // Using: integral_0^oo f(t)*e^(-s*t) dt
            transform(symbol, t, s) {
                symbol = symbol.clone();

                t = t.toString();
                // First try a lookup for a speed boost
                symbol = NerdamerSymbol.unwrapSQRT(symbol, true);
                let retval;
                const coeff = symbol.stripVar(t);
                const g = symbol.group;

                symbol = _.divide(symbol, coeff.clone());

                if (symbol.isConstant() || !symbol.contains(t, true)) {
                    retval = _.parse(format('({0})/({1})', symbol, s));
                } else if (g === S && core.Utils.isInt(symbol.power)) {
                    const n = String(symbol.power);
                    retval = _.parse(format('factorial({0})/({1})^({0}+1)', n, s));
                } else if (symbol.group === S && symbol.power.equals(1 / 2)) {
                    retval = _.parse(format('sqrt(pi)/(2*({0})^(3/2))', s));
                } else if (symbol.isComposite()) {
                    retval = new NerdamerSymbol(0);
                    symbol.each(x => {
                        retval = _.add(retval, __.LaPlace.transform(x, t, s));
                    }, true);
                } else if (symbol.isE() && (symbol.power.group === S || symbol.power.group === CB)) {
                    const a = symbol.power.stripVar(t);
                    retval = _.parse(format('1/(({1})-({0}))', a, s));
                } else {
                    const fns = ['sin', 'cos', 'sinh', 'cosh'];
                    // Support for symbols in fns with arguments in the form a*t or n*t where a = symbolic and n = Number
                    if (
                        symbol.group === FN &&
                        fns.indexOf(symbol.fname) !== -1 &&
                        (symbol.args[0].group === S || symbol.args[0].group === CB)
                    ) {
                        const a = symbol.args[0].stripVar(t);

                        switch (symbol.fname) {
                            case 'sin':
                                retval = _.parse(format('({0})/(({1})^2+({0})^2)', a, s));
                                break;
                            case 'cos':
                                retval = _.parse(format('({1})/(({1})^2+({0})^2)', a, s));
                                break;
                            case 'sinh':
                                retval = _.parse(format('({0})/(({1})^2-({0})^2)', a, s));
                                break;
                            case 'cosh':
                                retval = _.parse(format('({1})/(({1})^2-({0})^2)', a, s));
                                break;
                        }
                    } else {
                        // Try to integrate for a solution
                        // we need at least the Laplace integration depth
                        const depthIsLower = core.Settings.integration_depth < core.Settings.Laplace_integration_depth;

                        let savedIntegrationDepth;
                        if (depthIsLower) {
                            savedIntegrationDepth = core.Settings.integration_depth; // Save the depth
                            core.Settings.integration_depth = core.Settings.Laplace_integration_depth; // Transforms need a little more room
                        }

                        core.Utils.block(
                            'PARSE2NUMBER',
                            () => {
                                const u = t;
                                const sym = symbol.sub(t, u);
                                const integrationExpr = _.parse(`e^(-${s}*${u})*${sym}`);
                                retval = core.Calculus.integrate(integrationExpr, u);
                                if (retval.hasIntegral()) {
                                    retval = _.symfunction('laplace', [symbol, t, s]);
                                    return;
                                }
                                //                                _.error('Unable to compute transform');
                                retval = retval.sub(t, 0);
                                retval = _.expand(_.multiply(retval, new NerdamerSymbol(-1)));
                                retval = retval.sub(u, t);
                            },
                            false
                        );

                        retval = core.Utils.block('PARSE2NUMBER', () => _.parse(retval), true);

                        if (depthIsLower) // Put the integration depth as it was
                        {
                            core.Settings.integration_depth = savedIntegrationDepth;
                        }
                    }
                }

                return _.multiply(retval, coeff);
            },
            inverse(symbol, s_, t) {
                const inputSymbol = symbol.clone();
                return core.Utils.block(
                    'POSITIVE_MULTIPLIERS',
                    () => {
                        let retval;
                        // Expand and get partial fractions
                        if (symbol.group === CB) {
                            symbol = core.Algebra.PartFrac.partfrac(_.expand(symbol), s_);
                        }

                        if (symbol.group === S || symbol.group === CB || symbol.isComposite()) {
                            let p;
                            let denP;
                            let a;
                            let b;
                            let d;
                            let exp;
                            let f2;
                            let fact;
                            // Remove the multiplier
                            const m = symbol.multiplier.clone();
                            symbol.toUnitMultiplier();
                            // Get the numerator and denominator
                            let num = symbol.getNum();
                            const den = symbol.getDenom().toUnitMultiplier();

                            // TODO: Make it so factor doesn't destroy pi
                            // num = core.Algebra.Factor.factor(symbol.getNum());
                            // den = core.Algebra.Factor.factor(symbol.getDenom().invert(null, true));

                            if (den.group === CP || den.group === PL) {
                                denP = den.power.clone();
                                den.toLinear();
                            } else {
                                denP = new core.Frac(1);
                            }

                            // Convert s to a string
                            const s = s_.toString();
                            // Split up the denominator if in the form ax+b
                            const f = core.Utils.decompose_fn(den, s, true);
                            // Move the multiplier to the numerator
                            const _fe = core.Utils.decompose_fn(_.expand(num.clone()), s, true);
                            num.multiplier = num.multiplier.multiply(m);

                            const finalize = function () {
                                // Put back the numerator
                                retval = _.multiply(retval, num);
                                retval.multiplier = retval.multiplier.multiply(symbol.multiplier);
                                // Put back a
                                retval = _.divide(retval, f.a);
                            };

                            // Store the parts in variables for easy recognition
                            // check if in the form t^n where n = integer
                            if (
                                (den.group === S || den.group === CB) &&
                                f.x.value === s &&
                                f.b.equals(0) &&
                                core.Utils.isInt(f.x.power)
                            ) {
                                p = f.x.power - 1;
                                fact = core.Math2.factorial(p);
                                //  N!/s^(n-1)
                                retval = _.divide(_.pow(t, new NerdamerSymbol(p)), new NerdamerSymbol(fact));
                                // Wrap it up
                                finalize();
                            } else if (den.group === CP && denP.equals(1)) {
                                if (f.x.group === core.groups.PL && core.Algebra.degree(den).equals(2)) {
                                    // Possibly in the form 1/(s^2+2*s+1)
                                    // Try factoring to get it in a more familiar form{
                                    // Apply inverse of F(s-a)
                                    const completed = core.Algebra.sqComplete(den, s);
                                    const u = core.Utils.getU(den);
                                    // Get a for the function above
                                    a = core.Utils.decompose_fn(completed.a, s, true).b;
                                    const tf = __.LaPlace.inverse(_.parse(`1/((${u})^2+(${completed.c}))`), u, t);
                                    retval = _.multiply(tf, _.parse(`(${m})*e^(-(${a})*(${t}))`));
                                    // A/(b*s-c) -> ae^(-bt)
                                } else if (f.x.isLinear() && !num.contains(s)) {
                                    t = _.divide(t, f.a.clone());

                                    // Don't add factorial of one or zero
                                    p = denP - 1;
                                    fact = p === 0 || p === 1 ? '1' : `(${denP}-1)!`;
                                    retval = _.parse(
                                        format(
                                            '(({0})^({3}-1)*e^(-(({2})*({0}))/({1})))/(({4})*({1})^({3}))',
                                            t,
                                            f.a,
                                            f.b,
                                            denP,
                                            fact
                                        )
                                    );
                                    // Wrap it up
                                    finalize();
                                } else if (f.x.group === S && f.x.power.equals(2)) {
                                    if (!num.contains(s)) {
                                        retval = _.parse(
                                            format(
                                                '(({1})*sin((sqrt(({2})*({3}))*({0}))/({2})))/sqrt(({2})*({3}))',
                                                t,
                                                num,
                                                f.a,
                                                f.b
                                            )
                                        );
                                    }
                                    // A*s/(b*s^2+c^2)
                                    else {
                                        a = new NerdamerSymbol(1);
                                        if (num.group === CB) {
                                            let newNum = new NerdamerSymbol(1);
                                            num.each(x => {
                                                if (x.contains(s)) {
                                                    newNum = _.multiply(newNum, x);
                                                } else {
                                                    a = _.multiply(a, x);
                                                }
                                            });
                                            num = newNum;
                                        }

                                        // We need more information about the denominator to decide
                                        f2 = core.Utils.decompose_fn(num, s, true);
                                        const fn1 = f2.a;
                                        const fn2 = f2.b;
                                        const aHasSin = fn1.containsFunction('sin');
                                        const aHasCos = fn1.containsFunction('cos');
                                        const bHasCos = fn2.containsFunction('cos');
                                        const bHasSin = fn2.containsFunction('sin');
                                        if (
                                            f2.x.value === s &&
                                            f2.x.isLinear() &&
                                            !((aHasSin && bHasCos) || aHasCos || bHasSin)
                                        ) {
                                            retval = _.parse(
                                                format(
                                                    '(({1})*cos((sqrt(({2})*({3}))*({0}))/({2})))/({2})',
                                                    t,
                                                    f2.a,
                                                    f.a,
                                                    f.b
                                                )
                                            );
                                        } else if (aHasSin && bHasCos) {
                                            const sin = fn1.findFunction('sin');
                                            const cos = fn2.findFunction('cos');
                                            // Who has the s?
                                            if (sin.args[0].equals(cos.args[0]) && !sin.args[0].contains(s)) {
                                                b = _.divide(fn2, cos.toUnitMultiplier()).toString();
                                                const c = sin.args[0].toString();
                                                d = f.b;
                                                const e = _.divide(fn1, sin.toUnitMultiplier());
                                                exp =
                                                    '(({1})*({2})*cos({3})*sin(sqrt({4})*({0})))/sqrt({4})+({1})*sin({3})*({5})*cos(sqrt({4})*({0}))';
                                                retval = _.parse(format(exp, t, a, b, c, d, e));
                                            }
                                        }
                                    }
                                }
                            } else if (
                                f.x.power.num &&
                                f.x.power.num.equals(3) &&
                                f.x.power.den.equals(2) &&
                                num.contains('sqrt(pi)') &&
                                !num.contains(s) &&
                                num.isLinear()
                            ) {
                                b = _.divide(num.clone(), _.parse('sqrt(pi)'));
                                retval = _.parse(format('(2*({2})*sqrt({0}))/({1})', t, f.a, b, num));
                            } else if (denP.equals(2) && f.x.power.equals(2)) {
                                if (!num.contains(s)) {
                                    a = _.divide(num, new NerdamerSymbol(2));
                                    exp =
                                        '(({1})*sin((sqrt(({2})*({3}))*({0}))/({2})))/(({3})*sqrt(({2})*({3})))-(({1})*({0})*cos((sqrt(({2})*({3}))*({0}))/({2})))/(({2})*({3}))';
                                    retval = _.parse(format(exp, t, a, f.a, f.b));
                                } else {
                                    // Decompose the numerator to check value of s
                                    f2 = core.Utils.decompose_fn(_.expand(num.clone()), s, true);
                                    if (f2.x.isComposite()) {
                                        const sTerms = [];
                                        // First collect the factors e.g. (a)(bx)(cx^2+d)
                                        const symbols = num
                                            .collectSymbols(x => {
                                                x = NerdamerSymbol.unwrapPARENS(x);
                                                const decomp = core.Utils.decompose_fn(x, s, true);
                                                decomp.symbol = x;
                                                return decomp;
                                            })
                                            // Then sort them by power hightest to lowest
                                            .sort((x1, x2) => {
                                                const p1 = x1.x.value !== s ? 0 : x1.x.power;
                                                const p2 = x2.x.value !== s ? 0 : x2.x.power;
                                                return p2 - p1;
                                            });
                                        a = new NerdamerSymbol(-1);
                                        // Grab only the ones which have s
                                        for (let i = 0; i < symbols.length; i++) {
                                            const fc = symbols[i];
                                            if (fc.x.value === s) {
                                                sTerms.push(fc);
                                            } else {
                                                a = _.multiply(a, fc.symbol);
                                            }
                                        }
                                        // The following 2 assumptions are made
                                        // 1. since the numerator was factored above then each s_term has a unique power
                                        // 2. because the terms are sorted by descending powers then the first item
                                        //    has the highest power
                                        // We can now check for the next type s(s^2-a^2)/(s^2+a^2)^2
                                        if (
                                            sTerms[0].x.power.equals(2) &&
                                            sTerms[1].x.power.equals(1) &&
                                            sTerms[1].b.equals(0) &&
                                            !sTerms[0].b.equals(0)
                                        ) {
                                            b = sTerms[0].a.negate();
                                            exp =
                                                '-(({1})*({2})*({5})*({0})*sin((sqrt(({4})*({5}))*({0}))/({4})))/' +
                                                '(2*({4})^2*sqrt(({4})*({5})))-(({1})*({3})*({0})*sin((sqrt(({4})*({5}))*({0}))/({4})))' +
                                                '/(2*({4})*sqrt(({4})*({5})))+(({1})*({2})*cos((sqrt(({4})*({5}))*({0}))/({4})))/({4})^2';
                                            retval = _.parse(format(exp, t, a, b, sTerms[0].b, f.a, f.b));
                                        }
                                    } else if (f2.x.isLinear()) {
                                        a = _.divide(f2.a, new NerdamerSymbol(2));
                                        exp =
                                            '(({1})*({0})*sin((sqrt(({2})*({3}))*({0}))/({2})))/(({2})*sqrt(({2})*({3})))';
                                        retval = _.parse(format(exp, t, a, f.a, f.b));
                                    } else if (f2.x.power.equals(2)) {
                                        if (f2.b.equals(0)) {
                                            a = _.divide(f2.a, new NerdamerSymbol(2));
                                            exp =
                                                '(({1})*sin((sqrt(({2})*({3}))*({0}))/({2})))/(({2})*sqrt(({2})*({3})))+(({1})*({0})*cos((sqrt(({2})*({3}))*({0}))/({2})))/({2})^2';
                                            retval = _.parse(format(exp, t, a, f.a, f.b));
                                        } else {
                                            a = _.divide(f2.a, new NerdamerSymbol(2));
                                            d = f2.b.negate();
                                            exp =
                                                '-((({2})*({4})-2*({1})*({3}))*sin((sqrt(({2})*({3}))*({0}))/({2})))/(2*({2})*({3})*sqrt(({2})*({3})))+' +
                                                '(({4})*({0})*cos((sqrt(({2})*({3}))*({0}))/({2})))/(2*({2})*({3}))+(({1})*({0})*cos((sqrt(({2})*({3}))*({0}))/({2})))/({2})^2';
                                            retval = _.parse(format(exp, t, a, f.a, f.b, d));
                                        }
                                    }
                                }
                            } else if (symbol.isComposite()) {
                                // 1/(s+1)^2
                                if (denP.equals(2) && f.x.group === S) {
                                    retval = _.parse(`(${m})*(${t})*e^(-(${f.b})*(${t}))`);
                                } else {
                                    retval = new NerdamerSymbol(0);

                                    symbol = core.Algebra.PartFrac.partfrac(_.expand(symbol), s_);

                                    symbol.each(x => {
                                        retval = _.add(retval, __.LaPlace.inverse(x, s_, t));
                                    }, true);
                                }
                            }
                        }

                        retval ||= _.symfunction('ilt', [inputSymbol, s_, t]);

                        return retval;
                    },
                    true
                );
            },
        },
        Statistics: {
            frequencyMap(arr) {
                const map = {};
                // Get the frequency map
                for (let i = 0, l = arr.length; i < l; i++) {
                    const e = arr[i];
                    const key = e.toString();
                    map[key] ||= 0; // Default it to zero
                    map[key]++; // Increment
                }
                return map;
            },
            sort(arr) {
                return arr.sort((a, b) => {
                    if (!a.isConstant() || !b.isConstant()) {
                        _.error('Unable to sort! All values must be numeric');
                    }
                    return a.multiplier.subtract(b.multiplier);
                });
            },
            count(arr) {
                return new NerdamerSymbol(arr.length);
            },
            sum(arr, x_) {
                let sum = new NerdamerSymbol(0);
                for (let i = 0, l = arr.length; i < l; i++) {
                    const xi = arr[i].clone();
                    if (x_) {
                        sum = _.add(_.pow(_.subtract(xi, x_.clone()), new NerdamerSymbol(2)), sum);
                    } else {
                        sum = _.add(xi, sum);
                    }
                }

                return sum;
            },
            mean(...args) {
                // Handle arrays
                if (isVector(args[0])) {
                    return __.Statistics.mean(...args[0].elements);
                }
                return _.divide(__.Statistics.sum(args), __.Statistics.count(args));
            },
            median(...args) {
                let retval;
                // Handle arrays
                if (isVector(args[0])) {
                    return __.Statistics.median(...args[0].elements);
                }
                try {
                    const sorted = __.Statistics.sort(args);
                    const l = args.length;
                    if (core.Utils.even(l)) {
                        const mid = l / 2;
                        retval = __.Statistics.mean(sorted[mid - 1], sorted[mid]);
                    } else {
                        retval = sorted[Math.floor(l / 2)];
                    }
                } catch (e) {
                    if (e.message === 'timeout') {
                        throw e;
                    }
                    retval = _.symfunction('median', args);
                }
                return retval;
            },
            mode(...args) {
                let retval;
                // Handle arrays
                if (isVector(args[0])) {
                    return __.Statistics.mode(...args[0].elements);
                }

                const map = __.Statistics.frequencyMap(args);

                // The mode of 1 item is that item as per issue #310 (verified by Happypig375).
                if (core.Utils.keys(map).length === 1) {
                    retval = args[0];
                } else {
                    // Invert by arraning them according to their frequency
                    const inverse = {};
                    for (const x in map) {
                        if (!Object.hasOwn(map, x)) {
                            continue;
                        }
                        const freq = map[x];
                        // Check if it's in the inverse already
                        if (!(freq in inverse)) {
                            inverse[freq] = x;
                        } else {
                            const e = inverse[freq];
                            // If it's already an array then just add it
                            if (isArray(e)) {
                                e.push(x);
                            }
                            // Convert it to and array
                            else {
                                inverse[freq] = [x, inverse[freq]];
                            }
                        }
                    }
                    // The keys now represent the maxes. We want the max of those keys
                    const max = inverse[Math.max.apply(null, core.Utils.keys(inverse))];
                    // Check it's an array. If it is then map over the results and convert
                    // them to NerdamerSymbol
                    if (isArray(max)) {
                        retval = _.symfunction('mode', max.sort());
                    } else {
                        retval = _.parse(max);
                    }
                }

                return retval;
            },
            gVariance(k, args) {
                const x_ = __.Statistics.mean(...args);
                const sum = __.Statistics.sum(args, x_);
                return _.multiply(k, sum);
            },
            variance(...args) {
                // Handle arrays
                if (isVector(args[0])) {
                    return __.Statistics.variance(...args[0].elements);
                }
                const k = _.divide(new NerdamerSymbol(1), __.Statistics.count(args));
                return __.Statistics.gVariance(k, args);
            },
            sampleVariance(...args) {
                // Handle arrays
                if (isVector(args[0])) {
                    return __.Statistics.sampleVariance(...args[0].elements);
                }

                const k = _.divide(new NerdamerSymbol(1), _.subtract(__.Statistics.count(args), new NerdamerSymbol(1)));
                return __.Statistics.gVariance(k, args);
            },
            standardDeviation(...args) {
                // Handle arrays
                if (isVector(args[0])) {
                    return __.Statistics.standardDeviation(...args[0].elements);
                }
                return _.pow(__.Statistics.variance(...args), new NerdamerSymbol(1 / 2));
            },
            sampleStandardDeviation(...args) {
                // Handle arrays
                if (isVector(args[0])) {
                    return __.Statistics.sampleStandardDeviation(...args[0].elements);
                }
                return _.pow(__.Statistics.sampleVariance(...args), new NerdamerSymbol(1 / 2));
            },
            zScore(x, mean, stdev) {
                return _.divide(_.subtract(x, mean), stdev);
            },
        },
        Units: {
            table: {
                foot: '12 inch',
                meter: '100 cm',
                decimeter: '10 cm',
            },
        },
    });

    nerdamer.register([
        {
            name: 'laplace',
            visible: true,
            numargs: 3,
            build() {
                return __.LaPlace.transform;
            },
        },
        {
            name: 'ilt',
            visible: true,
            numargs: 3,
            build() {
                return __.LaPlace.inverse;
            },
        },
        // Statistical
        {
            name: 'mean',
            visible: true,
            numargs: -1,
            build() {
                return __.Statistics.mean;
            },
        },
        {
            name: 'median',
            visible: true,
            numargs: -1,
            build() {
                return __.Statistics.median;
            },
        },
        {
            name: 'mode',
            visible: true,
            numargs: -1,
            build() {
                return __.Statistics.mode;
            },
        },
        {
            name: 'smpvar',
            visible: true,
            numargs: -1,
            build() {
                return __.Statistics.sampleVariance;
            },
        },
        {
            name: 'variance',
            visible: true,
            numargs: -1,
            build() {
                return __.Statistics.variance;
            },
        },
        {
            name: 'smpstdev',
            visible: true,
            numargs: -1,
            build() {
                return __.Statistics.sampleStandardDeviation;
            },
        },
        {
            name: 'stdev',
            visible: true,
            numargs: -1,
            build() {
                return __.Statistics.standardDeviation;
            },
        },
        {
            name: 'zscore',
            visible: true,
            numargs: 3,
            build() {
                return __.Statistics.zScore;
            },
        },
    ]);

    // Link registered functions externally
    nerdamer.updateAPI();
})();

// Added for all.min.js
if (typeof module !== 'undefined') {
    module.exports = nerdamer;
}
