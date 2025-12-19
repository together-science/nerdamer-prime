/* global expect, describe, it, beforeEach, afterEach */

'use strict';

/**
 * Regression tests for USE_BIG mode with complex number powers.
 *
 * These tests verify the fix for a bug in the pow() function where
 * undefined variables `i` and `r` were used instead of `im` and `re`
 * when computing powers of imaginary numbers with Settings.USE_BIG enabled.
 *
 * The bug caused: "Cannot read properties of undefined (reading 'multiplier')"
 *
 * Fix: Changed bigDec.atan2(i.multiplier..., r.multiplier...)
 *   to bigDec.atan2(im.multiplier..., re.multiplier...)
 */

var nerdamer = require('../nerdamer.core.js');
var core = nerdamer.getCore();
var Settings = core.Settings;

describe('USE_BIG mode with complex number powers', function () {
    var originalUseBig;

    beforeEach(function () {
        // Save original setting
        originalUseBig = Settings.USE_BIG;
    });

    afterEach(function () {
        // Restore original setting
        Settings.USE_BIG = originalUseBig;
    });

    describe('when USE_BIG is false (default)', function () {
        beforeEach(function () {
            Settings.USE_BIG = false;
        });

        it('should compute i^3 correctly', function () {
            var result = nerdamer('i^3').evaluate().text('decimals');
            // i^3 = i^2 * i = -1 * i = -i
            expect(result).toEqual('-i');
        });

        it('should compute i^4 correctly', function () {
            var result = nerdamer('i^4').evaluate().text('decimals');
            // i^4 = (i^2)^2 = (-1)^2 = 1
            expect(result).toEqual('1');
        });
    });

    describe('when USE_BIG is true', function () {
        beforeEach(function () {
            Settings.USE_BIG = true;
        });

        it('should compute i^3 correctly in USE_BIG mode', function () {
            var result = nerdamer('i^3').evaluate().text('decimals');
            // i^3 = i^2 * i = -1 * i = -i
            expect(result).toEqual('-i');
        });

        it('should compute i^4 correctly in USE_BIG mode', function () {
            var result = nerdamer('i^4').evaluate().text('decimals');
            // i^4 = (i^2)^2 = (-1)^2 = 1
            expect(result).toEqual('1');
        });

        it('should handle pure imaginary number powers in USE_BIG mode', function () {
            // 2i raised to power 2 = 4*i^2 = -4
            var result = nerdamer('(2*i)^2').evaluate().text('decimals');
            // Allow for floating point precision - result should be approximately -4
            // The imaginary part should be essentially 0 (< 1e-10)
            expect(result).toMatch(/^-4/);
        });

        it('should handle pure imaginary number cubed in USE_BIG mode', function () {
            // (2i)^3 = 8*i^3 = 8*(-i) = -8i
            var result = nerdamer('(2*i)^3').evaluate().text('decimals');
            // Allow for floating point precision - result should be approximately -8i
            // The real part should be essentially 0 (< 1e-10)
            expect(result).toMatch(/-8\*i$/);
        });

        it('should handle pure imaginary number to the 4th power in USE_BIG mode', function () {
            // (2i)^4 = 16*i^4 = 16*1 = 16
            var result = nerdamer('(2*i)^4').evaluate().text('decimals');
            // Allow for floating point precision - result should be approximately 16
            // The imaginary part should be essentially 0 (< 1e-10)
            expect(result).toMatch(/16$/);
        });
    });
});
