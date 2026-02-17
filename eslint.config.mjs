import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".contentlayer/**",
    "extension/dist/**",
  ]),
  {
    files: [
      "src/app/privacy/page.tsx",
      "src/app/terms/page.tsx",
    ],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: [
      "src/components/changelog/changelog-entry.tsx",
    ],
    rules: {
      "react-hooks/static-components": "off",
    },
  },
  {
    files: [
      "src/lib/logger.ts",
      "src/lib/metadata.ts",
      "extension/create-icons.js",
      "extension/webpack.config.js",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
