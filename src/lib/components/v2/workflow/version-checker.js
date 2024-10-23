import { greatestVersionAsc, greatestVersionDesc } from '$lib/common/component_utilities';
import { AlertError } from '$lib/common/errors';

/**
 * @param {import('$lib/types-v2').TaskV2} task
 * @returns {Promise<import('$lib/types-v2').TaskV2[]>} the list of update candidates for the given task
 */
export async function getNewVersions(task) {
	const updateCandidates = await getAllNewVersions([task]);
	return updateCandidates[task.id];
}

/**
 * @param {import('$lib/types-v2').TaskV2[]} tasks
 * @returns {Promise<{ [id: string]: import('$lib/types-v2').TaskV2[] }>} the list of update candidates, for each task received as input
 */
export async function getAllNewVersions(tasks) {
	const response = await fetch(`/api/v2/task-group?only_active=true`);

	if (!response.ok) {
		throw new AlertError(await response.json());
	}

	/** @type {import('$lib/types-v2').TaskGroupV2[]} */
	const taskGroups = await response.json();

	const tasksWithPackage = tasks.map((t) => ({
		...t,
		pkg_name: taskGroups.find((tg) => tg.id === t.taskgroupv2_id)?.pkg_name
	}));

	return tasksWithPackage.reduce(function (map, task) {
		map[task.id] = taskGroups
			.flatMap((tg) => tg.task_list.map((t) => ({ ...t, pkg_name: tg.pkg_name })))
			.filter((t) => {
				return (
					(task.args_schema_non_parallel !== null || task.args_schema_parallel !== null) &&
					task.version !== null &&
					t.name === task.name &&
					t.type === task.type &&
					t.version &&
					(t.args_schema_non_parallel || t.args_schema_parallel) &&
					t.pkg_name === task.pkg_name &&
					greatestVersionAsc(t, task) === 1
				);
			})
			.sort(greatestVersionDesc);
		return map;
	}, {});
}
