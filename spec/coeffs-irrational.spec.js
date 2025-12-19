/* global expect */

'use strict';

/**
 * Regression tests for coeffs() function with irrational constants.
 *
 * These tests verify that the coeffs() function correctly preserves symbolic irrational constants (pi, e, sqrt(2)) rather than converting them to rational approximations.
 *
 * Previously, the Algebra.coeffs() function would incorrectly convert:
 *
 * - Pi to 245850922/78256779 (≈ 3.14159265)
 * - E to 325368125/119696244 (≈ 2.71828183)
 * - Sqrt(2) to 131836323/93222358 (≈ 1.41421356)
 *
 * These issues have been fixed. The tests below serve as regression tests to ensure symbolic constants remain preserved in coefficient extraction.
 */

const nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');

describe('Coefficients with irrational constants', () => {
    describe('Single irrational constant preservation', () => {
        it('should preserve pi in coefficients', () => {
            const result = nerdamer.coeffs('pi*x+1', 'x').toString();
            expect(result).toEqual('[1,pi]');
        });

        it('should preserve e in coefficients', () => {
            const result = nerdamer.coeffs('e*y+1', 'y').toString();
            expect(result).toEqual('[1,e]');
        });

        it('should preserve sqrt(2) in coefficients', () => {
            const result = nerdamer.coeffs('sqrt(2)*z+1', 'z').toString();
            expect(result).toEqual('[1,sqrt(2)]');
        });
    });

    describe('Multiple irrational constants in expression', () => {
        it('should preserve both pi and e in coefficient extraction', () => {
            // For expression: pi*x + e*y - sqrt(2)
            // Coefficients with respect to x should be: [e*y - sqrt(2), pi]
            const coeffsX = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'x').toString();
            expect(coeffsX).toEqual('[-sqrt(2)+e*y,pi]');

            // Coefficients with respect to y should be: [pi*x - sqrt(2), e]
            const coeffsY = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'y').toString();
            expect(coeffsY).toEqual('[-sqrt(2)+pi*x,e]');
        });

        it('should preserve pi and e when both appear as coefficients', () => {
            // Coefficients of pi*x + e with respect to x: [e, pi]
            const result = nerdamer.coeffs('pi*x+e', 'x').toString();
            expect(result).toEqual('[e,pi]');
        });

        it('should preserve pi and e*y in coefficient extraction', () => {
            const coeffsX = nerdamer.coeffs('pi*x+e*y', 'x').toString();
            expect(coeffsX).toEqual('[e*y,pi]');

            const coeffsY = nerdamer.coeffs('pi*x+e*y', 'y').toString();
            expect(coeffsY).toEqual('[pi*x,e]');
        });
    });

    describe('Cross-products issue with irrational constants', () => {
        it('should not create spurious cross-products', () => {
            // A linear expression should have degree 1 in each variable
            // When we extract coefficients, there should be no x*y term
            const coeffsX = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'x');
            const coeffsY = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'y');

            // The coefficient arrays should have length 2 (constant term and linear term)
            expect(coeffsX.symbol.elements.length).toEqual(2);
            expect(coeffsY.symbol.elements.length).toEqual(2);

            // Verify no variable appears in the wrong coefficient
            // The constant term for x should not contain x
            expect(coeffsX.symbol.elements[0].contains('x')).toBe(false);
            // The linear coefficient should be exactly pi
            expect(coeffsX.symbol.elements[1].text()).toEqual('pi');
        });
    });

    describe('Utils.getCoeffs preserves irrationals correctly', () => {
        it('should preserve pi in Utils.getCoeffs', () => {
            const Utils = nerdamer.getCore().Utils;
            const sym = nerdamer('pi*x+1').symbol;
            const coeffs = Utils.getCoeffs(sym, 'x');

            expect(coeffs[0].toString()).toEqual('1');
            expect(coeffs[1].toString()).toEqual('pi');
        });

        it('should preserve e in Utils.getCoeffs', () => {
            const Utils = nerdamer.getCore().Utils;
            const sym = nerdamer('e*y+1').symbol;
            const coeffs = Utils.getCoeffs(sym, 'y');

            expect(coeffs[0].toString()).toEqual('1');
            expect(coeffs[1].toString()).toEqual('e');
        });

        it('should preserve sqrt(2) in Utils.getCoeffs', () => {
            const Utils = nerdamer.getCore().Utils;
            const sym = nerdamer('sqrt(2)*z+1').symbol;
            const coeffs = Utils.getCoeffs(sym, 'z');

            expect(coeffs[0].toString()).toEqual('1');
            expect(coeffs[1].toString()).toEqual('sqrt(2)');
        });

        it('should preserve multiple irrationals in Utils.getCoeffs', () => {
            const Utils = nerdamer.getCore().Utils;
            const sym = nerdamer('pi*x+e*y-sqrt(2)').symbol;

            const coeffsX = Utils.getCoeffs(sym, 'x');
            expect(coeffsX[0].toString()).toEqual('-sqrt(2)+e*y');
            expect(coeffsX[1].toString()).toEqual('pi');

            const coeffsY = Utils.getCoeffs(sym, 'y');
            expect(coeffsY[0].toString()).toEqual('-sqrt(2)+pi*x');
            expect(coeffsY[1].toString()).toEqual('e');
        });
    });

    describe('String-based coeffs syntax with irrationals', () => {
        it('should parse coeffs(pi*x+1, x) without error', () => {
            expect(() => {
                nerdamer('coeffs(pi*x+1, x)');
            }).not.toThrow();
        });

        it('should parse coeffs(e*y+1, y) without error', () => {
            expect(() => {
                nerdamer('coeffs(e*y+1, y)');
            }).not.toThrow();
        });

        it('should parse coeffs(sqrt(2)*z+1, z) correctly', () => {
            const result = nerdamer('coeffs(sqrt(2)*z+1, z)').toString();
            expect(result).toEqual('[1,sqrt(2)]');
        });
    });

    describe('isPoly should handle expressions with irrational constants', () => {
        // Note: isPoly returns false for expressions with transcendental constants
        // like pi and e, which is arguably correct since they are not algebraic.
        // sqrt(2) is algebraic, so isPoly returns true for it.

        it('should recognize pi*x+1 as not a polynomial (pi is transcendental)', () => {
            const sym = nerdamer('pi*x+1').symbol;
            const isPoly = sym.isPoly();
            expect(isPoly).toBe(false);
        });

        it('should recognize e*y+1 as not a polynomial (e is transcendental)', () => {
            const sym = nerdamer('e*y+1').symbol;
            const isPoly = sym.isPoly();
            expect(isPoly).toBe(false);
        });

        it('should recognize sqrt(2)*z+1 as a polynomial (sqrt(2) is algebraic)', () => {
            const sym = nerdamer('sqrt(2)*z+1').symbol;
            const isPoly = sym.isPoly();
            expect(isPoly).toBe(true);
        });
    });

    describe('isLinear should handle expressions with symbolic coefficients', () => {
        /**
         * Regression tests for isLinear() with symbolic/irrational coefficients.
         *
         * Previously, isLinear() would incorrectly return false for expressions like:
         *
         * - A_x + b_y (multi-term with symbolic coefficients)
         * - Pi_x + e_y (multi-term with transcendental constants)
         * - Pi_x + e_y - sqrt(2) (includes function terms like sqrt)
         *
         * The bug was in two places:
         *
         * 1. CB (combination) group terms that didn't contain the target variable were returning false instead of true (they're constant wrt that variable)
         * 2. Terms that don't contain the target variable at all (like sqrt(2) when checking for x) were returning false instead of true
         */

        describe('single terms with symbolic coefficients', () => {
            it('should recognize pi*x as linear in x', () => {
                expect(nerdamer('pi*x').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize pi*x as linear in y (does not contain y)', () => {
                expect(nerdamer('pi*x').symbol.isLinear('y')).toBe(true);
            });

            it('should recognize e*y as linear in y', () => {
                expect(nerdamer('e*y').symbol.isLinear('y')).toBe(true);
            });

            it('should recognize e*y as linear in x (does not contain x)', () => {
                expect(nerdamer('e*y').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize a*x as linear in x', () => {
                expect(nerdamer('a*x').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize sqrt(2)*x as linear in x', () => {
                expect(nerdamer('sqrt(2)*x').symbol.isLinear('x')).toBe(true);
            });
        });

        describe('multi-term expressions with symbolic coefficients', () => {
            it('should recognize a*x + b*y as linear in x', () => {
                expect(nerdamer('a*x+b*y').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize a*x + b*y as linear in y', () => {
                expect(nerdamer('a*x+b*y').symbol.isLinear('y')).toBe(true);
            });

            it('should recognize pi*x + e*y as linear in x', () => {
                expect(nerdamer('pi*x+e*y').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize pi*x + e*y as linear in y', () => {
                expect(nerdamer('pi*x+e*y').symbol.isLinear('y')).toBe(true);
            });

            it('should recognize pi*x + e*y - sqrt(2) as linear in x', () => {
                expect(nerdamer('pi*x+e*y-sqrt(2)').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize pi*x + e*y - sqrt(2) as linear in y', () => {
                expect(nerdamer('pi*x+e*y-sqrt(2)').symbol.isLinear('y')).toBe(true);
            });

            it('should recognize sqrt(2)*x + sqrt(3)*y + 1 as linear in x and y', () => {
                expect(nerdamer('sqrt(2)*x+sqrt(3)*y+1').symbol.isLinear('x')).toBe(true);
                expect(nerdamer('sqrt(2)*x+sqrt(3)*y+1').symbol.isLinear('y')).toBe(true);
            });
        });

        describe('non-linear expressions should still return false', () => {
            it('should recognize x^2 as not linear in x', () => {
                expect(nerdamer('x^2').symbol.isLinear('x')).toBe(false);
            });

            it('should recognize sin(x) as not linear in x', () => {
                expect(nerdamer('sin(x)').symbol.isLinear('x')).toBe(false);
            });

            it('should recognize x^2 + y as not linear in x', () => {
                expect(nerdamer('x^2+y').symbol.isLinear('x')).toBe(false);
            });

            it('should recognize x^2 + y as linear in y', () => {
                expect(nerdamer('x^2+y').symbol.isLinear('y')).toBe(true);
            });

            it('should recognize e^x as not linear in x (exponential)', () => {
                expect(nerdamer('e^x').symbol.isLinear('x')).toBe(false);
            });

            it('should recognize e^x + y as not linear in x', () => {
                expect(nerdamer('e^x+y').symbol.isLinear('x')).toBe(false);
            });

            it('should recognize e^x + y as linear in y', () => {
                expect(nerdamer('e^x+y').symbol.isLinear('y')).toBe(true);
            });

            it('should recognize 2^x as not linear in x', () => {
                expect(nerdamer('2^x').symbol.isLinear('x')).toBe(false);
            });

            it('should recognize x^x as not linear in x', () => {
                expect(nerdamer('x^x').symbol.isLinear('x')).toBe(false);
            });
        });

        describe('terms not containing the variable should be considered linear', () => {
            it('should recognize sqrt(2) as linear in x (does not contain x)', () => {
                expect(nerdamer('sqrt(2)').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize sin(a) as linear in x (does not contain x)', () => {
                expect(nerdamer('sin(a)').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize e^a as linear in x (does not contain x)', () => {
                expect(nerdamer('e^a').symbol.isLinear('x')).toBe(true);
            });

            it('should recognize e^x as linear in y (does not contain y)', () => {
                expect(nerdamer('e^x').symbol.isLinear('y')).toBe(true);
            });
        });
    });
});
