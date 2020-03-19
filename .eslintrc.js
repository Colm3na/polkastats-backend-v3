module.exports = {
  parserOptions: {
    ecmaVersion: 2017,
  },

  env: {
    es2017: true,
    node: true,
  },

  extends: ['eslint:recommended', 'prettier'],

  rules: {
    // ERROR
    'no-var': 'error',
    'lines-between-class-members': ['error', 'always'],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'block-like', next: '*' },
      { blankLine: 'always', prev: 'function', next: 'function' },
    ],
    'newline-before-return': 'error',
    'object-shorthand': 'error',
    'space-before-blocks': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // WARNING
    'guard-for-in': 'warn',
    'no-console': 'warn',
  },
};
