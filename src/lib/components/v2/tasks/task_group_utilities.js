import { formatMarkdown } from '$lib/common/component_utilities';
import { getAlertErrorFromResponse } from '$lib/common/errors';
import compareLoose from 'semver/functions/compare-loose';

/**
 * @param {import('$lib/types-v2').TaskGroupV2[]} taskGroups
 * @param {string} groupBy
 * @returns {import('$lib/types-v2').WorkflowTasksTableRowGroup[]}
 */
export function buildWorkflowTaskTableRows(taskGroups, groupBy) {
	/** @type {import('$lib/types-v2').WorkflowTasksTableRowGroup[]} */
	const rows = [];
	for (const taskGroup of taskGroups) {
		for (const task of taskGroup.task_list) {
			const groupValue = taskGroup[groupBy];
			let groupRow = rows.find((r) => r.groupTitle === groupValue);
			const taskProperties = getTaskTableProperties(taskGroup, task);
			const taskVersion = taskGroup.version || '';
			if (groupRow) {
				let groupTask = groupRow.tasks.find((t) =>
					Object.values(t.taskVersions).find((r) => r.task_name === task.name)
				);
				if (groupTask) {
					groupTask.taskVersions[taskVersion] = taskProperties;
				} else {
					groupTask = {
						selectedVersion: taskVersion,
						taskVersions: { [taskVersion]: taskProperties }
					};
					groupRow.tasks.push(groupTask);
				}
			} else {
				groupRow = {
					groupTitle: taskGroup[groupBy],
					tasks: [
						{
							selectedVersion: taskVersion,
							taskVersions: { [taskVersion]: taskProperties }
						}
					]
				};
				rows.push(groupRow);
			}
		}
	}
	sortWorkflowTasksTableRows(rows);
	return rows;
}

/**
 * @param {import('$lib/types-v2').WorkflowTasksTableRowGroup[]} rows
 */
function sortWorkflowTasksTableRows(rows) {
	for (const row of rows) {
		for (const task of row.tasks) {
			const validVersions = Object.keys(task.taskVersions).filter((v) => v !== '');
			if (validVersions.length > 0) {
				sortVersions(validVersions);
				task.selectedVersion = validVersions[0];
			}
		}
		row.tasks.sort((t1, t2) =>
			t1.taskVersions[t1.selectedVersion].task_id < t2.taskVersions[t2.selectedVersion].task_id
				? -1
				: 1
		);
	}
	rows.sort((r1, r2) =>
		r1.groupTitle.localeCompare(r2.groupTitle, undefined, { sensitivity: 'base' })
	);
}

/**
 * @param {import('$lib/types-v2').TaskGroupV2[]} taskGroups
 * @param {string} groupBy
 * @returns {import('$lib/types-v2').TasksTableRowGroup[]}
 */
export function buildTaskTableRows(taskGroups, groupBy) {
	/** @type {import('$lib/types-v2').TasksTableRowGroup[]} */
	const rows = [];
	for (const taskGroup of taskGroups) {
		if (taskGroup.task_list.length > 0) {
			const groupValue = taskGroup[groupBy];
			let groupRow = rows.find((r) => r.groupTitle === groupValue);
			const version = taskGroup.version || '';
			if (groupRow) {
				groupRow.groups[version] = taskGroup;
			} else {
				groupRow = {
					groupTitle: groupValue,
					selectedVersion: version,
					groups: { [version]: taskGroup }
				};
				rows.push(groupRow);
			}
		}
	}
	sortTasksTableRows(rows);
	return rows;
}

/**
 * @param {import('$lib/types-v2').TasksTableRowGroup[]} rows
 */
function sortTasksTableRows(rows) {
	for (const row of rows) {
		const validVersions = Object.keys(row.groups).filter((v) => v !== '');
		if (validVersions.length > 0) {
			sortVersions(validVersions);
			row.selectedVersion = validVersions[0];
		}
		for (const taskGroup of Object.values(row.groups)) {
			taskGroup.task_list.sort((t1, t2) => (t1.id < t2.id ? -1 : 1));
		}
	}
	rows.sort((r1, r2) =>
		r1.groupTitle.localeCompare(r2.groupTitle, undefined, { sensitivity: 'base' })
	);
}

/**
 * @param {string[]} versions
 */
export function sortVersions(versions) {
	try {
		versions
			.sort((v1, v2) => {
				if (!v1) {
					return -1;
				}
				if (!v2) {
					return 1;
				}
				return compareLoose(v1, v2);
			})
			.reverse();
	} catch (err) {
		console.warn('Semver error:', err);
	}
	return versions;
}

