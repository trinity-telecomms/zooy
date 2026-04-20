import { defineConfig } from "vite-plus";
import { resolve } from "path";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "react"],
    categories: {
      correctness: "warn",
    },
    env: {
      browser: true,
      es2026: true,
    },
    globals: {
      mdc: "readonly",
    },
    ignorePatterns: ["node_modules/**", "build/**", "dist/**", "demo/**", "main.js", "**/*.min.js"],
    rules: {
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-case-declarations": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-import-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-new-native-nonconstructor": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-prototype-builtins": "error",
      "no-redeclare": "error",
      "no-regex-spaces": "error",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-unassigned-vars": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": "error",
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "no-with": "error",
      "preserve-caught-error": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-throw-literal": "error",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "warn",
      "no-useless-constructor": "warn",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "off",
    },
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/main.js"),
      name: "zooy",
      fileName: (format) => `zooy.${format}.js`,
      formats: ["es", "cjs"],
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // Don't bundle dependencies — let the consuming project resolve them.
      // This prevents Rollup from creating wrapper chunks with side-effect
      // imports that can silently fail in Vite dev mode.
      external: [
        "badu",
        "ramda",
        "lit",
        /^lit\//,
        /^@carbon\/web-components/,
        /^@carbon\/icons/,
        /^@ibm\/plex/,
        /^material-components-web/,
      ],
      // Suppress warnings for intentional design patterns
      onwarn(warning, warn) {
        // Ignore eval warning - used intentionally in evalScripts for dynamic script execution
        if (warning.code === "EVAL" && warning.id?.includes("src/dom/utils.js")) {
          return;
        }
        // Ignore mixed exports warning - main.js intentionally exports both named and default for backward compatibility
        if (warning.code === "MIXED_EXPORTS" && warning.id?.includes("src/main.js")) {
          return;
        }
        // Use default warning handler for all other warnings
        warn(warning);
      },
      output: {
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
    minify: "esbuild",
  },
});
