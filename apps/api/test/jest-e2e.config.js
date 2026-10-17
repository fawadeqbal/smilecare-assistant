/**
 * End-to-end tests run the real NestJS app against PostgreSQL (pgvector) and Redis,
 * with Claude replaced by a scripted fake. Start the stores first: `pnpm infra:up`.
 */
module.exports = {
  rootDir: '..',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testEnvironment: 'node',
  testTimeout: 30000,
};
