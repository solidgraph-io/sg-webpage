import solidgraphConfig from '@solidgraph/eslint-config';

export default [
  ...solidgraphConfig,
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
];
