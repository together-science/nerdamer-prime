/* global expect */

'use strict';

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');
require('../Calculus.js');
require('../Solve.js');

describe('Known problems:', function () {
    it('Algebra', function () {    
        // issue #1 - baseunit_m should cancel out 
        expect(nerdamer('baseunit_m^(-1)*sqrt(baseunit_m^2*cos(3)+baseunit_m^2)')
            .evaluate().text())
            .toEqual('0.100037509962788179');
        // issue #7 - everything becomes 1
        expect(nerdamer("log(0.01s)/(-239263565+51955423log(s))-1")
            .simplify().text())
            .not.toEqual('1');
    });
});
