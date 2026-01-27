/* global expect */

const nerdamer = require('../nerdamer.core.js');
const { round } = nerdamer.getCore().Utils;

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

describe('Calculus', () => {
    it('should differentiate correctly', () => {
        expect(nerdamer('diff(cos(x),x)').toString()).toEqual('-sin(x)');
        expect(nerdamer('diff(log(x),x)').toString()).toEqual('x^(-1)');
        expect(nerdamer('diff(tan(x),x)').toString()).toEqual('sec(x)^2');
        expect(nerdamer('diff(4*tan(x)*sec(x),x)').toString()).toEqual('4*(sec(x)*tan(x)^2+sec(x)^3)');
        expect(nerdamer('diff(sqrt(7),x)').toString()).toEqual('0');
        expect(nerdamer('diff(4,x)').toString()).toEqual('0');
        expect(nerdamer('diff(x^2,x)').toString()).toEqual('2*x');
        expect(nerdamer('diff(2*x^2+4,x)').toString()).toEqual('4*x');
        expect(nerdamer('diff(sqrt(x)*x,x)').toString()).toEqual('(3/2)*x^(1/2)');
        expect(nerdamer('diff(sqrt(x)-1/sqrt(x),x)').toString()).toEqual('(1/2)*x^(-1/2)+(1/2)*x^(-3/2)');
        expect(nerdamer('diff(x^2/3-3/x^2,x)').toString()).toEqual('(2/3)*x+6*x^(-3)');
        expect(nerdamer('diff(sqrt(x)*(x^2+1),x)').toString()).toEqual('(1/2)*(1+x^2)*x^(-1/2)+2*x^(3/2)');
        expect(nerdamer('diff(e^x/(e^x-1),x)').toString()).toEqual('(-1+e^x)^(-1)*e^x-(-1+e^x)^(-2)*e^(2*x)');
        expect(nerdamer('diff(e^x,x)').toString()).toEqual('e^x');
        expect(nerdamer('diff(e^x/x,x)').toString()).toEqual('-e^x*x^(-2)+e^x*x^(-1)');
        expect(nerdamer('diff(tan(x)*log(1/cos(x)),x)').toString()).toEqual('-(-cos(x)^(-1)*sin(x)*tan(x)+log(cos(x))*sec(x)^2)');
        expect(nerdamer('diff((2*x)^(e),x)').toString()).toEqual('2^e*e*x^(-1+e)');
        expect(nerdamer('diff(2*cos(x)*log(x),x)').toString()).toEqual('2*(-log(x)*sin(x)+cos(x)*x^(-1))');
        expect(nerdamer('diff(cos(5*x)*log(sec(sqrt(cos(x^(4/5))^2))/y^2)*y,x)').toString()).toEqual(
            '(-4/5)*abs(cos(x^(4/5)))^(-1)*cos(x^(4/5))*sec(abs(cos(x^(4/5))))*sin(x^(4/5))*tan(abs(cos(x^(4/5))))*x^(-1/5)*y^(-2)*cos(5*x)*sec(abs(cos(x^(4/5))))^(-1)*y^3-5*log(sec(abs(cos(x^(4/5))))*y^(-2))*sin(5*x)*y'
        );
        expect(nerdamer('diff(x*cos(x)^log(x),x)').toString()).toEqual('(-cos(x)^(-1)*log(x)*sin(x)+log(cos(x))*x^(-1))*cos(x)^log(x)*x+cos(x)^log(x)');
        expect(nerdamer('diff(cos(2*x),x)').toString()).toEqual('-2*sin(2*x)');
        expect(nerdamer('diff(cos(x)*tan(x),x)').toString()).toEqual('-sin(x)*tan(x)+cos(x)*sec(x)^2');
        expect(nerdamer('diff(sec(sqrt(cos(x^(4/5))^2)),x)').toString()).toEqual('(-4/5)*abs(cos(x^(4/5)))^(-1)*cos(x^(4/5))*sec(abs(cos(x^(4/5))))*sin(x^(4/5))*tan(abs(cos(x^(4/5))))*x^(-1/5)');
        expect(nerdamer('diff(log(log(log(cos(t*t)^z))),t)').toString()).toEqual('-2*cos(t^2)^(-1)*sin(t^2)*t*z*log(cos(t^2))^(-1)*log(log(cos(t^2))*z)^(-1)*z^(-1)');
        expect(nerdamer('diff(6*log(x)^(3*log(x^2)),x)').toString()).toEqual('36*(log(log(x))*x^(-1)+x^(-1))*log(x)^(6*log(x))');
        expect(nerdamer('diff(sinh(x^2)^cos(x),x)').toString()).toEqual('(-log(sinh(x^2))*sin(x)+2*cos(x)*cosh(x^2)*sinh(x^2)^(-1)*x)*sinh(x^2)^cos(x)');
        expect(nerdamer('diff(tan(x)*tanh(x),x)').toString()).toEqual('sec(x)^2*tanh(x)+sech(x)^2*tan(x)');
        expect(nerdamer('diff(4*x*tan(x)*7*tanh(x),x)').toString()).toEqual('28*(sec(x)^2*tanh(x)*x+sech(x)^2*tan(x)*x+tan(x)*tanh(x))');
        expect(nerdamer('diff(y*tan(y)*7*tanh(y),x)').toString()).toEqual('0');
        expect(nerdamer('diff(yx*tan(y)*7*tanh(y),x)').toString()).toEqual('0');
        expect(nerdamer('diff(y,x)').toString()).toEqual('0');
        expect(nerdamer('diff(x*y,x)').toString()).toEqual('y');
        expect(nerdamer('diff([sin(x), x^2, x],x)').toString()).toEqual('[cos(x),2*x,1]');
        expect(nerdamer('diff(sinc(a*x^3+b),x)').toString()).toEqual('3*((a*x^3+b)*cos(a*x^3+b)-sin(a*x^3+b))*(a*x^3+b)^(-2)*a*x^2');
        expect(nerdamer('diff(sqrt(e^x + a),x)').toString()).toEqual('(1/2)*(a+e^x)^(-1/2)*e^x');

        // Issue #
        expect(nerdamer('diff(3asin(x),x)').toString()).toEqual('3*sqrt(-x^2+1)^(-1)');
        expect(nerdamer('diff(5acos(x),x)').toString()).toEqual('-5*sqrt(-x^2+1)^(-1)');
        expect(nerdamer('diff(7atan(x),x)').toString()).toEqual('7*(1+x^2)^(-1)');

        // Equations
        expect(nerdamer('diff(3asin(x)=x,x)').toString()).toEqual('3*sqrt(-x^2+1)^(-1)=1');
    });

    /*
    Todo: cover all function differentiation, with scalars:
        case LOG:
        case COS:
        case SIN:
        case TAN:
        case SEC:
        case CSC:
        case COT:
        case ASIN:
        case ACOS:
        case ATAN:
        case ABS:
        case 'cosh':
        case 'sinh':
        case TANH:
        case SECH:
        case CSCH:
        case COTH:
        case 'asinh':
        case 'acosh':
        case 'atanh':
        case ASECH:
        case ACOTH:
        case ACSCH:
        case ASEC:
        case ACSC:
        case ACOT:
        case 'S':
        case 'C':
        case 'Si':
        case 'Shi':
        case 'Ci':
        case 'Chi':
        case 'Ei':
        case 'Li':
        case 'erf':
        case 'atan2':
        case 'sign':
        case 'sinc':
        case Settings.LOG10:
    */

    it('should calculate sums correctly', () => {
        expect(nerdamer('sum(x+y, x, 0, 3)').evaluate().toString()).toEqual('4*y+6');
        expect(nerdamer('sum(x^2+x, x, 0, 10)').evaluate().toString()).toEqual('440');
        expect(nerdamer('sum(x^2*z^2+x*y-z+1, x, 0, 10)').evaluate().toString()).toEqual('-11*z+385*z^2+11+55*y');
        expect(nerdamer('sum(x^2*z^2+x*y-z+1, z, 0, 10)').evaluate().toString()).toEqual('-44+11*x*y+385*x^2');
        expect(nerdamer('sum(sqrt(x)*sin(x), x, 0, 10)').evaluate().toString()).toEqual('775334583/372372283');
        // Use numerical comparison with tolerance due to platform-dependent rational approximations
        expect(round(nerdamer('sum(e^(-x^2*π/9),x,1,100)').evaluate(), 10)).toEqual(round(1.0, 10));
    });

    it('should calculate the definite integral correctly', () => {
        expect(round(nerdamer('defint(cos(x),1,2,x)').evaluate(), 14)).toEqual(round(0.067826442018, 14));
        expect(round(nerdamer('defint(cos(x)^3*x^2-1,-1,9)').evaluate(), 14)).toEqual(round(8.543016466395, 14));
        expect(round(nerdamer('defint(cos(x^x),1,2,x)').evaluate(), 14)).toEqual(round(-0.27113666621, 14));
        expect(round(nerdamer('defint(cos(x^log(sin(x))),2,3,x)').evaluate(), 14)).toEqual(round(0.805604089074, 14));

        /*
         * The following integrals have singularities at the integration bounds:
         * - log(cos(x/2)) approaches -∞ as x → ±π (since cos(±π/2) = 0)
         * - This causes the adaptive Simpson integration to hit max recursion depth ~19,500 times
         * - The warnings are expected and don't indicate bugs - results are still accurate
         */
        withSilencedWarnings(() => {
            expect(round(nerdamer('defint(log(2*cos(x/2)),-π,π,x)').evaluate(), 14)).toEqual(round(0, 14));
            expect(round(nerdamer('defint(log(cos(x/2)),-π,π,x)').evaluate(), 14)).toEqual(round(-4.355172180607, 14));
        });

        expect(round(nerdamer('defint(log(x+1), -1, 1, x)').evaluate(), 14)).toEqual(round(-0.6137056388801095, 14));
        expect(round(nerdamer('defint(log(x), 0, 1, x)').evaluate(), 14)).toEqual(round(-1, 14));
        expect(round(nerdamer('defint((x^2-3)/(-x^3+9x+1), 1, 3, x)').evaluate(), 14)).toEqual(round(0.7324081924454066, 14));

        /*
         * These integrals involve sqrt expressions that can't be symbolically integrated.
         * The symbolic integrator emits "Unable to compute integral!" before falling back
         * to numerical integration, which succeeds. The warning is expected behavior.
         */
        withSilencedWarnings(() => {
            expect(round(nerdamer('defint(x*(x-5)^(1/2),5,8)').evaluate(), 14)).toEqual(round(23.555890982937, 14));
            expect(round(nerdamer('defint(sqrt(4(x^2)+4), 0, 3)').evaluate(), 14)).toEqual(round(11.305279439736, 14));
        });
    });

    it('should calculate limits correctly', () => {
        expect(nerdamer('limit((2-2*x^2)/(x-1), x, 1)').toString()).toEqual('-4');
        expect(nerdamer('limit(1/2*(x^2 - 1)/(x^2 + 1), x, 3)').toString()).toEqual('2/5');
        expect(nerdamer('limit(tan(3*x)/tan(x), x, pi/2)').toString()).toEqual('1/3');
        expect(nerdamer('limit(x/(3*abs(4*x)),x, 0)').toString()).toEqual('[-1/12,1/12]');
        expect(nerdamer('limit((4x^2-x)/(3x^2+x),x,∞)').toString()).toEqual('4/3');
        expect(nerdamer('limit((x^(1/2)+x^(-1/2))/(x^(1/2)-x^(-1/2)),x,Infinity)').toString()).toEqual('1');
        expect(nerdamer('limit((2*x+log(x))/(x*log(x)),x,Infinity)').toString()).toEqual('0');
        expect(nerdamer('limit(e^(-x)+2,x,Infinity)').toString()).toEqual('2');
        expect(nerdamer('limit((x+1)^(1+1/x)-x^(1+x),x, Infinity)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit(x/(x+1)^2, x, -1)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit(log(x),x, 0)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit((3*sin(x)-sin(2*x))/(x-sin(x)),x,0)').toString()).toEqual('Infinity');
        // Issue #12
        expect(nerdamer('limit((2sin(x)-sin(2x))/(x-sin(x)),x,0)').toString()).toEqual('6');
    });

    it('should calculate limit signs correctly', () => {
        // Simple cases: n/x where numerator is constant
        expect(nerdamer('limit(1/x, x, 0)').toString()).toEqual('Infinity');
        expect(nerdamer('limit(-1/x, x, 0)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit(5/x, x, 0)').toString()).toEqual('Infinity');
        expect(nerdamer('limit(-5/x, x, 0)').toString()).toEqual('-Infinity');

        // Even powers: sign only depends on numerator
        expect(nerdamer('limit(1/x^2, x, 0)').toString()).toEqual('Infinity');
        expect(nerdamer('limit(-1/x^2, x, 0)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit(3/x^2, x, 0)').toString()).toEqual('Infinity');
        expect(nerdamer('limit(-3/x^2, x, 0)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit(1/x^4, x, 0)').toString()).toEqual('Infinity');
        expect(nerdamer('limit(-1/x^4, x, 0)').toString()).toEqual('-Infinity');

        // Odd powers > 1
        expect(nerdamer('limit(1/x^3, x, 0)').toString()).toEqual('Infinity');
        expect(nerdamer('limit(-1/x^3, x, 0)').toString()).toEqual('-Infinity');

        // Expression numerators that evaluate to negative
        expect(nerdamer('limit((-3+2*cos(x))/x, x, 0)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit((cos(x)-2)/x, x, 0)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit((1-cos(x))/x^2, x, 0)').toString()).toEqual('1/2'); // L'Hopital case

        // Expression numerators that evaluate to positive
        expect(nerdamer('limit((3+2*cos(x))/x, x, 0)').toString()).toEqual('Infinity');
        expect(nerdamer('limit((2+cos(x))/x, x, 0)').toString()).toEqual('Infinity');

        // Product forms that should have correct sign
        expect(nerdamer('limit((-3+2*cos(x))*x^(-1), x, 0)').toString()).toEqual('-Infinity');
        expect(nerdamer('limit((3+2*cos(x))*x^(-1), x, 0)').toString()).toEqual('Infinity');

        // More complex expressions
        expect(nerdamer('limit((-1+cos(x))/x^2, x, 0)').toString()).toEqual('-1/2');
        expect(nerdamer('limit((sin(x)-x)/x^3, x, 0)').toString()).toEqual('-1/6');
    });

    it('should integrate properly', () => {
        expect(nerdamer('integrate(sin(x), x)').toString()).toEqual('-cos(x)');
        expect(nerdamer('integrate((22/7)^x,x)').toString()).toEqual('(log(1/7)+log(22))^(-1)*22^x*7^(-x)');
        expect(nerdamer('integrate(cos(x), x)').toString()).toEqual('sin(x)');
        expect(nerdamer('integrate(2*x^2+x, x)').toString()).toEqual('(1/2)*x^2+(2/3)*x^3');
        expect(nerdamer('integrate(log(x), x)').toString()).toEqual('-x+log(x)*x');
        expect(nerdamer('integrate(sqrt(x), x)').toString()).toEqual('(2/3)*x^(3/2)');
        expect(nerdamer('integrate(asin(a*x), x)').toString()).toEqual('a^(-1)*sqrt(-a^2*x^2+1)+asin(a*x)*x');
        expect(nerdamer('integrate(a/x, x)').toString()).toEqual('a*log(x)');
        expect(nerdamer('integrate(x*e^x, x)').toString()).toEqual('-e^x+e^x*x');
        expect(nerdamer('integrate(x^3*log(x), x)').toString()).toEqual('(-1/16)*x^4+(1/4)*log(x)*x^4');
        expect(nerdamer('integrate(x^2*sin(x), x)').toString()).toEqual('-cos(x)*x^2+2*cos(x)+2*sin(x)*x');
        expect(nerdamer('integrate(sin(x)*log(cos(x)), x)').toString()).toEqual('-cos(x)*log(cos(x))+cos(x)');
        expect(nerdamer('integrate(x*asin(x), x)').toString()).toEqual('(-1/4)*asin(x)+(1/2)*asin(x)*x^2+(1/4)*cos(asin(x))*sin(asin(x))');
        expect(nerdamer('integrate(q/((2-3*x^2)^(1/2)), x)').toString()).toEqual('asin(3*sqrt(6)^(-1)*x)*q*sqrt(3)^(-1)');
        expect(nerdamer('integrate(1/(a^2+x^2), x)').toString()).toEqual('a^(-1)*atan(a^(-1)*x)');
        expect(nerdamer('integrate(11/(a+5*r*x)^2,x)').toString()).toEqual('(-11/5)*(5*r*x+a)^(-1)*r^(-1)');
        expect(nerdamer('integrate(cos(x)*sin(x), x)').toString()).toEqual('(-1/2)*cos(x)^2');
        expect(nerdamer('integrate(x*cos(x)*sin(x), x)').toString()).toEqual('(-1/2)*cos(x)^2*x+(1/4)*cos(x)*sin(x)+(1/4)*x');
        expect(nerdamer('integrate(t/(a*x+b), x)').toString()).toEqual('a^(-1)*log(a*x+b)*t');
        expect(nerdamer('integrate(x*(x+a)^3, x)').toString()).toEqual('(1/2)*a^3*x^2+(1/5)*x^5+(3/4)*a*x^4+a^2*x^3');
        expect(nerdamer('integrate(4*x/(x^2+a^2), x)').toString()).toEqual('2*log(a^2+x^2)');
        expect(nerdamer('integrate(1/(x^2+3*a^2), x)').toString()).toEqual('a^(-1)*atan(a^(-1)*sqrt(3)^(-1)*x)*sqrt(3)^(-1)');
        expect(nerdamer('integrate(8*x^3/(6*x^2+3*a^2), x)').toString()).toEqual('8*((-1/24)*a^2*log(2*x^2+a^2)+(1/12)*x^2)');
        expect(nerdamer('integrate(10*q/(4*x^2+24*x+20), x)').toString()).toEqual('10*((-1/16)*log(5+x)+(1/16)*log(1+x))*q');
        expect(nerdamer('integrate(x/(x+a)^2, x)').toString()).toEqual('(a+x)^(-1)*a+log(a+x)');
        expect(nerdamer('integrate(sqrt(x-a), x)').toString()).toEqual('(2/3)*(-a+x)^(3/2)');
        expect(nerdamer('integrate(x^n*log(x), x)').toString()).toEqual('(1+n)^(-1)*log(x)*x^(1+n)-(1+n)^(-2)*x^(1+n)');
        expect(nerdamer('integrate(3*a*sec(x)^2, x)').toString()).toEqual('3*a*tan(x)');
        expect(nerdamer('integrate(a/(x^2+b*x+a*x+a*b),x)').toString()).toEqual('(((-a*b^(-1)+1)^(-1)*a*b^(-1)+1)*b^(-1)*log(a+x)-(-a*b^(-1)+1)^(-1)*b^(-1)*log(b+x))*a');
        expect(nerdamer('integrate(log(a*x+b),x)').toString()).toEqual('((a*x+b)*log(a*x+b)-a*x-b)*a');
        expect(nerdamer('integrate(x*log(x),x)').toString()).toEqual('(-1/4)*x^2+(1/2)*log(x)*x^2');
        expect(nerdamer('integrate(log(a*x)/x,x)').toString()).toEqual('(1/2)*log(a*x)^2');
        expect(nerdamer('integrate(log(x)^2,x)').toString()).toEqual('-2*log(x)*x+2*x+log(x)^2*x');
        expect(nerdamer('integrate(t*log(x)^3,x)').toString()).toEqual('(-3*log(x)^2*x-6*x+6*log(x)*x+log(x)^3*x)*t');
        expect(nerdamer('integrate(e^x*sin(x),x)').toString()).toEqual('(1/2)*(-cos(x)*e^x+e^x*sin(x))');
        expect(nerdamer('integrate(e^x*sin(x),x)').toString()).toEqual('(1/2)*(-cos(x)*e^x+e^x*sin(x))');
        expect(nerdamer('integrate(e^(2*x)*sin(x),x)').toString()).toEqual('(4/5)*((-1/4)*cos(x)*e^(2*x)+(1/2)*e^(2*x)*sin(x))');
        expect(nerdamer('integrate(e^(2*x)*sin(x)*x,x)').toString()).toEqual('(-3/25)*e^(2*x)*sin(x)+(4/25)*cos(x)*e^(2*x)+(4/5)*((-1/4)*cos(x)*e^(2*x)+(1/2)*e^(2*x)*sin(x))*x');
        expect(nerdamer('integrate(x*log(x)^2,x)').toString()).toEqual('(-1/2)*log(x)*x^2+(1/2)*log(x)^2*x^2+(1/4)*x^2');
        expect(nerdamer('integrate(x^2*log(x)^2,x)').toString()).toEqual('(-2/9)*log(x)*x^3+(1/3)*log(x)^2*x^3+(2/27)*x^3');
        expect(nerdamer('integrate(x^2*e^(a*x),x)').toString()).toEqual('-2*(-a^(-2)*e^(a*x)+a^(-1)*e^(a*x)*x)*a^(-1)+a^(-1)*e^(a*x)*x^2');
        expect(nerdamer('integrate(8*e^(a*x^2),x)').toString()).toEqual('4*erf(sqrt(-a)*x)*sqrt(-a)^(-1)*sqrt(pi)');
        expect(nerdamer('integrate(5*x*e^(-8*a*x^2),x)').toString()).toEqual('(-5/16)*a^(-1)*e^(-8*a*x^2)');
        expect(nerdamer('integrate(x^2*sin(x),x)').toString()).toEqual('-cos(x)*x^2+2*cos(x)+2*sin(x)*x');
        expect(nerdamer('integrate(8*tan(b*x)^2,x)').toString()).toEqual('8*(-x+b^(-1)*tan(b*x))');
        expect(nerdamer('integrate(sec(a*x)^3,x)').toString()).toEqual('(1/2)*a^(-1)*log(sec(a*x)+tan(a*x))+(1/2)*a^(-1)*sec(a*x)*tan(a*x)');
        expect(nerdamer('integrate(sec(a*x)*tan(a*x),x)').toString()).toEqual('a^(-1)*sec(a*x)');
        expect(nerdamer('integrate(3*a*cot(a*x)^4, x)').toString()).toEqual('3*((-1/3)*a^(-1)*cot(a*x)^3+a^(-1)*cot(a*x)+x)*a');
        expect(nerdamer('integrate(3*a*csc(a*x)^4, x)').toString()).toEqual('3*((-1/3)*a^(-1)*cot(a*x)*csc(a*x)^2+(-2/3)*a^(-1)*cot(a*x))*a');
        expect(nerdamer('integrate(1/8*a*2/(x^3+13*x^2+47*x+35),x)').toString()).toEqual('(1/4)*((-1/8)*log(5+x)+(1/12)*log(7+x)+(1/24)*log(1+x))*a');
        expect(nerdamer('integrate(a*2/(x^2+x),x)').toString()).toEqual('2*(-log(1+x)+log(x))*a');
        expect(nerdamer('integrate((x+7)/(x+1)^3,x)').toString()).toEqual('(-1/2)*(1+x)^(-1)+(-7/2)*(1+x)^(-2)+(-1/2)*(1+x)^(-2)*x');
        expect(nerdamer('integrate((3*x+2)/(x^2+x),x)').toString()).toEqual('2*log(x)+log(1+x)');
        expect(nerdamer('integrate([sin(x), x^2, x],x)').toString()).toEqual('[-cos(x),(1/3)*x^3,(1/2)*x^2]');
        expect(nerdamer('integrate(sinh(x),x)').toString()).toEqual('cosh(x)');
        expect(nerdamer('integrate(cosh(x),x)').toString()).toEqual('sinh(x)');
        expect(nerdamer('integrate(tanh(x),x)').toString()).toEqual('log(cosh(x))');
        expect(nerdamer('integrate(sinh(x)*x,x)').toString()).toEqual('-sinh(x)+cosh(x)*x');
        expect(nerdamer('integrate((x^6+x^2-7)/(x^2+11), x)').toString()).toEqual('(-11/3)*x^3+(1/5)*x^5+122*x-1349*atan(sqrt(11)^(-1)*x)*sqrt(11)^(-1)');
        expect(nerdamer('integrate(x^6/(x^2+11), x)').toString()).toEqual('(-11/3)*x^3+(1/5)*x^5+121*x-1331*atan(sqrt(11)^(-1)*x)*sqrt(11)^(-1)');
        expect(nerdamer('integrate(x^2/(x^2+11))').toString()).toEqual('-11*atan(sqrt(11)^(-1)*x)*sqrt(11)^(-1)+x');
        expect(nerdamer('integrate(tan(x)*csc(x), x)').toString()).toEqual('log(sec(x)+tan(x))');
        expect(nerdamer('integrate(sinh(x)*e^x, x)').toString()).toEqual('(-1/2)*x+(1/4)*e^(2*x)');
        expect(nerdamer('integrate(sinh(x)*cos(x), x)').toString()).toEqual('(-1/4)*e^(-x)*sin(x)+(1/4)*cos(x)*e^(-x)+(1/4)*cos(x)*e^x+(1/4)*e^x*sin(x)');
        /*
         * The Fresnel integral cos(x^2) has no closed-form antiderivative in terms of
         * elementary functions. The integrator correctly returns the expression unchanged
         * and emits "Unable to compute integral!" which is expected, not a bug.
         */
        withSilencedWarnings(() => {
            expect(nerdamer('integrate(cos(x^2), x)').toString()).toEqual('integrate(cos(x^2),x)');
        });
        expect(nerdamer('integrate(sqrt(a-x^2)*x^2, x)').toString()).toEqual('((-1/16)*cos(2*asin(sqrt(a)^(-1)*x))*sin(2*asin(sqrt(a)^(-1)*x))+(1/8)*asin(sqrt(a)^(-1)*x))*a^2');
        expect(nerdamer('integrate((1-x^2)^(3/2), x)').toString()).toEqual('(-3/16)*cos(2*asin(x))*sin(2*asin(x))+(-x^2+1)^(3/2)*x+(3/8)*asin(x)');
        expect(nerdamer('integrate((1-x^2)^(3/2)*x^2, x)').toString()).toEqual('(-1/32)*cos(2*asin(x))*sin(2*asin(x))+(-1/48)*cos(2*asin(x))^2*sin(2*asin(x))+(1/16)*asin(x)+(1/48)*sin(2*asin(x))');
        expect(nerdamer('integrate(cos(x)^2*sin(x)^4, x)').toString()).toEqual('(-1/32)*cos(2*x)*sin(2*x)+(-1/48)*sin(2*x)+(1/16)*x+(1/48)*cos(2*x)^2*sin(2*x)');
        expect(nerdamer('integrate(log(a*x+1)/x^2, x)').toString()).toEqual('(-log(1+a*x)+log(x))*a-log(1+a*x)*x^(-1)');
        expect(nerdamer('integrate(x^2*(1-x^2)^(5/2), x)').toString()).toEqual('(-1/128)*cos(2*asin(x))^3*sin(2*asin(x))+(-1/48)*cos(2*asin(x))^2*sin(2*asin(x))+(-3/256)*cos(2*asin(x))*sin(2*asin(x))+(1/48)*sin(2*asin(x))+(5/128)*asin(x)');
        /*
         * Generic symbolic integration of tan(a*x)^(-n) for arbitrary n
         * cannot be resolved. The integrator correctly returns the expression unchanged
         * and emits "Unable to compute integral!" which is expected, not a bug.
         */
        withSilencedWarnings(() => {
            expect(nerdamer('integrate(1/tan(a*x)^n, x)').toString()).toEqual('integrate(tan(a*x)^(-n),x)');
        });
        expect(nerdamer('integrate(sin(x)^2*cos(x)*tan(x), x)').toString()).toEqual('(-3/4)*cos(x)+(1/12)*cos(3*x)');
        expect(nerdamer('integrate(cos(x)^2/sin(x),x)').toString()).toEqual('-log(cot(x)+csc(x))+cos(x)');
        expect(nerdamer('integrate(cos(x)/x,x)').toString()).toEqual('Ci(x)');
        expect(nerdamer('integrate(sin(x)/x,x)').toString()).toEqual('Si(x)');
        expect(nerdamer('integrate(log(x)^3/x,x)').toString()).toEqual('(1/4)*log(x)^4');
        expect(nerdamer('integrate(tan(x)^2*sec(x), x)').toString()).toEqual('(-1/2)*log(sec(x)+tan(x))+(1/2)*sec(x)*tan(x)');
        expect(nerdamer('integrate(tan(x)/cos(x),x)').toString()).toEqual('cos(x)^(-1)');
        expect(nerdamer('integrate(sin(x)^3/x,x)').toString()).toEqual('(-1/4)*Si(3*x)+(3/4)*Si(x)');
        expect(nerdamer('integrate(tan(x)/sec(x)*sin(x)/tan(x),x)').toString()).toEqual('(-1/2)*cos(x)^2');
        expect(nerdamer('integrate(log(x)^n/x,x)').toString()).toEqual('(1+n)^(-1)*log(x)^(1+n)');
        expect(nerdamer('integrate(1/(x^2+9)^3,x)').toString()).toEqual('(1/729)*((1/4)*cos(atan((1/3)*x))^3*sin(atan((1/3)*x))+(3/8)*atan((1/3)*x)+(3/8)*cos(atan((1/3)*x))*sin(atan((1/3)*x)))');
        expect(nerdamer('integrate(asin(x)/sqrt(2-2x^2),x)').toString()).toEqual('(1/2)*asin(x)^2*sqrt(2)^(-1)');
        expect(nerdamer('integrate(atan(x)/(2+2*x^2),x)').toString()).toEqual('(1/4)*atan(x)^2');
        expect(nerdamer('integrate(1/(sqrt(1-1/x^2)*x^2), x)').toString()).toEqual('asin(sqrt(-x^(-2)+1))');
        expect(nerdamer('integrate(1/(sqrt(1-1/x^2)*x), x)').toString()).toEqual('(-1/2)*log(1+sqrt(-x^(-2)+1))+(1/2)*log(-1+sqrt(-x^(-2)+1))');
        expect(nerdamer('integrate(exp(2*log(x)),x)').toString()).toEqual('(1/3)*x^3');
    });

    it('should handle integrals of sqrt(a*x^2+b) (issue #61)', () => {
        expect(nerdamer('integrate(sqrt(a*x^2+b), x)').text('fractions')).toBe('(a*x^2+b)^(1/2)*x-((-1/2)*cos(asin(i*sqrt(a)*sqrt(b)^(-1)*x))*sin(asin(i*sqrt(a)*sqrt(b)^(-1)*x))+(1/2)*asin(i*sqrt(a)*sqrt(b)^(-1)*x))*a^(-1)*b^2*sqrt(-a^(-1)*b)*sqrt(b)^(-1)');
    });
});
