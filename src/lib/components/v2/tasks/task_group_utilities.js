import { getAlertErrorFromResponse } from '$lib/common/errors';

/**
 * Fetches a task collection from the server
 * @param {number} taskGroupActivityId
 * @returns {Promise<import('fractal-components/types/api').TaskGroupActivityV2|undefined>}
 */
async function getTaskActivity(taskGroupActivityId) {
	const response = await fetch(`/api/v2/task-group/activity/${taskGroupActivityId}`, {
		method: 'GET',
		credentials: 'include'
	});
	if (response.ok) {
		return await response.json();
	} else {
		if (response.status === 404) {
			console.log('Missing task collection %d', taskGroupActivityId);
			return undefined;
		} else {
			console.error('Failed to fetch task-group activity');
			throw await getAlertErrorFromResponse(response);
		}
	}
}

/**
 * Fetches a task collection from the server
 * @param {number} taskGroupActivityId
 * @returns {Promise<import('fractal-components/types/api').TaskGroupActivityV2|undefined>}
 */
async function getAdminTaskActivity(taskGroupActivityId) {
	const response = await fetch(
		`/api/admin/v2/task-group/activity?task_group_activity_id=${taskGroupActivityId}`,
		{
			method: 'GET',
			credentials: 'include'
		}
	);
	if (response.ok) {
		/** @type {import('fractal-components/types/api').TaskGroupActivityV2[]} */
		const activities = await response.json();
		if (activities.length === 0) {
			return undefined;
		}
		return activities[0];
	}
	console.error('Failed to fetch task-group activity');
	throw await getAlertErrorFromResponse(response);
}

/**
 * @param {import('fractal-components/types/api').TaskGroupActivityV2[]} activities
 * @param {boolean} admin
 * @returns {Promise<import('fractal-components/types/api').TaskGroupActivityV2[]>}
 */
export async function getTaskGroupActivitiesToUpdate(activities, admin) {
	const activitiesToCheck = activities.filter((a) => a.status !== 'OK' && a.status !== 'failed');
	if (activitiesToCheck.length === 0) {
		return [];
	}

	const updates = await Promise.allSettled(
		activitiesToCheck.map((a) => (admin ? getAdminTaskActivity(a.id) : getTaskActivity(a.id)))
	);

	const failure = /** @type {PromiseRejectedResult|undefined} */ (
		updates.find((u) => u.status === 'rejected')
	);
	if (failure) {
		console.error(failure.reason);
	}

	const successfulUpdates =
		/** @type {PromiseFulfilledResult<import('fractal-components/types/api').TaskGroupActivityV2|undefined>[]} */ (
			updates.filter((u) => u.status === 'fulfilled')
		)
			.map((u) => u.value)
			.filter((u) => u !== undefined);

	return /** @type {import('fractal-components/types/api').TaskGroupActivityV2[]} */ (successfulUpdates);
}
