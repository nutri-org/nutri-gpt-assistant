import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jestPlugin from "eslint-plugin-jest";
import nodePlugin from "eslint-plugin-node";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

export default [
  js.configs.recommended,

  // ✅ Convert each legacy object, no “globals” left behind
  ...compat.config(jestPlugin.configs.recommended),
  ...compat.config(nodePlugin.configs.recommended),

  prettier,                       // always last

  // Jest globals only in test files
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        beforeEach: "readonly",
        expect: "readonly"
      }
    }
  },

  // Project‑specific tweaks
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "node/no-unsupported-features/es-syntax": "off",
      "node/no-deprecated-api": "off"   // temporary v9 workaround
    }
  }
];
