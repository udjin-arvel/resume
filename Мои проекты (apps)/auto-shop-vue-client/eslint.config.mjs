import { createConfigForNuxt } from "@nuxt/eslint-config/flat"

export default createConfigForNuxt({
  features: {
    stylistic: {
      semi: false,
      indent: 2,
      quotes: "double",
      printWidth: 120,
      bracketSameLine: true,
    },
  },
}).append({
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "vue/no-multiple-template-root": "off",
    "curly": ["error", "all"],
  },
})
