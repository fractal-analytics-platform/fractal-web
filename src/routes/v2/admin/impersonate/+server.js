import { logout } from '#lib/server/api/auth_api.js';
import { userImpersonation } from '#lib/server/api/v2/admin_api.js';
import { getLogger } from '#lib/server/logger.js';
import { isHttpError } from '@sveltejs/kit';
import { setCookieFromToken } from '../../../auth/login/cookie';

const logger = getLogger('POST /v2/admin/impersonate');

export const POST = async function ({ request, cookies, fetch }) {
	await logout(fetch);

	const { userId } = await request.json();
	logger.debug(`Executing impersonation of ${userId}`);

	let authData;
	try {
		authData = await userImpersonation(fetch, userId);
	} catch (error) {
		const invalidMessage = isHttpError(error) ? error.body.message : 'Error during impersonation';
		return Response.json({ invalidMessage, invalid: true }, { status: 400 });
	}

	setCookieFromToken(request, cookies, authData.access_token);
	return Response.json({ invalid: false }, { status: 200 });
};
