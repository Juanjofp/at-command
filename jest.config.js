module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-node',
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
    coverageThreshold: {
        global: {
            statements: 90,
            branches: 60,
            functions: 90,
            lines: 80
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
