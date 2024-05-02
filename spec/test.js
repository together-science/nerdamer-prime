/* global expect */

'use strict';

var nerdamer = require('../nerdamer.core.js');
require('../Algebra.js');
require('../Calculus.js');
require('../Solve.js');
require('../Extra.js');
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
// let x = nerdamer("solve(-4901*t^2+1000*h*s^2, t)").evaluate().text();
// let x = nerdamer("factor(4901*t^2+1000*h*s^2)").evaluate().text("fractions");
// console.log(x);
// x = nerdamer("factor(4902*t^2+1000*h*s^2)").evaluate().text();
// console.log(x);
// x = nerdamer("factor(4903*t^2+1000*h*s^2)").evaluate().text();
// console.log(x);

// let x = nerdamer("3.53540^3.5").evaluate().text();
// console.log(x);
// x = nerdamer("3.535401^3.5").evaluate().text();
// console.log(x);

let x;

try {
    // x=nerdamer('ilt(1/(s^3+4s^2+s),s,t)').text();
    // x=nerdamer('ilt(1/(s^2+2s+1),s,t)').toString()
    // x = nerdamer("solve(x^3-1=0,x)").text()
    x = nerdamer("arg(1/i)").text();
    // x = nerdamer("simplify(-0.9413895002348294*i+1.210178148039533+2.044319483931663*(-0.5+0.8660254037844386*i)^(-1))").evaluate().text()
} catch (error) {
    console.log("error "+error)
}
console.log(x);

// console.log(text);
console.log("done");
