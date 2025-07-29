import js from "@eslint/js";
import node from "eslint-plugin-node";
import jest from "eslint-plugin-jest";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  node.configs.recommended,
  jest.configs.recommended,
  prettier,
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
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "node/no-unsupported-features/es-syntax": "off"
    }
  }
];