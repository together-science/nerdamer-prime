import js from '@eslint/js';
import type { Linter } from 'eslint';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const currentDir = dirname(fileURLToPath(import.meta.url));

// =============================================================================
// Shared Constants
// =============================================================================

/** Nerdamer internal types used in JSDoc annotations. These are class names defined within the nerdamer codebase. */
const NERDAMER_TYPES = [
    'NerdamerSymbol',
    'Frac',
    'Vector',
    'Matrix',
    'Parser',
    'Collection',
    'Polynomial',
    'Factors',
    'MVPolynomial',
    'Equation',
    'Expression',
    'AlgebraL',
    'Factor',
    'Token',
    'Tokens',
    'Parser.Collection',
];

/**
 * Common type aliases found in JSDoc that should be allowed. NOTE: Prefer standard types (number, boolean, string) in
 * new code.
 */
const ALLOWED_TYPE_ALIASES = [
    // Exception types
    'Exception',
    'Error',
    // TypeScript/JSDoc type keywords
    'any',
    'void',
    'null',
    'undefined',
    'never',
    'bigint',
    // Nerdamer-specific result types
    'error',
    'divergent',
];

/** Legacy nerdamer core source files. These files have relaxed linting rules for progressive adoption. */
const LEGACY_CORE_FILES = [
    'nerdamer.core.js',
    'Algebra.js',
    'Calculus.js',
    'Solve.js',
    'Extra.js',
    'constants.js',
    'all.js',
];

// =============================================================================
// JSDoc Configuration
// =============================================================================

/** JSDoc rules configuration. Set to 'warn' for progressive adoption; noisy rules are disabled. */
const jsdocRules: Linter.RulesRecord = {
    // Disable overly noisy rules
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns-description': 'off',
    'jsdoc/require-property-description': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-param': 'off',
    'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
    'jsdoc/require-returns-check': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/no-multi-asterisks': 'error',
    'jsdoc/reject-function-type': 'off',
    'jsdoc/reject-any-type': 'off',

    // Rules that catch real issues
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/valid-types': 'error',

    // Type checking - enable defaults now that we've renamed Symbol to NerdamerSymbol
    // This will flag String->string, Number->number, Boolean->boolean conversions
    'jsdoc/check-types': [
        'error',
        {
            noDefaults: false,
            unifyParentAndChildTypeChecks: true,
        },
    ],

    // Allow nerdamer-specific and common type aliases
    'jsdoc/no-undefined-types': [
        'error',
        {
            definedTypes: [...NERDAMER_TYPES, ...ALLOWED_TYPE_ALIASES],
        },
    ],
};

// =============================================================================
// Base JavaScript Rules
// =============================================================================

