const nextJest = require('next/jest').default;

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  // Explicitly use ts-jest for ts/tsx files
  transform: {
    '^.+\\.(\\ts|\\tsx)$': 'ts-jest',
  },
  // Redefined the ignore pattern to be more explicit
  transformIgnorePatterns: [
    '/node_modules/(?!(superjson|next-auth|@auth/prisma-adapter|d3-.*|internmap|delaunator|robust-predicates))/',
  ],
};

module.exports = createJestConfig(customJestConfig);