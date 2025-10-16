/* global expect */

'use strict';

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');
require('../Calculus.js');
require('../Solve.js');

describe('Known problems:', function () {
    it('Core', function() {
    });
    

    it('Algebra', function () {    
        // issue #1 - baseunit_m should cancel out 
        // expect(nerdamer('baseunit_m ^(-1)*sqrt(baseunit_m ^2*cos(3)+baseunit_m ^2)')
        //     .evaluate().text())
        //     .toEqual('0.100037509962788179');
    });
    it('Solve', function () { 
        // solve x^3-1,x
        // solve x^3-2x^2+8x-12,x
        // investigate: Why did it switch to numeric solve? Also, previous result was incorrect
        expect(nerdamer('solve(sqrt(x)-2x+x^2,x)').toString()).toEqual('[0,832040/2178309,1]'/*[(-1/2)*sqrt(5)+3/2,0,832040/2178309,1]'*/);
    });
});
