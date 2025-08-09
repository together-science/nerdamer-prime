'use strict';

var nerdamer = require('../nerdamer.core.js');
var utils = require('./support/utils');
var _ = utils.toFixed;
var core = nerdamer.getCore();
var round = core.Utils.round;

describe('Logarithms', function () {
    it('should evaluate natural logarithm log(x)', function () {
        var cases = [
            { given: 'log(e)', expected: '1', expectedValue: '1' },
            { given: 'log(e^e)', expected: 'e', expectedValue: '2.718281828459045' },
            { given: 'log(1/e^e)', expected: '-e', expectedValue: '-2.718281828459045' }
        ];

        for (var i = 0; i < cases.length; i++) {
            var parsed = nerdamer(cases[i].given);
            var value = parsed.evaluate().text('decimals');
            expect(parsed.toString()).toEqual(cases[i].expected);
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should evaluate logarithm with custom base log(x, b)', function () {
        var cases = [
            { given: 'log(8, 2)', expected: '3', expectedValue: '3' },
            { given: 'log(100, 10)', expected: '2', expectedValue: '2' },
            { given: 'log(2^5, 2)', expected: '5', expectedValue: '5' }
        ];

        for (var i = 0; i < cases.length; i++) {
            var parsed = nerdamer(cases[i].given);
            var value = parsed.evaluate().text('decimals');
            expect(parsed.toString()).toEqual(cases[i].expected);
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should evaluate common logarithm log10(x)', function () {
        var cases = [
            { given: 'log10(1000)', expectedValue: '3' },
            { given: 'log10(100)', expectedValue: '2' },
            { given: 'log10(1/100)', expectedValue: '-2' }
        ];

        for (var i = 0; i < cases.length; i++) {
            var parsed = nerdamer(cases[i].given);
            var value = parsed.evaluate().text('decimals');
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should throw on log(0)', function () {
        expect(function () { nerdamer('log(0)'); }).toThrow();
    });

    it('environment should provide native Math.log, Math.log10, Math.log2 and Math.log1p', function () {
        expect(typeof Math.log).toBe('function');
        expect(typeof Math.log10).toBe('function');
        expect(typeof Math.log2).toBe('function');
        expect(typeof Math.log1p).toBe('function');

        expect(Math.log(Math.E)).toBeCloseTo(1, 12);
        expect(Math.log10(1000)).toBeCloseTo(3, 12);
        expect(Math.log2(8)).toBeCloseTo(3, 12);
        expect(Math.log1p(1e-9)).toBeCloseTo(Math.log(1 + 1e-9), 12);
    });

    it('Math.log2 agrees with nerdamer log(x, 2)', function () {
        var nums = [0.5, 1, 2, 4, 8, 16, 10];
        for (var i = 0; i < nums.length; i++) {
            var n = nums[i];
            var expected = Math.log2(n);
            var expr = nerdamer('log(' + n + ',2)');
            var value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('Math.log1p agrees with nerdamer log(1 + x)', function () {
        var xs = [0, 1e-9, 1e-5, 0.1, 0.5, -0.5];
        for (var i = 0; i < xs.length; i++) {
            var x = xs[i];
            var expected = Math.log1p(x);
            var expr = nerdamer('log(' + (1 + x) + ')');
            var value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('Math.log agrees with nerdamer log(x)', function () {
        var nums = [Math.E, 1, 10, 0.5, 3.141592653589793];
        for (var i = 0; i < nums.length; i++) {
            var n = nums[i];
            var expected = Math.log(n);
            var expr = nerdamer('log(' + n + ')');
            var value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('Math.log10 agrees with nerdamer log10(x)', function () {
        var nums = [1, 10, 100, 1000, 0.1, 0.01, 2, 5];
        for (var i = 0; i < nums.length; i++) {
            var n = nums[i];
            var expected = Math.log10(n);
            var expr = nerdamer('log10(' + n + ')');
            var value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('nerdamer log(x,b) agrees with change-of-base numerically', function () {
        var cases = [
            [3, 7],
            [10, 2],
            [0.5, 2],
            [16, 4],
            [1000, 10],
            [2.5, 5],
            [1, 10]
        ];
        for (var i = 0; i < cases.length; i++) {
            var x = cases[i][0];
            var b = cases[i][1];
            var expected = Math.log(x) / Math.log(b);
            var expr = nerdamer('log(' + x + ',' + b + ')');
            var value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('should simplify log(e^3, e) to 3', function () {
        var parsed = nerdamer('log(e^3, e)');
        expect(parsed.toString()).toEqual('3');
        expect(Number(parsed.evaluate().text('decimals'))).toBeCloseTo(3, 12);
    });
});


