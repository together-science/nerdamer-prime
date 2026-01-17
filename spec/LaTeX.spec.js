/* global expect */

const nerdamer = require('../nerdamer.core.js');

/**
 * Helper to run a test with warnings silenced. Use this for tests where warnings are expected and don't indicate bugs.
 *
 * @param {Function} testFn - The test function to run
 */
function withSilencedWarnings(testFn) {
    const previous = nerdamer.getCore().Settings.SILENCE_WARNINGS;
    nerdamer.set('SILENCE_WARNINGS', true);
    try {
        testFn();
    } finally {
        nerdamer.set('SILENCE_WARNINGS', previous);
    }
}

describe('TeX features', () => {
    it('should render TeX output correctly', () => {
        const testCases = [
            {
                given: '2',
                TeX: '2',
                decimalTeX: '2',
            },
            {
                given: '1/2',
                TeX: '\\frac{1}{2}',
                decimalTeX: '0.5',
            },
            {
                given: '2*x',
                TeX: '2 \\cdot x',
                decimalTeX: '2 \\cdot x',
            },
            {
                given: '2/5*x',
                TeX: '\\frac{2 \\cdot x}{5}',
                decimalTeX: '0.4 \\cdot x',
            },
            {
                given: '2/5*x^2',
                TeX: '\\frac{2 \\cdot x^{2}}{5}',
                decimalTeX: '0.4 \\cdot x^{2}',
            },
            {
                given: '1/2*x',
                TeX: '\\frac{x}{2}',
                decimalTeX: '0.5 \\cdot x',
            },
            {
                given: '1/2*x^2',
                TeX: '\\frac{x^{2}}{2}',
                decimalTeX: '0.5 \\cdot x^{2}',
            },
            {
                given: '1/2*2^(2/3)',
                TeX: '\\frac{1}{2^{\\frac{1}{3}}}',
                decimalTeX: '0.7937005259840998',
            },
            {
                given: '2^(2/3)',
                TeX: '2^{\\frac{2}{3}}',
                decimalTeX: '1.5874010519681994',
            },
            {
                given: '5/8*2^(2/3)*4',
                TeX: '\\frac{5}{2^{\\frac{1}{3}}}',
                decimalTeX: '3.968502629920499',
            },
            {
                given: '3*x^(2/3)/4',
                TeX: '\\frac{3 \\cdot x^{\\frac{2}{3}}}{4}',
                decimalTeX: '0.75 \\cdot x^{0.666666666666666666667}',
            },
            {
                given: '4*cos(x)',
                TeX: '4 \\cdot \\mathrm{cos}\\left(x\\right)',
                decimalTeX: '4 \\cdot \\mathrm{cos}\\left(x\\right)',
            },
            {
                given: '(1/4)*cos(x)',
                TeX: '\\frac{\\mathrm{cos}\\left(x\\right)}{4}',
                decimalTeX: '0.25 \\cdot \\mathrm{cos}\\left(x\\right)',
            },
            {
                given: '(5/4)*cos(x)',
                TeX: '\\frac{5 \\cdot \\mathrm{cos}\\left(x\\right)}{4}',
                decimalTeX: '1.25 \\cdot \\mathrm{cos}\\left(x\\right)',
            },
            {
                given: '7/8*sqrt(x)',
                TeX: '\\frac{7 \\cdot \\sqrt{x}}{8}',
                decimalTeX: '0.875 \\cdot \\sqrt{x}',
            },
            {
                given: '1/8*sqrt(x+8)',
                TeX: '\\frac{\\sqrt{x+8}}{8}',
                decimalTeX: '0.125 \\cdot \\sqrt{x+8}',
            },
            {
                given: 'x/(x+y)',
                TeX: '\\frac{x}{x+y}',
                decimalTeX: '\\frac{x}{x+y}',
            },
            {
                given: 'x/(x+y)^3',
                TeX: '\\frac{x}{\\left(x+y\\right)^{3}}',
                decimalTeX: '\\frac{x}{\\left(x+y\\right)^{3}}',
            },
            {
                given: '(x+y)^3/x',
                TeX: '\\frac{\\left(x+y\\right)^{3}}{x}',
                decimalTeX: '\\frac{\\left(x+y\\right)^{3}}{x}',
            },
            {
                given: '((x+1)*(x+2))/(x+5)',
                TeX: '\\frac{\\left(x+1\\right) \\cdot \\left(x+2\\right)}{x+5}',
                decimalTeX: '\\frac{\\left(x+1\\right) \\cdot \\left(x+2\\right)}{x+5}',
            },
            {
                given: '((x+1)*(x+2)*u)/((x+5)*z)',
                TeX: '\\frac{\\left(x+1\\right) \\cdot \\left(x+2\\right) \\cdot u}{\\left(x+5\\right) \\cdot z}',
                decimalTeX: '\\frac{\\left(x+1\\right) \\cdot \\left(x+2\\right) \\cdot u}{\\left(x+5\\right) \\cdot z}',
            },
            {
                given: '2/(x+y)^3',
                TeX: '\\frac{2}{\\left(x+y\\right)^{3}}',
                decimalTeX: '\\frac{2}{\\left(x+y\\right)^{3}}',
            },
            {
                given: '2*(x+1)/(x+y)^3',
                TeX: '\\frac{2\\left(x+1\\right)}{\\left(x+y\\right)^{3}}',
                decimalTeX: '\\frac{2\\left(x+1\\right)}{\\left(x+y\\right)^{3}}',
            },
            {
                given: '2*(x+1)^2/(x+y)^3',
                TeX: '\\frac{2 \\cdot \\left(x+1\\right)^{2}}{\\left(x+y\\right)^{3}}',
                decimalTeX: '\\frac{2 \\cdot \\left(x+1\\right)^{2}}{\\left(x+y\\right)^{3}}',
            },
            {
                given: '(x)^x/(x+1)',
                TeX: '\\frac{x^{x}}{x+1}',
                decimalTeX: '\\frac{x^{x}}{x+1}',
            },
            {
                given: '(3/4)*(x+y)^x/(x+5)^2',
                TeX: '\\frac{3 \\cdot \\left(x+y\\right)^{x}}{4 \\cdot \\left(x+5\\right)^{2}}',
                decimalTeX: '\\frac{0.75 \\cdot \\left(x+y\\right)^{x}}{\\left(x+5\\right)^{2}}',
            },
            {
                given: '(3/4)*abs(x+y)^x/(x+5)^2',
                TeX: '\\frac{3 \\cdot \\left|x+y\\right|^{x}}{4 \\cdot \\left(x+5\\right)^{2}}',
                decimalTeX: '\\frac{0.75 \\cdot \\left|x+y\\right|^{x}}{\\left(x+5\\right)^{2}}',
            },
            {
                given: 'x^(1/4)+3/4*x^2+cos(1/4)',
                TeX: '\\frac{3 \\cdot x^{2}}{4}+x^{\\frac{1}{4}}+\\mathrm{cos}\\left(\\frac{1}{4}\\right)',
                decimalTeX: '0.75 \\cdot x^{2}+x^{0.25}+\\mathrm{cos}\\left(0.25\\right)',
            },
            {
                given: '-(x^wtf+1)^6-(t+1)/(x+3)^2',
                TeX: '-\\left(x^{wtf}+1\\right)^{6}-\\frac{t+1}{\\left(x+3\\right)^{2}}',
                decimalTeX: '-\\left(x^{wtf}+1\\right)^{6}-\\frac{t+1}{\\left(x+3\\right)^{2}}',
            },
            {
                given: '2*(-log(x)*sin(x)+cos(x)*x^(-1))',
                TeX: '2\\left(-\\mathrm{log}\\left(x\\right) \\cdot \\mathrm{sin}\\left(x\\right)+\\frac{\\mathrm{cos}\\left(x\\right)}{x}\\right)',
                decimalTeX: '2\\left(-\\mathrm{log}\\left(x\\right) \\cdot \\mathrm{sin}\\left(x\\right)+\\frac{\\mathrm{cos}\\left(x\\right)}{x}\\right)',
            },
            {
                given: '(x*(x+1))/(x^2+2*x+1)',
                TeX: '\\frac{x \\cdot \\left(x+1\\right)}{x^{2}+2 \\cdot x+1}',
                decimalTeX: '\\frac{x \\cdot \\left(x+1\\right)}{x^{2}+2 \\cdot x+1}',
            },
            {
                given: 'x^2+2*x+y^2+y+6',
                TeX: 'x^{2}+2 \\cdot x+y^{2}+y+6',
                decimalTeX: 'x^{2}+2 \\cdot x+y^{2}+y+6',
            },
            {
                given: '(-1*(x-1))',
                TeX: '-x+1',
                decimalTeX: '-x+1',
            },
            {
                given: 'x!',
                TeX: 'x!',
                decimalTeX: 'x!',
            },
            {
                given: '(x+1)!',
                TeX: '\\left(x+1\\right)!',
                decimalTeX: '\\left(x+1\\right)!',
            },
            {
                given: 'x!+(x+1)!',
                TeX: '\\left(x+1\\right)!+x!',
                decimalTeX: '\\left(x+1\\right)!+x!',
            },
            {
                given: '(x/(x+y))^n',
                TeX: '\\frac{x^{n}}{x+y}',
                decimalTeX: '\\frac{x^{n}}{x+y}',
            },
            {
                given: '1/(a*b)',
                TeX: '\\frac{1}{a \\cdot b}',
                decimalTeX: '\\frac{1}{a \\cdot b}',
            },
            {
                given: 'sum(a,b,c,Infinity)',
                TeX: '\\sum\\limits_{{b}={c}}^{\\infty} {a}',
                decimalTeX: '\\sum\\limits_{{b}={c}}^{\\infty} {a}',
            },
            {
                given: 'product(a,b,c,Infinity)',
                TeX: '\\prod\\limits_{{b}={c}}^{\\infty} {a}',
                decimalTeX: '\\prod\\limits_{{b}={c}}^{\\infty} {a}',
            },
            {
                given: 'mod(a,b)',
                TeX: 'a \\bmod b',
                decimalTeX: 'a \\bmod b',
            },
            {
                given: 'nthroot(a,b)',
                TeX: '\\sqrt[b]{a}',
                decimalTeX: '\\sqrt[b]{a}',
            },
            {
                given: 'x_aa_bb+y_cc_dd',
                TeX: 'x_{aa_{bb}}+y_{cc_{dd}}',
                decimalTeX: 'x_{aa_{bb}}+y_{cc_{dd}}',
            },
        ];

        for (let i = 0; i < testCases.length; ++i) {
            // When
            const teX = nerdamer(testCases[i].given).toTeX();
            const decimalTex = nerdamer(testCases[i].given).toTeX('decimal');

            // Then
            expect(teX).toEqual(testCases[i].TeX, `for formula ${testCases[i].given}`);
            expect(decimalTex).toEqual(testCases[i].decimalTeX, `for formula ${testCases[i].given}`);
        }
    });

    /** #36: Weird results with sqrt */
    it('should render square roots properly', () => {
        // Given
        const formula = '2*sqrt(x)';

        // When
        const teX = nerdamer(formula).toTeX();

        // Then
        expect(teX).toEqual('2 \\cdot \\sqrt{x}');
    });

    /** #39: Terms multiplied in brackets not rendered correctly */
    it('should render parentheses', () => {
        // Given
        const formula = '(x+1)*(x+2)';

        // When
        const teX = nerdamer(formula).toTeX();

        // Then
        expect(teX).toEqual('\\left(x+1\\right) \\cdot \\left(x+2\\right)');
    });

    /** #41: Latex output should use descending order */
    it('should use descending order of polynomials', () => {
        // Given
        const formula = 'x^2+x+1';

        // When
        const teX = nerdamer(formula).toTeX();

        // Then
        expect(teX).toEqual('x^{2}+x+1');
    });

    it('should support Greek letters', () => {
        // Given
        const testCases = [
            {
                given: 'alpha + beta',
                expected: '\\alpha+\\beta',
            },
            {
                given: '5 * 3 / psi',
                expected: '\\frac{15}{\\psi}',
            },
            {
                given: 'Xi ^ tau - 8*nu',
                expected: '\\Xi^{\\tau}-8 \\cdot \\nu',
            },
        ];

        for (let i = 0; i < testCases.length; ++i) {
            // When
            const teX = nerdamer(testCases[i].given).toTeX();

            // Then
            expect(teX).toEqual(testCases[i].expected);
        }
    });

    it('should explicitly convert to LaTeX', () => {
        expect(nerdamer.convertToLaTeX('realpart(a)')).toEqual('\\operatorname{Re}\\left(a\\right)');
        expect(nerdamer.convertToLaTeX('imagpart(a)')).toEqual('\\operatorname{Im}\\left(a\\right)');
        expect(nerdamer.convertToLaTeX('diff(cos(x),x)')).toEqual('\\frac{d}{d x}\\left({\\mathrm{cos}\\left(x\\right)}\\right)');
        expect(nerdamer.convertToLaTeX('integrate(cos(x),x)')).toEqual('\\int {\\mathrm{cos}\\left(x\\right)}\\, dx');
        expect(nerdamer.convertToLaTeX('2*(sqrt(3)+sqrt(2))')).toEqual('2 \\cdot \\left(\\sqrt{3} + \\sqrt{2}\\right)');
        expect(nerdamer.convertToLaTeX('(a+1)(x+a)^(-5)+1')).toEqual('\\frac{a + 1}{{\\left(x + a\\right)}^{5}} + 1');
        expect(nerdamer.convertToLaTeX('a*x^-3+1/a')).toEqual('\\frac{a}{{x}^{3}} + \\frac{1}{a}');
        expect(nerdamer.convertToLaTeX('a*x^+3+1/a')).toEqual('a \\cdot {x}^{3} + \\frac{1}{a}');
        expect(nerdamer.convertToLaTeX('x^2/y-x')).toEqual('\\frac{{x}^{2}}{y} - x');
        expect(nerdamer.convertToLaTeX('log2(x)')).toEqual('\\log_{2}\\left( x\\right)');
        expect(nerdamer.convertToLaTeX('log1p(x)')).toEqual('\\ln\\left( 1 + x \\right)');
    });

    it('should display integrals', () => {
        // Given
        const testCases = [
            {
                given: 'defint(log(2cos(x/2)),-π,π,x)',
                expected: '\\int\\limits_{-\\pi}^{\\pi} \\mathrm{log}\\left(2 \\cdot \\mathrm{cos}\\left(\\frac{x}{2}\\right)\\right) dx',
            },
            {
                given: 'integrate(sin(x^x),x)',
                expected: '\\int{\\mathrm{sin}\\left(x^{x}\\right)}{dx}',
            },
        ];

        /*
         * The defint expression triggers numerical integration which generates warnings
         * due to singularities at the bounds (log(cos(x/2)) → -∞ as x → ±π).
         * The warnings are expected - we're only testing the TeX rendering here.
         */
        withSilencedWarnings(() => {
            for (let i = 0; i < testCases.length; ++i) {
                // When
                const teX = nerdamer(testCases[i].given).toTeX();

                // Then
                expect(teX).toEqual(testCases[i].expected);
            }
        });
    });
});
