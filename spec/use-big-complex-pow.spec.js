/* global expect, describe, it, beforeEach, afterEach */

/**
 * Regression tests for USE_BIG mode with complex number powers.
 *
 * These tests verify the fix for a bug in the pow() function where the bigDec.atan2() result was double-wrapped with NerdamerSymbol when USE_BIG was enabled.
 *
 * The buggy code was: phi = Settings.USE_BIG ? new NerdamerSymbol(bigDec.atan2(...).times(b.toString())) // BUG: wrapped here : Math.atan2(...) * b; theta = new NerdamerSymbol(phi); // and wrapped again here
 *
 * The bug caused: "ParseError: Invalid integer: NaN" because a NerdamerSymbol containing a Decimal was passed to new NerdamerSymbol() again.
 *
 * Fix: Removed the redundant new NerdamerSymbol() wrapper from the USE_BIG branch, so phi is just the raw Decimal value which then gets properly wrapped once on the next line.
 */

const nerdamer = require('../nerdamer.core.js');
const core = nerdamer.getCore();
const { Settings } = core;

describe('USE_BIG mode with complex number powers', () => {
    let originalUseBig;

    beforeEach(() => {
        // Save original setting
        originalUseBig = Settings.USE_BIG;
    });

    afterEach(() => {
        // Restore original setting
        Settings.USE_BIG = originalUseBig;
    });

    describe('when USE_BIG is false (default)', () => {
        beforeEach(() => {
            Settings.USE_BIG = false;
        });

        it('should compute i^3 correctly', () => {
            const result = nerdamer('i^3').evaluate().text('decimals');
            // I^3 = i^2 * i = -1 * i = -i
            expect(result).toEqual('-i');
        });

        it('should compute i^4 correctly', () => {
            const result = nerdamer('i^4').evaluate().text('decimals');
            // I^4 = (i^2)^2 = (-1)^2 = 1
            expect(result).toEqual('1');
        });
    });

    describe('when USE_BIG is true', () => {
        beforeEach(() => {
            Settings.USE_BIG = true;
        });

        it('should compute i^3 correctly in USE_BIG mode', () => {
            const result = nerdamer('i^3').evaluate().text('decimals');
            // I^3 = i^2 * i = -1 * i = -i
            expect(result).toEqual('-i');
        });

        it('should compute i^4 correctly in USE_BIG mode', () => {
            const result = nerdamer('i^4').evaluate().text('decimals');
            // I^4 = (i^2)^2 = (-1)^2 = 1
            expect(result).toEqual('1');
        });

        it('should handle pure imaginary number powers in USE_BIG mode', () => {
            // 2i raised to power 2 = 4*i^2 = -4 (real only, no imaginary component)
            const result = nerdamer('(2*i)^2').evaluate().text('decimals');
            // Result should be exactly -4 with no imaginary part
            expect(result).toMatch(/^-4(?:\.\d+)?$/u);
        });

        it('should handle pure imaginary number cubed in USE_BIG mode', () => {
            // (2i)^3 = 8*i^3 = 8*(-i) = -8i (pure imaginary, no real component)
            const result = nerdamer('(2*i)^3').evaluate().text('decimals');
            // Result should be -8*i with no real part (or negligible real part from floating point)
            // Matches: "-8*i" or "-0.0000000000000009382-8*i" (negligible real part with 10+ leading zeros)
            expect(result).toMatch(/^(?:-?0\.0{10,}\d*)?-8(?:\.\d+)?\*i$/u);
        });

        it('should handle pure imaginary number to the 4th power in USE_BIG mode', () => {
            // (2i)^4 = 16*i^4 = 16*1 = 16 (real only, no imaginary component)
            const result = nerdamer('(2*i)^4').evaluate().text('decimals');
            // Result should be exactly 16 with no imaginary part
            expect(result).toMatch(/^16(?:\.\d+)?$/u);
        });
    });
});
