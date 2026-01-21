/**
 * Nerdamer-Prime TypeScript Declaration File
 *
 * Comprehensive typings for the entire Nerdamer mathematical library, including core functionality, algebra, calculus,
 * and solver modules.
 *
 * @version 1.3.0
 * @author Nerdamer-Prime TypeScript Definitions
 * @see {@link https://github.com/together-science/nerdamer-prime}
 *
 * ## Quick Start Guide
 *
 * ```typescript
 * import nerdamer from 'nerdamer-prime';
 *
 * // Basic expression parsing and evaluation
 * const expr = nerdamer('x^2 + 2*x + 1');
 * const result = expr.evaluate({x: 3});  // 16
 *
 * // Symbolic mathematics
 * const expanded = nerdamer.expand('(x+1)^2');     // x^2 + 2*x + 1
 * const factored = nerdamer.factor('x^2 + 2*x + 1'); // (x + 1)^2
 * const simplified = nerdamer.simplify('2*x + 3*x'); // 5*x
 *
 * // Calculus operations
 * const derivative = nerdamer.diff('x^3', 'x');       // 3*x^2
 * const integral = nerdamer.integrate('x^2', 'x');    // x^3/3
 * const definite = nerdamer.defint('x^2', 0, 1, 'x'); // 1/3
 *
 * // Equation solving
 * const solutions = nerdamer.solve('x^2 - 4 = 0', 'x'); // [-2, 2]
 *
 * // Vector and matrix operations
 * const vec = nerdamer.vector([1, 2, 3]);
 * nerdamer.setVar('M', 'matrix([1,2],[3,4])');
 * const mat = nerdamer('M');
 * const det = nerdamer.determinant(mat);  // -2
 * ```
 *
 * ## API Architecture
 *
 * ### Expression-Centric Design
 * Nerdamer uses a unified expression-based architecture:
 * - **Everything is an Expression**: Numbers, variables, vectors, matrices are all `NerdamerExpression` instances
 * - **Consistent API**: All objects share the same base methods (add, multiply, evaluate, etc.)
 * - **Immutable Operations**: Operations return new instances, preserving the original
 * - **Semantic Types**: Vectors and Matrices extend NerdamerExpression with semantic meaning
 *
 * ### Function Organization
 * - **Static Functions**: Most mathematical operations (`nerdamer.factor`, `nerdamer.solve`, `nerdamer.diff`)
 * - **Instance Methods**: Basic manipulation and evaluation (`expr.add`, `expr.evaluate`, `expr.simplify`)
 * - **Chainable Operations**: Many operations can be chained together
 *
 * ### Type Safety
 * These definitions provide full compatibility with the JavaScript runtime:
 * - All declared methods exist at runtime or are properly inherited
 * - Accurate representation of Nerdamer's expression-based architecture
 * - Comprehensive JSDoc documentation with practical examples
 * - Full support for modern TypeScript features
 *
 * ## Module System Support
 *
 * ```typescript
 * // CommonJS
 * const nerdamer = require('nerdamer-prime');
 *
 * // ES6 Modules
 * import nerdamer from 'nerdamer-prime';
 * import { NerdamerExpression } from 'nerdamer-prime';
 *
 * // Browser global
 * // <script src="nerdamer-prime.js"></script>
 * // window.nerdamer is available
 * ```
 */
// #region Main Exports
// Import BigInteger type from big-integer library
import type { BigInteger } from 'big-integer';
// Import Decimal type from big.js library for high-precision arithmetic
import type { Big as Decimal } from 'big.js';

// Extend global Math interface with polyfills defined by nerdamer
declare global {
    interface Math {
        sech?(x: number): number;
        csch?(x: number): number;
        coth?(x: number): number;
    }
}

// Main exports
export = nerdamer;
export as namespace nerdamer;

// Named exports for modern import syntax
export {
    NerdamerExpression,
    NerdamerEquation,
    SolveResult,
    ExpressionParam,
    OutputType,
    ParseOption,
    ExpandOptions,
    ArithmeticOperand,
    LaTeXToken,
    FilteredLaTeXToken,
    SortFn,
};

// #endregion

// #region Core Type Definitions

/** A type alias for strings representing number output formats. */
type OutputType = 'decimals' | 'fractions' | 'scientific' | 'mixed' | 'recurring' | 'decimals_or_scientific' | string;

/** A type alias for common parsing and evaluation options. */
type ParseOption = 'numer' | 'expand';

/** A type alias for accessing items in the expression history. */
type ExpressionHistoryIndex = 'last' | 'first' | number;

/** Options for expand operations */
interface ExpandOptions {
    /** Whether to expand the denominator */
    expand_denominator?: boolean;
    /** Whether to expand functions */
    expand_functions?: boolean;
}

/** Union type for arithmetic operands in parser operations. These methods accept symbols, vectors, or matrices. */
type ArithmeticOperand =
    | nerdamerPrime.NerdamerCore.NerdamerSymbol
    | nerdamerPrime.NerdamerCore.Vector
    | nerdamerPrime.NerdamerCore.Matrix;

/** Type alias for cloneable array items */
interface _Cloneable {
    clone(): this;
}

/** Represents an item in a LaTeX token stream. Used during LaTeX parsing and generation. */
interface LaTeXToken {
    type: string;
    value: string;
    left?: LaTeXToken;
    right?: LaTeXToken;
}

/** Represents a filtered token or token array from LaTeX parsing. */
type FilteredLaTeXToken = LaTeXToken | FilteredLaTeXToken[];

/** Type alias for integer numbers */
type int = number;

/** Type alias for sort comparison functions */
type SortFn = (a: unknown, b: unknown) => number;

// #region Discriminated Union Types for Internal Values

/**
 * Base interface for all parseable mathematical objects. This provides common properties shared by NerdamerSymbol,
 * Vector, and Matrix.
 */
interface _ParseableBase {
    /** Multiplier coefficient */
    multiplier: nerdamerPrime.NerdamerCore.Frac;
    /** Clone method available on all types */
    clone(): this;
    /** String representation */
    toString(): string;
}

/**
 * Union type representing any value that can be returned by the parser. Use type guards (isSymbol, isVector, isMatrix)
 * to narrow the type.
 *
 * @example
 *     ```typescript
 *     const result: ParseResult = parser.parse('x + 1');
 *     if (nerdamer.getCore().Utils.isVector(result)) {
 *         // result is narrowed to Vector
 *         console.log(result.elements.length);
 *     } else if (nerdamer.getCore().Utils.isMatrix(result)) {
 *         // result is narrowed to Matrix
 *         console.log(result.rows());
 *     } else {
 *         // result is narrowed to NerdamerSymbol
 *         console.log(result.group);
 *     }
 *     ```;
 */
type ParseResult =
    | nerdamerPrime.NerdamerCore.NerdamerSymbol
    | nerdamerPrime.NerdamerCore.Vector
    | nerdamerPrime.NerdamerCore.Matrix;

/**
 * Union type for values that can be used in mathematical operations. Includes all ParseResult types plus primitives
 * that can be auto-converted.
 */
type _MathOperand = ParseResult | string | number;

// #endregion

/**
 * A type alias for common expression inputs accepted throughout the Nerdamer API.
 *
 * @example
 *     ```typescript
 *         // All of these are valid ExpressionParam values:
 *         nerdamer.add('x + 1', 'y + 2')     // strings
 *         nerdamer.add(5, 10)                // numbers
 *         nerdamer.add(expr1, expr2)         // NerdamerExpression objects
 *         nerdamer.add(equation, 'x')        // NerdamerEquation objects
 *         ```;
 */
type ExpressionParam =
    | string
    | number
    | NerdamerExpression
    | NerdamerEquation
    | nerdamerPrime.NerdamerCore.NerdamerSymbol;

/**
 * Represents the result of solving a system of equations.
 *
 * **CRITICAL BEHAVIOR NOTE**: The return format depends on the `SOLUTIONS_AS_OBJECT` setting:
 *
 * ```typescript
 * // ✅ SOLUTIONS_AS_OBJECT = true (default):
 * nerdamer.set('SOLUTIONS_AS_OBJECT', true);
 * const result = nerdamer.solveEquations(['x + y - 1', '2*x - y'], ['x', 'y']);
 * // Returns: { x: 0.3333333333333333, y: 0.6666666666666666 }
 *
 * // ✅ SOLUTIONS_AS_OBJECT = false:
 * nerdamer.set('SOLUTIONS_AS_OBJECT', false);
 * const result = nerdamer.solveEquations(['x + y - 1', '2*x - y'], ['x', 'y']);
 * // Returns: [["x", 0.3333333333333333], ["y", 0.6666666666666666]]
 *
 * // ✅ SAFE ACCESS PATTERN for both formats:
 * if (result && typeof result === 'object') {
 *   if (Array.isArray(result)) {
 *     // Array format: [["var", value], ...]
 *     const solutionMap = new Map(result);
 *     const xValue = solutionMap.get('x'); // number
 *   } else {
 *     // Object format: { var: value, ... }
 *     const solutionMap = new Map(Object.entries(result));
 *     const xValue = solutionMap.get('x'); // number
 *   }
 * }
 * ```
 *
 * **Important Notes:**
 *
 * - Values are always **numbers**, not NerdamerExpression objects
 * - For systems with no solution: returns `null` or empty array `[]`
 * - For systems with multiple solutions: behavior may vary
 * - The setting `SOLUTIONS_AS_OBJECT` controls the output format
 */
type SolveResult =
    | Record<string, number | NerdamerExpression | NerdamerExpression[]>
    | [string, number | NerdamerExpression | NerdamerExpression[]][]
    | null
    | [];

// #endregion

// #region Core Expression Interfaces

/**
 * The main expression object returned by nerdamer(), wrapping a symbolic NerdamerSymbol object. Provides a
 * developer-friendly API for manipulating mathematical expressions.
 *
 * All mathematical objects in Nerdamer (including vectors and matrices) are ultimately NerdamerExpression instances,
 * making the API consistent and predictable.
 *
 * @example
 *     ```typescript
 *         const expr = nerdamer('x^2 + 2*x + 1');
 *         const expanded = expr.expand();           // x^2 + 2*x + 1
 *         const factored = nerdamer.factor(expr);  // (x + 1)^2
 *         const value = expr.evaluate({x: 3});     // 16
 *         ```;
 */
interface NerdamerExpression {
    /** The underlying NerdamerSymbol object. */
    symbol: nerdamerPrime.NerdamerCore.NerdamerSymbol;

    // Basic output methods
    toString: () => string;
    /**
     * Gets the string representation of the expression.
     *
     * **CRITICAL BEHAVIOR NOTE**: Small numbers become fractions instead of scientific notation:
     *
     * ```typescript
     * nerdamer('1e-15').toString(); // becomes "1/999999999999999" instead of "1e-15"
     * ```
     *
     * This breaks zero detection. Use tolerance-based comparison:
     *
     * ```typescript
     * function isZero(expr: NerdamerExpression): boolean {
     *     // Method 1: String comparison (most reliable)
     *     if (expr.toString() === '0') return true;
     *
     *     // Method 2: Decimal evaluation with tolerance
     *     try {
     *         const decimal = expr.text('decimals');
     *         const value = parseFloat(decimal);
     *         return Math.abs(value) < 1e-12;
     *     } catch {
     *         return false;
     *     }
     * }
     * ```
     *
     * @param option Pass in the string 'decimals' to always get back numbers as decimals. Pass in the string
     *   'fractions' to always get back numbers as fractions. Defaults to decimals.
     */
    text: (option?: OutputType) => string;
    latex: (option?: OutputType) => string;
    valueOf: () => number | string;

    // Basic methods
    variables: () => string[];

    /**
     * Checks if the expression contains an integral. Added by the Calculus module - may not be available if Calculus
     * module is not loaded.
     */
    hasIntegral?: () => boolean;

    /**
     * Performs an arithmetic operation on this expression.
     *
     * This is an internal helper method used by add, subtract, multiply, divide, and pow.
     *
     * @param operationType The type of operation: 'add', 'subtract', 'multiply', 'divide', or 'pow'
     * @param other The other operand
     * @returns A new expression with the result of the operation
     */
    operation: (
        operationType: 'add' | 'subtract' | 'multiply' | 'divide' | 'pow',
        other: ExpressionParam
    ) => NerdamerExpression;
    /**
     * Forces evaluation of the expression.
     *
     * @example
     *     const x = nerdamer('sin(9+5)');
     *     //the expression is simplified but the functions aren't called:
     *     x.toString(); // == sin(14)
     *     // force function calls with evaluate:
     *     x.evaluate().toString(); // == 127690464/128901187
     */
    evaluate: (substitutions?: Record<string, ExpressionParam>) => NerdamerExpression;

    /**
     * Checks to see if the expression's value equals a number. Compares the direct value returned. The function will
     * not check for all possible cases. To avoid this call evaluate.
     *
     * @example
     *     nerdamer('sqrt(5)').isNumber();
     *     // false
     *     nerdamer('sqrt(5)').evaluate().isNumber();
     *     // true
     */
    isNumber: () => boolean;

    /**
     * Checks if a number evaluates to an imaginary number
     *
     * @example
     *     nerdamer('sqrt(-5)+8').isImaginary();
     *     // true
     *     nerdamer('sqrt(5)+8').isImaginary();
     *     // false
     */
    isImaginary: () => boolean;
    isInfinity: () => boolean;
    isFraction: () => boolean;
    isPolynomial: () => boolean;

    // Expression operations
    /**
     * Expands a function or expression.
     *
     * @example
     *     nerdamer('x*(x+1)').expand();
     *     // x+x^2
     *     nerdamer('(x+y)*(x-5)*x').expand();
     *     // -5*x*y-5*x^2+x^3+x^2*y
     */
    expand: () => NerdamerExpression;
    /**
     * Simplifies the expression. Added by the Algebra module - may not be available if Algebra module is not loaded.
     *
     * @throws {Error} An Error if the computation exceeds the configured TIMEOUT duration.
     */
    simplify?: () => NerdamerExpression;

    /**
     * Sets this expression equal to another expression, creating an equation.
     *
     * This method is added by the Solve module - may not be available if Solve module is not loaded. Creates a
     * NerdamerEquation object with this expression as the left-hand side (LHS) and the provided expression as the
     * right-hand side (RHS).
     *
     * @example
     *     ```typescript
     *         const x = nerdamer('x^2');
     *         const equation = x.equals('4');  // Creates: x^2 = 4
     *         console.log(equation.LHS.toString());  // 'x^2'
     *         console.log(equation.RHS.toString());  // '4'
     *
     *         // Can then be solved
     *         const solutions = equation.solveFor('x');  // [-2, 2]
     *         ```;
     *
     * @param other The expression to set equal to (becomes the RHS)
     * @returns A NerdamerEquation with this expression as LHS and other as RHS
     */
    equals?: (other: ExpressionParam) => NerdamerEquation;

    /**
     * Attempts to solve an equation. Added by the Solve module - may not be available if Solve module is not loaded.
     *
     * @example
     *     const eq = nerdamer('a*x^2+b*x-c=0');
     *     eq.solveFor('x'); // [(-b+sqrt(b^2+4*a*c))/(2*a), (-b-sqrt(b^2+4*a*c))/(2*a)]
     *
     * @param variable The variable to solve for.
     * @throws {Error} An Error if the computation exceeds the configured TIMEOUT duration.
     */
    solveFor?: (variable: string) => NerdamerExpression[];

    /**
     * Substitutes a given value for another given value
     *
     * @param variable The variable being substituted.
     * @param value The value to substitute for.
     */
    sub: (variable: string, value: ExpressionParam) => NerdamerExpression;
    each: (callback: (symbol: nerdamerPrime.NerdamerCore.NerdamerSymbol, index?: number | string) => void) => void;
    contains: (variable: string) => boolean;
    hasFunction: (name: string) => boolean;

    // Arithmetic operations
    /**
     * Adds a value to an expression
     *
     * @example
     *     nerdamer('x').add(3);
     */
    add: (other: ExpressionParam) => NerdamerExpression;

    /**
     * Subtracts a value from an expression
     *
     * @example
     *     nerdamer('x').subtract(3);
     */
    subtract: (other: ExpressionParam) => NerdamerExpression;

    /**
     * Multiplies an expression by a value
     *
     * @example
     *     nerdamer('x').multiply(3);
     */
    multiply: (other: ExpressionParam) => NerdamerExpression;

    /**
     * Divides an expression by a value
     *
     * @example
     *     nerdamer('9*x').divide(3);
     */
    divide: (other: ExpressionParam) => NerdamerExpression;

    /**
     * Raises an expression to a power
     *
     * @example
     *     nerdamer('x').pow(3);
     */
    pow: (exponent: ExpressionParam) => NerdamerExpression;

    // Comparison operations
    /**
     * Checks if two expressions are mathematically equal (returns boolean).
     *
     * **Note**: This differs from `equals()` which creates an equation. Use `eq()` for boolean comparison, `equals()`
     * for creating equations.
     *
     * **Implementation Details**:
     *
     * - Internally calls `(this - other).equals(0)` on the underlying NerdamerSymbol
     * - Returns `true` if expressions are mathematically equal
     * - Returns `false` if expressions are not equal OR if comparison fails
     * - Catches errors gracefully and returns `false` instead of throwing
     *
     * **Usage Examples**:
     *
     * ```typescript
     * // Basic equality check (returns boolean)
     * nerdamer('sqrt(9)').eq(3); // true
     * nerdamer('x').eq('y'); // false
     *
     * // Zero detection (recommended approach)
     * const expr = nerdamer('x - x');
     * const isZero = expr.eq(nerdamer('0')); // true
     *
     * // Works with all expression types
     * nerdamer('sqrt(7)').eq('0'); // false
     * nerdamer('pi - pi').eq('0'); // true
     * nerdamer('2*x').eq('2*x'); // true
     *
     * // Compare with equals() which creates an equation:
     * nerdamer('x').equals('4'); // Creates equation: x = 4 (NerdamerEquation)
     * nerdamer('x').eq('4'); // Returns false (boolean)
     * ```
     *
     * @param other The expression to compare with
     * @returns `true` if expressions are equal, `false` otherwise
     */
    eq: (other: ExpressionParam) => boolean;

    /**
     * Checks if a value is less than another
     *
     * @example
     *     nerdamer('sqrt(9)').lt(3);
     *     // false
     *     nerdamer('8').lt(100);
     *     // true
     *
     * @param value The value being tested
     */
    lt: (other: ExpressionParam) => boolean;

