import { greatestVersionAsc, greatestVersionDesc } from '$lib/common/component_utilities';
import { AlertError } from '$lib/common/errors';

/**
 * @param {import('$lib/types').Task} task
 * @param {'v1'|'v2'} apiVersion
 * @returns {Promise<import('$lib/types').Task[]>} the list of update candidates for the given task
 */
export async function getNewVersions(task, apiVersion) {
	const updateCandidates = await getAllNewVersions([task], apiVersion);
	return updateCandidates[task.id];
}

/**
 * @param {import('$lib/types').Task[]} tasks
 * @param {'v1'|'v2'} apiVersion
 * @returns {Promise<{ [id: string]: import('$lib/types').Task[] }>} the list of update candidates, for each task received as input
 */
export async function getAllNewVersions(tasks, apiVersion) {
	console.log('Checking for new versions');
	const response = await fetch(`/api/${apiVersion}/task`);

	if (!response.ok) {
		throw new AlertError(await response.json());
	}

	/** @type {import('$lib/types').Task[]} */
	const result = await response.json();

	return tasks.reduce(function (map, task) {
		map[task.id] = result
			.filter((t) => {
				return (
					task.args_schema !== null &&
					task.version !== null &&
					t.name === task.name &&
					t.owner === task.owner &&
					t.version &&
					t.args_schema &&
					greatestVersionAsc(t, task) === 1
				);
			})
			.sort(greatestVersionDesc);
		return map;
	}, {});
}
