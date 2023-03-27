/* global expect */

'use strict';

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');
require('../Calculus.js');
require('../Solve.js');

describe('Known problems:', function () {
    it('Algebra', function () {       
        expect(nerdamer('baseunit_m^(-1)*sqrt(baseunit_m^2*cos(3)+baseunit_m^2)').evaluate().text())
            .toEqual('0.100037509962788179');
    });
    it('Calculus', function () {
        expect(nerdamer('limit(cos(sin(x)+2), x, Infinity)').toString()).toEqual('[cos(1),cos(3)]');
        expect(nerdamer('limit((2sin(x)-sin(2x))/(x-sin(x)),x,0)').toString()).toEqual('6');
    });
    

});
