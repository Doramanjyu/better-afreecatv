const globals = require('globals')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const js = require('@eslint/js')

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.browser,
        $: 'readonly',
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
  },
  eslintPluginPrettierRecommended,
]
