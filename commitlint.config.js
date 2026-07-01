/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'layout',
        'atom',
        'molecule',
        'block',
        'content',
        'cms',
        'form',
        'seo',
        'a11y',
        'perf',
        'analytics',
        'infra',
      ],
    ],
    'footer-max-line-length': [0],
  },
};
