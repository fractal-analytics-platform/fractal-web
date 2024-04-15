import { greatestVersionAsc, greatestVersionDesc } from '$lib/common/component_utilities';
import { AlertError } from '$lib/common/errors';

/**
 * @param {import('$lib/types').Task} task
 * @param {boolean|false=} v2
 * @returns {Promise<import('$lib/types').Task[]>} the list of update candidates for the given task
 */
export async function getNewVersions(task, v2) {
	const updateCandidates = await getAllNewVersions([task], v2);
	return updateCandidates[task.id];
}

/**
 * @param {import('$lib/types').Task[]} tasks
 * @param {boolean|false=} v2
 * @returns {Promise<{ [id: string]: import('$lib/types').Task[] }>} the list of update candidates, for each task received as input
 */
export async function getAllNewVersions(tasks, v2 = false) {
	const response = await fetch(v2 ? `/api/v2/task-legacy` : `/api/v1/task`);

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
