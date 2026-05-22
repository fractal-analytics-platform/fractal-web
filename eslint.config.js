// eslint.config.js
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: [
			'**/.DS_Store',
			'**/node_modules',
			'build',
			'components/build',
			'components/.svelte-kit',
			'coverage-unit',
			'sandbox/.svelte-kit',
			'sandbox/build',
			'tasks-list/.svelte-kit',
			'tasks-list/build',
			'templates-list/.svelte-kit',
			'templates-list/build',
			'site',
			'.svelte-kit',
			'package',
			'**/.env',
			'**/.env.*',
			'!**/.env.example',
			'**/*.d.ts',
			'venv',
			'**/pnpm-lock.yaml',
			'**/package-lock.json',
			'**/yarn.lock',
			'local'
		]
	},
	js.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node // Add this if you are using SvelteKit in non-SPA mode
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				// We recommend importing and specifying svelte.config.js.
				// By doing so, some rules in eslint-plugin-svelte will automatically read the configuration and adjust their behavior accordingly.
				// While certain Svelte settings may be statically loaded from svelte.config.js even if you don’t specify it,
				// explicitly specifying it ensures better compatibility and functionality.
				svelteConfig
			}
		}
	},
	{
		rules: {
			//  deprecated and replaced by svelte/no-navigation-without-resolve rule.
			'svelte/no-navigation-without-base': ['off'],
			// disabled due to large number of false positive with simple classes (e.g. Date)
			'svelte/prefer-svelte-reactivity': ['off'],
			'svelte/no-navigation-without-resolve': [
				'error',
				{
					ignoreGoto: false,
					ignoreLinks: true,
					ignorePushState: false,
					ignoreReplaceState: false
				}
			]
		}
	}
];