/** Core JavaScript rules applied to all files. */
const baseJsRules: Linter.RulesRecord = {
    // Prettier integration
    'prettier/prettier': 'error',

    // Console and debugging
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',

    // Variables
    'no-unused-vars': [
        'error',
        {
            args: 'after-used',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            caughtErrors: 'none',
        },
    ],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-shadow': 'error',
    'no-use-before-define': [
        'error',
        {
            functions: false,
            classes: true,
            variables: true,
        },
    ],

    // Modern syntax preferences
    'object-shorthand': ['error', 'always'],
    'prefer-template': 'error',
    'prefer-arrow-callback': [
        'error',
        {
            allowNamedFunctions: true,
            allowUnboundThis: false,
        },
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'no-duplicate-imports': 'error',

    // Best practices
    'accessor-pairs': 'error',
    'block-scoped-var': 'error',
    camelcase: ['error', { properties: 'never', ignoreDestructuring: true, allow: ['^_'] }],
    'class-methods-use-this': ['error', { exceptMethods: [] }],
    'consistent-return': 'error',
    'default-param-last': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'all'],
    'default-case-last': 'error',
    'dot-notation': 'error',
    'func-name-matching': 'error',
    'func-names': ['error', 'as-needed'],
    'grouped-accessor-pairs': ['error', 'getBeforeSet'],
    'guard-for-in': 'error',
    'logical-assignment-operators': ['error', 'always', { enforceForIfStatements: true }],
    'max-depth': ['error', { max: 6 }],
    'max-nested-callbacks': ['error', { max: 5 }],
    'max-params': ['error', { max: 6 }],
    'new-cap': ['error', { newIsCap: true, capIsNew: false }],
    'no-alert': 'error',
    'no-array-constructor': 'error',
    'no-bitwise': ['error', { allow: ['~', '<<', '>>', '>>>'] }],
    'no-caller': 'error',
    'no-constructor-return': 'error',
    'no-div-regex': 'error',
    'no-else-return': ['error', { allowElseIf: false }],
    'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
    'no-eq-null': 'off', // We use eqeqeq with null: 'ignore' instead
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-implicit-coercion': ['error', { allow: ['!!'] }],
    'no-implicit-globals': 'error',
    'no-implied-eval': 'error',
    'no-invalid-this': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-lonely-if': 'error',
    'no-loop-func': 'error',
    'no-multi-assign': 'error',
    'no-multi-str': 'error',
    'no-negated-condition': 'error',
    'no-nested-ternary': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-object-constructor': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': ['error', { props: false }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-proto': 'error',
    'no-return-assign': ['error', 'except-parens'],
    'no-return-await': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-template-curly-in-string': 'error',
    'no-throw-literal': 'error',
    'no-undef-init': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unneeded-ternary': 'error',
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-concat': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-void': 'error',
    'one-var': ['error', 'never'],
    'operator-assignment': ['error', 'always'],
    'prefer-destructuring': [
        'error',
        {
            VariableDeclarator: { array: false, object: true },
            AssignmentExpression: { array: false, object: false },
        },
    ],
    'prefer-exponentiation-operator': 'error',
    'prefer-named-capture-group': 'warn',
    'prefer-numeric-literals': 'error',
    'prefer-object-has-own': 'error',
    'prefer-object-spread': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-regex-literals': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    radix: 'error',
    'require-atomic-updates': 'error',
    'require-await': 'error',
    'require-unicode-regexp': 'warn',
    'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
    'sort-vars': ['error', { ignoreCase: true }],
    'spaced-comment': ['error', 'always', { markers: ['/'], exceptions: ['-', '+', '*'] }],
    strict: ['error', 'never'],
    'symbol-description': 'error',
    'unicode-bom': ['error', 'never'],
    'vars-on-top': 'error',
    yoda: ['error', 'never'],

    // Complexity limits (warnings to track but not block)
    complexity: ['warn', { max: 30 }],
    'max-classes-per-file': ['warn', { max: 3 }],
    'max-lines': ['warn', { max: 1000, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
    'max-statements': ['warn', { max: 50 }],

    // Code quality warnings
    'capitalized-comments': [
        'warn',
        'always',
        {
            ignoreConsecutiveComments: true,
            ignoreInlineComments: true,
            ignorePattern: 'pragma|ignore|prettier-ignore|eslint|webpack|istanbul|c8|v8|tsc',
        },
    ],
    'id-denylist': ['warn', 'e', 'err', 'cb', 'callback', 'data', 'temp', 'tmp'],
    'id-length': ['warn', { min: 2, exceptions: ['i', 'j', 'k', 'n', 'm', 'x', 'y', 'z', 'a', 'b', 'c', 'd', '_'] }],
    'no-await-in-loop': 'warn',
    'no-inline-comments': 'off', // Allow inline comments
    'no-magic-numbers': [
        'warn',
        {
            ignore: [-1, 0, 1, 2, 10, 100],
            ignoreArrayIndexes: true,
            ignoreDefaultValues: true,
            enforceConst: true,
        },
    ],
    'no-ternary': 'off', // Ternaries are fine when used appropriately
    'no-underscore-dangle': ['warn', { allowAfterThis: true, allowFunctionParams: true }],
    'no-undefined': 'off', // Allow undefined - it's safer in modern JS
    'no-warning-comments': ['warn', { terms: ['fixme', 'xxx', 'hack'], location: 'start' }],
    'sort-keys': 'off', // Too restrictive for most codebases

    // Potential errors (from eslint:recommended but explicitly configured)
    'array-callback-return': ['error', { allowImplicit: true, checkForEach: true }],
    'no-async-promise-executor': 'error',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': ['error', 'except-parens'],
    'no-const-assign': 'error',
    'no-constant-binary-expression': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-control-regex': 'error',
    'no-dupe-args': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-ex-assign': 'error',
    'no-fallthrough': ['error', { allowEmptyCase: true }],
    'no-func-assign': 'error',
    'no-import-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-loss-of-precision': 'error',
    'no-misleading-character-class': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-obj-calls': 'error',
    'no-promise-executor-return': ['error', { allowVoid: true }],
    'no-prototype-builtins': 'error',
    'no-regex-spaces': 'error',
    'no-setter-return': 'error',
    'no-sparse-arrays': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': ['error', { enforceForOrderingRelations: true }],
    'no-unsafe-optional-chaining': ['error', { disallowArithmeticOperators: true }],
    'no-unused-private-class-members': 'error',
    'no-useless-backreference': 'error',
    'use-isnan': ['error', { enforceForSwitchCase: true, enforceForIndexOf: true }],
    'valid-typeof': ['error', { requireStringLiterals: true }],

    // Additional potential error rules
    'for-direction': 'error',
    'getter-return': 'error',
};

// =============================================================================
// TypeScript Rules (Overrides for presets)
// =============================================================================

/**
 * TypeScript rule overrides. We use tseslint.configs.strictTypeChecked and stylisticTypeChecked as bases, then apply
 * these customizations.
 */
const typescriptRuleOverrides: Linter.RulesRecord = {
    // Disable base ESLint rules that conflict with TypeScript equivalents
    'no-unused-vars': 'off',
    'no-shadow': 'off',
    'no-use-before-define': 'off',
    'no-redeclare': 'off',
    'no-dupe-class-members': 'off',
    'no-return-await': 'off',

    // Custom configurations for rules from presets
    '@typescript-eslint/no-unused-vars': [
        'error',
        {
            args: 'after-used',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            caughtErrors: 'none',
        },
    ],
    '@typescript-eslint/no-use-before-define': [
        'error',
        {
            functions: false,
            classes: true,
            variables: true,
            typedefs: true,
        },
    ],
    '@typescript-eslint/ban-ts-comment': [
        'error',
        {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': false,
            'ts-nocheck': false,
            'ts-check': false,
        },
    ],
    '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
            allowString: true,
            allowNumber: true,
            allowNullableObject: true,
        },
    ],
    '@typescript-eslint/consistent-type-imports': [
        'error',
        {
            prefer: 'type-imports',
            disallowTypeAnnotations: true,
            fixStyle: 'inline-type-imports',
        },
    ],
    '@typescript-eslint/no-inferrable-types': [
        'error',
        {
            ignoreParameters: true,
            ignoreProperties: true,
        },
    ],

    // Additional rules not in presets
    '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowDirectConstAssertionInArrowFunctions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
    ],
    '@typescript-eslint/member-ordering': 'error',
    '@typescript-eslint/method-signature-style': ['error', 'property'],
    '@typescript-eslint/naming-convention': [
        'error',
        {
            selector: 'interface',
            format: ['PascalCase'],
            prefix: ['I'],
        },
        {
            selector: 'typeAlias',
            format: ['PascalCase'],
        },
        {
            selector: 'enum',
            format: ['PascalCase'],
        },
    ],
    '@typescript-eslint/no-import-type-side-effects': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/promise-function-async': 'error',
    '@typescript-eslint/no-shadow': 'error',
};

