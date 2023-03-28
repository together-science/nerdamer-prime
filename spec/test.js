/* global expect */

'use strict';

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');
require('../Calculus.js');
require('../Solve.js');

console.log(nerdamer('m=(34141034228515471851/614756350000000000000000000)*(3631430813109509/100837351+51955423*log(5+m))')
    .solveFor("x").map(x=>x.text("decimals")).toString());

const a = nerdamer('solve(m=(34141034228515471851/614756350000000000000000000)*(3631430813109509/100837351+51955423*log(5+m)),m)')
    .toString();
const b = a.substring(1,a.length-1);
const c = b.split(",");
const d = c.map(x=>eval(x))
console.log(d);