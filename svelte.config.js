import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			'fractal-components': './components/src/lib'
		},
		typescript: {
			// Customize generated .svelte-kit/tsconfig.json
			config: (/** @type {Record<string, any>} */ cfg) => {
				// Add __tests__ folder to includes list
				cfg.include.push('../__tests__/**/*.js');
				// Add extra matchers to Assertion<HTMLElement>
				cfg.compilerOptions.types = ['@testing-library/jest-dom'];
				return cfg;
			}
		}
	}
};

export default config;
