import type { NerdamerExpression } from '../index';

// Import complete nerdamer with all modules for runtime
const nerdamer = require('../all');

function expectType<T>(_value: T): void {}

describe('Nerdamer Calculus Addon Type Definitions', () => {
    it('should compile when using calculus functions correctly', () => {
        // Test differentiation
        const derivative: NerdamerExpression = nerdamer.diff('sin(x)', 'x');
        expectType<NerdamerExpression>(derivative);

        // Test differentiation with order
        const secondDerivative: NerdamerExpression = nerdamer.diff('x^3', 'x', 2);
        expectType<NerdamerExpression>(secondDerivative);

        // Test integration
        const integral: NerdamerExpression = nerdamer.integrate('x^2', 'x');
        expectType<NerdamerExpression>(integral);

        // Test definite integration
        const definiteIntegral: NerdamerExpression = nerdamer.defint('x^2', 0, 2, 'x');
        expectType<NerdamerExpression>(definiteIntegral);

        // Test summation
        const summation: NerdamerExpression = nerdamer.sum('i^2', 'i', 1, 10);
        expectType<NerdamerExpression>(summation);

        // Test product
        const product: NerdamerExpression = nerdamer.product('i', 'i', 1, 5);
        expectType<NerdamerExpression>(product);

        // Test limit
        const limit: NerdamerExpression = nerdamer.limit('sin(x)/x', 'x', 0);
        expectType<NerdamerExpression>(limit);
    });

    it('should handle calculus with complex expressions', () => {
        // Test differentiation of complex expressions
        const complexDerivative: NerdamerExpression = nerdamer.diff('e^(x^2) * sin(x)', 'x');
        expectType<NerdamerExpression>(complexDerivative);

        // Test integration by parts candidates
        const logIntegral: NerdamerExpression = nerdamer.integrate('log(x)', 'x');
        expectType<NerdamerExpression>(logIntegral);

        // Test trigonometric integration
        const trigIntegral: NerdamerExpression = nerdamer.integrate('cos(x)*sin(x)', 'x');
        expectType<NerdamerExpression>(trigIntegral);
    });

    it('should handle variable order parameters correctly', () => {
        // Test that order parameter accepts both number and string
        const numericOrder: NerdamerExpression = nerdamer.diff('x^4', 'x', 3);
        expectType<NerdamerExpression>(numericOrder);

        const stringOrder: NerdamerExpression = nerdamer.diff('x^4', 'x', '3');
        expectType<NerdamerExpression>(stringOrder);
    });

    it('should handle bound parameters correctly', () => {
        // Test that bounds accept both number and string
        const numericBounds: NerdamerExpression = nerdamer.sum('i', 'i', 1, 10);
        expectType<NerdamerExpression>(numericBounds);

        const stringBounds: NerdamerExpression = nerdamer.sum('i', 'i', 'a', 'b');
        expectType<NerdamerExpression>(stringBounds);

        const mixedBounds: NerdamerExpression = nerdamer.defint('x^2', 0, 'b', 'x');
        expectType<NerdamerExpression>(mixedBounds);
    });
});
