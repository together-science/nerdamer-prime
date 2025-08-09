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
});


