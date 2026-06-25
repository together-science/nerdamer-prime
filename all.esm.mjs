/*
 * Author : Martin Donk
 * Website : http://www.nerdamer.com
 * Email : martin.r.donk@gmail.com
 * Source : https://github.com/jiggzson/nerdamer
 * ESM entry point — loads all add-ons and exports nerdamer as the default export
 */

const nerdamer = require('./nerdamer.core.js');
require('./Algebra.js');
require('./Calculus.js');
require('./Solve.js');
require('./Extra.js');

export default nerdamer;
