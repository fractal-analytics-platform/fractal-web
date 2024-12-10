import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/.DS_Store",
        "**/node_modules",
        "build",
        "components/build",
        "components/.svelte-kit",
        "coverage-unit",
        "sandbox",
        "tasks-list",
        "site",
        ".svelte-kit",
        "package",
        "**/.env",
        "**/.env.*",
        "!**/.env.example",
        "**/*.d.ts",
        "venv",
        "**/pnpm-lock.yaml",
        "**/package-lock.json",
        "**/yarn.lock",
        "local",
    ],
}, ...compat.extends("eslint:recommended", "plugin:svelte/recommended", "prettier"), {
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        ecmaVersion: 2020,
        sourceType: "module",

        parserOptions: {
            extraFileExtensions: [".svelte"],
        },
    },
}];