/**
 * ESLint config for the API project (Req 27.3, 27.5).
 * Uses @typescript-eslint for TypeScript-aware linting. Kept as a classic
 * .eslintrc so it works with the pinned ESLint 8 toolchain.
 */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // Warn on unused vars but allow intentional `_`-prefixed args.
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // API uses a structured logger; console allowed in bootstrap/tests.
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
