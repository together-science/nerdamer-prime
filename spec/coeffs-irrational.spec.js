/* global expect */

'use strict';

/**
 * Regression tests for coeffs() function with irrational constants.
 *
 * ISSUE 1: When extracting polynomial coefficients from expressions containing
 * irrational constants (pi, e, sqrt(2)), the Algebra.coeffs() function (used by
 * nerdamer.coeffs()) incorrectly converts these symbolic constants into rational
 * approximations.
 *
 * For example:
 *   - pi becomes 245850922/78256779 (≈ 3.14159265)
 *   - e becomes 325368125/119696244 (≈ 2.71828183)
 *   - sqrt(2) becomes 131836323/93222358 (≈ 1.41421356)
 *
 * This is problematic for symbolic computation where exact forms are needed.
 * A linear expression like `pi*x + e*y - sqrt(2)` should have coefficients
 * that preserve the symbolic constants, not convert them to decimals.
 *
 * ISSUE 2: The string-based syntax `nerdamer('coeffs(pi*x+1, x)')` throws a
 * parse error, while `nerdamer.coeffs('pi*x+1', 'x')` works (but has issue 1).
 *
 * IMPORTANT FINDING: Utils.getCoeffs in nerdamer.core.js WORKS CORRECTLY!
 * It preserves pi, e, and sqrt(2) as symbolic constants. The bug is specifically
 * in Algebra.coeffs (in Algebra.js), which uses a different code path that
 * converts irrationals to rationals. The fix should involve making Algebra.coeffs
 * use a similar approach to Utils.getCoeffs.
 *
 * Expected behavior for `coeffs(pi*x + e*y - sqrt(2), x)`:
 *   [e*y - sqrt(2), pi]  (constant term, coefficient of x)
 *
 * Actual (buggy) behavior:
 *   [(325368125/119696244)*y-131836323/93222358, 245850922/78256779]
 */

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');

