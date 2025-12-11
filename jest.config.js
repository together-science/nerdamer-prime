module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Look for test files in the `spec-dts` directory
    testMatch: ['<rootDir>/spec-dts/**/*.spec.ts'],
    // Enable ES modules support
    extensionsToTreatAsEsm: ['.ts'],
    // Use modern ts-jest configuration (no globals needed)
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: '<rootDir>/tsconfig.json',
            },
        ],
    },
    // Module resolution for ES modules
    moduleNameMapper: {
        '^../index$': '<rootDir>/index.d.ts',
        '^../all$': '<rootDir>/all.js',
    },
    // Silence console warnings from nerdamer modules during testing
    silent: false,
    // Don't collect coverage for type tests
    collectCoverage: false,
};
