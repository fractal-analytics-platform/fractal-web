import {
	FRACTAL_SERVER_HOST,
	FRACTAL_RUNNER_BACKEND,
	FRACTAL_DEFAULT_GROUP_NAME,
	AUTH_COOKIE_NAME,
	AUTH_COOKIE_SECURE,
	AUTH_COOKIE_DOMAIN,
	AUTH_COOKIE_PATH,
	AUTH_COOKIE_SAME_SITE,
	FRACTAL_HIDE_BASIC_AUTH,
	WARNING_BANNER_PATH,
	NEWS_INFO_PATH,
	LOG_CONFIG_FILE,
	LOG_FILE,
	LOG_LEVEL_FILE,
	LOG_LEVEL_CONSOLE,
	FRACTAL_DISPLAY_CORE_TASK_FILTER
} from '$app/env/private';
import {
	PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL,
	PUBLIC_UPDATE_JOBS_INTERVAL,
	PUBLIC_OAUTH_CLIENT_NAME,
	PUBLIC_FRACTAL_DATA_URL,
	PUBLIC_FRACTAL_VIZARR_VIEWER_URL,
	PUBLIC_FRACTAL_VOLE_VIEWER_URL,
	PUBLIC_FRACTAL_FEATURE_EXPLORER_URL,
	PUBLIC_GUEST_USERNAME,
	PUBLIC_GUEST_PASSWORD,
	PUBLIC_ENABLE_HELP_LINKS,
	PUBLIC_HELP_LINKS_BASE_URL
} from '$app/env/public';
import { getLogger } from '#lib/server/logger.js';
import { exit } from 'process';

const logger = getLogger('environment');

export function checkEnvironmentVariables() {
	checkCookieVariables();
	printEnvironmentVariables();
}

function printEnvironmentVariables() {
	logger.info('--------- fractal-web environment variables ---------');
	logger.info(`FRACTAL_SERVER_HOST: ${FRACTAL_SERVER_HOST}`);
	logger.info(`FRACTAL_RUNNER_BACKEND: ${FRACTAL_RUNNER_BACKEND}`);
	logger.info(`FRACTAL_DEFAULT_GROUP_NAME: ${FRACTAL_DEFAULT_GROUP_NAME}`);
	logger.info(`AUTH_COOKIE_NAME: ${AUTH_COOKIE_NAME}`);
	logger.info(`AUTH_COOKIE_SECURE: ${AUTH_COOKIE_SECURE}`);
	logger.info(`AUTH_COOKIE_DOMAIN: ${AUTH_COOKIE_DOMAIN}`);
	logger.info(`AUTH_COOKIE_PATH: ${AUTH_COOKIE_PATH}`);
	logger.info(`AUTH_COOKIE_SAME_SITE: ${AUTH_COOKIE_SAME_SITE}`);
	logger.info(`FRACTAL_HIDE_BASIC_AUTH: ${FRACTAL_HIDE_BASIC_AUTH}`);
	logger.info(`WARNING_BANNER_PATH: ${WARNING_BANNER_PATH}`);
	logger.info(`NEWS_INFO_PATH: ${NEWS_INFO_PATH}`);
	logger.info(`LOG_CONFIG_FILE: ${LOG_CONFIG_FILE}`);
	logger.info(`LOG_FILE: ${LOG_FILE}`);
	logger.info(`LOG_LEVEL_FILE: ${LOG_LEVEL_FILE}`);
	logger.info(`LOG_LEVEL_CONSOLE: ${LOG_LEVEL_CONSOLE}`);
	logger.info(`BODY_SIZE_LIMIT: ${process.env.BODY_SIZE_LIMIT || ''}`);
	logger.info(`PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL: ${PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL}`);
	logger.info(`PUBLIC_UPDATE_JOBS_INTERVAL: ${PUBLIC_UPDATE_JOBS_INTERVAL}`);
	logger.info(`PUBLIC_OAUTH_CLIENT_NAME: ${PUBLIC_OAUTH_CLIENT_NAME}`);
	logger.info(`PUBLIC_FRACTAL_DATA_URL: ${PUBLIC_FRACTAL_DATA_URL}`);
	logger.info(`PUBLIC_FRACTAL_VIZARR_VIEWER_URL: ${PUBLIC_FRACTAL_VIZARR_VIEWER_URL}`);
	logger.info(`PUBLIC_FRACTAL_VOLE_VIEWER_URL: ${PUBLIC_FRACTAL_VOLE_VIEWER_URL}`);
	logger.info(`PUBLIC_FRACTAL_FEATURE_EXPLORER_URL: ${PUBLIC_FRACTAL_FEATURE_EXPLORER_URL}`);
	logger.info(`PUBLIC_GUEST_USERNAME: ${PUBLIC_GUEST_USERNAME}`);
	logger.info(`PUBLIC_GUEST_PASSWORD: ${PUBLIC_GUEST_PASSWORD}`);
	logger.info(`PUBLIC_ENABLE_HELP_LINKS: ${PUBLIC_ENABLE_HELP_LINKS}`);
	logger.info(`PUBLIC_HELP_LINKS_BASE_URL: ${PUBLIC_HELP_LINKS_BASE_URL}`);
	logger.info(`FRACTAL_DISPLAY_CORE_TASK_FILTER: ${FRACTAL_DISPLAY_CORE_TASK_FILTER}`);
}

function checkCookieVariables() {
	if (AUTH_COOKIE_NAME && AUTH_COOKIE_NAME.startsWith('__Host-')) {
		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#cookie_prefixes
		logger.warn(
			'Support for cookie prefixes is experimental and may cause issues with fractal-data and fractal-feature-explorer'
		);
		if (AUTH_COOKIE_DOMAIN) {
			logger.error('AUTH_COOKIE_DOMAIN must not be set if cookie name prefix is __Host-');
			exit(2);
		}
		if (!AUTH_COOKIE_SECURE) {
			logger.error('AUTH_COOKIE_SECURE must be set to true if cookie name prefix is __Host-');
			exit(2);
		}
		if (AUTH_COOKIE_PATH !== '/') {
			logger.error('AUTH_COOKIE_PATH must be set to / if cookie name prefix is __Host-');
			exit(2);
		}
	} else {
		if (!AUTH_COOKIE_DOMAIN && (!process.env.NODE_ENV || process.env.NODE_ENV === 'production')) {
			logger.warn('AUTH_COOKIE_DOMAIN must be set when running in production');
		}
	}
}