    /**
     * Checks if a value is greater than another
     *
     * @example
     *     nerdamer('sqrt(9)').gt(3);
     *     // false
     *     nerdamer('800').gt(100);
     *     // true
     *
     * @param value The value being tested
     */
    gt: (other: ExpressionParam) => boolean;

    /**
     * Checks if a value is less than or equal to another
     *
     * @example
     *     nerdamer('sqrt(9)').lte(3);
     *     // true
     *     nerdamer('x').lte(100);
     *     // false
     *
     * @param value The value being tested
     */
    lte: (other: ExpressionParam) => boolean;

    /**
     * Checks if a value is greater than or equal to another
     *
     * @example
     *     nerdamer('sqrt(9)').gte(3);
     *     // true
     *     nerdamer('x').gte(100);
     *     // false
     *
     * @param value The value being tested
     */
    gte: (other: ExpressionParam) => boolean;

    // Fraction operations
    numerator: () => NerdamerExpression;
    denominator: () => NerdamerExpression;

    // Conversion
    /** Gets expression as LaTeX */
    toTeX: (format?: OutputType) => string;

    /** Gets expression as LaTeX */
    latex: (format?: OutputType) => string;

    /** Forces the expression to displayed with decimals */
    toDecimal: (precision?: number) => string;

    /**
     * Generates a JavaScript function given the expression. This is perfect for plotting and filtering user input.
     * Plotting for the demo is accomplished using this. The order of the parameters is in alphabetical order by default
     * but an argument array can be provided with the desired order.
     *
     * @param args_array The argument array with the order in which they are preferred.
     */
    buildFunction: (variables?: string[]) => (...args: number[]) => number;
}

/**
 * Represents a Nerdamer equation, with Left-Hand-Side (LHS) and Right-Hand-Side (RHS) properties. This is typically
 * returned when using the '=' operator, e.g., `nerdamer('x^2=4')`.
 */
interface NerdamerEquation extends NerdamerExpression {
    LHS: NerdamerExpression;
    RHS: NerdamerExpression;
    /** Moves the RHS to the LHS to form an expression that equals zero. */
    toLHS: (expand?: boolean) => NerdamerExpression;
}

/**
 * Configuration object for registering custom functions with Nerdamer.
 *
 * @example
 *     ```typescript
 *         // Register a simple custom function
 *         nerdamer.register({
 *           name: 'double',
 *           numargs: 1,
 *           visible: true,
 *           build: () => (x: number) => x * 2
 *         });
 *
 *         // Use the custom function
 *         nerdamer('double(5)');  // 10
 *
 *         // Register a function with variable arguments
 *         nerdamer.register({
 *           name: 'average',
 *           numargs: [-1],  // Variable number of arguments
 *           build: () => (...args: number[]) => args.reduce((a, b) => a + b) / args.length
 *         });
 *         ```;
 */
interface NerdamerAddon {
    /** Name of the function to register. */
    name: string;
    /**
     * Number of function arguments:
     *
     * - Single number: exact number of arguments required
     * - -1: variable number of arguments
     * - [min, max]: minimum and maximum number of arguments
     */
    numargs: int | -1 | [int, int];
    /** Whether this function is visible and can be called through nerdamer. Defaults to true. */
    visible?: boolean;
    /** Factory function that returns the actual implementation function. */
    build: () => (...args: number[]) => number;
}

// #endregion

// #region Main Function Interface

/**
 * Defines a user function from a native JavaScript function. Allows for chaining.
 *
 * @example
 *     ```typescript
 *         // Register a custom function
 *         nerdamer(function myFunc(x, y) { return x + y; });
 *
 *         // Use the custom function
 *         nerdamer('myFunc(3, 4)');  // 7
 *         ```;
 *
 * @param customJsFunction Native JavaScript function to register
 * @returns The nerdamer function for chaining
 */
declare function nerdamer(customJsFunction: Function): typeof nerdamer;

/**
 * Parses and evaluates mathematical expressions and equations.
 *
 * This is the main entry point for the Nerdamer library. It can parse mathematical expressions, equations, and perform
 * symbolic computation.
 *
 * @example
 *     ```typescript
 *         // Basic expression parsing
 *         const expr = nerdamer('x^2 + 2*x + 1');
 *
 *         // With substitutions
 *         const result = nerdamer('x^2 + y', {x: 3, y: 4});  // 13
 *
 *         // With options
 *         const expanded = nerdamer('(x+1)^2', {}, 'expand');  // x^2 + 2*x + 1
 *
 *         // Equations
 *         const equation = nerdamer('x^2 = 4');
 *         const solutions = equation.solveFor('x');  // [-2, 2]
 *
 *         // Numerical evaluation
 *         const numerical = nerdamer('sin(pi/2)', {}, 'numer');  // 1
 *         ```;
 *
 * @param expression The mathematical expression or equation to parse
 * @param substitutions Optional object containing variable substitutions
 * @param options Optional parsing options ('numer' for numerical evaluation, 'expand' for expansion)
 * @param index Optional index in the expression history to store the result
 * @returns A NerdamerExpression for expressions, or NerdamerEquation for equations
 */
declare function nerdamer(
    expression: ExpressionParam,
    substitutions?: Record<string, ExpressionParam> | null,
    options?: ParseOption | ParseOption[] | null,
    index?: number
): NerdamerExpression | NerdamerEquation;

// Extend nerdamer function with all static methods from nerdamerPrime
declare namespace nerdamer {
    // Import all types and functions from nerdamerPrime
    export import version = nerdamerPrime.version;

    // Core Functions
    export import setConstant = nerdamerPrime.setConstant;
    export import getConstant = nerdamerPrime.getConstant;
    export import clearConstants = nerdamerPrime.clearConstants;
    export import setFunction = nerdamerPrime.setFunction;
    export import clearFunctions = nerdamerPrime.clearFunctions;
    export import getCore = nerdamerPrime.getCore;
    export import reserved = nerdamerPrime.reserved;
    export import expressions = nerdamerPrime.expressions;
    export import register = nerdamerPrime.register;
    export import validVarName = nerdamerPrime.validVarName;
    export import setVar = nerdamerPrime.setVar;
    export import getVar = nerdamerPrime.getVar;
    export import clearVars = nerdamerPrime.clearVars;
    export import getVars = nerdamerPrime.getVars;
    export import clear = nerdamerPrime.clear;
    export import set = nerdamerPrime.set;
    export import get = nerdamerPrime.get;
    export import tree = nerdamerPrime.tree;
    export import htmlTree = nerdamerPrime.htmlTree;
    export import flush = nerdamerPrime.flush;
    export import convertToLaTeX = nerdamerPrime.convertToLaTeX;
    export import convertFromLaTeX = nerdamerPrime.convertFromLaTeX;

    // Basic Operations
    export import expand = nerdamerPrime.expand;
    export import factor = nerdamerPrime.factor;
    export import simplify = nerdamerPrime.simplify;

    // Trigonometric Functions
    export import cos = nerdamerPrime.cos;
    export import sin = nerdamerPrime.sin;
    export import tan = nerdamerPrime.tan;
    export import sec = nerdamerPrime.sec;
    export import csc = nerdamerPrime.csc;
    export import cot = nerdamerPrime.cot;
    export import acos = nerdamerPrime.acos;
    export import asin = nerdamerPrime.asin;
    export import atan = nerdamerPrime.atan;
    export import atan2 = nerdamerPrime.atan2;
    export import acsc = nerdamerPrime.acsc;
    export import acot = nerdamerPrime.acot;
    export import asec = nerdamerPrime.asec;

    // Hyperbolic Functions
    export import cosh = nerdamerPrime.cosh;
    export import sinh = nerdamerPrime.sinh;
    export import tanh = nerdamerPrime.tanh;
    export import sech = nerdamerPrime.sech;
    export import csch = nerdamerPrime.csch;
    export import coth = nerdamerPrime.coth;
    export import acosh = nerdamerPrime.acosh;
    export import asinh = nerdamerPrime.asinh;
    export import atanh = nerdamerPrime.atanh;
    export import asech = nerdamerPrime.asech;
    export import acsch = nerdamerPrime.acsch;
    export import acoth = nerdamerPrime.acoth;

    // Matrix and Vector Functions
    export import matrix = nerdamerPrime.matrix;
    export import imatrix = nerdamerPrime.imatrix;
    export import determinant = nerdamerPrime.determinant;
    export import matget = nerdamerPrime.matget;
    export import matset = nerdamerPrime.matset;
    export import invert = nerdamerPrime.invert;
    export import transpose = nerdamerPrime.transpose;
    export import matgetcol = nerdamerPrime.matgetcol;
    export import matgetrow = nerdamerPrime.matgetrow;
    export import vector = nerdamerPrime.vector;
    export import vecget = nerdamerPrime.vecget;
    export import vecset = nerdamerPrime.vecset;
    export import cross = nerdamerPrime.cross;
    export import dot = nerdamerPrime.dot;
    export import matsetcol = nerdamerPrime.matsetcol;
    export import matsetrow = nerdamerPrime.matsetrow;
    export import size = nerdamerPrime.size;

    // Complex Number Functions
    export import polarform = nerdamerPrime.polarform;
    export import rectform = nerdamerPrime.rectform;
    export import arg = nerdamerPrime.arg;
    export import imagpart = nerdamerPrime.imagpart;
    export import realpart = nerdamerPrime.realpart;

    // Math Functions
    export import log = nerdamerPrime.log;
    export import log10 = nerdamerPrime.log10;
    export import log1p = nerdamerPrime.log1p;
    export import log2 = nerdamerPrime.log2;
    export import min = nerdamerPrime.min;
    export import max = nerdamerPrime.max;
    export import abs = nerdamerPrime.abs;
    export import floor = nerdamerPrime.floor;
    export import ceil = nerdamerPrime.ceil;
    export import Si = nerdamerPrime.Si;
    export import Ci = nerdamerPrime.Ci;
    export import Ei = nerdamerPrime.Ei;
    export import rect = nerdamerPrime.rect;
    export import step = nerdamerPrime.step;
    export import sinc = nerdamerPrime.sinc;
    export import Shi = nerdamerPrime.Shi;
    export import Chi = nerdamerPrime.Chi;
    export import fact = nerdamerPrime.fact;
    export import factorial = nerdamerPrime.factorial;
    export import dfactorial = nerdamerPrime.dfactorial;
    export import exp = nerdamerPrime.exp;
    export import mod = nerdamerPrime.mod;
    export import erf = nerdamerPrime.erf;
    export import sign = nerdamerPrime.sign;
    export import round = nerdamerPrime.round;
    export import pfactor = nerdamerPrime.pfactor;
    export import sqrt = nerdamerPrime.sqrt;
    export import fib = nerdamerPrime.fib;
    export import tri = nerdamerPrime.tri;
    export import parens = nerdamerPrime.parens;
    export import line = nerdamerPrime.line;
    export import continuedFraction = nerdamerPrime.continuedFraction;

    // Calculus Functions
    export import sum = nerdamerPrime.sum;
    export import product = nerdamerPrime.product;
    export import diff = nerdamerPrime.diff;
    export import integrate = nerdamerPrime.integrate;
    export import defint = nerdamerPrime.defint;

    // Algebra Functions
    export import divide = nerdamerPrime.divide;
    export import partfrac = nerdamerPrime.partfrac;
    export import lcm = nerdamerPrime.lcm;
    export import gcd = nerdamerPrime.gcd;
    export import roots = nerdamerPrime.roots;
    export import coeffs = nerdamerPrime.coeffs;
    export import deg = nerdamerPrime.deg;
    export import sqcomp = nerdamerPrime.sqcomp;

    // Solve Functions
    export import solve = nerdamerPrime.solve;
    export import solveEquations = nerdamerPrime.solveEquations;
    export import setEquation = nerdamerPrime.setEquation;

    // Statistics Functions
    export import mean = nerdamerPrime.mean;
    export import mode = nerdamerPrime.mode;
    export import median = nerdamerPrime.median;
    export import zscore = nerdamerPrime.zscore;
    export import limit = nerdamerPrime.limit;
    export import smpvar = nerdamerPrime.smpvar;
    export import variance = nerdamerPrime.variance;
    export import smpstdev = nerdamerPrime.smpstdev;
    export import stdev = nerdamerPrime.stdev;

    // Transform Functions
    export import laplace = nerdamerPrime.laplace;
    export import ilt = nerdamerPrime.ilt;

    // NerdamerSet Functions
    export import NerdamerSet = nerdamerPrime.NerdamerSet;
    export import C = nerdamerPrime.C;
    export import S = nerdamerPrime.S;
    export import union = nerdamerPrime.union;
    export import intersection = nerdamerPrime.intersection;
    export import difference = nerdamerPrime.difference;
    export import isSubset = nerdamerPrime.isSubset;
    export import isIn = nerdamerPrime.isIn;
    export import intersects = nerdamerPrime.intersects;
    export import contains = nerdamerPrime.contains;

    // Additional Math Functions
    export import cbrt = nerdamerPrime.cbrt;
    export import nthroot = nerdamerPrime.nthroot;
    export import trunc = nerdamerPrime.trunc;
    export import integer_part = nerdamerPrime.integer_part;
    export import conjugate = nerdamerPrime.conjugate;
    export import gamma_incomplete = nerdamerPrime.gamma_incomplete;
    export import radians = nerdamerPrime.radians;
    export import degrees = nerdamerPrime.degrees;
    export import rationalize = nerdamerPrime.rationalize;
    export import Li = nerdamerPrime.Li;

    // Alternative Trigonometric Names
    export import arccos = nerdamerPrime.arccos;
    export import arcsin = nerdamerPrime.arcsin;
    export import arctan = nerdamerPrime.arctan;

    // Utility Functions
    export import IF = nerdamerPrime.IF;
    export import supported = nerdamerPrime.supported;
    export import sort = nerdamerPrime.sort;
    export import print = nerdamerPrime.print;
    export import scientific = nerdamerPrime.scientific;
    export import primes = nerdamerPrime.primes;
    export import vectrim = nerdamerPrime.vectrim;
    export import updateAPI = nerdamerPrime.updateAPI;
    export import validateName = nerdamerPrime.validateName;
    export import load = nerdamerPrime.load;

    // Parser Functions
    export import parse = nerdamerPrime.parse;
    export import rpn = nerdamerPrime.rpn;
    export import functions = nerdamerPrime.functions;
    export import addPeeker = nerdamerPrime.addPeeker;
    export import removePeeker = nerdamerPrime.removePeeker;
    export import aliasOperator = nerdamerPrime.aliasOperator;
    export import setOperator = nerdamerPrime.setOperator;
    export import getOperator = nerdamerPrime.getOperator;
    export import getWarnings = nerdamerPrime.getWarnings;
    export import replaceFunction = nerdamerPrime.replaceFunction;

    // Expression/Equation Management
    export import getExpression = nerdamerPrime.getExpression;
    export import getEquation = nerdamerPrime.getEquation;
    export import numExpressions = nerdamerPrime.numExpressions;
    export import numEquations = nerdamerPrime.numEquations;

    // Division Functions
    export import div = nerdamerPrime.div;
    export import useAlgebraDiv = nerdamerPrime.useAlgebraDiv;
    export import useParserDiv = nerdamerPrime.useParserDiv;

    // Import NerdamerCore namespace
    export import NerdamerCore = nerdamerPrime.NerdamerCore;
}

// #endregion

// #region Namespace for Static Methods and API

declare namespace nerdamerPrime {
    /**
     * Returns the version of nerdamer or a specific add-on module.
     *
     * @param add_on Optional module name to get the version of (e.g., 'Algebra', 'Calculus', 'Solve')
     * @returns The version string, or an error message if the add_on module is not found
     */
    function version(add_on?: string): string;

    // #region Core Functions

    /**
     * Sets a constant value which nerdamer will automatically substitute when parsing expression/equation
     *
     * @param name The variable to be set as the constant.
     * @param value The value for the expression to be set to.
     */
    function setConstant(name: string, value: number | 'delete'): typeof nerdamer;
    function getConstant(name: string): string;
    function clearConstants(): typeof nerdamer;

    /**
     * Sets a function which can then be called using nerdamer.
     *
     * @example
     *     1;
     *     nerdamer.setFunction('f', ['x', 'y'], 'x^2+y');
     *     var x = nerdamer('f(4, 7)').toString();
     *     console.log(x.toString());
     *     nerdamer.setFunction('g', ['z', 'x', 'y'], '2*x+3*y+4*z');
     *     x = nerdamer('g(3, 1, 2)');
     *     console.log(x.toString());
     *
     * @example
     *     2;
     *     nerdamer.setFunction('f(x, y) = x^2+y'); //OR 'f(x, y) := x^2+y'
     *     var x = nerdamer('f(4, 7)').toString();
     *     console.log(x.toString());
     *     nerdamer.setFunction('g', ['z', 'x', 'y'], '2*x+3*y+4*z');
     *     x = nerdamer('g(3, 1, 2)');
     *     console.log(x.toString());
     *
     * @example
     *     3
     *     function custom(x , y) {
     *     return x + y;
     *     }
     *     nerdamer.setFunction(custom);
     *     var x = nerdamer('custom(4, 7)').toString();
     *     console.log(x.toString())
     *     console.log(x.valueOf())
     *     OR just nerdamer.setFunction(function custom(x , y) { return x + y; });
     *
     * @param fnName The function name, definition string like 'f(x)=x^2', or a JavaScript function
     * @param fnParams Optional array of parameter names (when fnName is a string name)
     * @param fnBody Optional function body expression (when fnName is a string name)
     */
    function setFunction(fnName: string | Function, fnParams?: string[], fnBody?: string): typeof nerdamer;
    function clearFunctions(): typeof nerdamer;

    /**
     * Returns the nerdamer core object. This object contains all the core functions of nerdamer and houses the parser.
     *
     * @example
     *     Object.keys(nerdamer.getCore());
     */
    function getCore(): NerdamerCore.Core;

    /**
     * Gets the list of reserved names. This is a list of names already in use by nerdamer excluding variable names.
     * This is not a static list.
     *
     * @param asArray Pass in true to get the list back as an array instead of as an object.
     */
    function reserved(asArray?: boolean): string | string[];

