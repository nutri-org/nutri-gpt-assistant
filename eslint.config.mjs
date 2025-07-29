
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  js.configs.recommended,

  // Use compat for ALL legacy plugins to avoid "globals" key issues
  ...compat.config({
    extends: [
      "plugin:node/recommended",
      "plugin:jest/recommended",
      "prettier"
    ]
  }),

  // Jest globals only for test files
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

  // Project-specific tweaks
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "node/no-unsupported-features/es-syntax": "off",
      "node/no-deprecated-api": "off"   // temporary v9 workaround
    }
  }
];
