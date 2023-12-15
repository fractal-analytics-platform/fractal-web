import { fail, redirect } from '@sveltejs/kit';
import { userAuthentication } from '$lib/server/api/v1/auth_api';
import { setCookieFromToken } from './cookie';

export const actions = {
	// Default page action / Handles POST requests
	default: async ({ request, cookies, fetch }) => {
		console.log('Login action');

		// Get form data
		const formData = await request.formData();
		// Set auth data
		let authData;
		try {
			authData = await userAuthentication(fetch, formData);
		} catch (error) {
			console.error(error);
			return fail(400, { invalidMessage: 'Invalid credentials', invalid: true });
		}

		setCookieFromToken(request, cookies, authData.access_token);
		throw redirect(302, '/projects');
	}
};