    /**
     * Each time an expression is parsed nerdamer stores the result. Use this method to get back stored expressions.
     *
     * @param asObject Pass in true to get expressions as numbered object with 1 as starting index
     * @param asLaTeX Pass in the string "LaTeX" to get the expression to LaTeX, otherwise expressions come back as
     *   strings
     */
    function expressions(
        asObject?: boolean,
        asLaTeX?: boolean,
        options?: OutputType
    ): string[] | Record<number, string>;

    /**
     * Registers a module function with nerdamer. The object needs to contain at a minimum, a name property (text), a
     * numargs property (int), this is -1 for variable arguments or an array containing the min and max arguments, the
     * visible property (bool) which allows use of this function through nerdamer, defaults to true, and a build
     * property containing a function which returns the function to be used. This function is also handy for creating
     * aliases to functions. See below how the alias D was created for the diff function).
     *
     * @example
     *     var core = nerdamer.getCore();
     *     var _ = core.PARSER;
     *     function f(a, b) {
     *         //use clone for safety since a or b might be returned
     *         var sum = _.add(a.clone(), b.clone());
     *         var product = _.multiply(a.clone(), b.clone());
     *         return _.multiply(sum, product);
     *     }
     *     //register the function with nerdamer
     *     nerdamer.register({
     *         name: 'myFunction',
     *         numargs: 2,
     *         visible: true,
     *         build: function () {
     *             return f;
     *         },
     *     });
     *
     *     //create an alias for the diff function
     *     var core = nerdamer.getCore();
     *     nerdamer.register({
     *         name: 'D',
     *         visible: true,
     *         numargs: [1, 3],
     *         build: function () {
     *             return core.Calculus.diff;
     *         },
     *     });
     *
     * @param addon
     */
    function register(addon: NerdamerAddon | NerdamerAddon[]): void;

    /**
     * This method can be used to check that the variable meets variable name requirements for nerdamer. Variable names
     * Must start with a letter or underscore and may contains any combination of numbers, letters, and underscores
     * after that.
     *
     * @example
     *     nerdamer.validVarName('cos'); // false
     *     nerdamer.validVarName('chicken1'); // true
     *     nerdamer.validVarName('1chicken'); // false
     *     nerdamer.validVarName('_'); // true
     *
     * @param name The variable name being validated.
     */
    function validVarName(name: string): boolean;

    /**
     * Sets a known value in nerdamer. This differs from setConstant as the value can be overridden trough the scope.
     * See example.
     *
     * @example
     *     nerdamer.setVar('x', '11');
     *     nerdamer('x*x'); // == 121
     *     // nerdamer will use 13 instead of 11:
     *     nerdamer('x*x', { x: 13 }); // == 169
     *     // the value will be 121 again since the known value isn't being overridden:
     *     nerdamer('x*x'); // == 121
     *     nerdamer.setVar('x', 'delete');
     *     // since there no longer is a known value it will just be evaluated symbolically:
     *     nerdamer('x*x'); // == x^2
     *
     * @param name The known value to be set.
     * @param value The value for the expression to be set to
     */
    function setVar(name: string, value: ExpressionParam | 'delete'): typeof nerdamer;
    function getVar(name: string): NerdamerCore.NerdamerSymbol | undefined;

    /** Clears all previously set variables. */
    function clearVars(): typeof nerdamer;

    /**
     * Gets all previously set variables.
     *
     * @param format Output format: 'text' (default), 'latex', or 'object' (returns raw expressions)
     * @param option Additional formatting options passed to text() or latex() conversion
     */
    function getVars(
        format?: 'text' | 'latex' | 'object',
        option?: OutputType
    ): Record<string, NerdamerExpression | string>;

    /**
     * Clears an item or all items from the expression history.
     *
     * @param item The expression to clear: 'all', 'last', 'first', or an index number
     * @param keepFixed If true, replaces the expression with undefined instead of removing it (keeps EXPRESSIONS length
     *   fixed)
     */
    function clear(item?: 'all' | 'last' | 'first' | ExpressionHistoryIndex, keepFixed?: boolean): typeof nerdamer;

    /**
     * Sets the value of a nerdamer setting. Currently PARSE2NUMBER and IMAGINARY. Setting PARSE2NUMBER to true will let
     * nerdamer always try to return a number whenenver possible. IMAGINARY allows you to change the variable used for
     * imaginary to j for instance.
     *
     * @example
     *     nerdamer.set('PARSE2NUMBER', true);
     *     nerdamer('cos(9)+1'); // == 14846499/167059106
     *     nerdamer.set('IMAGINARY', 'j');
     *     nerdamer('sqrt(-1)'); // == j
     *
     * @param option The setting to be changed
     * @param value The value to set the setting to.
     */
    function set(option: string, value: string | number | boolean): void;

    /** Gets a nerdamer configuration option. */
    function get(option: string): string | number | boolean | undefined;

    /** Generates an abstract syntax tree of the expression. */
    function tree(expression: ExpressionParam): unknown;

    /**
     * Generates an HTML representation of the expression tree.
     *
     * @param expression The expression to generate the tree for
     * @param indent Optional indentation level for the HTML output
     */
    function htmlTree(expression: ExpressionParam, indent?: number): string;

    /**
     * Clears all stored expressions.
     *
     * @example
     *     var x = nerdamer('x*x');
     *     console.log(nerdamer.expressions());
     *     nerdamer.flush(); //clear all expressions
     *     console.log(nerdamer.expressions());
     */
    function flush(): typeof nerdamer;

    /**
     * Converts and expression to LaTeX without evaluating expression.
     *
     * @param expression The expression being converted.
     */
    function convertToLaTeX(expression: ExpressionParam, options?: OutputType | { useGroup?: boolean }): string;

    /**
     * Attempts to import a LaTeX string.
     *
     * @param latex The expression being converted.
     */
    function convertFromLaTeX(latex: string): NerdamerExpression;

    // #endregion

    // #region Basic Operations

    /**
     * Expands an algebraic expression by distributing products over sums.
     *
     * @example
     *     ```typescript
     *         nerdamer.expand('(x+1)*(x+2)');     // x^2 + 3*x + 2
     *         nerdamer.expand('(a+b)^2');         // a^2 + 2*a*b + b^2
     *         nerdamer.expand('x*(y+z)');         // x*y + x*z
     *         ```;
     *
     * @param expression The expression to expand
     * @returns The expanded expression
     */
    function expand(expression: ExpressionParam): NerdamerExpression;

    /**
     * Factors an algebraic expression into its constituent factors.
     *
     * @example
     *     ```typescript
     *         nerdamer.factor('x^2 + 3*x + 2');   // (x + 1)*(x + 2)
     *         nerdamer.factor('a^2 - b^2');       // (a - b)*(a + b)
     *         nerdamer.factor('x^3 - 8');         // (x - 2)*(x^2 + 2*x + 4)
     *         ```;
     *
     * @param expression The expression to factor
     * @returns The factored expression
     */
    function factor(expression: ExpressionParam): NerdamerExpression;

    /**
     * Simplifies an expression by combining like terms and applying algebraic rules.
     *
     * @example
     *     ```typescript
     *         nerdamer.simplify('2*x + 3*x');     // 5*x
     *         nerdamer.simplify('sin(x)^2 + cos(x)^2'); // 1
     *         nerdamer.simplify('(x^2 - 1)/(x - 1)'); // x + 1
     *         ```;
     *
     * @param expression The expression to simplify
     * @returns The simplified expression
     */
    function simplify(expression: ExpressionParam): NerdamerExpression;

    // #endregion

    // #region Trigonometric Functions

    function cos(expression: ExpressionParam): NerdamerExpression;
    function sin(expression: ExpressionParam): NerdamerExpression;
    function tan(expression: ExpressionParam): NerdamerExpression;
    function sec(expression: ExpressionParam): NerdamerExpression;
    function csc(expression: ExpressionParam): NerdamerExpression;
    function cot(expression: ExpressionParam): NerdamerExpression;
    function acos(expression: ExpressionParam): NerdamerExpression;
    function asin(expression: ExpressionParam): NerdamerExpression;
    function atan(expression: ExpressionParam): NerdamerExpression;
    function atan2(y: ExpressionParam, x: ExpressionParam): NerdamerExpression;
    function acsc(expression: ExpressionParam): NerdamerExpression;
    function acot(expression: ExpressionParam): NerdamerExpression;
    function asec(expression: ExpressionParam): NerdamerExpression;

    // #endregion

    // #region Hyperbolic Functions

    function cosh(expression: ExpressionParam): NerdamerExpression;
    function sinh(expression: ExpressionParam): NerdamerExpression;
    function tanh(expression: ExpressionParam): NerdamerExpression;
    function sech(expression: ExpressionParam): NerdamerExpression;
    function csch(expression: ExpressionParam): NerdamerExpression;
    function coth(expression: ExpressionParam): NerdamerExpression;
    function acosh(expression: ExpressionParam): NerdamerExpression;
    function asinh(expression: ExpressionParam): NerdamerExpression;
    function atanh(expression: ExpressionParam): NerdamerExpression;
    function asech(expression: ExpressionParam): NerdamerExpression;
    function acsch(expression: ExpressionParam): NerdamerExpression;
    function acoth(expression: ExpressionParam): NerdamerExpression;

    // #endregion

    // #region Matrix and Vector Functions

    /**
     * Creates a matrix from 2D array data.
     *
     * **CRITICAL BEHAVIOR NOTE**: Different matrix creation methods produce different internal formats:
     *
     * ```typescript
     * // Method 1: Function with 2D array - FLATTENS incorrectly for determinants:
     * const m1 = nerdamer.matrix([
     *     [1, 2],
     *     [3, 4],
     * ]); // → matrix([(1, 2, 3, 4)])
     * nerdamer.determinant(m1); // → "" (empty, fails)
     *
     * // Method 2: String with double brackets - FAILS for determinants:
     * const m2 = nerdamer('matrix([[1,2],[3,4]])'); // → matrix([[1,2],[3,4]])
     * nerdamer.determinant(m2); // → "" (empty, fails)
     *
     * // Method 3: Variable-based - WORKS for determinants:
     * nerdamer.setVar('M', 'matrix([1,2],[3,4])'); // → matrix([1,2],[3,4])
     * const m3 = nerdamer('M');
     * nerdamer.determinant(m3); // → "-2" ✅ WORKS!
     * ```
     *
     * **For reliable determinant calculations**, use the variable-based approach:
     *
     * ```typescript
     * function createMatrixForDeterminant(data: number[][]): NerdamerExpression {
     *     const flatData = data.flat().join(',');
     *     const rows = data.length;
     *     const cols = data[0]?.length || 0;
     *     const matrixStr = `matrix([${flatData}])`; // Single brackets format
     *
     *     const tempVar = `temp_matrix_${Date.now()}`;
     *     nerdamer.setVar(tempVar, matrixStr);
     *     const matrix = nerdamer(tempVar);
     *     nerdamer.setVar(tempVar, 'delete'); // cleanup
     *     return matrix;
     * }
     * ```
     *
     * @param data 2D array of expressions or a single expression
     * @returns Matrix object (format depends on creation method)
     */
    function matrix(data: ExpressionParam[][] | ExpressionParam): NerdamerCore.Matrix;
    function imatrix(size: number): NerdamerCore.Matrix;
    /**
     * Computes the determinant of a square matrix.
     *
     * **CRITICAL BEHAVIOR NOTE**: This function fails for 1x1 (single element) matrices:
     *
     * ```typescript
     * // ❌ FAILS - Single element matrices throw error:
     * nerdamer.setVar('M', 'matrix([42])');
     * const matrix = nerdamer('M');
     * nerdamer.determinant(matrix); // throws "Cannot read properties of undefined (reading '1')"
     *
     * // ✅ WORKAROUND - Extract the single element directly:
     * function safeDeterminant(matrix: NerdamerExpression): NerdamerExpression {
     *     const size = nerdamer.size(matrix).toString();
     *     if (size === '[1,1]' || size === '1') {
     *         return nerdamer.matget(matrix, 0, 0); // For 1x1, determinant = the element
     *     }
     *     return nerdamer.determinant(matrix);
     * }
     * ```
     *
     * Works correctly for 2x2, 3x3, and larger square matrices.
     *
     * @param matrix The square matrix to compute the determinant of
     * @returns The determinant value (fails for 1x1 matrices)
     * @throws {Error} Error for 1x1 matrices: "Cannot read properties of undefined (reading '1')"
     */
    function determinant(matrix: ExpressionParam): NerdamerExpression;
    function matget(matrix: ExpressionParam, row: number, col: number): NerdamerExpression;
    function matset(matrix: ExpressionParam, row: number, col: number, value: ExpressionParam): NerdamerExpression;
    function invert(matrix: ExpressionParam): NerdamerCore.Matrix;
    function transpose(matrix: ExpressionParam): NerdamerCore.Matrix;
    function matgetcol(matrix: ExpressionParam, col: number): NerdamerCore.Vector;
    function matgetrow(matrix: ExpressionParam, row: number): NerdamerCore.Vector;
    function vector(components: ExpressionParam[] | ExpressionParam): NerdamerCore.Vector;
    /**
     * Gets an element from a vector at the specified index.
     *
     * **CRITICAL BEHAVIOR NOTE**: This function returns a NerdamerExpression wrapper, but for missing/invalid indices
     * it returns an object with `symbol: undefined`:
     *
     * ```typescript
     * // For valid coefficients:
     * const result = nerdamer.vecget(coeffs, 0);
     * result.toString(); // "5" (valid value)
     * result.symbol; // { group: 1, value: '#', ... } (valid symbol)
     *
     * // For invalid/missing coefficients:
     * const invalid = nerdamer.vecget(coeffs, 999);
     * invalid.toString(); // "" (empty string!)
     * invalid.symbol; // undefined (no symbol property!)
     * ```
     *
     * **SAFE USAGE PATTERN**: Always check if symbol is undefined before using the result:
     *
     * ```typescript
     * function safeVecget(coeffs: NerdamerExpression, index: number): NerdamerExpression {
     *     const result = nerdamer.vecget(coeffs, index);
     *     // Check if symbol is undefined - this indicates missing coefficient
     *     if (!result || result.symbol === undefined) {
     *         return nerdamer('0'); // Return zero for missing coefficients
     *     }
     *     return result;
     * }
     * ```
     *
     * @param vector The vector to access
     * @param index The index to retrieve
     * @returns NerdamerExpression for valid indices, or object with `symbol: undefined` for invalid indices
     */
    function vecget(vector: ExpressionParam, index: number): NerdamerExpression;
    function vecset(vector: ExpressionParam, index: number, value: ExpressionParam): NerdamerExpression;
    function cross(vector1: ExpressionParam, vector2: ExpressionParam): NerdamerCore.Vector;
    function dot(vector1: ExpressionParam, vector2: ExpressionParam): NerdamerExpression;
    function matsetcol(matrix: ExpressionParam, col: number, vector: ExpressionParam): NerdamerCore.Matrix;
    function matsetrow(matrix: ExpressionParam, row: number, vector: ExpressionParam): NerdamerCore.Matrix;
    /**
     * Gets the size of a matrix or vector.
     *
     * **CRITICAL BEHAVIOR NOTE**: This function returns dimensions in [columns, rows] order, NOT [rows, columns]:
     *
     * ```typescript
     * // For a 2x3 matrix (2 rows, 3 columns):
     * nerdamer.setVar('M', 'matrix([1,2,3],[4,5,6])');
     * const matrix = nerdamer('M');
     * const size = nerdamer.size(matrix);
     * console.log(size.toString()); // "[3,2]" - returns [cols, rows]!
     *
     * // To get [rows, cols], you need to swap:
     * const [cols, rows] = size
     *     .toString()
     *     .replace(/[\[\]]/g, '')
     *     .split(',')
     *     .map(Number);
     * const actualSize = [rows, cols]; // [2, 3] - correct [rows, cols]
     * ```
     *
     * This contradicts the official documentation which claims it returns [row length, column length]. Always swap the
     * values when you need [rows, cols] format.
     *
     * @param matrix The matrix or vector to get the size of
     * @returns Size expression in [columns, rows] format (contrary to documentation)
     */
    function size(matrix: ExpressionParam): NerdamerExpression;

    // #endregion

    // #region Complex Number Functions

    function polarform(expression: ExpressionParam): NerdamerExpression;
    function rectform(expression: ExpressionParam): NerdamerExpression;
    function arg(expression: ExpressionParam): NerdamerExpression;
    function imagpart(expression: ExpressionParam): NerdamerExpression;
    function realpart(expression: ExpressionParam): NerdamerExpression;

    // #endregion

    // #region Math Functions

    function log(expression: ExpressionParam, base?: ExpressionParam): NerdamerExpression;
    function log10(expression: ExpressionParam): NerdamerExpression;
    function log1p(expression: ExpressionParam): NerdamerExpression;
    function log2(expression: ExpressionParam): NerdamerExpression;
    function min(...expressions: ExpressionParam[]): NerdamerExpression;
    function max(...expressions: ExpressionParam[]): NerdamerExpression;
    function abs(expression: ExpressionParam): NerdamerExpression;
    function floor(expression: ExpressionParam): NerdamerExpression;
    function ceil(expression: ExpressionParam): NerdamerExpression;
    function Si(expression: ExpressionParam): NerdamerExpression;
    function Ci(expression: ExpressionParam): NerdamerExpression;
    function Ei(expression: ExpressionParam): NerdamerExpression;
    function rect(expression: ExpressionParam): NerdamerExpression;
    function step(expression: ExpressionParam): NerdamerExpression;
    function sinc(expression: ExpressionParam): NerdamerExpression;
    function Shi(expression: ExpressionParam): NerdamerExpression;
    function Chi(expression: ExpressionParam): NerdamerExpression;
    function fact(expression: ExpressionParam): NerdamerExpression;
    function factorial(expression: ExpressionParam): NerdamerExpression;
    function dfactorial(expression: ExpressionParam): NerdamerExpression;
    /**
     * Computes the exponential function e^x.
     *
     * **CRITICAL BEHAVIOR NOTE**: Exponential expressions use numeric bases instead of symbolic 'e':
     *
     * ```typescript
     * nerdamer('e^x'); // becomes "119696244^(-x)*325368125^x" instead of "exp(x)"
     * ```
     *
     * This affects calculus tests that expect 'exp' notation in output strings. Accept numeric exponential
     * representations or adjust test expectations.
     *
     * @param expression The exponent
     * @returns Exponential expression (may use numeric base representation)
     */
    function exp(expression: ExpressionParam): NerdamerExpression;
    function mod(dividend: ExpressionParam, divisor: ExpressionParam): NerdamerExpression;
    function erf(expression: ExpressionParam): NerdamerExpression;
    function sign(expression: ExpressionParam): NerdamerExpression;
    function round(expression: ExpressionParam): NerdamerExpression;
    function pfactor(expression: ExpressionParam): NerdamerExpression;
    function sqrt(expression: ExpressionParam): NerdamerExpression;
    function fib(expression: ExpressionParam): NerdamerExpression;
    function tri(expression: ExpressionParam): NerdamerExpression;
    function parens(expression: ExpressionParam): NerdamerExpression;
    function line(p1: ExpressionParam, p2: ExpressionParam, variable?: string): NerdamerExpression;
    function continuedFraction(expression: ExpressionParam, terms?: number): NerdamerExpression;

