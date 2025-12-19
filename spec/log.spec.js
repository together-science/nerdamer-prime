'use strict';

const nerdamer = require('../nerdamer.core.js');
const utils = require('./support/utils');
const _ = utils.toFixed;
const core = nerdamer.getCore();
const round = core.Utils.round;

describe('Logarithms', () => {
    it('should evaluate natural logarithm log(x)', () => {
        const cases = [
            { given: 'log(e)', expected: '1', expectedValue: '1' },
            { given: 'log(e^e)', expected: 'e', expectedValue: '2.718281828459045' },
            { given: 'log(1/e^e)', expected: '-e', expectedValue: '-2.718281828459045' },
        ];

        for (let i = 0; i < cases.length; i++) {
            const parsed = nerdamer(cases[i].given);
            const value = parsed.evaluate().text('decimals');
            expect(parsed.toString()).toEqual(cases[i].expected);
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should evaluate logarithm with custom base log(x, b)', () => {
        const cases = [
            { given: 'log(8, 2)', expected: '3', expectedValue: '3' },
            { given: 'log(100, 10)', expected: '2', expectedValue: '2' },
            { given: 'log(2^5, 2)', expected: '5', expectedValue: '5' },
        ];

        for (let i = 0; i < cases.length; i++) {
            const parsed = nerdamer(cases[i].given);
            const value = parsed.evaluate().text('decimals');
            expect(parsed.toString()).toEqual(cases[i].expected);
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should evaluate common logarithm log10(x)', () => {
        const cases = [
            { given: 'log10(1000)', expectedValue: '3' },
            { given: 'log10(100)', expectedValue: '2' },
            { given: 'log10(1/100)', expectedValue: '-2' },
        ];

        for (let i = 0; i < cases.length; i++) {
            const parsed = nerdamer(cases[i].given);
            const value = parsed.evaluate().text('decimals');
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should evaluate binary logarithm log2(x)', () => {
        const cases = [
            { given: 'log2(8)', expectedValue: '3' },
            { given: 'log2(4)', expectedValue: '2' },
            { given: 'log2(2)', expectedValue: '1' },
            { given: 'log2(1/4)', expectedValue: '-2' },
        ];

        for (let i = 0; i < cases.length; i++) {
            const parsed = nerdamer(cases[i].given);
            const value = parsed.evaluate().text('decimals');
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should evaluate log1p(x)', () => {
        const cases = [
            { given: 'log1p(0)', expectedValue: '0' },
            { given: 'log1p(0.5)', expectedValue: '0.4054651081081644' },
            { given: 'log1p(-0.5)', expectedValue: '-0.6931471805599453' },
            { given: 'log1p(1e-9)', expectedValue: String(Math.log1p(1e-9)) },
        ];

        for (let i = 0; i < cases.length; i++) {
            const parsed = nerdamer(cases[i].given);
            const value = parsed.evaluate().text('decimals');
            expect(round(value), 14).toEqual(round(cases[i].expectedValue), 14);
        }
    });

    it('should throw on log(0)', () => {
        expect(() => {
            nerdamer('log(0)');
        }).toThrow();
    });

    it('environment should provide native Math.log, Math.log10, Math.log2 and Math.log1p', () => {
        expect(typeof Math.log).toBe('function');
        expect(typeof Math.log10).toBe('function');
        expect(typeof Math.log2).toBe('function');
        expect(typeof Math.log1p).toBe('function');

        expect(Math.log(Math.E)).toBeCloseTo(1, 12);
        expect(Math.log10(1000)).toBeCloseTo(3, 12);
        expect(Math.log2(8)).toBeCloseTo(3, 12);
        expect(Math.log1p(1e-9)).toBeCloseTo(Math.log(1 + 1e-9), 12);
    });

    it('Math.log2 agrees with nerdamer log(x, 2)', () => {
        const nums = [0.5, 1, 2, 4, 8, 16, 10];
        for (let i = 0; i < nums.length; i++) {
            const n = nums[i];
            const expected = Math.log2(n);
            const expr = nerdamer(`log(${n},2)`);
            const value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('Math.log1p agrees with nerdamer log(1 + x)', () => {
        const xs = [0, 1e-9, 1e-5, 0.1, 0.5, -0.5];
        for (let i = 0; i < xs.length; i++) {
            const x = xs[i];
            const expected = Math.log1p(x);
            const expr = nerdamer(`log(${1 + x})`);
            const value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('Math.log agrees with nerdamer log(x)', () => {
        const nums = [Math.E, 1, 10, 0.5, 3.141592653589793];
        for (let i = 0; i < nums.length; i++) {
            const n = nums[i];
            const expected = Math.log(n);
            const expr = nerdamer(`log(${n})`);
            const value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('Math.log10 agrees with nerdamer log10(x)', () => {
        const nums = [1, 10, 100, 1000, 0.1, 0.01, 2, 5];
        for (let i = 0; i < nums.length; i++) {
            const n = nums[i];
            const expected = Math.log10(n);
            const expr = nerdamer(`log10(${n})`);
            const value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('nerdamer log(x,b) agrees with change-of-base numerically', () => {
        const cases = [
            [3, 7],
            [10, 2],
            [0.5, 2],
            [16, 4],
            [1000, 10],
            [2.5, 5],
            [1, 10],
        ];
        for (let i = 0; i < cases.length; i++) {
            const x = cases[i][0];
            const b = cases[i][1];
            const expected = Math.log(x) / Math.log(b);
            const expr = nerdamer(`log(${x},${b})`);
            const value = Number(expr.evaluate().text('decimals'));
            expect(value).toBeCloseTo(expected, 12);
        }
    });

    it('should simplify log(e^3, e) to 3', () => {
        const parsed = nerdamer('log(e^3, e)');
        expect(parsed.toString()).toEqual('3');
        expect(Number(parsed.evaluate().text('decimals'))).toBeCloseTo(3, 12);
    });
});