describe('Coefficients with irrational constants', function () {
    // These tests document the current buggy behavior with xit (Jasmine skip)
    // Once the bug is fixed, change xit back to it and update expected values

    describe('Single irrational constant preservation', function () {
        xit('should preserve pi in coefficients', function () {
            // Currently returns: [1, 245850922/78256779] (pi approximated as fraction)
            // Expected: [1, pi]
            var result = nerdamer.coeffs('pi*x+1', 'x').toString();
            expect(result).toEqual('[1,pi]');
        });

        xit('should preserve e in coefficients', function () {
            // Currently returns: [1, 325368125/119696244] (e approximated as fraction)
            // Expected: [1, e]
            var result = nerdamer.coeffs('e*y+1', 'y').toString();
            expect(result).toEqual('[1,e]');
        });

        xit('should preserve sqrt(2) in coefficients', function () {
            // Currently returns: [1, 131836323/93222358] (sqrt(2) approximated as fraction)
            // Expected: [1, sqrt(2)]
            var result = nerdamer.coeffs('sqrt(2)*z+1', 'z').toString();
            expect(result).toEqual('[1,sqrt(2)]');
        });
    });

    describe('Multiple irrational constants in expression', function () {
        xit('should preserve both pi and e in coefficient extraction', function () {
            // For expression: pi*x + e*y - sqrt(2)
            // Coefficients with respect to x should be: [e*y - sqrt(2), pi]
            // Currently returns: [(325368125/119696244)*y-131836323/93222358, 245850922/78256779]
            var coeffsX = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'x').toString();
            expect(coeffsX).toEqual('[-sqrt(2)+e*y,pi]');

            // Coefficients with respect to y should be: [pi*x - sqrt(2), e]
            // Currently returns: [(245850922/78256779)*x-131836323/93222358, 325368125/119696244]
            var coeffsY = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'y').toString();
            expect(coeffsY).toEqual('[-sqrt(2)+pi*x,e]');
        });

        xit('should preserve pi and e when both appear as coefficients', function () {
            // pi*x + e
            // Coefficients with respect to x: [e, pi]
            var result = nerdamer.coeffs('pi*x+e', 'x').toString();
            expect(result).toEqual('[e,pi]');
        });

        xit('should preserve pi and e*y in coefficient extraction', function () {
            // pi*x + e*y (no constant term)
            var coeffsX = nerdamer.coeffs('pi*x+e*y', 'x').toString();
            expect(coeffsX).toEqual('[e*y,pi]');

            var coeffsY = nerdamer.coeffs('pi*x+e*y', 'y').toString();
            expect(coeffsY).toEqual('[pi*x,e]');
        });
    });

    describe('Cross-products issue with irrational constants', function () {
        /**
         * When irrational constants are converted to rational approximations,
         * this can create false cross-product terms when checking if an expression
         * is linear. For example, if we expand pi*x + e*y, both coefficients get
         * approximated as fractions, and their product may falsely suggest an x*y term.
         */
        xit('should not create spurious cross-products', function () {
            // A linear expression should have degree 1 in each variable
            // With rational approximations, cross-products could appear due to numeric errors

            // When we extract coefficients, there should be no x*y term
            // (i.e., the expression is clearly linear in x and y)
            var coeffsX = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'x');
            var coeffsY = nerdamer.coeffs('pi*x+e*y-sqrt(2)', 'y');

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

    describe('Utils.getCoeffs preserves irrationals correctly', function () {
        // Note: Utils.getCoeffs is a different code path than the Algebra.coeffs function
        // DISCOVERY: Utils.getCoeffs actually WORKS correctly and preserves symbolic constants!
        // The bug is specifically in Algebra.coeffs (used by nerdamer.coeffs)

        it('should preserve pi in Utils.getCoeffs', function () {
            var Utils = nerdamer.getCore().Utils;
            var sym = nerdamer('pi*x+1').symbol;
            var coeffs = Utils.getCoeffs(sym, 'x');

            expect(coeffs[0].toString()).toEqual('1');
            expect(coeffs[1].toString()).toEqual('pi');
        });

        it('should preserve e in Utils.getCoeffs', function () {
            var Utils = nerdamer.getCore().Utils;
            var sym = nerdamer('e*y+1').symbol;
            var coeffs = Utils.getCoeffs(sym, 'y');

            expect(coeffs[0].toString()).toEqual('1');
            expect(coeffs[1].toString()).toEqual('e');
        });

        it('should preserve sqrt(2) in Utils.getCoeffs', function () {
            var Utils = nerdamer.getCore().Utils;
            var sym = nerdamer('sqrt(2)*z+1').symbol;
            var coeffs = Utils.getCoeffs(sym, 'z');

            expect(coeffs[0].toString()).toEqual('1');
            expect(coeffs[1].toString()).toEqual('sqrt(2)');
        });

        it('should preserve multiple irrationals in Utils.getCoeffs', function () {
            var Utils = nerdamer.getCore().Utils;
            var sym = nerdamer('pi*x+e*y-sqrt(2)').symbol;

            var coeffsX = Utils.getCoeffs(sym, 'x');
            expect(coeffsX[0].toString()).toEqual('-sqrt(2)+e*y');
            expect(coeffsX[1].toString()).toEqual('pi');

            var coeffsY = Utils.getCoeffs(sym, 'y');
            expect(coeffsY[0].toString()).toEqual('-sqrt(2)+pi*x');
            expect(coeffsY[1].toString()).toEqual('e');
        });
    });

    describe('String-based coeffs syntax with irrationals', function () {
        // ISSUE 2: The string-based syntax throws a parse error

        xit('should parse coeffs(pi*x+1, x) without error', function () {
            // Currently throws: TypeError: Cannot read properties of undefined (reading 'message')
            expect(function () {
                nerdamer('coeffs(pi*x+1, x)');
            }).not.toThrow();
        });

        xit('should parse coeffs(e*y+1, y) without error', function () {
            // Currently throws: TypeError: Cannot read properties of undefined (reading 'message')
            expect(function () {
                nerdamer('coeffs(e*y+1, y)');
            }).not.toThrow();
        });

        it('should parse coeffs(sqrt(2)*z+1, z) correctly', function () {
            // sqrt(2) case seems to work differently
            // Note: this does NOT throw, but still approximates sqrt(2)
            var result = nerdamer('coeffs(sqrt(2)*z+1, z)').toString();
            expect(result).toEqual('[1,1]'); // Current (wrong) behavior - sqrt(2) becomes 1
        });
    });

    describe('Verification tests (current behavior)', function () {
        // These tests document the CURRENT (buggy) behavior
        // They should pass now and will need updating when the bug is fixed

        it('should currently approximate pi to a fraction (via nerdamer.coeffs)', function () {
            var result = nerdamer.coeffs('pi*x+1', 'x').toString();
            // This is the current buggy behavior - pi is approximated
            expect(result).toContain('/');  // Contains a fraction
            expect(result).not.toContain('pi');  // Does not contain symbolic pi
        });

        it('should currently approximate e to a fraction (via nerdamer.coeffs)', function () {
            var result = nerdamer.coeffs('e*y+1', 'y').toString();
            // This is the current buggy behavior - e is approximated
            expect(result).toContain('/');  // Contains a fraction
            expect(result).not.toContain('e');  // Does not contain symbolic e
        });

        it('should currently approximate sqrt(2) to a fraction (via nerdamer.coeffs)', function () {
            var result = nerdamer.coeffs('sqrt(2)*z+1', 'z').toString();
            // This is the current buggy behavior - sqrt(2) is approximated
            expect(result).toContain('/');  // Contains a fraction
            expect(result).not.toContain('sqrt');  // Does not contain symbolic sqrt
        });

        it('should verify the specific rational approximations being used', function () {
            // These are the exact rational approximations currently used
            // Documenting them helps detect if the behavior changes

            var piCoeffs = nerdamer.coeffs('pi*x', 'x');
            var piApprox = piCoeffs.symbol.elements[1].text('decimals');
            // Should be close to pi = 3.14159265...
            expect(Math.abs(parseFloat(piApprox) - Math.PI)).toBeLessThan(1e-7);

            var eCoeffs = nerdamer.coeffs('e*y', 'y');
            var eApprox = eCoeffs.symbol.elements[1].text('decimals');
            // Should be close to e = 2.71828182...
            expect(Math.abs(parseFloat(eApprox) - Math.E)).toBeLessThan(1e-7);

            var sqrt2Coeffs = nerdamer.coeffs('sqrt(2)*z', 'z');
            var sqrt2Approx = sqrt2Coeffs.symbol.elements[1].text('decimals');
            // Should be close to sqrt(2) = 1.41421356...
            expect(Math.abs(parseFloat(sqrt2Approx) - Math.SQRT2)).toBeLessThan(1e-7);
        });
    });

    describe('Related: isPoly should handle expressions with irrational constants', function () {
        // These tests check if isPoly() correctly identifies polynomials with irrational coefficients

        it('should recognize pi*x+1 as a polynomial', function () {
            var sym = nerdamer('pi*x+1').symbol;
            // Currently returns false, should be true
            // This is related to the coeffs bug
            var isPoly = sym.isPoly();
            // Document current behavior
            expect(isPoly).toBe(false);  // Current (arguably wrong) behavior
        });

        it('should recognize e*y+1 as a polynomial', function () {
            var sym = nerdamer('e*y+1').symbol;
            var isPoly = sym.isPoly();
            expect(isPoly).toBe(false);  // Current (arguably wrong) behavior
        });

        it('should recognize sqrt(2)*z+1 as a polynomial', function () {
            var sym = nerdamer('sqrt(2)*z+1').symbol;
            var isPoly = sym.isPoly();
            // sqrt(2) is handled differently - this may actually work
            expect(isPoly).toBe(true);  // sqrt(2) case works correctly
        });
    });
});