    // #endregion

    // #region Calculus Functions

    function sum(
        expression: ExpressionParam,
        variable: string,
        lowerBound: string | number,
        upperBound: string | number
    ): NerdamerExpression;
    function product(
        expression: ExpressionParam,
        variable: string,
        lowerBound: string | number,
        upperBound: string | number
    ): NerdamerExpression;
    /**
     * Computes the derivative of an expression with respect to a variable.
     *
     * @example
     *     ```typescript
     *         nerdamer.diff('x^3', 'x');          // 3*x^2
     *         nerdamer.diff('sin(x)', 'x');       // cos(x)
     *         nerdamer.diff('x^4', 'x', 2);       // 12*x^2 (second derivative)
     *         nerdamer.diff('x*y^2', 'x');        // y^2
     *         ```;
     *
     * @param expression The expression to differentiate
     * @param variable The variable to differentiate with respect to
     * @param order The order of the derivative (default: 1)
     * @returns The derivative expression
     */
    function diff(expression: ExpressionParam, variable: string, order?: number | string): NerdamerExpression;

    /**
     * Computes the indefinite integral (antiderivative) of an expression.
     *
     * @example
     *     ```typescript
     *         nerdamer.integrate('x^2', 'x');     // x^3/3
     *         nerdamer.integrate('sin(x)', 'x');  // -cos(x)
     *         nerdamer.integrate('1/x', 'x');     // log(x)
     *         nerdamer.integrate('e^x', 'x');     // e^x
     *         ```;
     *
     * @param expression The expression to integrate
     * @param variable The variable to integrate with respect to
     * @returns The integral expression (without constant of integration)
     */
    function integrate(expression: ExpressionParam, variable: string): NerdamerExpression;

    /**
     * Computes the definite integral of an expression over a specified interval.
     *
     * @example
     *     ```typescript
     *         nerdamer.defint('x^2', 0, 1, 'x');  // 1/3
     *         nerdamer.defint('sin(x)', 0, 'pi', 'x'); // 2
     *         nerdamer.defint('e^x', 0, 1, 'x');  // e - 1
     *         ```;
     *
     * @param expression The expression to integrate
     * @param lowerBound The lower bound of integration
     * @param upperBound The upper bound of integration
     * @param variable The variable to integrate with respect to
     * @returns The value of the definite integral
     */
    function defint(
        expression: ExpressionParam,
        lowerBound: string | number,
        upperBound: string | number,
        variable: string
    ): NerdamerExpression;

    // #endregion

    // #region Algebra Functions

    function divide(dividend: ExpressionParam, divisor: ExpressionParam): NerdamerExpression | NerdamerExpression[];
    function partfrac(expression: ExpressionParam, variable: string): NerdamerExpression;
    function lcm(...expressions: ExpressionParam[]): NerdamerExpression;
    function gcd(...expressions: ExpressionParam[]): NerdamerExpression;

    /**
     * Finds the roots of a univariate polynomial.
     *
     * @param expression The polynomial expression.
     */
    function roots(expression: ExpressionParam): NerdamerCore.Vector;
    function coeffs(expression: ExpressionParam, variable: string): NerdamerCore.Vector;
    function deg(expression: ExpressionParam, variable: string): NerdamerExpression;
    function sqcomp(expression: ExpressionParam, variable: string): NerdamerExpression;

    // #endregion

    // #region Solve Functions

    /**
     * Solves an equation for a specified variable.
     *
     * @example
     *     ```typescript
     *         nerdamer.solve('x^2 - 4 = 0', 'x');     // Vector containing [-2, 2]
     *         nerdamer.solve('x^2 + x - 6', 'x');     // Vector containing [-3, 2]
     *         nerdamer.solve('sin(x) = 0', 'x');      // Vector containing [0, pi]
     *         nerdamer.solve('a*x + b = 0', 'x');     // Vector containing [-b/a]
     *         ```;
     *
     * @param equation The equation to solve (can include '=' or assume equals zero)
     * @param variable The variable to solve for
     * @returns A vector containing the solutions
     */
    function solve(equation: ExpressionParam, variable: string): NerdamerCore.Vector;

    /**
     * Solves a system of linear equations. Has limited ability to solve system of nonlinear equations.
     *
     * **Key Behaviors:**
     *
     * - **Values are numbers**: Direct numeric solutions, not symbolic expressions
     * - **Linear systems**: Solved symbolically when possible
     * - **Nonlinear systems**: Limited support, returns first satisfying solution set
     * - **No solution**: Returns `null` or empty array `[]`
     * - **Floating point errors**: May occur with nonlinear equations
     * - **Format control**: Use `nerdamer.set('SOLUTIONS_AS_OBJECT', boolean)` to control output
     *
     * @param equations An array of equations to solve.
     * @param variables Optional array of variables to solve for.
     * @returns Solution object/array with numeric values, null, or empty array.
     * @throws {Error} SolveError if the system does not have a distinct solution.
     * @throws {Error} If the computation exceeds the configured `TIMEOUT` duration (error message will be "timeout").
     */
    function solveEquations(equations: ExpressionParam[], variables?: string[]): SolveResult;
    function setEquation(a: ExpressionParam, b: ExpressionParam): NerdamerEquation;

    // #endregion

    // #region Statistics Functions

    /**
     * Calculates the arithmetic mean of a collection of values.
     *
     * @param values Array of expressions to calculate mean from
     * @returns The mean value
     */
    function mean(values: ExpressionParam[]): NerdamerExpression;

    /**
     * Finds the mode (most frequent value) in a collection.
     *
     * @param values Array of expressions to find mode from
     * @returns The mode value(s)
     */
    function mode(values: ExpressionParam[]): NerdamerExpression | NerdamerExpression[];

    /**
     * Calculates the median of a collection of values.
     *
     * **CRITICAL BEHAVIOR NOTE**: The array syntax is broken, but function call syntax works perfectly:
     *
     * ```typescript
     * // ✅ WORKING SYNTAX - Function call with comma-separated arguments:
     * nerdamer('median(1,2,3,4)').evaluate(); // 5/2 ✅
     * nerdamer('median(4,2,5,4)').evaluate(); // 4 ✅
     * nerdamer('median(x+1,x+2,x+3)'); // median(1+x,3+x,2+x) ✅
     *
     * // ❌ BROKEN SYNTAX - Array-based calls return original collection:
     * nerdamer.median([1, 2, 3, 4]); // (1, 2, 3, 4) ❌
     * nerdamer.median(['1', '2', '3', '4']); // (1, 2, 3, 4) ❌
     * ```
     *
     * **RECOMMENDED USAGE**: Always use the string function call syntax:
     *
     * ```typescript
     * // For numeric arrays:
     * const values = [1, 2, 3, 4];
     * const result = nerdamer(`median(${values.join(',')})`).evaluate();
     *
     * // For symbolic expressions:
     * const expressions = ['x+1', 'x+2', 'x+3'];
     * const symbolic = nerdamer(`median(${expressions.join(',')})`);
     *
     * // Works with all data types:
     * nerdamer('median(-2,-1,0,1,2)'); // 0
     * nerdamer('median(1000000,2000000)'); // 1500000
     * nerdamer('median(1.5,2.5,3.5,4.5)'); // 3
     * ```
     *
     * The function correctly handles:
     *
     * - Even and odd length arrays
     * - Negative numbers and decimals
     * - Symbolic expressions
     * - Mixed symbolic and numeric values
     * - Unsorted input (automatically sorts)
     *
     * @param values Array of expressions (BROKEN - use string syntax instead)
     * @returns Median value when using string syntax, original collection when using array syntax
     */
    function median(values: ExpressionParam[]): NerdamerExpression;
    function zscore(value: ExpressionParam, mean: ExpressionParam, stdev: ExpressionParam): NerdamerExpression;
    function limit(expression: ExpressionParam, variable: string, approach: ExpressionParam): NerdamerExpression;
    function smpvar(values: ExpressionParam[]): NerdamerExpression;
    function variance(values: ExpressionParam[]): NerdamerExpression;
    function smpstdev(values: ExpressionParam[]): NerdamerExpression;
    function stdev(values: ExpressionParam[]): NerdamerExpression;

    // #endregion

    // #region Transform Functions

    function laplace(expression: ExpressionParam, variable: string, transformVariable: string): NerdamerExpression;
    function ilt(expression: ExpressionParam, variable: string, transformVariable: string): NerdamerExpression;

    // #endregion

    // #region NerdamerSet Functions

    function NerdamerSet(elements?: ExpressionParam[]): NerdamerCore.NerdamerSet;
    function C(n: ExpressionParam, k: ExpressionParam): NerdamerExpression;
    function S(n: ExpressionParam, k: ExpressionParam): NerdamerExpression;
    function union(set1: ExpressionParam, set2: ExpressionParam): NerdamerCore.NerdamerSet;
    function intersection(set1: ExpressionParam, set2: ExpressionParam): NerdamerCore.NerdamerSet;
    function difference(set1: ExpressionParam, set2: ExpressionParam): NerdamerCore.NerdamerSet;
    function isSubset(set1: ExpressionParam, set2: ExpressionParam): boolean;
    function isIn(element: ExpressionParam, set: ExpressionParam): boolean;
    function intersects(set1: ExpressionParam, set2: ExpressionParam): boolean;
    function contains(container: ExpressionParam, element: ExpressionParam): boolean;

    // #endregion

    // #region Additional Math Functions

    function cbrt(expression: ExpressionParam): NerdamerExpression;
    function nthroot(expression: ExpressionParam, n: ExpressionParam): NerdamerExpression;
    function trunc(expression: ExpressionParam): NerdamerExpression;
    function integer_part(expression: ExpressionParam): NerdamerExpression;
    function conjugate(expression: ExpressionParam): NerdamerExpression;
    function gamma_incomplete(a: ExpressionParam, x: ExpressionParam): NerdamerExpression;
    function radians(expression: ExpressionParam): NerdamerExpression;
    function degrees(expression: ExpressionParam): NerdamerExpression;
    function rationalize(expression: ExpressionParam): NerdamerExpression;
    function Li(expression: ExpressionParam): NerdamerExpression;

    // #endregion

    // #region Alternative Trigonometric Names

    function arccos(expression: ExpressionParam): NerdamerExpression;
    function arcsin(expression: ExpressionParam): NerdamerExpression;
    function arctan(expression: ExpressionParam): NerdamerExpression;

    // #endregion

    // #region Utility Functions

    function IF(
        condition: ExpressionParam,
        trueValue: ExpressionParam,
        falseValue: ExpressionParam
    ): NerdamerExpression;

    /**
     * Returns an array of all supported function names in nerdamer.
     *
     * @example
     *     ```typescript
     *         const functions = nerdamer.supported();
     *         console.log(functions);  // ['cos', 'sin', 'tan', 'expand', 'factor', ...]
     *         ```;
     *
     * @returns Array of supported function names
     */
    function supported(): string[];
    function sort(expression: ExpressionParam): NerdamerExpression;
    /**
     * Prints the expression to the console and returns an Expression.
     *
     * @param expression The expression to print
     * @returns An Expression object (with symbol possibly undefined)
     */
    function print(expression: ExpressionParam): NerdamerExpression;

    /**
     * Converts a number to scientific notation.
     *
     * @param expression The number to convert
     * @returns The expression in scientific notation form
     */
    function scientific(expression: ExpressionParam): NerdamerExpression;
    function primes(n: number): number[];
    function vectrim(vector: ExpressionParam): NerdamerExpression;

    /**
     * Maps internal functions to the external API. This is called automatically on initialization. Call with
     * `override=true` to re-map functions that have been added or modified.
     *
     * @param override If true, overrides existing function mappings
     */
    function updateAPI(override?: boolean): void;
    /**
     * Validates that a name is valid for use as a variable or function name. Throws an error if the name is invalid.
     *
     * @example
     *     ```typescript
     *         nerdamer.validateName('x');     // OK, no error
     *         nerdamer.validateName('myVar'); // OK, no error
     *         nerdamer.validateName('123');   // throws Error: "123 is not a valid variable name"
     *         ```;
     *
     * @param name The name to validate
     * @throws {Error} Error if the name is invalid
     */
    function validateName(name: string): void;

    /**
     * Loads a custom module/extension by calling the loader function with nerdamer as context.
     *
     * @example
     *     ```typescript
     *         nerdamer.load(function() {
     *             // 'this' is the nerdamer object
     *             this.register({
     *                 name: 'myFunc',
     *                 numargs: 1,
     *                 visible: true,
     *                 build: () => (x) => x * 2
     *             });
     *         });
     *         ```;
     *
     * @param loader A function that will be called with nerdamer as 'this' context
     * @returns The nerdamer object for chaining
     */
    function load(loader: (this: typeof nerdamer) => void): typeof nerdamer;

    // #endregion

    // #region Parser Functions

    /**
     * Parses an expression string into NerdamerSymbol objects.
     *
     * Multiple expressions can be separated by semicolons.
     *
     * @example
     *     ```typescript
     *         nerdamer.parse('x+1');           // [NerdamerSymbol]
     *         nerdamer.parse('x+1;y+2');       // [NerdamerSymbol, NerdamerSymbol]
     *         ```;
     *
     * @param expression The expression string (can contain multiple expressions separated by semicolons)
     * @returns Array of parsed NerdamerSymbol objects
     */
    function parse(expression: string): NerdamerCore.NerdamerSymbol[];
    function rpn(expression: string): Token[];

    /**
     * Returns the list of user-defined functions.
     *
     * @example
     *     ```typescript
     *         nerdamer.setFunction('f', ['x'], 'x^2');
     *         nerdamer.functions();       // ['f(x)=x^2']
     *         nerdamer.functions(true);   // { '1': 'f(x)=x^2' }
     *         ```;
     *
     * @param asObject If true, returns an object with 1-based indices as keys
     * @param option Optional formatting option
     * @returns Array of function definitions, or object if asObject is true
     */
    function functions(asObject?: boolean, option?: OutputType): string[] | Record<number, string>;
    function addPeeker(name: string, fn: Function): void;

    /**
     * Removes a peeker function by name and function reference.
     *
     * @param name The name/type of peeker to remove from
     * @param fn The specific function to remove
     */
    function removePeeker(name: string, fn: Function): void;
    function aliasOperator(original: string, alias: string): void;
    function setOperator(
        operator: string | { symbol: string; precedence?: number; leftAssoc?: boolean },
        action?: Function,
        shift?: 'over' | 'under'
    ): void;
    function getOperator(
        operator: string
    ): { symbol: string; precedence: number; leftAssoc: boolean; operation?: Function } | undefined;
    function getWarnings(): string[];

    /**
     * Replaces an existing function with a new implementation.
     *
     * @example
     *     ```typescript
     *         // Replace the 'sin' function with a custom implementation
     *         nerdamer.replaceFunction('sin', (originalFn, core) => {
     *             return (x) => {
     *                 // Custom implementation using original
     *                 return originalFn(x);
     *             };
     *         });
     *         ```;
     *
     * @param name The name of the function to replace
     * @param fn A factory function that receives the original function and core, and returns the new implementation
     * @param numArgs Optional: override the number of arguments
     */
    function replaceFunction(
        name: string,
        fn: (originalFn: Function, core: NerdamerCore.Core) => Function,
        numArgs?: number | [number, number]
    ): void;

    // #endregion

    // #region Expression/Equation Management

    function getExpression(index: ExpressionHistoryIndex): NerdamerExpression | undefined;
    function getEquation(index: ExpressionHistoryIndex): NerdamerExpression | undefined;
    function numExpressions(): number;
    function numEquations(): number;

    // #endregion

    // #region Division Functions

    function div(dividend: ExpressionParam, divisor: ExpressionParam): NerdamerExpression | NerdamerExpression[];
    function useAlgebraDiv(): void;
    function useParserDiv(): void;

    // #endregion

    // #region NerdamerCore Namespace: Internal Classes & Utilities

    /** Contains the internal classes, parsers, and utilities of Nerdamer. Accessible via `nerdamer.getCore()`. */
    namespace NerdamerCore {
        // #region Core Data Structures

        /** Represents a token in the parser's token stream */
        interface Token {
            /** The type of token (OPERATOR, VARIABLE_OR_LITERAL, FUNCTION, UNIT, KEYWORD) */
            type: string;
            /** The token's value */
            value: string | number | NerdamerSymbol;
            /** Column number in the source expression */
            column?: number;
            /** Precedence for operator tokens */
            precedence?: number;
            /** Whether the operator is left associative */
            leftAssoc?: boolean;
            /** Whether this is a prefix operator */
            is_prefix?: boolean;
            /** Whether this is a postfix operator */
            postfix?: boolean;
            /** Operation function for operators */
            operation?: (...args: NerdamerSymbol[]) => NerdamerSymbol;
        }

        /** Array extended with scope properties for tokenization */
        interface ScopeArray<T = Token | NerdamerSymbol> extends Array<T> {
            /** The type of scope (e.g., 'vector', 'function') */
            type?: string;
            /** Column number in the source expression where this scope starts */
            column?: number;
        }

        /** Constructor for creating Frac instances. */
        interface FracConstructor {
            new (n?: number | string | Frac): Frac;
            /** Creates a Frac from a number, string, or existing Frac */
            create(n: number | string | Frac): Frac;
            /** Creates a Frac quickly from numerator and denominator */
            quick(n: string | number, d: string | number): Frac;
            /** Simplified fraction creation for special cases */
            simple(n: number | string): Frac;
            /** Type guard to check if a value is a Frac */
            isFrac(o: unknown): o is Frac;
        }

