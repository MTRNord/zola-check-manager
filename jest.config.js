/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    //clearMocks: true,
    //moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.m?[tj]sx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: "./tsconfig.test.json"
            }
        ]
    },
    verbose: true
};
export default jestConfig;
