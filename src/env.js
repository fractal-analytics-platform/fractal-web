import { defineEnvVars } from '@sveltejs/kit/env';

// @migration-task Review usage of dynamic environment variables. They fall back to the empty string if not present, which may not be what you want.
export const variables = defineEnvVars({
	AUTH_COOKIE_NAME: { schema: (input) => input ?? '' },
	FRACTAL_SERVER_HOST: { schema: (input) => input ?? '' },
	FRACTAL_RUNNER_BACKEND: { schema: (input) => input ?? '' },
	WARNING_BANNER_PATH: { schema: (input) => input ?? '' },
	NEWS_INFO_PATH: { schema: (input) => input ?? '' },
	PUBLIC_FRACTAL_DATA_URL: { public: true, schema: (input) => input ?? '' },
	PUBLIC_FRACTAL_VIZARR_VIEWER_URL: { public: true, schema: (input) => input ?? '' },
	PUBLIC_FRACTAL_VOLE_VIEWER_URL: { public: true, schema: (input) => input ?? '' },
	PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL: { public: true, schema: (input) => input ?? '' },
	PUBLIC_ENABLE_HELP_LINKS: { public: true, schema: (input) => input ?? '' },
	PUBLIC_HELP_LINKS_BASE_URL: { public: true, schema: (input) => input ?? '' },
	FRACTAL_DISPLAY_CORE_TASK_FILTER: { schema: (input) => input ?? '' },
	FRACTAL_DEFAULT_GROUP_NAME: { schema: (input) => input ?? '' },
	PUBLIC_UPDATE_JOBS_INTERVAL: { public: true, schema: (input) => input ?? '' },
	PUBLIC_FRACTAL_FEATURE_EXPLORER_URL: { public: true, schema: (input) => input ?? '' },
	AUTH_COOKIE_PATH: { schema: (input) => input ?? '' },
	AUTH_COOKIE_SAME_SITE: { schema: (input) => input ?? '' },
	AUTH_COOKIE_SECURE: { schema: (input) => input ?? '' },
	AUTH_COOKIE_DOMAIN: { schema: (input) => input ?? '' },
	FRACTAL_HIDE_BASIC_AUTH: { schema: (input) => input ?? '' },
	LOGIN_INVITE_PATH: { schema: (input) => input ?? '' },
	PUBLIC_GUEST_USERNAME: { public: true, schema: (input) => input ?? '' },
	PUBLIC_OAUTH_CLIENT_NAME: { public: true, schema: (input) => input ?? '' },
	PUBLIC_GUEST_PASSWORD: { public: true, schema: (input) => input ?? '' },
	LOG_LEVEL_CONSOLE: { schema: (input) => input ?? '' },
	LOG_LEVEL_FILE: { schema: (input) => input ?? '' },
	LOG_FILE: { schema: (input) => input ?? '' },
	LOG_CONFIG_FILE: { schema: (input) => input ?? '' }
});
