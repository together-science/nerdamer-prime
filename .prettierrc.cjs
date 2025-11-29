module.exports = {
    plugins: [require.resolve('@trivago/prettier-plugin-sort-imports'), require.resolve('prettier-plugin-jsdoc')],

    // Use 4 spaces for indentation (matches existing code style)
    tabWidth: 4,
    useTabs: false,

    // Use single quotes (matches existing code style)
    singleQuote: true,

    // Always include semicolons (matches existing code style)
    semi: true,

    // Include trailing commas where valid in ES5 (arrays, objects)
    trailingComma: 'es5',

    // Print spaces between brackets in object literals
    bracketSpacing: true,

    // Put the > of a multi-line HTML (JSX) element at the end of the last line
    bracketSameLine: false,

    // Line length that the printer will wrap on
    printWidth: 120,

    // Overrides for specific file patterns
    overrides: [
        {
            files: ['*.spec.js', '**/*.spec.js'],
            options: {
                printWidth: 300,
                // Preserve multi-line JSDoc comments in spec files for readability
                jsdocCommentLineStrategy: 'keep',
            },
        },
    ],

    // Control quotes around object properties
    quoteProps: 'as-needed',

    // Include parentheses around a sole arrow function parameter
    arrowParens: 'avoid',

    // Line endings
    endOfLine: 'lf',

    // Prettier will not format files containing this comment: @prettier-ignore
    requirePragma: false,

    // Prettier will not format files unless they contain this comment: @format
    insertPragma: false,

    // Embedded code formatting options
    embeddedLanguageFormatting: 'auto',
};
