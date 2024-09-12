import { fail, redirect } from '@sveltejs/kit';
import { userAuthentication } from '$lib/server/api/auth_api';
import { setCookieFromToken } from './cookie';
import { getLogger } from '$lib/server/logger.js';

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
			return fail(400, { invalidMessage: 'Invalid credentials', invalid: true });
		}

		setCookieFromToken(request, cookies, authData.access_token);
		throw redirect(302, '/v2/projects');
	}
};