        /**
         * Common interface for values that can be used as a power/exponent. Both Frac and NerdamerSymbol implement
         * these methods when used as powers. Methods like isNegative, toDecimal, absEquals are only called when the
         * symbol is not in EX group (exponential), where power is guaranteed to be Frac.
         */
        interface PowerValue {
            /** Compares for equality - parameter types vary by implementation */
            equals(n: number | Frac | PowerValue): boolean;
            negate(): this;
            clone(): PowerValue;
            toString(): string;
            /** Multiplies power values - signature varies by implementation */
            multiply(m: number | Frac | PowerValue): PowerValue;
        }

        /** Represents a high-precision fraction. */
        interface Frac extends PowerValue {
            /** Numerator - BigInteger from big-integer library */
            num: BigInteger;
            /** Denominator - BigInteger from big-integer library */
            den: BigInteger;
            /** Multiplies this fraction by m, returning a new Frac */
            multiply(m: Frac): Frac;
            /** Divides this fraction by m, returning a new Frac */
            divide(m: Frac): Frac;
            /** Adds m to this fraction, returning a new Frac */
            add(m: Frac): Frac;
            /** Subtracts m from this fraction, returning a new Frac */
            subtract(m: Frac): Frac;
            /** Alias for subtract */
            sub(m: Frac): Frac;
            /** Returns this modulo m as a new Frac */
            mod(m: Frac): Frac;
            /** Negates this fraction in place, returns this */
            neg(): this;
            /** Alias for neg */
            negate(): this;
            /** Inverts this fraction in place, returns this */
            invert(): this;
            /** Makes this fraction positive in place, returns this */
            abs(): this;
            /** Compares for equality - accepts Frac, number, or any PowerValue */
            equals(n: number | Frac | PowerValue): boolean;
            gt(n: number | Frac): boolean;
            lt(n: number | Frac): boolean;
            gte(n: number | Frac): boolean;
            lte(n: number | Frac): boolean;
            lessThan(n: number | Frac): boolean;
            greaterThan(n: number | Frac): boolean;
            isInteger(): boolean;
            isOne(): boolean;
            isNegative(): boolean;
            sign(): -1 | 1;
            /** Returns the GCD of this and f as a new Frac */
            gcd(f: Frac): Frac;
            toDecimal(precision?: number): string | number;
            /** Internal decimal conversion method */
            decimal(precision?: number): string;
            /** Internal comparison helper - returns [this.num * n.den, n.num * this.den] */
            qcompare(n: Frac): [BigInteger, BigInteger];
            toString(): string;
            valueOf(): number | Decimal;
            /** Creates a copy of this fraction */
            clone(): Frac;
            /** Simplifies this fraction in place, returns this */
            simplify(): this;
            contains(n: number | Frac): boolean;
            /** Checks if the absolute value equals the given number */
            absEquals(n: number | Frac): boolean;
        }

        /** Constructor for creating NerdamerSymbol instances. */
        interface SymbolConstructor {
            new (value?: string | number | Frac): NerdamerSymbol;
            imaginary(): NerdamerSymbol;
            infinity(negative?: -1): NerdamerSymbol;
            shell(group: number, value?: string): NerdamerSymbol;
            create(value: string | number, power?: string | number): NerdamerSymbol;
            unwrapSQRT(symbol: NerdamerSymbol, all?: boolean): NerdamerSymbol;
            unwrapPARENS(symbol: NerdamerSymbol): NerdamerSymbol;
            hyp(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            toPolarFormArray(symbol: NerdamerSymbol): [NerdamerSymbol, NerdamerSymbol];
        }

        /**
         * The core symbolic object in Nerdamer. Everything from a variable to a complex expression is ultimately
         * represented as a NerdamerSymbol.
         *
         * **Discriminator**: NerdamerSymbol does NOT have a `custom` property, while Vector and Matrix have `custom:
         * true`. Use this for type narrowing:
         *
         * ```typescript
         * if ('custom' in result && result.custom === true) {
         *     // result is Vector | Matrix
         * } else {
         *     // result is NerdamerSymbol
         * }
         * ```
         */
        interface NerdamerSymbol extends PowerValue {
            /**
             * Discriminator: NerdamerSymbol does NOT have custom property. Vector and Matrix have `custom: true`. This
             * enables type narrowing in discriminated unions.
             */
            custom?: never;

            // Output methods
            toString: () => string;
            text: (option?: OutputType | string[]) => string;
            latex: (option?: OutputType | string[]) => string;
            valueOf: () => number | string;

            // Properties - these are REQUIRED on NerdamerSymbol but not on Vector/Matrix
            /** Symbol group number (N, S, FN, PL, CB, CP, EX) - REQUIRED on NerdamerSymbol */
            group: number;
            /** The value/name of the symbol - always a string internally */
            value: string;
            multiplier: Frac;
            /** The power/exponent - usually Frac, but can be NerdamerSymbol for EX group symbols */
            power: Frac | NerdamerSymbol;
            symbols?: Record<string, NerdamerSymbol>;
            args?: NerdamerSymbol[];
            fname?: string;
            imaginary?: boolean;
            isInfinity?: boolean;

            // Additional internal properties
            /** Unit symbol attached to this symbol */
            unit?: NerdamerSymbol;
            /** Whether this symbol represents a unit */
            isUnit?: boolean;
            /** Whether this symbol is a conversion factor */
            isConversion?: boolean;
            /** Whether this is an imaginary symbol */
            isImgSymbol?: boolean;
            /** Elements array for Vector/Matrix-like symbols */
            elements?: NerdamerSymbol[];
            /** Number of rows (for Matrix-like symbols) */
            rows?: number;
            /** Number of columns (for Matrix-like symbols) */
            cols?: number;
            /** Dimensions of the symbol */
            dimensions?: number[];
            /** Parent symbol reference */
            parent?: NerdamerSymbol;
            /** Parentheses tracking - can be boolean or number, used as truthy check */
            parens?: boolean | number;
            /** Previous group before transformation */
            previousGroup?: number;
            /** The symbol before substitution */
            subbed?: NerdamerSymbol;
            /** Custom text function for special rendering */
            text_?: (opt?: string) => string;

            // Type Guards / Checkers
            isPoly(multivariate?: boolean): boolean;
            isConstant(check_all?: boolean | 'all' | 'functions', check_symbols?: boolean): boolean;
            isLinear(wrt?: string): boolean;
            isInteger(): boolean;
            isSimple(): boolean;
            isMonomial(): boolean;
            isInverse(): boolean;
            isOne(abs?: boolean): boolean;
            isE(): boolean;
            isPi(): boolean;
            isSQRT(): boolean;
            isSquare(): boolean;
            isCube(): boolean;
            isToNth(n: number): boolean;
            isImaginary(): boolean;
            isComposite(): boolean;

            // Manipulation Methods (mutating methods return this)
            negate(): this;
            invert(powerOnly?: boolean, all?: boolean): this;
            toLinear(): this;
            toUnitMultiplier(keepSign?: boolean): this;
            abs(): NerdamerSymbol;
            stripVar(x: string | NerdamerSymbol, excludeX?: boolean): NerdamerSymbol;
            distributeMultiplier(all?: boolean): this;
            distributeExponent(): this;
            powSimp(): NerdamerSymbol;
            getNth(n: number): NerdamerSymbol;
            setPower(p: number | Frac | NerdamerSymbol, retainSign?: boolean): this;
            /** Multiplies this symbol by x. Available on Vector/Matrix. */
            multiply?(x: NerdamerSymbol): this;
            clone(c?: NerdamerSymbol): NerdamerSymbol;

            // Part Extraction
            realpart(): NerdamerSymbol;
            imagpart(): NerdamerSymbol;
            getNum(): NerdamerSymbol;
            getDenom(): NerdamerSymbol;

            // Content & Comparison
            contains(variable: string | NerdamerSymbol, all?: boolean): boolean;
            containsFunction(names: string | string[]): boolean;
            equals(symbol: ExpressionParam | number | Frac | PowerValue): boolean;
            gt(symbol: ExpressionParam): boolean;
            lt(symbol: ExpressionParam): boolean;
            gte(symbol: ExpressionParam): boolean;
            lte(symbol: ExpressionParam): boolean;
            lessThan(symbol: ExpressionParam): boolean;
            sign(): -1 | 1;

            // Iteration & Output
            each(fn: (symbol: NerdamerSymbol, key: string) => void, deep?: boolean): void;
            /** Iterates over elements. Available on Vector/Matrix. */
            eachElement?(fn: (element: NerdamerSymbol, i: number, j?: number) => void): void;
            /** Maps over symbols. Available on Vector/Matrix. */
            map?(fn: (symbol: NerdamerSymbol, key: string) => NerdamerSymbol): NerdamerSymbol;
            collectSymbols<T = NerdamerSymbol>(
                fn?: (symbol: NerdamerSymbol, opt?: string) => T,
                opt?: string,
                sortFn?: SortFn,
                expandSymbol?: boolean
            ): T[];
            sub(a: ExpressionParam, b: ExpressionParam): NerdamerSymbol;

            // Internal methods used by parser operations
            pushMinus(): NerdamerSymbol;
            toArray(v: string, arr?: NerdamerSymbol[]): NerdamerSymbol[];
            hasFunc(v: string): boolean;
            multiplyPower(p2: NerdamerSymbol | Frac): NerdamerSymbol;
            length?: number;
            convert(group: number, imaginary?: boolean): NerdamerSymbol;
            insert(symbol: NerdamerSymbol, action: 'add' | 'multiply'): this;
            attach(symbol: NerdamerSymbol | NerdamerSymbol[]): this;
            combine(symbol: NerdamerSymbol | NerdamerSymbol[]): this;
            updateHash(): void;
            keyForGroup(group: number): string | number;
            collectSummandSymbols<T = NerdamerSymbol>(
                fn?: (s: NerdamerSymbol, opt?: string) => T,
                opt?: string,
                sortFn?: SortFn,
                expandSymbol?: boolean
            ): T[];
            isCombination(): boolean;
            greaterThan(n: ExpressionParam): boolean;

            // Methods from Modules (may not be present if modules not loaded)
            /** Gets coefficients. Available when Algebra module is loaded. */
            coeffs?(c?: NerdamerSymbol[], with_order?: boolean): NerdamerSymbol[];
            groupTerms?(x: string): NerdamerSymbol[];
            fnTransform?(): NerdamerSymbol;
            simplify?(): NerdamerSymbol;
            hasTrig?(): boolean;
            hasIntegral?(): boolean;
        }

        /**
         * Constructor for NerdamerExpression
         *
         * Note: The constructed Expression instance contains only the core methods. Module-specific methods (simplify,
         * equals, solveFor, hasIntegral) are added by respective modules (Algebra, Solve) and may not be available
         * immediately.
         */
        interface ExpressionConstructor {
            new (symbol: NerdamerSymbol): NerdamerExpression;
            getExpression(index: 'last' | 'first' | number): NerdamerExpression | undefined;
        }

        /** Constructor for Vector */
        interface VectorConstructor {
            new (elements?: Vector | Matrix | NerdamerSymbol[] | NerdamerSymbol, ...rest: NerdamerSymbol[]): Vector;
            fromArray(arr: (NerdamerSymbol | Vector | Matrix | string | number)[]): Vector;
            arrayPrefill(n: number, val?: NerdamerSymbol | number): (NerdamerSymbol | number)[];
        }

        /**
         * Represents a vector of symbolic expressions.
         *
         * Vectors in Nerdamer are internal objects with vector semantics. They can be manipulated using vector-specific
         * static functions and have their own methods.
         *
         * @example
         *     // Create vectors
         *     const v1 = nerdamer.vector([1, 2, 3]);
         *     const v2 = nerdamer.vector(['x', 'y', 'z']);
         *
         *     // Vector operations (using static functions)
         *     const dot = nerdamer.dot(v1, v2); // Dot product
         *     const cross = nerdamer.cross(v1, v2); // Cross product
         *     const elem = nerdamer.vecget(v1, 0); // Get element at index 0
         */
        interface Vector {
            /**
             * Discriminator property - always true for Vector and Matrix. Use with type guards like: if ('custom' in
             * obj && obj.custom) { ... }
             */
            readonly custom: true;

            /** Multiplier coefficient */
            multiplier: Frac;

            /** Array of elements in the vector (can include nested vectors/matrices from parser operations) */
            elements: (NerdamerSymbol | Vector | Matrix)[];

            /** Whether this is a row vector (vs column vector) */
            rowVector: boolean;

            /** Returns the element at index i (1-based) */
            e(i: number): NerdamerSymbol | Vector | Matrix | null;

            /** Sets element at index i */
            set(i: number, val: NerdamerSymbol | string | number): void;

            /** Returns the number of elements */
            dimensions(): number;

            /** Returns the modulus (length) of the vector */
            modulus(): NerdamerSymbol;

            /** Returns true if the vector equals the argument */
            eql(vector: Vector | NerdamerSymbol[]): boolean;

            /** Clone the vector */
            clone(): Vector;

            /** Expands all elements */
            expand(options?: ExpandOptions): this;

            /** Maps the vector to another vector */
            map(fn: (element: NerdamerSymbol, index: number) => NerdamerSymbol): Vector;

            /** Calls the iterator for each element */
            each(fn: (element: NerdamerSymbol, index: number) => void): void;

            /** Returns a normalized unit vector */
            toUnitVector(): Vector;

            /** Returns the angle between this vector and another */
            angleFrom(vector: Vector | NerdamerSymbol[]): NerdamerSymbol | null;

            /** Returns true if parallel to argument */
            isParallelTo(vector: Vector | NerdamerSymbol[]): boolean | null;

            /** Returns true if antiparallel to argument */
            isAntiparallelTo(vector: Vector | NerdamerSymbol[]): boolean | null;

            /** Returns true if perpendicular to argument */
            isPerpendicularTo(vector: Vector | NerdamerSymbol[]): boolean | null;

            /** Adds another vector */
            add(vector: Vector | NerdamerSymbol[]): Vector | null;

            /** Subtracts another vector */
            subtract(vector: Vector | NerdamerSymbol[]): Vector | null;

            /** Multiplies by a scalar */
            multiply(k: NerdamerSymbol): Vector;

            /** Alias for multiply */
            x(k: NerdamerSymbol): Vector;

            /** Returns the dot product */
            dot(vector: Vector | NerdamerSymbol[]): NerdamerSymbol | null;

            /** Returns the cross product (only for 3D vectors) */
            cross(vector: Vector | NerdamerSymbol[]): Vector | null;

            /** Returns this (for interface compatibility) */
            toUnitMultiplier(): this;

            /** Returns the largest element by absolute value */
            max(): NerdamerSymbol | Vector | Matrix | number;

            /** Returns the magnitude of the vector */
            magnitude(): NerdamerSymbol;

            /** Returns the index of the first match (1-based) */
            indexOf(x: NerdamerSymbol | number): number | null;

            /** Internal text representation method */
            text_(x?: unknown, options?: { decimals?: boolean; decimalPlaces?: number }): string;

            /** Returns text representation */
            text(x?: unknown, options?: { decimals?: boolean; decimalPlaces?: number }): string;

            /** Returns string representation */
            toString(): string;

            /** Returns LaTeX representation */
            latex(option?: OutputType): string;
        }

        /** Constructor for Matrix */
        interface MatrixConstructor {
            new (...rows: (ExpressionParam[] | Vector)[]): Matrix;
            identity(size: number): Matrix;
            fromArray(arr: (ExpressionParam | NerdamerSymbol)[][] | (ExpressionParam | NerdamerSymbol)[]): Matrix;
            zeroMatrix(rows: number, cols: number): Matrix;
        }

        /**
         * Represents a matrix of symbolic expressions.
         *
         * Matrices in Nerdamer are internal objects with matrix semantics. They can be manipulated using
         * matrix-specific static functions and have their own methods.
         *
         * IMPORTANT: For determinant calculations, use variable-based matrix creation:
         *
         * @example
         *     // RECOMMENDED - Variable-based creation (works with determinants):
         *     nerdamer.setVar('M1', 'matrix([1,2],[3,4])');
         *     const m1 = nerdamer('M1'); // matrix([1,2],[3,4])
         *     const det1 = nerdamer.determinant(m1); // -2
         *
         *     // ALTERNATIVE - Identity matrices work reliably:
         *     const identity = nerdamer.imatrix(3); // 3x3 identity matrix
         *     const detId = nerdamer.determinant(identity); // 1
         *
         *     // Matrix operations work with all creation methods:
         *     const inv = nerdamer.invert(m1); // Matrix inverse
         *     const trans = nerdamer.transpose(m1); // Transpose
         *     const elem = nerdamer.matget(m1, 0, 1); // Get element at (0,1)
         */
        interface Matrix {
            /**
             * Discriminator property - always true for Vector and Matrix. Use with type guards like: if ('custom' in
             * obj && obj.custom) { ... }
             */
            readonly custom: true;

            /** Multiplier coefficient */
            multiplier: Frac;

            /** 2D array of elements in the matrix (can include nested vectors/matrices from parser operations) */
            elements: (NerdamerSymbol | Vector | Matrix)[][];

            /** Gets element at (row, column) */
            get(row: number, column: number): NerdamerSymbol | Vector | Matrix | undefined;

            /** Maps the matrix to another matrix. Note: callback only receives element, not row/col indices */
            map(f: (element: NerdamerSymbol) => NerdamerSymbol, rawValues?: boolean): Matrix;

            /** Sets an element at position (row, column) */
            set(
                row: number,
                column: number,
                value: NerdamerSymbol | Vector | Matrix | string | number,
                raw?: boolean
            ): void;

            /** Returns number of columns */
            cols(): number;

            /** Returns number of rows */
            rows(): number;

            /** Returns row n (1-based) */
            row(n: number): (NerdamerSymbol | Vector | Matrix)[];

            /** Returns column n (1-based) */
            col(n: number): (NerdamerSymbol | Vector | Matrix)[];

            /** Iterates over each element in the matrix */
            eachElement(fn: (element: NerdamerSymbol, row: number, col: number) => void): void;

            /** Alias for eachElement */
            each(fn: (element: NerdamerSymbol, row: number, col: number) => void): void;

            /** Returns the determinant (null if not square) */
            determinant(): NerdamerSymbol | null;

            /** Returns true if the matrix is square */
            isSquare(): boolean;

            /** Returns true if the matrix is singular */
            isSingular(): boolean;

            /** Augments this matrix with another matrix */
            augment(m: Matrix): this;

            /** Clone the matrix */
            clone(): Matrix;

