import { getAlertErrorFromResponse } from '$lib/common/errors';
import { greatestVersionAsc, greatestVersionDesc } from 'fractal-components/common/version';

/**
 * @param {import('fractal-components/types/api').TaskV2} task
 * @returns {Promise<{
 *  updateCandidates: Array<import('fractal-components/types/api').TaskV2 & { version: string }>
 *  enrichedTask: import('fractal-components/types/api').TaskV2 & { version: string | null, pkg_name: string }
 * }>} updateCandidates is the list of update candidates for the given task,
 * enrichedTask it the task passed as input with additional fields extracted from related task group
 */
export async function getNewVersions(task) {
	const { updateCandidates, enrichedTasks } = await getAllNewVersions([task]);
	return {
		updateCandidates: updateCandidates[task.id],
		enrichedTask: enrichedTasks[0]
	};
}

/**
 * @param {import('fractal-components/types/api').TaskV2[]} tasks list of tasks inserted into a workflow
 * @returns {Promise<{
 *  updateCandidates: { [id: string]: Array<import('fractal-components/types/api').TaskV2 & { version: string }> }
 *  enrichedTasks: Array<import('fractal-components/types/api').TaskV2 & { version: string | null, pkg_name: string }>
 * }>} updateCandidates is a map having tasks ids as keys and update candidates list as values;
 * enrichedTasks is the list of tasks passed as input with additional fields extracted from related task groups
 */
export async function getAllNewVersions(tasks) {
	const response = await fetch(`/api/v2/task-group?only_active=false`);

	if (!response.ok) {
		throw await getAlertErrorFromResponse(response);
	}

	/** @type {import('fractal-components/types/api').TaskGroupV2[]} */
	const taskGroups = await response.json();

	const enrichedTasks = tasks.map((t) => {
		const taskGroup = /** @type {import('fractal-components/types/api').TaskGroupV2} */ (
			taskGroups.find((tg) => tg.id === t.taskgroupv2_id)
		);
		return {
			...t,
			version: taskGroup.version,
			pkg_name: taskGroup.pkg_name
		};
	});

	const updateCandidates = enrichedTasks.reduce(function (map, task) {
		map[task.id] = taskGroups
			.flatMap((tg) =>
				tg.task_list.map((t) => ({
					...t,
					version: tg.version,
					pkg_name: tg.pkg_name,
					active: tg.active
				}))
			)
			.filter((t) => {
				return (
					(task.args_schema_non_parallel || task.args_schema_parallel) &&
					(t.args_schema_non_parallel || t.args_schema_parallel) &&
					task.version &&
					t.version &&
					t.name === task.name &&
					isTaskTypeCompatible(t, task) &&
					t.pkg_name === task.pkg_name &&
					greatestVersionAsc(t.version, task.version) === 1 &&
					t.active
				);
			})
			.sort((t1, t2) => greatestVersionDesc(t1.version, t2.version));
		return map;
	}, {});

	return {
		updateCandidates,
		enrichedTasks
	};
}

/**
 * @param {import('fractal-components/types/api').TaskV2} task1
 * @param {import('fractal-components/types/api').TaskV2} task2
 * @returns {boolean}
 */
function isTaskTypeCompatible(task1, task2) {
	return (
		task1.type === task2.type ||
		(task1.type === 'compound' && task2.type === 'converter_compound') ||
		(task1.type === 'converter_compound' && task2.type === 'compound') ||
		(task1.type === 'non_parallel' && task2.type === 'converter_non_parallel') ||
		(task1.type === 'converter_non_parallel' && task2.type === 'non_parallel')
	);
}
