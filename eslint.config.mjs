import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextPlugin.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ...tseslint.configs.recommended,
    ...nextPlugin.configs["core-web-vitals"],
  }
);