import js from "@eslint/js";
import nPlugin from "eslint-plugin-n";
import jestPlugin from "eslint-plugin-jest";
import prettier from "eslint-config-prettier";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

export default [
  // Base JS rules
  js.configs.recommended,

  // Node‑specific rules + Node globals (native flat config)
  nPlugin.configs["flat/recommended"],

  // Jest recommended rules (converted from legacy)
  ...compat.config(jestPlugin.configs.recommended),

  // Prettier last to avoid conflicts
  prettier,

  // Tell ESLint about Jest globals only in test files
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

  // Treat all .mjs files as ES modules so ESLint can parse this config itself
  {
    files: ["**/*.mjs"],
    languageOptions: { sourceType: "module" }
  },

  // Project‑specific tweaks
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  }
];
