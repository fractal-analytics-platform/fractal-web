import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			'fractal-components': './components/src/lib'
		}
	},
	compilerOptions: {
		// allow accessing private object properties in unit tests
		accessors: !!process.env.TEST
	}
};

export default config;
