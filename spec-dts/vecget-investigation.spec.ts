/**
 * Investigation test for vecget return type behavior
 *
 * This test file specifically investigates the issue described where:
 *
 * - Vecget should return NerdamerExpression or undefined
 * - But actually returns object wrappers with symbol properties
 */

describe('vecget Return Type Investigation', () => {
    let nerdamerRuntime: any;

    beforeAll(async () => {
        // Load complete nerdamer with all modules
        nerdamerRuntime = await import('../all.js');
        nerdamerRuntime = nerdamerRuntime.default || nerdamerRuntime;
    });

    it('should investigate vecget return type behavior', () => {
        console.log('\n=== vecget Return Type Investigation ===');

        // Create test data - polynomial with known coefficients
        const expr = nerdamerRuntime('x^2 + 2*x + 1');
        const coeffs = nerdamerRuntime.coeffs(expr, 'x');

        console.log('Expression:', expr.toString());
        console.log('Coefficients:', coeffs.toString());
        console.log('Coefficients type:', typeof coeffs);
        console.log('Coefficients constructor:', coeffs.constructor.name);

        // Test 1: Valid coefficient access (index 0)
        console.log('\n--- Test 1: Valid Index (0) ---');
        const validResult = nerdamerRuntime.vecget(coeffs, 0);

        console.log('Result:', validResult);
        console.log('Type:', typeof validResult);
        console.log('Constructor:', validResult.constructor.name);
        console.log('Has symbol property:', 'symbol' in validResult);
        console.log('Has toString method:', typeof validResult.toString === 'function');
        console.log('Has text method:', typeof validResult.text === 'function');

        if ('symbol' in validResult) {
            console.log('Symbol property type:', typeof validResult.symbol);
            console.log('Symbol value:', validResult.symbol);
        }

        // Test 2: Another valid coefficient access (index 1)
        console.log('\n--- Test 2: Valid Index (1) ---');
        const validResult2 = nerdamerRuntime.vecget(coeffs, 1);

        console.log('Result:', validResult2);
        console.log('Type:', typeof validResult2);
        console.log('Has symbol property:', 'symbol' in validResult2);

        // Test 3: Invalid coefficient access (out of bounds)
        console.log('\n--- Test 3: Invalid Index (3) ---');
        const invalidResult = nerdamerRuntime.vecget(coeffs, 3);

        console.log('Result:', invalidResult);
        console.log('Type:', typeof invalidResult);
        console.log('Constructor:', invalidResult?.constructor?.name);
        console.log('Has symbol property:', 'symbol' in invalidResult);
        console.log('Has toString method:', typeof invalidResult?.toString === 'function');
        console.log('Has text method:', typeof invalidResult?.text === 'function');

        if ('symbol' in invalidResult) {
            console.log('Symbol property type:', typeof invalidResult.symbol);
            console.log('Symbol value:', invalidResult.symbol);
            console.log('Symbol is undefined:', invalidResult.symbol === undefined);
        }

        // Test 4: Check what a proper NerdamerExpression looks like
        console.log('\n--- Test 4: Reference NerdamerExpression ---');
        const referenceExpr = nerdamerRuntime('5');
        console.log('Reference expression:', referenceExpr);
        console.log('Reference type:', typeof referenceExpr);
        console.log('Reference constructor:', referenceExpr.constructor.name);
        console.log('Reference has symbol:', 'symbol' in referenceExpr);
        console.log('Reference toString:', typeof referenceExpr.toString === 'function');
        console.log('Reference text:', typeof referenceExpr.text === 'function');

        // Verification: Check the specific issue claims
        console.log('\n=== Issue Verification ===');

        const isValidResultObjectWrapper =
            validResult &&
            typeof validResult === 'object' &&
            'symbol' in validResult &&
            validResult.symbol !== undefined;

        const isInvalidResultObjectWrapper =
            invalidResult &&
            typeof invalidResult === 'object' &&
            'symbol' in invalidResult &&
            invalidResult.symbol === undefined;

        console.log('Valid result is object wrapper with symbol:', isValidResultObjectWrapper);
        console.log('Invalid result is object wrapper with undefined symbol:', isInvalidResultObjectWrapper);

        // Expected vs Actual behavior summary
        console.log('\n=== Expected vs Actual Behavior ===');
        console.log('EXPECTED: vecget(coeffs, 0) should return NerdamerExpression');
        console.log('ACTUAL: vecget(coeffs, 0) returns:', typeof validResult, 'with symbol property');

        console.log('EXPECTED: vecget(coeffs, 3) should return undefined');
        console.log('ACTUAL: vecget(coeffs, 3) returns:', typeof invalidResult, 'with symbol:', invalidResult?.symbol);

        // Assertions to document the current behavior
        expect(typeof validResult).toBe('object');
        expect('symbol' in validResult).toBe(true);
        expect(validResult.symbol).toBeDefined();

        expect(typeof invalidResult).toBe('object');
        expect('symbol' in invalidResult).toBe(true);
        expect(invalidResult.symbol).toBeUndefined();

        // The issue: both return objects, but invalid should return undefined
        console.log('\n=== ISSUE CONFIRMED ===');
        console.log('✓ Valid index returns object wrapper instead of direct NerdamerExpression');
        console.log('✓ Invalid index returns object wrapper with undefined symbol instead of undefined');
    });

    it('should test various vector indices', () => {
        console.log('\n=== Testing Various Vector Indices ===');

        // Create a longer polynomial to test more coefficients
        const expr = nerdamerRuntime('x^3 + 2*x^2 + 3*x + 4');
        const coeffs = nerdamerRuntime.coeffs(expr, 'x');

        console.log('Expression:', expr.toString());
        console.log('Coefficients:', coeffs.toString());

        // Test all valid indices
        const results = [];
        for (let i = 0; i < 4; i++) {
            const result = nerdamerRuntime.vecget(coeffs, i);
            results.push({
                index: i,
                result,
                type: typeof result,
                hasSymbol: 'symbol' in result,
                symbolValue: result?.symbol?.toString?.() || result?.symbol,
                isUndefined: result === undefined,
            });
        }

        // Test invalid indices
        for (let i = 4; i < 7; i++) {
            const result = nerdamerRuntime.vecget(coeffs, i);
            results.push({
                index: i,
                result,
                type: typeof result,
                hasSymbol: 'symbol' in result,
                symbolValue: result?.symbol?.toString?.() || result?.symbol,
                isUndefined: result === undefined,
            });
        }

        console.log('\nResults summary:');
        results.forEach(r => {
            console.log(
                `Index ${r.index}: type=${r.type}, hasSymbol=${r.hasSymbol}, symbolValue=${r.symbolValue}, isUndefined=${r.isUndefined}`
            );
        });

        // All should be objects (this documents the current behavior)
        results.forEach(r => {
            expect(r.type).toBe('object');
            expect(r.hasSymbol).toBe(true);
            expect(r.isUndefined).toBe(false);
        });

        // Valid indices should have defined symbols
        for (let i = 0; i < 4; i++) {
            expect(results[i]?.symbolValue).toBeDefined();
            expect(results[i]?.symbolValue).not.toBe('undefined');
        }

        // Invalid indices should have undefined symbols
        for (let i = 4; i < 7; i++) {
            expect(results[i]?.symbolValue).toBeUndefined();
        }
    });
});
