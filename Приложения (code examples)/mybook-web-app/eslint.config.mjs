import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'semi': ['error', 'always'],
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
  },
});
