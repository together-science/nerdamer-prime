import js from '@eslint/js';
import type { Linter } from 'eslint';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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

/** Rules disabled for legacy JavaScript code. These are turned off to allow gradual modernization. */
const LEGACY_JS_DISABLED_RULES: Linter.RulesRecord = {
    'no-var': 'off',
    'prefer-const': 'off',
    'no-redeclare': 'off',
    'no-use-before-define': 'off',
    'no-shadow': 'off',
    eqeqeq: 'off',
    'no-unused-vars': 'off',
    'no-useless-escape': 'off',
    'no-sparse-arrays': 'off',
    'prefer-arrow-callback': 'off',
    'arrow-body-style': 'off',
    'prefer-template': 'off',
    'no-console': 'off',
    'no-loss-of-precision': 'off',
    'no-case-declarations': 'off',
    curly: 'off',
    'no-prototype-builtins': 'off',
};

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
    'jsdoc/tag-lines': 'off',
    'jsdoc/require-returns-check': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/no-multi-asterisks': 'off',
    'jsdoc/reject-function-type': 'off',
    'jsdoc/reject-any-type': 'off',

    // Rules that catch real issues
    'jsdoc/check-param-names': 'warn',
    'jsdoc/check-tag-names': 'warn',
    'jsdoc/valid-types': 'warn',

    // Type checking - enable defaults now that we've renamed Symbol to NerdamerSymbol
    // This will flag String->string, Number->number, Boolean->boolean conversions
    'jsdoc/check-types': [
        'warn',
        {
            noDefaults: false,
            unifyParentAndChildTypeChecks: true,
        },
    ],

    // Allow nerdamer-specific and common type aliases
    'jsdoc/no-undefined-types': [
        'warn',
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
    'prefer-template': 'warn',
    'prefer-arrow-callback': [
        'error',
        {
            allowNamedFunctions: true,
            allowUnboundThis: false,
        },
    ],
    'arrow-body-style': ['warn', 'as-needed'],
    'no-duplicate-imports': 'error',

    // Best practices
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'all'],
    'default-case-last': 'error',
    'dot-notation': 'error',
    'no-multi-str': 'error',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'no-useless-concat': 'error',
    'prefer-promise-reject-errors': 'error',
    radix: 'error',
    yoda: ['error', 'never'],
};

// =============================================================================
// TypeScript Rules
// =============================================================================

/**
 * TypeScript-specific rules applied to .ts/.tsx files. These extend/override the base rules with TypeScript
 * equivalents.
 */
const typescriptRules: Linter.RulesRecord = {
    // Disable base rules that have TypeScript equivalents
    'no-unused-vars': 'off',
    'no-shadow': 'off',
    'no-use-before-define': 'off',
    'no-redeclare': 'off',
    'no-dupe-class-members': 'off',
    'no-return-await': 'off',

    // TypeScript equivalents (rules that replace base ESLint rules)
    '@typescript-eslint/no-redeclare': 'error',
    '@typescript-eslint/no-dupe-class-members': 'error',
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
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-use-before-define': [
        'error',
        {
            functions: false,
            classes: true,
            variables: true,
            typedefs: true,
        },
    ],
    '@typescript-eslint/return-await': ['error', 'in-try-catch'],

    // Type annotations and inference
    '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowDirectConstAssertionInArrowFunctions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-inferrable-types': [
        'error',
        {
            ignoreParameters: true,
            ignoreProperties: true,
        },
    ],

    // Type imports and definitions
    '@typescript-eslint/consistent-type-imports': [
        'error',
        {
            prefer: 'type-imports',
            disallowTypeAnnotations: true,
            fixStyle: 'inline-type-imports',
        },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

    // Code style
    '@typescript-eslint/member-ordering': 'warn',
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

    // Error prevention
    '@typescript-eslint/ban-ts-comment': [
        'error',
        {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': false,
            'ts-nocheck': false,
            'ts-check': false,
        },
    ],
    '@typescript-eslint/no-duplicate-enum-values': 'error',
    '@typescript-eslint/no-empty-object-type': [
        'error',
        {
            allowInterfaces: 'with-single-extends',
        },
    ],

    // Promise handling (type-checked)
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/promise-function-async': 'error',
    '@typescript-eslint/require-await': 'error',

    // Type safety (warnings for gradual adoption)
    '@typescript-eslint/no-redundant-type-constituents': 'warn',
    '@typescript-eslint/no-unnecessary-condition': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',

    // Modern syntax preferences
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',

    // Strictness
    '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
            allowString: true,
            allowNumber: true,
            allowNullableObject: true,
        },
    ],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
};

// =============================================================================
// Test File Rules
// =============================================================================

/** Relaxed TypeScript rules for test files. */
const testFileTypescriptOverrides: Linter.RulesRecord = {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
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
    // TypeScript Configuration
    // -------------------------------------------------------------------------
    {
        name: 'typescript/base',
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
                ecmaVersion: 2024,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: typescriptRules,
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
        rules: LEGACY_JS_DISABLED_RULES,
    },

    // -------------------------------------------------------------------------
    // Legacy Spec Test Files
    // -------------------------------------------------------------------------
    {
        name: 'legacy/spec',
        files: ['spec/**/*.js'],
        rules: {
            ...LEGACY_JS_DISABLED_RULES,
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
            ...testFileTypescriptOverrides,
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/prefer-optional-chain': 'off',
            '@typescript-eslint/consistent-type-imports': 'off',
            '@typescript-eslint/no-shadow': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrors: 'none',
                },
            ],
            'no-case-declarations': 'off',
            'no-undef': 'off',
            curly: 'off',
            radix: 'off',
            'dot-notation': 'off',
            'arrow-body-style': 'off',
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
            'jsdoc/check-param-names': 'off',
            'jsdoc/require-throws-type': 'off',
            'jsdoc/no-undefined-types': 'off',
            'prettier/prettier': 'off',
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
