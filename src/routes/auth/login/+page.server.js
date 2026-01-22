import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { userAuthentication } from '$lib/server/api/auth_api';
import { setCookieFromToken } from './cookie';
import { getLogger } from '$lib/server/logger.js';
import fs from 'fs/promises';
import { env } from '$env/dynamic/public';

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
			const guestUsername = env.PUBLIC_GUEST_USERNAME;
			if (guestUsername && formData.get('username') === guestUsername) {
				return fail(400, { invalidGuestMessage: 'Invalid credentials', invalid: true });
			} else {
				return fail(400, { invalidMessage: 'Invalid credentials', invalid: true });
			}
		}

		setCookieFromToken(request, cookies, authData.access_token);
		redirect(302, '/v2/projects');
	}
};

export async function load() {
	const loginInvite = await getLoginInvite();
	return { loginInvite };
}

async function getLoginInvite() {
	if (!env.LOGIN_INVITE_PATH) {
		return "Log in with Fractal specific email & password provided to you by the Fractal admin";
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