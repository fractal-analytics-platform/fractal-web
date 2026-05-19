import { env } from '$env/dynamic/private';
import { responseError } from '$lib/common/errors.server';
import { getLogger } from '$lib/server/logger.js';

const logger = getLogger('Task Group reset');

export async function load({ fetch, params }) {
	const response = await fetch(
		`${env.FRACTAL_SERVER_HOST}/api/v2/task-group/${params.taskGroupId}`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);

	if (!response.ok) {
		logger.error('Unable to fetch task groups');
		await responseError(response);
	}

	/** @type {import('fractal-components/types/api').TaskGroupV2} */
	const taskGroup = await response.json();

	return { taskGroup };
}
