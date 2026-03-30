import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { fail, isHttpError, redirect } from '@sveltejs/kit';
import { userAuthentication } from '$lib/server/api/auth_api';
import { setCookieFromToken } from './cookie';
import { getLogger } from '$lib/server/logger.js';
import fs from 'fs/promises';

const logger = getLogger('page /auth/login');

export const actions = {
	// Default page action / Handles POST requests
	default: async ({ request, cookies, fetch }) => {
		logger.debug('Login action');

		// Get form data
		const formData = await request.formData();
		// Set auth data
		let authData;
		try {
			authData = await userAuthentication(fetch, formData);
		} catch (error) {
			logger.debug(error);
			const errorMessage = getLoginErrorMessage(error);
			const guestUsername = publicEnv.PUBLIC_GUEST_USERNAME;
			if (guestUsername && formData.get('username') === guestUsername) {
				return fail(400, { invalidGuestMessage: errorMessage, invalid: true });
			} else {
				return fail(400, { invalidMessage: errorMessage, invalid: true });
			}
		}

		setCookieFromToken(request, cookies, authData.access_token);
		redirect(302, '/v2/projects');
	}
};

/**
 * @param {unknown} error 
 */
function getLoginErrorMessage(error) {
	if (isHttpError(error)) {
		if (error.status === 400 && error.body.message === 'LOGIN_BAD_CREDENTIALS') {
			return 'Invalid credentials';
		} else if (error.status === 404) {
			return 'Basic auth login has been disabled';
		}
	}
	return 'Unexpected error';
}

export async function load() {
	const loginInvite = await getLoginInvite();
	const hideBasicAuth = env.FRACTAL_HIDE_BASIC_AUTH === 'true';
	return {
		loginInvite,
		hideBasicAuth
	};
}

async function getLoginInvite() {
	if (!env.LOGIN_INVITE_PATH) {
		return null;
	}
	try {
		try {
			await fs.stat(env.LOGIN_INVITE_PATH);
		} catch {
			logger.error("Login invite file %s doesn't exist", env.LOGIN_INVITE_PATH);
			return null;
		}
		const inviteData = await fs.readFile(env.LOGIN_INVITE_PATH, { encoding: 'utf-8' });
		return inviteData.trim();
	} catch (err) {
		logger.error('An error happened reading login invite file %s', env.LOGIN_INVITE_PATH, err);
		return null;
	}
}