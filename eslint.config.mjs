
import js from "@eslint/js";
import node from "eslint-plugin-node";
import jest from "eslint-plugin-jest";
import prettier from "eslint-config-prettier";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const compat     = new FlatCompat({ baseDirectory: __dirname });

export default [
  js.configs.recommended,
  node.configs.recommended,

  // Convert the legacy Jest preset on‑the‑fly ➜ no "globals" crash
  ...compat.config({ extends: ["plugin:jest/recommended"] }),

  prettier,                         // always last

  // Jest globals only for test files
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        jest:       "readonly",
        describe:   "readonly",
        test:       "readonly",
        beforeEach: "readonly",
        expect:     "readonly"
      }
    }
  },

  // Custom project rules
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "node/no-unsupported-features/es-syntax": "off"
    }
  }
];
