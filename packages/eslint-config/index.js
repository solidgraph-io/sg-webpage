import tseslint from 'typescript-eslint';

export default tseslint.config(tseslint.configs.strict, {
  rules: {
    'no-console': 'warn',
  },
});
