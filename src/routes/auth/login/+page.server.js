import { FRACTAL_HIDE_BASIC_AUTH, LOGIN_INVITE_PATH } from '$app/env/private';
import { getLogger } from '#lib/server/logger.js';
import fs from 'fs/promises';

const logger = getLogger('page /auth/login');

export async function load() {
	const loginInvite = await getLoginInvite();
	return { loginInvite, hideBasicAuth: FRACTAL_HIDE_BASIC_AUTH };
}

async function getLoginInvite() {
	if (!LOGIN_INVITE_PATH) {
		return null;
	}
	try {
		try {
			await fs.stat(LOGIN_INVITE_PATH);
		} catch {
			logger.error("Login invite file %s doesn't exist", LOGIN_INVITE_PATH);
			return null;
		}
		const inviteData = await fs.readFile(LOGIN_INVITE_PATH, { encoding: 'utf-8' });
		return inviteData.trim();
	} catch (err) {
		logger.error('An error happened reading login invite file %s', LOGIN_INVITE_PATH, err);
		return null;
	}
}
