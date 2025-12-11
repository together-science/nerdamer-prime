import { NerdamerExpression, NerdamerEquation } from '../index';

// Import complete nerdamer with all modules for runtime
const nerdamer = require('../all');

// A helper function to make intent clear. It does nothing at runtime.
function expectType<T>(_value: T): void {
    // This space intentionally left blank.
}

describe('Nerdamer Core Type Definitions', () => {
    it('should compile when using core functions with correct types', () => {
        // Test the main function with string input
        const expr1: NerdamerExpression = nerdamer('x^2');
        expectType<NerdamerExpression>(expr1);

        // Test the main function with number input
        const expr2: NerdamerExpression = nerdamer(42);
        expectType<NerdamerExpression>(expr2);

        // Test chaining operations
        const expr3 = nerdamer('x').add('2*y');
        expectType<NerdamerExpression>(expr3);

        // Test a core method
        const simplified = nerdamer('x+x').simplify();
        expectType<NerdamerExpression>(simplified);

        // Test evaluation with substitutions
        const variables = { x: 5, y: 10 };
        const evaluated: NerdamerExpression = nerdamer('x^2 + y').evaluate(variables);
        expectType<NerdamerExpression>(evaluated);

        // Test string output methods
        const stringResult: string = nerdamer('x^2').toString();
        expectType<string>(stringResult);

        const latexString: string = nerdamer('x^2').toTeX();
        expectType<string>(latexString);

        const textOutput: string = nerdamer('x^2').text();
        expectType<string>(textOutput);

        // Test boolean methods
        const isNumber: boolean = nerdamer('42').isNumber();
        expectType<boolean>(isNumber);

        const isImaginary: boolean = nerdamer('sqrt(-1)').isImaginary();
        expectType<boolean>(isImaginary);

        // Test comparison methods
        const isEqual: boolean = nerdamer('2+2').eq(4);
        expectType<boolean>(isEqual);

        const isLess: boolean = nerdamer('3').lt(5);
        expectType<boolean>(isLess);

        // Test arithmetic operations
        const sum: NerdamerExpression = nerdamer('x').add('y');
        expectType<NerdamerExpression>(sum);

        const product: NerdamerExpression = nerdamer('x').multiply(3);
        expectType<NerdamerExpression>(product);

        const power: NerdamerExpression = nerdamer('x').pow(2);
        expectType<NerdamerExpression>(power);
    });

    it('should handle equations correctly', () => {
        // Test equation creation
        const equation = nerdamer('x^2 = 4');
        expectType<NerdamerExpression | NerdamerEquation>(equation);

        // If it's an equation, it should have LHS and RHS properties
        if ('LHS' in equation) {
            expectType<NerdamerExpression>(equation.LHS);
            expectType<NerdamerExpression>(equation.RHS);

            const lhsExpression: NerdamerExpression = equation.toLHS();
            expectType<NerdamerExpression>(lhsExpression);
        }
    });

    it('should handle function building correctly', () => {
        // Test function building
        const fn: (...args: number[]) => number = nerdamer('x^2 + y').buildFunction();
        expectType<(...args: number[]) => number>(fn);

        // Test with specific variable order
        const fnOrdered: (...args: number[]) => number = nerdamer('x^2 + y').buildFunction(['x', 'y']);
        expectType<(...args: number[]) => number>(fnOrdered);
    });

    it('should handle variable operations correctly', () => {
        // Test variable extraction
        const vars: string[] = nerdamer('x^2 + y*z').variables();
        expectType<string[]>(vars);

        // Test substitution
        const substituted: NerdamerExpression = nerdamer('x^2').sub('x', 'y + 1');
        expectType<NerdamerExpression>(substituted);

        // Test contains
        const contains: boolean = nerdamer('x^2 + y').contains('x');
        expectType<boolean>(contains);
    });
});
