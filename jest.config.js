module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-node',
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
    coverageThreshold: {
        global: {
            statements: 50,
            branches: 30,
            functions: 50,
            lines: 50
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
