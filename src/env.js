import { defineEnvVars } from '@sveltejs/kit/env';

const logLevels = ['all', 'mark', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off'];

export const variables = defineEnvVars({
	AUTH_COOKIE_NAME: {
		schema: (input) => {
			return input ?? 'fastapiusersauth';
		}
	},
	FRACTAL_SERVER_HOST: {
		schema: (input) => {
			if (!input) {
				throw new Error('Environment variable FRACTAL_SERVER_HOST is mandatory');
			}
			if (input.endsWith('/')) {
				input = input.substring(0, input.length - 1);
			}
			checkUrl('FRACTAL_SERVER_HOST', input);
			return input;
		}
	},
	FRACTAL_RUNNER_BACKEND: {
		schema: (input) => {
			if (!input) {
				throw new Error('Environment variable FRACTAL_RUNNER_BACKEND is mandatory');
			}
			checkAllowedValues('FRACTAL_RUNNER_BACKEND', input, ['local', 'slurm_sudo', 'slurm_ssh']);
			return /** @type {'local'|'slurm_sudo'|'slurm_ssh'} */ (input);
		}
	},
	WARNING_BANNER_PATH: { schema: (input) => input ?? '' },
	NEWS_INFO_PATH: { schema: (input) => input ?? '' },
	PUBLIC_FRACTAL_DATA_URL: {
		public: true,
		schema: (input) => {
			input = addFinalSlash(input);
			checkUrl('PUBLIC_FRACTAL_DATA_URL', input);
			return input;
		}
	},
	PUBLIC_FRACTAL_VIZARR_VIEWER_URL: {
		public: true,
		schema: (input) => {
			input = addFinalSlash(input);
			checkUrl('PUBLIC_FRACTAL_VIZARR_VIEWER_URL', input);
			return input;
		}
	},
	PUBLIC_FRACTAL_VOLE_VIEWER_URL: {
		public: true,
		schema: (input) => {
			input = addFinalSlash(input);
			checkUrl('PUBLIC_FRACTAL_VOLE_VIEWER_URL', input);
			return input;
		}
	},
	PUBLIC_FRACTAL_FEATURE_EXPLORER_URL: {
		public: true,
		schema: (input) => {
			input = addFinalSlash(input);
			checkUrl('PUBLIC_FRACTAL_FEATURE_EXPLORER_URL', input);
			return input;
		}
	},
	PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL: { public: true, schema: (input) => input ?? '' },
	PUBLIC_ENABLE_HELP_LINKS: {
		public: true,
		schema: (input) => {
			checkAllowedValues('PUBLIC_ENABLE_HELP_LINKS', input, ['true', 'false']);
			return input === 'true';
		}
	},
	PUBLIC_HELP_LINKS_BASE_URL: { public: true, schema: (input) => input ?? '/help' },
	FRACTAL_DISPLAY_CORE_TASK_FILTER: {
		schema: (input) => {
			checkAllowedValues('FRACTAL_DISPLAY_CORE_TASK_FILTER', input, ['true', 'false']);
			return input !== 'false';
		}
	},
	FRACTAL_DEFAULT_GROUP_NAME: {
		schema: (input) => {
			checkAllowedValues('FRACTAL_DEFAULT_GROUP_NAME', input, ['All']);
			return input;
		}
	},
	PUBLIC_UPDATE_JOBS_INTERVAL: {
		public: true,
		schema: (input) => {
			return input ? parseInt(input) : 3000;
		}
	},
	AUTH_COOKIE_PATH: { schema: (input) => input ?? '/' },
	AUTH_COOKIE_SAME_SITE: {
		schema: (input) => {
			checkAllowedValues('AUTH_COOKIE_SAME_SITE', input, ['lax', 'strict', 'none']);
			return /** @type {'lax' | 'strict' | 'none'} */ (input) ?? 'lax';
		}
	},
	AUTH_COOKIE_SECURE: {
		schema: (input) => {
			checkAllowedValues('AUTH_COOKIE_SECURE', input, ['true', 'false']);
			return input !== 'false';
		}
	},
	AUTH_COOKIE_DOMAIN: { schema: (input) => input ?? '' },
	FRACTAL_HIDE_BASIC_AUTH: {
		schema: (input) => {
			checkAllowedValues('FRACTAL_HIDE_BASIC_AUTH', input, ['true', 'false']);
			return input === 'true';
		}
	},
	LOGIN_INVITE_PATH: { schema: (input) => input ?? '' },
	PUBLIC_GUEST_USERNAME: { public: true, schema: (input) => input ?? '' },
	PUBLIC_OAUTH_CLIENT_NAME: { public: true, schema: (input) => input ?? '' },
	PUBLIC_GUEST_PASSWORD: { public: true, schema: (input) => input ?? '' },
	LOG_LEVEL_CONSOLE: {
		schema: (input) => {
			checkAllowedValues('LOG_LEVEL_CONSOLE', input, logLevels);
			return input ?? 'warn';
		}
	},
	LOG_LEVEL_FILE: {
		schema: (input) => {
			checkAllowedValues('LOG_LEVEL_FILE', input, logLevels);
			return input ?? 'info';
		}
	},
	LOG_FILE: { schema: (input) => input ?? '' },
	LOG_CONFIG_FILE: { schema: (input) => input ?? '' }
});

/**
 * @param {string} key
 * @param {any} value
 * @param {string[]} allowedValues
 */
function checkAllowedValues(key, value, allowedValues) {
	if (value) {
		for (const v of allowedValues) {
			if (v === value) {
				return;
			}
		}
		throw new Error(
			`Environment variable ${key} has invalid value "${value}". Allowed values are: ${allowedValues.map((v) => `"${v}"`).join(', ')}`
		);
	}
}

/**
 * @param {string} key
 * @param {string|undefined} input
 */
function checkUrl(key, input) {
	if (input) {
		try {
			new URL(input);
		} catch {
			throw new Error(`Environment variable ${key} is not a valid URL. Received "${input}"`);
		}
	}
}

/**
 * Add a slash to the end of the URL, if needed.
 * @param {string|undefined} url
 */
function addFinalSlash(url) {
	if (!url) {
		return undefined;
	}
	return url.replace(/\/$|$/, '/');
}