// =============================================================================
// Export Configuration
// =============================================================================

export default defineConfig([
    // -------------------------------------------------------------------------
    // Base Configurations
    // -------------------------------------------------------------------------

    // ESLint recommended rules
    js.configs.recommended,

    // JSDoc recommended config
    jsdoc.configs['flat/recommended'],

    // Prettier integration (must come after other configs to override formatting)
    prettier,

    // -------------------------------------------------------------------------
    // Global Configuration for All Files
    // -------------------------------------------------------------------------
    {
        name: 'global/base',
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
        },
        plugins: {
            prettier: prettierPlugin,
            jsdoc,
        },
        rules: {
            ...jsdocRules,
            ...baseJsRules,
        },
    },

    // -------------------------------------------------------------------------
    // TypeScript Configuration (using preset configs)
    // -------------------------------------------------------------------------
    ...tseslint.configs.strictTypeChecked.map(config => ({
        ...config,
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    })),
    ...tseslint.configs.stylisticTypeChecked.map(config => ({
        ...config,
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    })),
    {
        name: 'typescript/overrides',
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: currentDir,
            },
        },
        rules: typescriptRuleOverrides,
    },

    // -------------------------------------------------------------------------
    // Test Files Configuration (globals for all test files)
    // -------------------------------------------------------------------------
    {
        name: 'tests/globals',
        files: ['**/*.spec.js', '**/*.spec.ts', 'spec/**', 'spec-dts/**'],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.jasmine,
            },
        },
        rules: {
            'no-console': 'off',
        },
    },

    // -------------------------------------------------------------------------
    // Config Files
    // -------------------------------------------------------------------------
    {
        name: 'config-files',
        files: ['*.config.js', '*.config.cjs', '*.config.mjs', '*.config.mts', '.prettierrc.cjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'off',
        },
    },

    // -------------------------------------------------------------------------
    // Legacy Nerdamer Core Files
    // -------------------------------------------------------------------------
    {
        name: 'legacy/core',
        files: LEGACY_CORE_FILES,
        rules: {
            // Code style rules that require manual refactoring in legacy files
            'guard-for-in': 'off',
            'no-else-return': 'off',
            'no-empty-function': 'off',
            'no-implicit-coercion': 'off',
            'no-lonely-if': 'off',
            'no-multi-assign': 'off',
            'no-new-func': 'off',
            'no-object-constructor': 'off',
            'no-unused-expressions': 'off',
            'no-useless-call': 'off',
            'no-useless-return': 'off',
            'operator-assignment': 'off',
            'prefer-exponentiation-operator': 'off',
            'prefer-spread': 'off',
            // Additional rules disabled due to legacy patterns
            'block-scoped-var': 'off',
            camelcase: 'off',
            'class-methods-use-this': 'off',
            complexity: 'off',
            'consistent-return': 'off',
            'func-name-matching': 'off',
            'func-names': 'off',
            'logical-assignment-operators': 'off',
            'max-depth': 'off',
            'max-lines-per-function': 'off',
            'max-params': 'off',
            'max-statements': 'off',
            'new-cap': 'off',
            'no-await-in-loop': 'off',
            'no-bitwise': 'off',
            'no-implicit-globals': 'off',
            'no-invalid-this': 'off',
            'no-loop-func': 'off',
            'no-negated-condition': 'off',
            'no-nested-ternary': 'off',
            'no-param-reassign': 'off',
            'no-plusplus': 'off',
            'no-undef-init': 'off',
            'no-underscore-dangle': 'off',
            'no-useless-constructor': 'off',
            'no-warning-comments': 'off',
            'no-magic-numbers': 'off',
            'one-var': 'off',
            'prefer-destructuring': 'off',
            'prefer-named-capture-group': 'off',
            'prefer-numeric-literals': 'off',
            'prefer-rest-params': 'off',
            'require-await': 'off',
            'require-unicode-regexp': 'off',
            'sort-imports': 'off',
            'sort-vars': 'off',
            'spaced-comment': 'off',
            strict: 'off',
            'vars-on-top': 'off',
            'capitalized-comments': 'off',
            'id-denylist': 'off',
            'id-length': 'off',
            'max-classes-per-file': 'off',
            'max-lines': 'off',
            // Potential error rules that fire on legacy patterns
            'array-callback-return': 'off',
            'no-unreachable-loop': 'off',
        },
    },

    // -------------------------------------------------------------------------
    // Legacy Spec Test Files
    // -------------------------------------------------------------------------
    {
        name: 'legacy/spec',
        files: ['spec/**/*.js'],
        rules: {
            // Disable no-redeclare since files use /* global expect */ alongside jest/jasmine globals
            'no-redeclare': 'off',
            // Code style rules
            'capitalized-comments': 'off',
            complexity: 'off',
            'guard-for-in': 'off',
            'id-denylist': 'off',
            'id-length': 'off',
            'logical-assignment-operators': 'off',
            'max-lines': 'off',
            'max-lines-per-function': 'off',
            'max-statements': 'off',
            'no-magic-numbers': 'off',
            'no-param-reassign': 'off',
            'no-underscore-dangle': 'off',
            'prefer-destructuring': 'off',
            'prefer-named-capture-group': 'off',
            'prefer-spread': 'off',
            'require-unicode-regexp': 'off',
            'spaced-comment': 'off',
            strict: 'off',
            // Additionally disable JSDoc for legacy test files
            'jsdoc/check-param-names': 'off',
            'jsdoc/check-tag-names': 'off',
            'jsdoc/check-types': 'off',
            'jsdoc/valid-types': 'off',
            'jsdoc/no-undefined-types': 'off',
        },
    },

    // -------------------------------------------------------------------------
    // TypeScript Spec Files (spec-dts)
    // -------------------------------------------------------------------------
    {
        name: 'spec-dts/overrides',
        files: ['spec-dts/**/*.ts'],
        rules: {
            // Relax rules for type specification tests
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/prefer-optional-chain': 'off',
            '@typescript-eslint/consistent-type-imports': 'off',
            '@typescript-eslint/no-shadow': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-unnecessary-type-parameters': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/prefer-for-of': 'off',
            complexity: 'off',
            'max-lines-per-function': 'off',
            'max-statements': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrors: 'none',
                },
            ],
            'no-case-declarations': 'off',
            'no-empty-function': 'off',
            'no-undef': 'off',
            'no-eval': 'off',
            'no-plusplus': 'off',
            'no-magic-numbers': 'off',
            'no-underscore-dangle': 'off',
            'max-depth': 'off',
            'capitalized-comments': 'off',
            'id-denylist': 'off',
            'id-length': 'off',
            'prefer-named-capture-group': 'off',
            'require-unicode-regexp': 'off',
            'sort-imports': 'off',
            curly: 'off',
            radix: 'off',
            'dot-notation': 'off',
            'arrow-body-style': 'off',
            'array-callback-return': 'off',
            '@typescript-eslint/prefer-regexp-exec': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
        },
    },

    // -------------------------------------------------------------------------
    // Type Definition File (index.d.ts)
    // -------------------------------------------------------------------------
    {
        name: 'type-definitions',
        files: ['index.d.ts'],
        rules: {
            // Disable strict TypeScript rules for legacy type definitions
            '@typescript-eslint/method-signature-style': 'off',
            '@typescript-eslint/naming-convention': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            '@typescript-eslint/member-ordering': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/prefer-function-type': 'off',
            '@typescript-eslint/adjacent-overload-signatures': 'off',
            'jsdoc/check-param-names': 'off',
            'jsdoc/require-throws-type': 'off',
            'jsdoc/no-undefined-types': 'off',
            'id-denylist': 'off',
            'prettier/prettier': 'off',
            '@typescript-eslint/unified-signatures': 'off',
            '@typescript-eslint/no-duplicate-type-constituents': 'off',
        },
    },

    // -------------------------------------------------------------------------
    // Ignored Files and Directories
    // -------------------------------------------------------------------------
    {
        name: 'ignores',
        ignores: [
            // Build outputs
            'dist/',
            'build/',
            'coverage/',
            '*.min.js',
            'all.min.js',

            // Dependencies
            'node_modules/',

            // Type declarations (generated, in types/ folder)
            'types/**/*.d.ts',

            // Generated spec output
            'spec-dts/dist/',

            // Temporary files
            'temp/',
            'tmp/',

            // Git
            '.git/',
        ],
    },
]);
