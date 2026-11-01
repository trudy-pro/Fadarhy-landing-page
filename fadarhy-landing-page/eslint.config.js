import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", ".cache/", "src/routeTree.gen.ts"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { window: true, document: true },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "This stack does not use the Next.js \`server-only\` package. If the module is server-only, rename the file to *.server.ts; otherwise remove the import.",
            },
            {
              name: "next",
              message: "Next.js is not available in this stack. Use TanStack Router + Vite primitives instead.",
            },
            {
              name: "next/link",
              message: "Use \`<Link>\` from \`@tanstack/react-router\` (with typed \`to\` + \`params\`) instead of next/link.",
            },
            {
              name: "next/navigation",
              message: "Use \`useNavigate()\` from \`@tanstack/react-router\` instead of next/navigation.",
            },
          ],
        },
      ],
    },
  },
);