            /** Returns this (for interface compatibility) */
            toUnitMultiplier(): this;

            /** Expands all elements */
            expand(options?: ExpandOptions): this;

            /** Evaluates all elements */
            evaluate(options?: Record<string, ExpressionParam>): this;

            /** Returns the inverse of the matrix */
            invert(): Matrix;

            /** Returns the right triangular form */
            toRightTriangular(): Matrix;

            /** Returns the transpose */
            transpose(): Matrix;

            /** Returns true if this matrix can multiply the argument from the left */
            canMultiplyFromLeft(matrix: Matrix | NerdamerSymbol[][]): boolean;

            /** Returns true if the matrices have the same dimensions */
            sameSize(matrix: Matrix): boolean;

            /** Multiplies by another matrix */
            multiply(matrix: Matrix): Matrix | null;

            /** Adds another matrix */
            add(
                matrix: Matrix,
                callback?: (result: NerdamerSymbol, e1: NerdamerSymbol, e2: NerdamerSymbol) => NerdamerSymbol
            ): Matrix;

            /** Subtracts another matrix */
            subtract(
                matrix: Matrix,
                callback?: (result: NerdamerSymbol, e1: NerdamerSymbol, e2: NerdamerSymbol) => NerdamerSymbol
            ): Matrix;

            /** Negates all elements */
            negate(): this;

            /** Converts to a Vector if 1D, otherwise returns this */
            toVector(): Vector | Matrix;

            /** Returns string representation */
            toString(newline?: string, toDecimal?: boolean): string;

            /** Returns text representation */
            text(): string;

            /** Returns LaTeX representation */
            latex(option?: OutputType): string;
        }

        /** Constructor for NerdamerSet */
        interface SetConstructor {
            new (set?: Vector): NerdamerSet;
            fromArray(arr: (ExpressionParam | NerdamerSymbol)[]): NerdamerSet;
        }

        /** Represents a mathematical set. */
        interface NerdamerSet {
            elements: NerdamerSymbol[];
            add(element: NerdamerSymbol): void;
            contains(element: NerdamerSymbol): boolean;
            union(other: NerdamerSet): NerdamerSet;
            intersection(other: NerdamerSet): NerdamerSet;
            difference(other: NerdamerSet): NerdamerSet;
            intersects(other: NerdamerSet): boolean;
            isSubset(other: NerdamerSet): boolean;
            remove(element: NerdamerSymbol): boolean;
            clone(): NerdamerSet;
            each(fn: (e: NerdamerSymbol, newSet: NerdamerSet, i: number) => void): NerdamerSet;
            toString(): string;
        }

        /** Constructor for Collection */
        interface CollectionConstructor {
            new (): Collection;
            create(e?: NerdamerSymbol): Collection;
        }

        /** Internal-use collection for function arguments. */
        interface Collection {
            /** Array of elements in the collection */
            elements: NerdamerSymbol[];
            /** Appends an element to the collection */
            append(e: NerdamerSymbol): void;
            /** Gets the items/elements in the collection */
            getItems(): NerdamerSymbol[];
            /** Returns the number of elements */
            dimensions(): number;
            /** Returns a string representation */
            toString(): string;
            /** Returns a text representation with options */
            text(options?: string): string;
            /** Creates a clone of the collection */
            clone(): Collection;
            /** Expands all elements */
            expand(options?: ExpandOptions): this;
            /** Evaluates all elements */
            evaluate(options?: Record<string, ExpressionParam>): this;
            /** Maps a function over elements */
            map(lambda: (x: NerdamerSymbol, i: number) => NerdamerSymbol): Collection;
            /** Adds another collection element-wise */
            add(c2: Collection): Collection | null;
            /** Subtracts another collection element-wise */
            subtract(c2: Collection): Collection | null;
        }

        /** Static utility object for converting decimals to fractions. */
        interface Fraction {
            /**
             * Converts a decimal to a fraction.
             *
             * @param value The decimal value to convert
             * @param opts Optional conversion options
             * @returns An array [numerator, denominator]
             */
            convert(value: number | string, opts?: object): [number, number];
            /**
             * Quick conversion for very small or very large numbers.
             *
             * @param value The value to convert
             * @returns An array [numerator, denominator]
             */
            quickConversion(value: number | string): [string, string];
            /**
             * Full precision conversion using continued fractions algorithm.
             *
             * @param dec The decimal to convert
             * @returns An array [numerator, denominator]
             */
            fullConversion(dec: number | string): [number, number];
        }

        /** Constructor for Scientific notation handler */
        interface ScientificConstructor {
            new (num?: string | number): Scientific;
            /** Check if a string is in scientific notation */
            isScientific(num: string): boolean;
            /** Get leading zeroes from a string */
            leadingZeroes(num: string): string;
            /** Remove leading zeroes from a string */
            removeLeadingZeroes(num: string): string;
            /** Remove trailing zeroes from a string */
            removeTrailingZeroes(num: string): string;
            /** Round a coefficient to n significant figures */
            round(c: string, n: number): string;
        }

        /** Scientific notation handler for arbitrary precision numbers. */
        interface Scientific {
            /** The sign of the number (-1 or 1) */
            sign: number;
            /** The coefficient in scientific notation */
            coeff: string;
            /** The exponent in scientific notation */
            exponent: number;
            /** The whole number part */
            wholes: string;
            /** The decimal part */
            dec: string;
            /** The number of decimal places */
            decp: number;
            /** Convert from scientific notation string */
            fromScientific(num: string): this;
            /** Convert a regular number to scientific notation */
            convert(num: string): this;
            /** Round to specified decimal places */
            round(num: number): Scientific;
            /** Create a copy */
            copy(): Scientific;
            /** Convert to string with optional precision */
            toString(n?: number): string;
        }

        /** Constructor for Parser */
        type ParserConstructor = new () => Parser;

        /** Static LaTeX conversion utilities. */
        interface LaTeX {
            /** Reference to the parser instance */
            parser: Parser | null;
            /** Space character for LaTeX */
            space: string;
            /** Dot/multiplication character for LaTeX */
            dot: string;
            /**
             * Parses tokenized LaTeX into a string representation.
             *
             * @param rawTokens The tokenized input from LaTeX
             * @returns Parsed string representation
             */
            parse(rawTokens: (Token | ScopeArray)[]): string;
            /**
             * Converts a symbol to LaTeX format.
             *
             * @param symbol The symbol to convert (can be NerdamerSymbol, Expression, array, or other types)
             * @param option Conversion option ('decimal' for numeric output)
             * @returns LaTeX string representation
             */
            latex(symbol: unknown, option?: string | string[]): string;
            /** Wraps content in brackets */
            brackets(contents: string, type?: string, braces?: boolean): string;
            /** Formats a fraction for LaTeX */
            formatFrac(frac: Frac, ignoreOnes?: boolean): string;
            /** Gets the value representation */
            value(symbol: NerdamerSymbol, invert?: boolean, option?: string, negative?: boolean): string[];
            /** Greek letter mappings */
            greek: Record<string, string>;
            /** Symbol mappings for functions */
            symbols: Record<string, string>;
            /** Initialize parser reference */
            initParser(): void;
        }

        /** Static Math2 utilities for extended mathematical functions. */
        interface Math2 {
            /** Cosecant */
            csc(x: number): number;
            /** Secant */
            sec(x: number): number;
            /** Cotangent */
            cot(x: number): number;
            /** Arc cosecant */
            acsc(x: number): number;
            /** Arc secant */
            asec(x: number): number;
            /** Arc cotangent */
            acot(x: number): number;
            /** Error function */
            erf(x: number): number;
            /** Numerical derivative */
            diff(f: (x: number) => number): (x: number) => number;
            /** Median of values */
            median(...values: number[]): number;
            /** Convert from continued fraction */
            fromContinued(contd: { whole: number; sign: number; fractions: number[] }): number;
            /** Calculate continued fraction representation */
            continuedFraction(n: number, x?: number): { whole: number; sign: number; fractions: number[] };
            /** Big integer power */
            bigpow(n: number | Frac, p: number | Frac): Frac;
            /** Gamma function */
            gamma(z: number): number;
            /** Big integer factorial */
            bigfactorial(x: number): Frac;
            /** Big integer logarithm */
            bigLog(x: number | string): Frac;
            /** Factorial */
            factorial(x: number): number;
            /** Double factorial */
            dfactorial(x: number): number | Frac;
            /** Greatest common divisor */
            GCD(...args: number[]): number;
            /** GCD for Frac objects */
            QGCD(...args: Frac[]): Frac;
            /** Least common multiple */
            LCM(a: number, b: number): number;
            /** Power with negative number handling */
            pow(b: number, e: number): number;
            /** Factor a number */
            factor(n: number): NerdamerSymbol;
            /** Simple factorization using trial division */
            sfactor(n: number, factors?: Record<string, number>): Record<string, number>;
            /** Integer factorization using Pollard's rho */
            ifactor(num: number): Record<string, number>;
            /** Box factorization */
            boxfactor(n: number, max?: number): [number, number] | [number, number, number];
            /** Fibonacci number */
            fib(n: number): number;
            /** Modulo operation */
            mod(x: number, y: number): number;
            /** Integer part of a number */
            integer_part(x: number): number;
            /** Simpson's rule integration */
            simpson(f: (x: number) => number, a: number, b: number, step?: number): number;
            /** Adaptive Simpson integration */
            num_integrate(f: (x: number) => number, a: number, b: number, tol?: number, maxdepth?: number): number;
            /** Cosine integral */
            Ci(x: number): number;
            /** Sine integral */
            Si(x: number): number;
            /** Exponential integral */
            Ei(x: number): number;
            /** Hyperbolic sine integral */
            Shi(x: number): number;
            /** Hyperbolic cosine integral */
            Chi(x: number): number;
            /** Logarithmic integral */
            Li(x: number | string): number;
            /** Incomplete gamma function */
            gamma_incomplete(n: number, x?: number): number;
            /** Heaviside step function */
            step(x: number): number;
            /** Rectangle function */
            rect(x: number): number;
            /** Sinc function */
            sinc(x: number): number;
            /** Triangle function */
            tri(x: number): number;
            /** Nth root calculation */
            nthroot(x: number | Frac, n: number | string): number | Frac;
        }

        /** Static Build utilities for compiling expressions to JavaScript functions. */
        interface Build {
            /** Dependency definitions for functions */
            dependencies: Record<string, Record<string, Function | string | object> | Record<string, string>>;
            /** Reformat definitions for special functions */
            reformat: Record<
                string,
                (
                    symbol: NerdamerSymbol,
                    deps: [Record<string, string>, string]
                ) => [string, [Record<string, string>, string]]
            >;
            /** Initialize dependencies (called once during setup) */
            initDependencies(): void;
            /** Get the proper name for a function */
            getProperName(f: string): string;
            /** Compile dependencies for a function */
            compileDependencies(f: string, deps?: [Record<string, string>, string]): [Record<string, string>, string];
            /** Get argument dependencies from a symbol */
            getArgsDeps(
                symbol: NerdamerSymbol,
                dependencies?: [Record<string, string>, string]
            ): [Record<string, string>, string];
            /**
             * Build a JavaScript function from a symbolic expression.
             *
             * @param symbol The expression to compile
             * @param argArray Optional array of argument names
             * @returns A compiled JavaScript function
             */
            build(symbol: NerdamerSymbol | string, argArray?: string[]): Function;
        }

        // #endregion

        // #region Parser Interface

        /** The internal parser object, containing the core logic for expression manipulation. */
        interface Parser {
            /**
             * The main parsing function. It tokenizes, converts to RPN, and evaluates an expression string.
             *
             * @param expression The expression string to parse.
             * @param substitutions An object containing variable substitutions.
             * @returns The resulting NerdamerSymbol object.
             */
            parse(
                expression: string | number | NerdamerSymbol | Frac | BigInteger,
                substitutions?: Record<string, ExpressionParam>
            ): NerdamerSymbol;

            /**
             * Adds two symbols or data structures (Vector, Matrix).
             *
             * @param a The first operand.
             * @param b The second operand.
             * @returns The resulting NerdamerSymbol, Vector, or Matrix.
             */
            add(
                a: NerdamerSymbol | Vector | Matrix,
                b: NerdamerSymbol | Vector | Matrix
            ): NerdamerSymbol | Vector | Matrix;

            /**
             * Subtracts two symbols or data structures (Vector, Matrix).
             *
             * @param a The first operand.
             * @param b The second operand.
             * @returns The resulting NerdamerSymbol, Vector, or Matrix.
             */
            subtract(
                a: NerdamerSymbol | Vector | Matrix,
                b: NerdamerSymbol | Vector | Matrix
            ): NerdamerSymbol | Vector | Matrix;

            /**
             * Multiplies two symbols or data structures (Vector, Matrix). Note: In special cases (function assignment),
             * may return Collection.
             *
             * @param a The first operand.
             * @param b The second operand.
             * @returns The resulting NerdamerSymbol, Vector, or Matrix.
             */
            multiply(
                a: NerdamerSymbol | Vector | Matrix,
                b: NerdamerSymbol | Vector | Matrix
            ): NerdamerSymbol | Vector | Matrix;

            /**
             * Divides two symbols or data structures (Vector, Matrix).
             *
             * @param a The dividend.
             * @param b The divisor.
             * @returns The resulting NerdamerSymbol, Vector, or Matrix.
             */
            divide(
                a: NerdamerSymbol | Vector | Matrix,
                b: NerdamerSymbol | Vector | Matrix
            ): NerdamerSymbol | Vector | Matrix;

            /**
             * Raises a symbol or data structure to a power.
             *
             * @param a The base.
             * @param b The exponent.
             * @returns The resulting NerdamerSymbol, Vector, or Matrix.
             */
            pow(
                a: NerdamerSymbol | Vector | Matrix,
                b: NerdamerSymbol | Vector | Matrix
            ): NerdamerSymbol | Vector | Matrix;

            /**
             * Expands a symbolic expression.
             *
             * @param symbol The symbol to expand.
             * @param options Expansion options.
             * @returns The expanded expression.
             */
            expand(symbol: NerdamerSymbol | Vector | Matrix, options?: ExpandOptions): NerdamerSymbol | Vector | Matrix;

            /**
             * Creates a symbolic function representation.
             *
             * @param name The name of the function.
             * @param args An array of NerdamerSymbol, Collection, Vector, or Matrix arguments.
             * @returns A new NerdamerSymbol representing the function.
             */
            symfunction(name: string, args: (NerdamerSymbol | Collection | Vector | Matrix)[]): NerdamerSymbol;
            symfunction(fn_name: string, params: (NerdamerSymbol | Collection | Vector | Matrix)[]): NerdamerSymbol;

            /**
             * Calls a registered function, either symbolic or numeric.
             *
             * @param name The name of the function to call.
             * @param args An array of NerdamerSymbol or Collection arguments.
             * @returns The result of the function call.
             */
            callfunction(name: string, args: (NerdamerSymbol | Collection)[]): NerdamerSymbol;

            /**
             * Tokenizes an expression string into an array of tokens and scopes.
             *
             * @param expression The expression string.
             * @returns An array of tokens and nested arrays representing scopes.
             */
            tokenize(expression: string): (Token | ScopeArray)[];

            /**
             * Converts an array of tokens into Reverse Polish Notation (RPN).
             *
             * @param tokens The array of tokens from `tokenize`.
             * @returns The RPN token array.
             */
            toRPN(tokens: (Token | ScopeArray)[]): Token[];

            /**
             * Parses an RPN token array into a final NerdamerSymbol object.
             *
             * @param rpn The RPN array from `toRPN`.
             * @param substitutions An object of substitutions.
             * @returns The final NerdamerSymbol object.
             */
            parseRPN(rpn: Token[], substitutions?: Record<string, ExpressionParam>): NerdamerSymbol;

            /**
             * Generates an abstract syntax tree from an expression string.
             *
             * @param expression The expression to parse into a tree.
             * @returns The root node of the syntax tree.
             */
            tree(expression: string): { type: string; value: string | number; children?: object[] };

            /** Internal classes used by the parser. */
            classes: {
                Collection: CollectionConstructor;
                Slice: new (
                    upper: NerdamerSymbol | number,
                    lower: NerdamerSymbol | number
                ) => { upper: NerdamerSymbol | number; lower: NerdamerSymbol | number };
                Token: new (node: string | number | NerdamerSymbol, node_type: string, column?: number) => Token;
            };

            /** Object containing trigonometric function handlers. */
            trig: Record<string, (...args: NerdamerSymbol[]) => NerdamerSymbol>;

            /** Object containing hyperbolic trigonometric function handlers. */
            trigh: Record<string, (symbol: NerdamerSymbol) => NerdamerSymbol>;

            /** Object to hold unit definitions. */
            units: Record<string, NerdamerSymbol | { value: NerdamerSymbol; prefix?: string }>;

