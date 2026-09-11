// Isolated runner: no next/jest, dotenv, shared setup or real services.
module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/admin-access-upload/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  transform: { '^.+\\.tsx?$': '<rootDir>/tests/admin-access-upload/transform.cjs' },
};
