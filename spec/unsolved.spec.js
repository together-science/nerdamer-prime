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
    });
});
