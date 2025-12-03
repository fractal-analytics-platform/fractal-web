import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { getLogger } from '$lib/server/logger';
import { exit } from 'process';

const logger = getLogger('environment');

const keys = [
	'FRACTAL_SERVER_HOST',
	'FRACTAL_RUNNER_BACKEND',
	'FRACTAL_DEFAULT_GROUP_NAME',
	'AUTH_COOKIE_NAME',
	'AUTH_COOKIE_SECURE',
	'AUTH_COOKIE_DOMAIN',
	'AUTH_COOKIE_PATH',
	'AUTH_COOKIE_SAME_SITE',
	'WARNING_BANNER_PATH',
	'NEWS_INFO_PATH',
	'LOG_FILE',
	'LOG_LEVEL_FILE',
	'LOG_LEVEL_CONSOLE',
	'BODY_SIZE_LIMIT',
	'PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL',
	'PUBLIC_UPDATE_JOBS_INTERVAL',
	'PUBLIC_OAUTH_CLIENT_NAME',
	'PUBLIC_FRACTAL_DATA_URL',
	'PUBLIC_FRACTAL_VIZARR_VIEWER_URL',
	'PUBLIC_FRACTAL_FEATURE_EXPLORER_URL'
];

const logLevels = ['all', 'mark', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off'];

export function checkEnvironmentVariables() {
	checkRunnerBackend();
	checkServerHost();
	checkAllowedValues('FRACTAL_DEFAULT_GROUP_NAME', ['All']);
	checkAllowedValues('AUTH_COOKIE_SECURE', ['true', 'false']);
	checkAllowedValues('AUTH_COOKIE_SAME_SITE', ['lax', 'strict', 'none']);
	checkAllowedValues('LOG_LEVEL_FILE', logLevels);
	checkAllowedValues('LOG_LEVEL_CONSOLE', logLevels);
	checkUrl('PUBLIC_FRACTAL_DATA_URL');
	checkUrl('PUBLIC_FRACTAL_VIZARR_VIEWER_URL');
	checkUrl('PUBLIC_FRACTAL_FEATURE_EXPLORER_URL');
	printEnvironmenVariables();
}

function checkRunnerBackend() {
	if (!env.FRACTAL_RUNNER_BACKEND) {
		logger.error('Environment variable FRACTAL_RUNNER_BACKEND is mandatory');
		exit(2);
	}
	checkAllowedValues('FRACTAL_RUNNER_BACKEND', ['local', 'slurm_sudo', 'slurm_ssh']);
}

/**
 * @param {string} key
 * @param {string[]} values
 */
function checkAllowedValues(key, values) {
	const value = env[key];
	if (value) {
		for (const v of values) {
			if (v === value) {
				return;
			}
		}
		logger.error(
			'Environment variable %s has invalid value "%s". Allowed values are: %s',
			key,
			value,
			values.map((v) => `"${v}"`).join(', ')
		);
		exit(2);
	}
}

function checkServerHost() {
	if (!env.FRACTAL_SERVER_HOST) {
		logger.error('Environment variable FRACTAL_SERVER_HOST is mandatory');
		exit(2);
	}
	if (env.FRACTAL_SERVER_HOST.endsWith('/')) {
		env.FRACTAL_SERVER_HOST = env.FRACTAL_SERVER_HOST.substring(
			0,
			env.FRACTAL_SERVER_HOST.length - 1
		);
		logger.trace(
			'Removing final slash from FRACTAL_SERVER_HOST, new value is %s',
			env.FRACTAL_SERVER_HOST
		);
	}
	checkUrl('FRACTAL_SERVER_HOST');
}

/**
 * @param {string} key
 */
function checkUrl(key) {
	const value = getValue(key);
	if (value) {
		try {
			new URL(value);
		} catch {
			logger.error('Environment variable %s is not a valid URL. Received "%s"', key, value);
			exit(2);
		}
	}
}

function printEnvironmenVariables() {
	logger.info('--------- fractal-web environment variables ---------');
	for (const key of keys) {
		logger.info('%s: %s', key, getValue(key) || '');
	}
}

/**
 * @param {string} key
 */
function getValue(key) {
	if (key.startsWith('PUBLIC_')) {
		return publicEnv[key];
	}
	return env[key];
}
