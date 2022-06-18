module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-node',
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts',
        '!src/cli.ts',
        '!src/serialports/**'
    ],
    coverageThreshold: {
        global: {
            statements: 40,
            branches: 40,
            functions: 40,
            lines: 40
        }
    },
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
    ],
    setupFilesAfterEnv: ['./test/setup-test.ts'],
    moduleNameMapper: {
        'src/(.*)': '<rootDir>/src/$1',
        '@/(.*)': '<rootDir>/src/$1'
    }
};
