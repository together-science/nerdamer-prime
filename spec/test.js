/* global expect */

'use strict';

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');
require('../Calculus.js');
require('../Solve.js');

console.log(nerdamer('(5-3y)/(5+y)=(1-9y)/(3y-7)').text());
console.log(nerdamer('(5-3y)/(5+y)=(1-9y)/(3y-7)').solveFor("y").toString());
console.log(nerdamer('solve((5-3y)/(5+y)=(1-9y)/(3y-7),y)').toString());
console.log(nerdamer("(5-3y)*(3y-7)=(1-9y)*(5+y)").solveFor("y").toString());

