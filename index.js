// index.js — npm entry that includes all nerdamer components and exports the `nerdamer` object
/* eslint-disable global-require */
(function () {
    var nerdamer;
    try {
        // Prefer the bundled all.js which includes all modules
        nerdamer = require('./all.js');
    } catch (e) {
        // Fallback: require core and known components individually
        try {
            require('./nerdamer.core.js');
            // optional modules
            try { require('./constants.js'); } catch (_) {}
            try { require('./Algebra.js'); } catch (_) {}
            try { require('./Calculus.js'); } catch (_) {}
            try { require('./Solve.js'); } catch (_) {}
            try { require('./Extra.js'); } catch (_) {}
            nerdamer = (typeof global !== 'undefined' && global.nerdamer) || (typeof window !== 'undefined' && window.nerdamer) || undefined;
        } catch (inner) {
            // If nothing works, rethrow the original error
            throw e;
        }
    }

    // Export for CommonJS, and provide interop for ES modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = nerdamer;
        module.exports.default = nerdamer;
        module.exports.nerdamer = nerdamer;
    }

    // Also attach to exports if using named exports (rare)
    try {
        if (typeof exports !== 'undefined') {
            exports.nerdamer = nerdamer;
        }
    } catch (_) {}
}());
