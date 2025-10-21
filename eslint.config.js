import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
    // Base JavaScript recommended config
    js.configs.recommended,

    // Prettier integration - must come after other configs to override
    prettier,

    // Global configuration for all files
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2024,
            },
        },
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            // Prettier rules
            'prettier/prettier': 'error',

            // General JavaScript rules
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
            'no-debugger': 'error',
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
            'no-restricted-syntax': 'off',
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
            'no-shadow': 'error',
            'no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: true,
                    variables: true,
                },
            ],
        },
    },

    // TypeScript-specific configuration
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                project: ['./tsconfig.declaration.json', './spec-dts/tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
                ecmaVersion: 2024,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            // Disable base rules that conflict with TypeScript versions
            'no-unused-vars': 'off',
            'no-shadow': 'off',
            'no-use-before-define': 'off',
            'no-redeclare': 'off',
            'no-dupe-class-members': 'off',
            'no-loss-of-precision': 'off',
            'no-return-await': 'off',

            // TypeScript-specific rules
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
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    disallowTypeAnnotations: true,
                    fixStyle: 'inline-type-imports',
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
            '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
            '@typescript-eslint/ban-ts-comment': [
                'error',
                {
                    'ts-expect-error': 'allow-with-description',
                    'ts-ignore': false,
                    'ts-nocheck': false,
                    'ts-check': false,
                },
            ],
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
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
            '@typescript-eslint/no-duplicate-enum-values': 'error',
            '@typescript-eslint/no-empty-interface': [
                'error',
                {
                    allowSingleExtends: true,
                },
            ],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-redundant-type-constituents': 'warn',
            '@typescript-eslint/no-unnecessary-condition': 'warn',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-call': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/prefer-readonly': 'warn',
            '@typescript-eslint/prefer-string-starts-ends-with': 'error',
            '@typescript-eslint/promise-function-async': 'error',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/return-await': ['error', 'in-try-catch'],
            '@typescript-eslint/strict-boolean-expressions': [
                'warn',
                {
                    allowString: true,
                    allowNumber: true,
                    allowNullableObject: true,
                },
            ],
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
        },
    },

    // Test files configuration
    {
        files: ['**/*.spec.js', '**/*.spec.ts', '**/spec/**', '**/spec-dts/**'],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.jasmine,
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jasmine: 'readonly',
                spyOn: 'readonly',
                xit: 'readonly',
                xdescribe: 'readonly',
                fdescribe: 'readonly',
                fit: 'readonly',
            },
        },
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
        },
    },

    // Configuration files
    {
        files: ['*.config.js', '*.config.cjs', '*.config.mjs', '.prettierrc.cjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-var-requires': 'off',
        },
    },

    // Ignore patterns
    {
        ignores: [
            'dist/',
            'build/',
            'node_modules/',
            'coverage/',
            '*.min.js',
            'all.min.js',
            'types/',
            '.git/',
            '**/*.d.ts', // Type declaration files
            'temp/',
            'tmp/',
        ],
    },
];
