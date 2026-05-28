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
		},
		csp: {
			directives: {
				'script-src': ['strict-dynamic', 'unsafe-eval', 'unsafe-inline', 'https:', 'http:'],
				'default-src': ['none'],
				'img-src': ['self', 'data:'],
				'object-src': ['none'],
				'base-uri': ['none'],
				'form-action': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'script-src-attr': ['self', 'unsafe-inline'],
				'font-src': ['self'],
				'frame-ancestors': ['none'],
				'connect-src': ['self']
			}
		}
	}
};

export default config;
