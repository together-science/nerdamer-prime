import { NerdamerExpression, SolveResult } from '../index';

// Import complete nerdamer with all modules for runtime
const nerdamer = require('../all');

function expectType<T>(_value: T): void {}

describe('Nerdamer Algebra & Solve Addon Type Definitions', () => {
    it('should compile when using algebra functions correctly', () => {
        // Test polynomial division
        const division: NerdamerExpression | NerdamerExpression[] = nerdamer.divide('x^3 + 2*x^2 + x', 'x + 1');
        expectType<NerdamerExpression | NerdamerExpression[]>(division);

        // Test partial fractions
        const partialFractions: NerdamerExpression = nerdamer.partfrac('(x+1)/(x^2-1)', 'x');
        expectType<NerdamerExpression>(partialFractions);

        // Test GCD and LCM
        const gcdResult: NerdamerExpression = nerdamer.gcd('12*x^2', '18*x');
        expectType<NerdamerExpression>(gcdResult);

        const lcmResult: NerdamerExpression = nerdamer.lcm('x^2-1', 'x^2+2*x+1');
        expectType<NerdamerExpression>(lcmResult);

        // Test with multiple arguments
        const multiGcd: NerdamerExpression = nerdamer.gcd('12', '18', '24');
        expectType<NerdamerExpression>(multiGcd);

        // Test polynomial operations
        const roots = nerdamer.roots('x^2 - 5*x + 6');
        expectType<nerdamer.NerdamerCore.Vector>(roots);

        const coefficients = nerdamer.coeffs('x^3 + 2*x^2 + x + 1', 'x');
        expectType<nerdamer.NerdamerCore.Vector>(coefficients);

        const degree: NerdamerExpression = nerdamer.deg('x^5 + 3*x^2', 'x');
        expectType<NerdamerExpression>(degree);

        // Test square completion
        const squareComplete: NerdamerExpression = nerdamer.sqcomp('x^2 + 4*x + 1', 'x');
        expectType<NerdamerExpression>(squareComplete);
    });

    it('should compile when using solve functions correctly', () => {
        // Test single equation solving
        const solutions = nerdamer.solve('x^2 - 4', 'x');
        expectType<nerdamer.NerdamerCore.Vector>(solutions);

        // Test system of equations
        const systemSolutions: SolveResult | [] | null = nerdamer.solveEquations(['x + y = 5', '2*x - y = 1']);
        expectType<SolveResult | [] | null>(systemSolutions);

        // Test system with specified variables
        const systemWithVars: SolveResult | [] | null = nerdamer.solveEquations(
            ['a + b = 10', 'a - b = 2'],
            ['a', 'b']
        );
        expectType<SolveResult | [] | null>(systemWithVars);

        // Test equation creation
        const equation = nerdamer.setEquation('x^2', '4');
        expectType<import('../index').NerdamerEquation>(equation);
    });

    it('should handle expression method solving', () => {
        // Test solveFor method on expressions
        const expr = nerdamer('a*x^2 + b*x + c = 0');
        const solutions: NerdamerExpression[] = expr.solveFor('x');
        expectType<NerdamerExpression[]>(solutions);
    });

    it('should handle complex algebraic operations', () => {
        // Test factorization
        const factored: NerdamerExpression = nerdamer.factor('x^2 - 4');
        expectType<NerdamerExpression>(factored);

        // Test expansion
        const expanded: NerdamerExpression = nerdamer.expand('(x+1)*(x-1)');
        expectType<NerdamerExpression>(expanded);

        // Test simplification
        const simplified: NerdamerExpression = nerdamer.simplify('(x^2-1)/(x-1)');
        expectType<NerdamerExpression>(simplified);
    });
});
