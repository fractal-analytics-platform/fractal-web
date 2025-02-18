import { listUsers, logout } from '$lib/server/api/auth_api.js';
import { userImpersonation } from '$lib/server/api/v2/admin_api';
import { getLogger } from '$lib/server/logger.js';
import { fail, isHttpError, redirect } from '@sveltejs/kit';
import { setCookieFromToken } from '../../../auth/login/cookie';

const logger = getLogger('impersonate user page');

export async function load({ fetch }) {
	logger.trace('Loading impersonate user page');

	const users = await listUsers(fetch);

	return {
		users
	};
}

export const actions = {
	// Default page action / Handles POST requests
	default: async ({ request, cookies, fetch }) => {
		logger.debug('Impersonate action');

		await logout(fetch);

		// Get form data
		const formData = await request.formData();
		const userId = Number(formData.get('user_id'));
		// Set auth data
		let authData;
		try {
			authData = await userImpersonation(fetch, userId);
		} catch (error) {
			const invalidMessage = isHttpError(error) ? error.body.message : 'Error during impersonation';
			return fail(400, { invalidMessage, invalid: true });
		}

		setCookieFromToken(request, cookies, authData.access_token);
		redirect(302, '/v2/projects');
	}
};
