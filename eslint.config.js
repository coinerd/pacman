import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.es2021
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 4],
      'no-trailing-spaces': 'error',
      'comma-dangle': ['error', 'never'],
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all']
    },
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.min.js'
    ]
  }
];
