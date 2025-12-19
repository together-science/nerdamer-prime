/* global expect */

const nerdamer = require('../../nerdamer.core.js');

//fix for rounding errors in some functions
const toFixed = function (x, n) {
    return Number(x).toFixed(n || 14);
};

/**
 * @param {Array} o An array of object to parse
 * @param {String} dec Get output as decimals
 */
const run = function (o, dec) {
    dec = dec || 'decimal';
    for (let i = 0; i < o.length; ++i) {
        // when
        const parsed = nerdamer(o[i].given);
        const value = parsed.evaluate().text(dec);

        // then
        expect(parsed.toString()).toEqual(o[i].expected);
        expect(value).toEqual(o[i].expectedValue);
    }
};

/**
 * @param {String} e The expression
 * @param {object} subs The substitution object
 */
const parse = function (e, subs) {
    let r = nerdamer(e, subs).evaluate().text('decimals');
    if (!isNaN(r)) {
        r = Number(r);
    }
    return r;
};

module.exports = {
    run,
    toFixed,
    parse,
};