/**
 * @param {import('$lib/types-v2').TaskGroupV2} taskGroup
 * @param {import('$lib/types-v2').TaskV2} task
 * @returns {import('$lib/types-v2').TasksTableRow}
 */
function getTaskTableProperties(taskGroup, task) {
	return {
		pkg_name: taskGroup.pkg_name,
		task_id: task.id,
		task_name: task.name,
		version: taskGroup.version || '',
		category: task.category,
		modality: task.modality,
		authors: task.authors,
		tags: task.tags,
		input_types: task.input_types,
		docs_info: formatMarkdown(task.docs_info || '')
	};
}

/**
 * @param {import('$lib/types-v2').TaskGroupV2[]} taskGroups
 * @param {import('$lib/types').User & {group_ids_names: Array<[number, string]>}} user
 * @returns {import('$lib/types-v2').TaskGroupV2[]}
 */
export function removeIdenticalTaskGroups(taskGroups, user) {
	/** @type {Map<string, Map<string|null, import('$lib/types-v2').TaskGroupV2>>}  */
	const taskGroupsMap = new Map();
	for (const taskGroup of taskGroups) {
		let versionsMap = taskGroupsMap.get(taskGroup.pkg_name);
		if (!versionsMap) {
			/** @type {Map<string|null, import('$lib/types-v2').TaskGroupV2>}  */
			versionsMap = new Map();
			taskGroupsMap.set(taskGroup.pkg_name, versionsMap);
		}
		const duplicate = versionsMap.get(taskGroup.version);
		if (duplicate) {
			const preferredTaskGroup = selectTaskGroupToKeep(taskGroup, duplicate, user);
			versionsMap.set(taskGroup.version, preferredTaskGroup);
		} else {
			versionsMap.set(taskGroup.version, taskGroup);
		}
	}
	/** @type {import('$lib/types-v2').TaskGroupV2[]} */
	const filteredTaskGroups = [];
	for (const [, versionsMap] of taskGroupsMap) {
		for (const [, taskGroup] of versionsMap) {
			filteredTaskGroups.push(taskGroup);
		}
	}
	return filteredTaskGroups;
}

/**
 * @param {import('$lib/types-v2').TaskGroupV2} taskGroup1
 * @param {import('$lib/types-v2').TaskGroupV2} taskGroup2
 * @param {import('$lib/types').User & {group_ids_names: Array<[number, string]>}} user
 * @returns {import('$lib/types-v2').TaskGroupV2}
 */
function selectTaskGroupToKeep(taskGroup1, taskGroup2, user) {
	if (taskGroup1.user_id === user.id) {
		return taskGroup1;
	}
	for (const [userGroupId] of user.group_ids_names) {
		if (taskGroup1.user_group_id === userGroupId) {
			return taskGroup1;
		}
		if (taskGroup2.user_group_id === userGroupId) {
			return taskGroup2;
		}
	}
	console.warn(
		'Unable to find a user group matching task groups',
		taskGroup1,
		taskGroup2,
		user.group_ids_names
	);
	return taskGroup1;
}

/**
 * @param {import('$lib/types-v2').TaskGroupActivityStatusV2} status
 */
export function getTaskActivityStatusBadgeClass(status) {
	switch (status.toLowerCase()) {
		case 'pending':
			return 'text-bg-light';
		case 'ongoing':
			return 'text-bg-primary';
		case 'failed':
			return 'text-bg-danger';
		case 'ok':
			return 'text-bg-success';
	}
}

/**
 * Fetches a task collection from the server
 * @param {number} taskGroupActivityId
 * @returns {Promise<import('$lib/types-v2').TaskGroupActivityV2|undefined>}
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
 * @returns {Promise<import('$lib/types-v2').TaskGroupActivityV2|undefined>}
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
		/** @type {import('$lib/types-v2').TaskGroupActivityV2[]} */
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
 * @param {import('$lib/types-v2').TaskGroupActivityV2[]} activities
 * @param {boolean} admin
 * @returns {Promise<import('$lib/types-v2').TaskGroupActivityV2[]>}
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
		/** @type {PromiseFulfilledResult<import('$lib/types-v2').TaskGroupActivityV2|undefined>[]} */ (
			updates.filter((u) => u.status === 'fulfilled')
		)
			.map((u) => u.value)
			.filter((u) => u !== undefined);

	return /** @type {import('$lib/types-v2').TaskGroupActivityV2[]} */ (successfulUpdates);
}