            /** Unit operations module for handling unit conversions and arithmetic. */
            Unit?: {
                add(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
                subtract(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
                multiply(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
                divide(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
                pow(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            };

            /**
             * A map of all registered functions and their properties [implementation, numArgs, metadata?]. The optional
             * third element contains metadata for user-defined functions (name, params, body). numArgs can be a number
             * or number[] for variable arity functions.
             */
            functions: Record<
                string,
                | [Function, number]
                | [Function, number[]]
                | [Function, number, { name: string; params: string[]; body: string }]
            >;

            /**
             * Gets a registered function by name.
             *
             * @param name The name of the function.
             * @returns The function implementation.
             */
            getFunction(name: string): Function;

            /**
             * Loader for user-defined functions which are not part of Math2. Substitutes parameters into the function
             * body.
             *
             * @param args The arguments to pass to the function.
             * @returns The parsed result.
             */
            mappedFunction(...args: NerdamerSymbol[]): NerdamerSymbol;

            /**
             * Assigns a function definition to a symbol.
             *
             * @param a The function symbol with elements.
             * @param b The function body.
             * @returns The assigned result.
             */
            functionAssign(a: Collection, b: NerdamerSymbol): boolean;

            /**
             * The error handler function.
             *
             * @param msg The error message.
             * @param ErrorObj The constructor for the error type to be thrown.
             */
            error(msg: string, ErrorObj?: ErrorConstructor): void;

            // Additional parser methods for operators and functionality

            /** A regex used to filter operators when processing implied multiplication. */
            operator_filter_regex: RegExp;

            /**
             * Sets or overrides an operator's definition.
             *
             * @param operator The operator definition object.
             * @param action The function to perform for this operator.
             * @param shift How to adjust precedence of other operators.
             */
            setOperator(
                operator:
                    | string
                    | {
                          operator?: string;
                          symbol?: string;
                          precedence?: number;
                          leftAssoc?: boolean;
                          action?: string;
                          prefix?: boolean;
                          postfix?: boolean;
                          operation?: Function;
                      },
                action?: Function,
                shift?: 'over' | 'under'
            ): void;

            /**
             * Gets an operator's definition object.
             *
             * @param operator The operator symbol (e.g., '+', '*').
             */
            getOperator(
                operator: string
            ): { symbol: string; precedence: number; leftAssoc: boolean; operation?: Function } | undefined;

            /**
             * Creates an alias for an existing operator.
             *
             * @param originalOperator The existing operator symbol.
             * @param newOperator The new alias symbol.
             */
            aliasOperator(originalOperator: string, newOperator: string): void;

            /** Returns the entire map of defined operators. */
            getOperators(): Record<
                string,
                { symbol: string; precedence: number; leftAssoc: boolean; operation?: Function }
            >;

            /** Returns the entire map of defined bracket types. */
            getBrackets(): Record<
                string,
                { type: string; id: number; is_open: boolean; is_close: boolean; maps_to?: string }
            >;

            /** Initializes the default constants (PI, E). */
            initConstants(): void;

            /** A collection of "peeker" functions that can be registered to inspect operations. */
            peekers: Record<string, Function[]>;

            /**
             * Calls all registered peekers for a specific operation type.
             *
             * @param name The type of peeker to call (e.g., 'pre_operator').
             */
            callPeekers(name: string, ...args: (NerdamerSymbol | string | number)[]): void;

            /**
             * Converts an expression string to a simplified array of objects for LaTeX conversion.
             *
             * @param expression_string The expression string.
             */
            toObject(expression_string: string): Token[];

            /**
             * Converts an expression object to a LaTeX string.
             *
             * @param expression_or_obj The expression object or string.
             * @param options Formatting options.
             */
            toTeX(expression_or_obj: string | Token[], options?: OutputType): string;

            /**
             * Adds a preprocessing function to be run on expression strings before tokenization.
             *
             * @param name A name for the preprocessor.
             * @param action The function to execute.
             * @param order Optional order of execution.
             * @param shift_cells If true, inserts at `order` instead of replacing.
             */
            addPreprocessor(name: string, action: Function, order?: number, shift_cells?: boolean): void;

            /** Gets the map of all registered preprocessors. */
            getPreprocessors(): Record<string, { order: number; action: Function }>;

            /**
             * Removes a preprocessor by name.
             *
             * @param name The name of the preprocessor to remove.
             * @param shift_cells If true, shifts remaining preprocessors up.
             */
            removePreprocessor(name: string, shift_cells?: boolean): void;

            /** The generic handler for user-defined symbolic functions. */
            mapped_function?(...args: NerdamerSymbol[]): NerdamerSymbol;

            // Operator handlers
            /**
             * Handles comma operations, creating a Collection of arguments.
             *
             * @param a The left operand.
             * @param b The right operand.
             */
            comma(a: NerdamerSymbol | Collection, b: NerdamerSymbol): Collection;
            /**
             * Handles the modulo operator '%'.
             *
             * @param a The dividend.
             * @param b The divisor.
             */
            mod(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            /**
             * Handles slicing operations ':' for vectors.
             *
             * @param a The start index.
             * @param b The end index.
             */
            slice(
                a: NerdamerSymbol | number,
                b: NerdamerSymbol | number
            ): { upper: NerdamerSymbol | number; lower: NerdamerSymbol | number };
            /**
             * Handles the assignment operator '='.
             *
             * @param a The variable NerdamerSymbol.
             * @param b The value NerdamerSymbol.
             */
            equals(a: NerdamerSymbol | Collection, b: NerdamerSymbol | Collection): NerdamerSymbol | Vector;
            /**
             * Handles the percent operator '%'.
             *
             * @param a The operand.
             */
            percent(a: NerdamerSymbol): NerdamerSymbol | Vector | Matrix;
            /**
             * Handles the function/variable assignment operator ':='.
             *
             * @param a The function name and parameter Collection.
             * @param b The function body NerdamerSymbol.
             */
            function_assign?(a: Collection, b: NerdamerSymbol): boolean;
            /** Handles the equality comparison operator '=='. */
            eq(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            /** Handles the greater-than comparison operator '>'. */
            gt(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            /** Handles the greater-than-or-equal-to comparison operator '>='. */
            gte(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            /** Handles the less-than comparison operator '<'. */
            lt(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            /** Handles the less-than-or-equal-to comparison operator '<='. */
            lte(a: NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            /** Handles the factorial operator '!'. */
            factorial(a: NerdamerSymbol): NerdamerSymbol;
            /** Handles the double-factorial operator '!!'. */
            dfactorial(a: NerdamerSymbol): NerdamerSymbol;

            // Internal storage
            /** Storage for constant values (PI, E, etc.) */
            CONSTANTS?: Record<string, NerdamerSymbol | number>;
            /** Evaluates a symbol numerically */
            evaluate?(symbol: NerdamerSymbol, o?: Record<string, ExpressionParam>): NerdamerSymbol;
            /** Function body storage for user-defined functions */
            body?: Record<string, NerdamerSymbol>;
            /** Function parameters storage */
            params?: Record<string, string[]>;

            // Linked convenience functions
            /** Expands an expression */
            expand(symbol: NerdamerSymbol | Vector | Matrix, options?: ExpandOptions): NerdamerSymbol | Vector | Matrix;
            /** Rounds a number to specified decimal places */
            round(symbol: NerdamerSymbol, decimals?: number): NerdamerSymbol;
            /** Cleans/simplifies an expression */
            clean(symbol: NerdamerSymbol): NerdamerSymbol;
            /** Square root function */
            sqrt(symbol: NerdamerSymbol | string | number): NerdamerSymbol;
            /** Cube root function */
            cbrt(symbol: NerdamerSymbol | string | number): NerdamerSymbol | Vector | Matrix;
            /** Absolute value function */
            abs(symbol: NerdamerSymbol): NerdamerSymbol;
            /** Logarithm function */
            log(symbol: NerdamerSymbol, base?: NerdamerSymbol): NerdamerSymbol;
            /** Rationalizes an expression */
            rationalize(symbol: NerdamerSymbol): NerdamerSymbol;
            /** Nth root function */
            nthroot(
                num: NerdamerSymbol | number,
                p: NerdamerSymbol | number,
                prec?: number,
                asbig?: boolean
            ): NerdamerSymbol;
            /** Argument (phase angle) of a complex number */
            arg(symbol: NerdamerSymbol): NerdamerSymbol;
            /** Complex conjugate */
            conjugate(symbol: NerdamerSymbol): NerdamerSymbol;
            /** Imaginary part of a complex number */
            imagpart(symbol: NerdamerSymbol): NerdamerSymbol;
            /** Real part of a complex number */
            realpart(symbol: NerdamerSymbol): NerdamerSymbol;
            /** Assigns a value to a variable */
            assign(a: string | NerdamerSymbol, b: NerdamerSymbol): NerdamerSymbol;
            /** Gets a function by name */
            getFunction(name: string): Function;

            /**
             * Override a parser method with a new implementation. The original method is saved and can be restored.
             *
             * @param which The name of the method to override
             * @param withWhat The new implementation
             */
            override(which: string, withWhat: Function): void;

            /**
             * Restore a previously overridden method to its original implementation.
             *
             * @param what The name of the method to restore
             */
            restore(what: string): void;

            /**
             * Extend an existing parser method without completely replacing it.
             *
             * @param what The name of the method to extend
             * @param withWhat The extension function
             * @param forceCall If true, always call the extension function
             */
            extend(what: string, withWhat: Function, forceCall?: boolean): void;

            /**
             * Debugging method for visualizing vectors and arrays.
             *
             * @param o The object to pretty-print
             * @returns A string representation
             */
            prettyPrint(o: { toString(): string } | unknown[]): string;
        }

        // #endregion

        // #region Settings Interface

        /** Nerdamer's configuration settings. Use `nerdamer.set(settingName, value)` to modify them. */
        interface Settings {
            // #region General Core Settings

            /**
             * If `true`, Nerdamer will attempt to return a pure number whenever possible instead of a symbolic
             * representation. For example, `cos(9)+1` would return a number instead of `cos(9)+1`.
             *
             * @default false
             */
            PARSE2NUMBER: boolean;

            /**
             * If `true`, forces functions like `add`, `subtract` to return a new cloned object, ensuring the original
             * object is not mutated.
             *
             * @default false
             */
            SAFE: boolean;

            /**
             * If `true`, suppresses the throwing of errors for issues like division by zero. This can have unintended
             * side effects.
             *
             * @default false
             */
            suppress_errors: boolean;

            /**
             * If `true`, suppresses the output of warnings to the console.
             *
             * @default false
             */
            SILENCE_WARNINGS: boolean;

            /**
             * The maximum time in milliseconds for long-running calculations like `solveFor`. The calculation will
             * throw a timeout error if it exceeds this duration.
             *
             * @default 800
             */
            TIMEOUT: number;

            /**
             * An array of module names to exclude from being loaded.
             *
             * @default [ ]
             */
            exclude: string[];

            /**
             * An array of objects (like the global `Math` object) that Nerdamer will search through to find function
             * implementations.
             *
             * @default [Math, Math2]
             */
            FUNCTION_MODULES: (typeof Math | Math2 | Record<string, Function>)[];

            /**
             * Internal cache object for memoization of certain calculations, such as roots.
             *
             * @internal
             */
            CACHE: Record<string, unknown>;

            // #endregion

            // #region Parsing & Validation Settings

            /**
             * The symbol to be used for the imaginary unit.
             *
             * @default 'i'
             */
            IMAGINARY: string;

            /**
             * The character(s) to be used for the power operator.
             *
             * @default '^'
             */
            POWER_OPERATOR: '^' | '**' | string;

            /**
             * An array of special single characters that are allowed in variable names.
             *
             * @default ['π']
             */
            ALLOW_CHARS: string[];

            /**
             * If `true`, allows for multi-character variable names (e.g., 'myVar'). If `false`, 'abc' would be parsed
             * as `a*b*c`.
             *
             * @default true
             */
            USE_MULTICHARACTER_VARS: boolean;

            /**
             * An object mapping character aliases to their Nerdamer equivalents.
             *
             * @default { π: 'pi'; '∞': 'Infinity' }
             */
            ALIASES: Record<string, string>;

            /** The regular expression used to validate variable and function names. */
            VALIDATION_REGEX: RegExp;

            /** The regular expression used to detect user-defined function declarations. */
            FUNCTION_REGEX: RegExp;

            /**
             * The regular expression used to insert multiplication symbols where they are implied (e.g., converting
             * '2x' to '2*x').
             */
            IMPLIED_MULTIPLICATION_REGEX: RegExp;

            // #endregion

            // #region Output, Formatting, & Precision

            /**
             * Default precision for `big.js` decimal calculations.
             *
             * @default 21
             */
            PRECISION: number;

            /**
             * The default number of decimal places for `Expression.text('decimals')`.
             *
             * @default 16
             */
            DEFAULT_DECP: number;

            /**
             * The default number of decimal places when converting an Expression to a decimal string.
             *
             * @default 19
             */
            EXPRESSION_DECP: number;

            /**
             * If `true`, multipliers of composite symbols will be forced to be positive, moving the sign inward.
             *
             * @default false
             */
            POSITIVE_MULTIPLIERS: boolean;

            /**
             * When converting to scientific notation, this is the maximum number of decimal places to show.
             *
             * @default 14
             */
            SCIENTIFIC_MAX_DECIMAL_PLACES: number;

            /**
             * When converting to scientific notation, if `true`, exponents of zero will be omitted.
             *
             * @default true
             */
            SCIENTIFIC_IGNORE_ZERO_EXPONENTS: boolean;

            /**
             * The exponent absolute value from which to switch from decimals to scientific in "decimals_or_scientific"
             * mode.
             *
             * @default 7
             */
            SCIENTIFIC_SWITCH_FROM_DECIMALS_MIN_EXPONENT: number;

            // #endregion

            // #region Solver Settings (added by Solve module)

            /**
             * The maximum number of recursive calls allowed during a `solve` operation.
             *
             * @default 10
             */
            MAX_SOLVE_DEPTH?: number;

            /**
             * The search radius (`-r` to `r`) for numerical root finding.
             *
             * @default 1000
             */
            SOLVE_RADIUS?: number;

            /**
             * The maximum number of roots to find on each side of the starting point in numerical solving.
             *
             * @default 10
             */
            ROOTS_PER_SIDE?: number;

            /**
             * If `true`, numerical solutions will attempt to be converted to multiples of pi.
             *
             * @default false
             */
            make_pi_conversions?: boolean;

            /**
             * The step size for the initial root-finding point generation.
             *
             * @default 0.1
             */
            STEP_SIZE?: number;

            /**
             * The maximum number of iterations for Newton's method.
             *
             * @default 200
             */
            MAX_NEWTON_ITERATIONS?: number;

            /**
             * The epsilon (tolerance) used as the stopping condition for Newton's method.
             *
             * @default 2e-15
             */
            NEWTON_EPSILON?: number;

            /**
             * When points are generated as starting points for Newton's method, they are sliced into smaller intervals
             * to improve convergence. This defines the number of slices.
             *
             * @default 200
             */
            NEWTON_SLICES?: number;

            /**
             * The maximum number of iterations for the bisection method.
             *
             * @default 2000
             */
            MAX_BISECTION_ITER?: number;

            /**
             * The epsilon (tolerance) used as the stopping condition for the bisection method.
             *
             * @default 1e-12
             */
            BI_SECTION_EPSILON?: number;

            /**
             * An epsilon value used to determine if a numerical result is "close enough" to zero.
             *
             * @default 1e-9
             */
            ZERO_EPSILON?: number;

            /**
             * The distance within which two numerical solutions are considered to be the same.
             *
             * @default 1e-14
             */
            SOLUTION_PROXIMITY?: number;

            /**
             * If `true`, the solver will filter out duplicate solutions based on `SOLUTION_PROXIMITY`.
             *
             * @default true
             */
            FILTER_SOLUTIONS?: boolean;

            /**
             * The maximum number of times the non-linear system solver will try a new starting point.
             *
             * @default 12
             */
            MAX_NON_LINEAR_TRIES?: number;

            /**
             * For the non-linear solver, the number of iterations after which it checks for convergence and potentially
             * "jumps" to a new point.
             *
             * @default 50
             */
            NON_LINEAR_JUMP_AT?: number;

            /**
             * The size of the "jump" for the non-linear solver when it's not converging.
             *
             * @default 100
             */
            NON_LINEAR_JUMP_SIZE?: number;

            /**
             * The initial starting point for the non-linear equation solver.
             *
             * @default 0.01
             */
            NON_LINEAR_START?: number;

            // #endregion

            // #region Calculus Settings (added by Calculus module)

            /**
             * Maximum recursion depth for symbolic integration.
             *
             * @default 10
             */
            integration_depth?: number;

            /**
             * Maximum recursion depth for calculating limits.
             *
             * @default 10
             */
            max_lim_depth?: number;

            // #endregion

            // #region Extra Module Settings (added by Extra module)

            /**
             * Maximum recursion depth for calculating Laplace transforms via integration.
             *
             * @default 40
             */
            Laplace_integration_depth?: number;

            // #endregion

            // #region Internal Constants, Names & Strings

            /**
             * The max number up to which to pre-cache prime numbers.
             *
             * @default 1000
             */
            init_primes: number;

            /** Internal name for the natural log function. */
            LOG: string;
            /** Internal name for the base-10 log function. */
            LOG10: string;
            /** Internal LaTeX string for `log10`. */
            LOG10_LATEX: string;
            /** Internal name for the base-2 log function. */
            LOG2: string;
            /** Internal LaTeX string for `log2`. */
            LOG2_LATEX: string;
            /** Internal name for the log(1+p) function. */
            LOG1P: string;
            /** Internal LaTeX string for `log1p`. */
            LOG1P_LATEX: string;
            /** Internal name for the square root function. */
            SQRT: string;
            /** Internal name for the absolute value function. */
            ABS: string;
            /** Internal name for the parenthesis wrapper function. */
            PARENTHESIS: string;
            /** Internal name for the factorial function. */
            FACTORIAL: string;
            /** Internal name for the double factorial function. */
            DOUBLEFACTORIAL: string;
            /** Internal name for the vector constructor function. */
            VECTOR: string;

            /**
             * Internal hash key used to store constant parts of an expression.
             *
             * @internal
             */
            CONST_HASH?: '#';

            /** A long string representation of PI for high-precision calculations. */
            LONG_PI: string;
            /** A long string representation of E for high-precision calculations. */
            LONG_E: string;
            /** The JavaScript `Math.PI` value. */
            PI: number;
            /** The JavaScript `Math.E` value. */
            E: number;
            /**
             * A threshold for exponents above which JavaScript's `Math.pow` may be used for performance, as big integer
             * power calculations can be slow.
             *
             * @default 200000
             */
            MAX_EXP: number;

            /**
             * Small epsilon value used for floating-point comparisons.
             *
             * @default undefined
             * @internal
             */
            EPSILON?: number;

            /**
             * Internal storage for the original log and log10 function definitions. Used for swapping log behavior.
             *
             * @internal
             */
            LOG_FNS?: {
                log: (x: NerdamerSymbol) => NerdamerSymbol;
                log10: (x: NerdamerSymbol) => NerdamerSymbol;
            };

            /**
             * If `true`, peeker functions will be called during parsing operations.
             *
             * @default false
             * @internal
             */
            callPeekers: boolean;

            /**
             * If `true`, enables high-precision big number arithmetic for certain calculations.
             *
             * @default false
             * @internal
             */
            USE_BIG?: boolean;

            // #endregion
        }

        // #endregion

        // #region Utils Interface

        /** A collection of utility functions used throughout the Nerdamer library. */
        interface Utils {
            /**
             * Checks if all symbols in an array are of equal value.
             *
             * @param arr An array of Symbols.
             * @returns `true` if all symbols are equal, `false` otherwise.
             */
            allSame(arr: NerdamerSymbol[]): boolean;

            /**
             * Checks if all elements in an array are numeric strings.
             *
             * @param arr The array to check.
             * @returns `true` if all elements are numeric, `false` otherwise.
             */
            allNumeric(arr: (string | number)[]): boolean;

            /**
             * Converts a function's `arguments` object into a standard array.
             *
             * @param obj The `arguments` object.
             */
            arguments2Array(obj: IArguments): unknown[];

            /**
             * Starts the timeout timer for long-running calculations.
             *
             * @internal
             */
            armTimeout(): void;

            /**
             * Fills the gaps between numbers in an array with a specified number of slices.
             *
             * @param arr The array of numbers.
             * @param slices The number of slices to add between each pair of numbers.
             * @returns A new array with interpolated values.
             */
            arrayAddSlices(arr: number[], slices?: number): number[];

            /**
             * Creates a new array by calling the `clone` method on each element of the input array.
             *
             * @param arr The array of clonable objects.
             */
            arrayClone<T extends { clone: () => T }>(arr: T[]): T[];

            /**
             * Finds the maximum numeric value in an array.
             *
             * @param arr An array of numbers.
             */
            arrayMax(arr: number[]): number;

            /**
             * Finds the minimum numeric value in an array.
             *
             * @param arr An array of numbers.
             */
            arrayMin(arr: number[]): number;

            /**
             * Checks if two arrays contain the same elements, regardless of order.
             *
             * @param arr1 The first array.
             * @param arr2 The second array.
             */
            arrayEqual<T>(arr1: T[], arr2: T[]): boolean;

            /**
             * Removes duplicate values from an array.
             *
             * @param arr The array to filter.
             */
            arrayUnique<T>(arr: T[]): T[];

            /**
             * Extracts all unique variable names from an array of Symbols.
             *
             * @param arr An array of Symbols.
             * @returns A sorted array of unique variable names.
             */
            arrayGetVariables(arr: NerdamerSymbol[]): string[];

            /**
             * Calculates the sum of all elements in an array.
             *
             * @param arr An array of numbers or Symbols.
             * @param toNumber If true, returns a JavaScript number instead of a NerdamerSymbol.
             */
            arraySum(arr: (number | NerdamerSymbol)[], toNumber?: boolean): number | NerdamerSymbol;

            /**
             * Temporarily changes a Nerdamer setting, executes a function, and then restores the original setting.
             *
             * @param setting The name of the setting to change.
             * @param f The function to execute within the temporary context.
             * @param opt The temporary value for the setting.
             * @param obj The `this` context for the function.
             */
            block<T>(setting: keyof Settings, f: () => T, opt?: boolean, obj?: object): T;

            /**
             * A function that must be called periodically in long-running loops to check for timeouts.
             *
             * @throws {Error} An error if the timeout has been exceeded.
             */
            checkTimeout(): void;

            /**
             * Releases a temporary variable name used for u-substitution.
             *
             * @param u The variable name to release.
             */
            clearU(u: string): void;

            /**
             * Sorts two arrays in unison based on the values of the first array.
             *
             * @param a The primary array to sort by.
             * @param b The secondary array to sort along with the first.
             * @returns A tuple containing the two sorted arrays.
             */
            comboSort<T, U>(a: T[], b: U[]): [T[], U[]];

            /**
             * Numerically compares two symbols by substituting random numbers for their variables.
             *
             * @param sym1 The first NerdamerSymbol.
             * @param sym2 The second NerdamerSymbol.
             * @param vars An optional array of variables to use for substitution.
             */
            compare(sym1: NerdamerSymbol, sym2: NerdamerSymbol, vars: string[]): boolean;

            /**
             * Converts an array or other value into a Nerdamer Vector or NerdamerSymbol.
             *
             * @param x The item to convert.
             */
            convertToVector(x: ExpressionParam | ExpressionParam[]): Vector | NerdamerSymbol;

            /**
             * Creates a custom Error constructor.
             *
             * @param name The name of the custom error.
             */
            customError(name: string): new (message?: string) => Error;

            /**
             * Checks if an object is a custom Nerdamer data structure (like Matrix or Vector).
             *
             * @param obj The object to check.
             */
            customType(obj: unknown): boolean;

            /**
             * Decomposes a function into its parts with respect to a variable (ax+b).
             *
             * @param fn The function NerdamerSymbol.
             * @param wrt The variable to decompose with respect to.
             * @param as_obj If true, returns an object; otherwise, returns an array.
             */
            decompose_fn(
                fn: NerdamerSymbol,
                wrt: string,
                as_obj?: boolean
            ):
                | (NerdamerSymbol | Vector | Matrix)[]
                | {
                      a: NerdamerSymbol;
                      x: NerdamerSymbol | Vector | Matrix;
                      ax: NerdamerSymbol | Vector | Matrix;
                      b: NerdamerSymbol;
                  };

            /**
             * Disarms the timeout timer.
             *
             * @internal
             */
            disarmTimeout(): void;

            /**
             * Iterates over the properties or elements of an object or array.
             *
             * @param obj The object or array to iterate over.
             * @param fn A callback function `(item, key) => void`.
             */
            each<T>(obj: T[] | Record<string, T>, fn: (item: T, key: string | number) => void): void;

            /**
             * Forces the evaluation of a symbol, parsing it to a number if possible.
             *
             * @param symbol The NerdamerSymbol to evaluate.
             * @param subs An object of substitutions.
             */
            evaluate(symbol: NerdamerSymbol, subs?: Record<string, ExpressionParam>): NerdamerSymbol;

            /**
             * Checks if a number or the numerator of a fraction is even.
             *
             * @param num The number or Frac object.
             */
            even(num: number | Frac): boolean;

            /**
             * Checks if the inverse of a number's fractional part is even.
             *
             * @param num The number to check.
             */
            evenFraction(num: number): boolean;

            /**
             * Fills empty indices in an array with a NerdamerSymbol representing zero.
             *
             * @param arr The array to fill.
             * @param n The desired length of the array.
             */
            fillHoles(arr: NerdamerSymbol[], n?: number): NerdamerSymbol[];

            /**
             * Gets the first property from an object.
             *
             * @param obj The object.
             * @param key If provided, returns the key instead of the value.
             * @param both If true, returns an object with both the key and value.
             */
            firstObject<T>(obj: Record<string, T>, key?: null, both?: false): T;
            firstObject<T>(obj: Record<string, T>, key: string, both?: false): string;
            firstObject<T>(obj: Record<string, T>, key: null | undefined, both: true): { key: string; obj: T };

            /**
             * A simple string formatting function, replacing `{index}` with arguments.
             *
             * @param str The template string.
             * @param args The values to insert into the template.
             */
            format(str: string, ...args: (string | number | boolean)[]): string;

            /**
             * Generates and caches prime numbers up to a given limit.
             *
             * @param upto The upper limit.
             */
            generatePrimes(upto: number): void;

            /**
             * Extracts the coefficients of a polynomial NerdamerSymbol with respect to a variable.
             *
             * @param symbol The polynomial NerdamerSymbol.
             * @param wrt The variable name or NerdamerSymbol.
             * @param _info Optional info parameter.
             * @returns An array of coefficient Symbols.
             */
            getCoeffs(symbol: NerdamerSymbol, wrt: NerdamerSymbol | string, _info?: unknown): unknown[];

            /**
             * Generates a unique temporary variable name (usually 'u') for substitutions.
             *
             * @param symbol The symbol in whose context the variable must be unique.
             */
            getU(symbol: NerdamerSymbol): string;

            /** Imports all registered parser functions into a single object. */
            importFunctions(): {};

            /**
             * Wraps a string in parentheses.
             *
             * @param str The string to wrap.
             */
            inBrackets(str: string): string;

            /**
             * A type guard to check if a value is an Array.
             *
             * @param arr The value to check.
             */
            isArray(arr: unknown): arr is unknown[];

            /**
             * A type guard to check if an object is a NerdamerExpression.
             *
             * @param obj The object to check.
             */
            isExpression(obj: unknown): obj is NerdamerExpression;

            /**
             * Checks if a number or NerdamerSymbol represents a fraction.
             *
             * @param num The number or NerdamerSymbol.
             */
            isFraction(num: number | NerdamerSymbol): boolean;

            /**
             * Checks if a value can be parsed as an integer.
             *
             * @param num The value to check.
             */
            isInt(num: unknown): boolean;

            /**
             * A type guard to check if an object is a Matrix.
             *
             * @param obj The object to check.
             */
            isMatrix(obj: unknown): obj is Matrix;

            /**
             * Checks if a number or NerdamerSymbol is negative.
             *
             * @param obj The number or NerdamerSymbol.
             */
            isNegative(obj: number | NerdamerSymbol): boolean;

            /**
             * Checks if a NerdamerSymbol is purely numeric (group N or P).
             *
             * @param symbol The NerdamerSymbol to check.
             */
            isNumericSymbol(symbol: NerdamerSymbol): boolean;

            /**
             * Checks if a number is prime.
             *
             * @param n The number to check.
             */
            isPrime(n: number): boolean;

            /**
             * Checks if a name is a reserved keyword in Nerdamer.
             *
             * @param value The name to check.
             */
            isReserved(value: string): boolean;

            /**
             * A type guard to check if an object is a NerdamerSymbol.
             *
             * @param obj The object to check.
             */
            isSymbol(obj: unknown): obj is NerdamerSymbol;

            /**
             * Checks if a NerdamerSymbol is a simple variable (e.g., 'x', not '2*x' or 'x^2').
             *
             * @param symbol The NerdamerSymbol to check.
             */
            isVariableSymbol(symbol: NerdamerSymbol): boolean;

            /**
             * A type guard to check if an object is a Vector.
             *
             * @param obj The object to check.
             */
            isVector(obj: unknown): obj is Vector;

            /**
             * A type guard to check if an object is a Collection.
             *
             * @param obj The object to check.
             */
            isCollection(obj: unknown): obj is Collection;

            /**
             * A type guard to check if an object is a NerdamerSet.
             *
             * @param obj The object to check.
             */
            isSet(obj: unknown): obj is NerdamerSet;

            /**
             * A robust wrapper for `Object.keys`.
             *
             * @param obj The object.
             */
            keys(obj: object): string[];

            /**
             * Creates a simple substitution object `{ variable: value }`.
             *
             * @param variable The variable name.
             * @param value The value to substitute.
             */
            knownVariable(variable: string, value: ExpressionParam): Record<string, ExpressionParam>;

            /**
             * Calculates the nth roots of a number, including complex roots.
             *
             * @param symbol The symbol to find the roots of.
             */
            nroots(symbol: NerdamerSymbol): Vector;

            /**
             * Removes an item from an array by index or from an object by key.
             *
             * @param obj The array or object.
             * @param indexOrKey The index or key of the item to remove.
             */
            remove<T>(obj: T[] | Record<string, T>, indexOrKey: number | string): T;

            /**
             * Adds names to Nerdamer's list of reserved words.
             *
             * @param obj A name or object of names to reserve.
             */
            reserveNames(obj: string | object): void;

            /**
             * Generates an array of numbers within a specified range.
             *
             * @param start The starting number.
             * @param end The ending number.
             * @param step The increment value.
             */
            range(start: number, end: number, step?: number): number[];

            /**
             * A wrapper for numerical rounding.
             *
             * @param x The number to round.
             * @param s The number of decimal places.
             */
            round(x: string | number, s?: number): string | number;

            /**
             * Checks if two numbers have the same sign.
             *
             * @param a The first number.
             * @param b The second number.
             */
            sameSign(a: number, b: number): boolean;

            /**
             * Converts a number from scientific notation to a decimal string.
             *
             * @param num The number to convert.
             */
            scientificToDecimal(num: number): string;

            /**
             * Separates a sum into its constituent parts based on variables.
             *
             * @param symbol The sum to separate.
             * @returns An object mapping variable groups to their sub-expressions.
             */
            separate(symbol: NerdamerSymbol): Record<string, NerdamerSymbol>;

            /**
             * Replaces a substring within a larger string.
             *
             * @param str The original string.
             * @param from The starting index.
             * @param to The ending index.
             * @param with_str The replacement string.
             */
            stringReplace(str: string, from: number, to: number, with_str: string): string;

            /**
             * Converts an object to its text representation.
             *
             * @param obj The object to convert (NerdamerSymbol, Vector, Matrix, etc.)
             * @param option Format option ('decimal', 'decimals', 'hash', 'decimals_or_scientific')
             * @param useGroup Group number to use for formatting
             * @param decp Number of decimal places
             * @returns The text representation
             */
            text(obj: NerdamerSymbol | Vector | Matrix, option?: string, useGroup?: number, decp?: number): string;

            /**
             * Extract cluster of all variable names from a NerdamerSymbol.
             *
             * @param obj The NerdamerSymbol to analyze.
             * @returns A sorted array of unique variable names.
             */
            variables(obj: NerdamerSymbol): string[];

            /**
             * Validates a variable or function name according to nerdamer rules.
             *
             * Enforces rule: 'must start with a letter or underscore and can have any number of underscores, letters,
             * and numbers thereafter.'
             *
             * @param name The name of the symbol being checked
             * @param typ The type of symbol that's being validated (default: 'variable')
             * @throws {Error} Throws an InvalidVariableNameError exception on validation failure
             */
            validateName(name: string, typ?: string): void;

            /**
             * Logs a warning to the console and adds it to Nerdamer's internal warning list.
             *
             * @param msg The warning message.
             */
            warn(msg: string): void;
        }

        // #endregion

        // #region Custom Error Types

        /** Error thrown for division by zero. */
        interface DivisionByZero extends Error {}
        /** Error thrown for general parsing failures. */
        interface ParseError extends Error {}
        /** Error thrown when an operation results in an undefined value (e.g., 0^0). */
        interface UndefinedError extends Error {}
        /** Error thrown when a function is called with a value outside its domain. */
        interface OutOfFunctionDomainError extends Error {}
        /** Error thrown when a numerical method exceeds its maximum iterations. */
        interface MaximumIterationsReached extends Error {}
        /** Error thrown when an incorrect data type is provided to a function. */
        interface NerdamerTypeError extends Error {}
        /** Error thrown for mismatched parentheses or brackets. */
        interface ParityError extends Error {}
        /** Error thrown for misplaced or invalid operators. */
        interface OperatorError extends Error {}
        /** Error thrown when a matrix or vector index is out of range. */
        interface OutOfRangeError extends Error {}
        /** Error thrown for matrix operations with incompatible dimensions. */
        interface DimensionError extends Error {}
        /** Error thrown for invalid variable or function names. */
        interface InvalidVariableNameError extends Error {}
        /** Error thrown when a calculation exceeds a function's value limits. */
        interface ValueLimitExceededError extends Error {}
        /**
         * Error thrown for invalid values on the LHS or RHS of an equation.
         *
         * **NOTE**: This error is thrown by `equals()` method when expressions are not equal, contrary to the expected
         * boolean return behavior.
         */
        interface NerdamerValueError extends Error {}
        /** Error thrown when an equation or system cannot be solved. */
        interface SolveError extends Error {}
        /** Error thrown when an infinite loop is algorithmically detected. */
        interface InfiniteLoopError extends Error {}
        /** Error thrown when an unexpected token is found during parsing. */
        interface UnexpectedTokenError extends Error {}

        // #endregion

        // #region Core Interface

        /** The object returned by `nerdamer.getCore()`. */
        interface Core {
            NerdamerSymbol: SymbolConstructor;
            Expression: ExpressionConstructor;
            Vector: VectorConstructor;
            Matrix: MatrixConstructor;
            NerdamerSet: SetConstructor;
            Frac: FracConstructor;
            Collection: CollectionConstructor;
            PARSER: Parser;
            groups: Record<'N' | 'P' | 'S' | 'EX' | 'FN' | 'PL' | 'CB' | 'CP', number>;
            Settings: Settings;
            Build: Build;
            Utils: Utils;
            Math2: Math2;
            LaTeX: LaTeX;
            bigInt: typeof BigInteger;
            bigDec: typeof Decimal;
            exceptions: {
                DivisionByZero: new (message?: string) => DivisionByZero;
                ParseError: new (message?: string) => ParseError;
                UndefinedError: new (message?: string) => UndefinedError;
                OutOfFunctionDomainError: new (message?: string) => OutOfFunctionDomainError;
                MaximumIterationsReached: new (message?: string) => MaximumIterationsReached;
                NerdamerTypeError: new (message?: string) => NerdamerTypeError;
                ParityError: new (message?: string) => ParityError;
                OperatorError: new (message?: string) => OperatorError;
                OutOfRangeError: new (message?: string) => OutOfRangeError;
                DimensionError: new (message?: string) => DimensionError;
                InvalidVariableNameError: new (message?: string) => InvalidVariableNameError;
                ValueLimitExceededError: new (message?: string) => ValueLimitExceededError;
                NerdamerValueError: new (message?: string) => NerdamerValueError;
                SolveError: new (message?: string) => SolveError;
                InfiniteLoopError: new (message?: string) => InfiniteLoopError;
                UnexpectedTokenError: new (message?: string) => UnexpectedTokenError;
            };
            Solve: Record<string, Function>;
            Calculus: Record<string, Function>;
            Algebra: Record<string, Function>;
            Extra: Record<string, Function>;
        }

        // #endregion

        // #region Discriminated Union Types

        /**
         * Union type representing any value that can be returned by the parser. Use type guards (isSymbol, isVector,
         * isMatrix) to narrow the type.
         *
         * Discriminator Pattern:
         *
         * - NerdamerSymbol has group: number and custom?: never
         * - Vector has custom: true and elements: NerdamerSymbol[]
         * - Matrix has custom: true and elements: NerdamerSymbol[][]
         *
         * @example
         *     function processResult(result: ParseResult) {
         *         const { Utils } = nerdamer.getCore();
         *         if (Utils.isVector(result)) {
         *             // result is narrowed to Vector
         *             console.log(result.elements.length);
         *         } else if (Utils.isMatrix(result)) {
         *             // result is narrowed to Matrix
         *             console.log(result.rows());
         *         } else {
         *             // result is narrowed to NerdamerSymbol
         *             console.log(result.group, result.value);
         *         }
         *     }
         */
        type InternalParseResult = NerdamerSymbol | Vector | Matrix;

        /**
         * Union type for internal symbol operations that might return Vector/Matrix. Similar to ParseResult but used in
         * internal parser operations.
         */
        type SymbolOrCustom = NerdamerSymbol | Vector | Matrix;

        // #endregion
    } // End NerdamerCore namespace

    // #endregion
} // End nerdamer namespace

// #endregion
