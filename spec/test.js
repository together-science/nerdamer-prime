/* global expect */

'use strict';

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');
require('../Calculus.js');
require('../Solve.js');
console.global = {tsDebugChannels: {notimeout: true}};


// console.log(nerdamer('solve((5-3y)/(5+y)=(1-9y)/(3y-7),y)')
//     .toString());
// console.log(nerdamer('(5-3y)/(5+y)=(1-9y)/(3y-7)').solveFor("y").toString());

// console.log(nerdamer('limit((2sin(x)-sin(2x))/(x-sin(x)),x,0)').toString());

// const testEq= ["0=a*c", "0=b"];
// const testUnkwowns = ["a", "b"];
// const sol = nerdamer.solveEquations(testEq, [...testUnkwowns]);
// console.log(sol.toString());

// const x = nerdamer("-0.5*sqrt(5)+0.5").simplify().text()
const x = nerdamer("-2*sqrt(5)+2").simplify().text()
console.log(x);

// nerdamer.setVar("x","-sqrt(-1+z)");
// nerdamer.setVar("y","-2*sqrt(-1+z)+5");
// console.log(nerdamer("(-1/2)*abs(-5+y)*sqrt(-1+z)^(-1)-1").simplify().text());

// let text = nerdamer("2-2*(x/3)").text()
// console.log(text);
// const text = nerdamer("2-2*(x/3)").simplify().text()
// const text = nerdamer("solve(h=((1)/(2))*(((981)/(100)))*m*(1/((s)^(2)))*((t)^(2)), t)").simplify().text()
// const text = nerdamer("(530678210/1662132951)*s*sqrt(h^(-1))*sqrt(m)^(-1)").simplify().text()

// const term = "2^y*log(y)+y";
// const text = nerdamer(term)
//     .simplify()
//     .text();

// console.log(text);
console.log("done");
