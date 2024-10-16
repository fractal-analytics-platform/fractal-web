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
			const versions = Object.keys(task.taskVersions);
			if (versions.length > 1) {
				const validVersions = versions.filter((v) => v !== '');
				sortVersions(validVersions);
				task.selectedVersion = validVersions[0];
			}
		}
		row.tasks.sort((t1, t2) =>
			t1.taskVersions[t1.selectedVersion].task_name.localeCompare(
				t2.taskVersions[t2.selectedVersion].task_name,
				undefined,
				{
					sensitivity: 'base'
				}
			)
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
	sortTasksTableRows(rows);
	return rows;
}

/**
 * @param {import('$lib/types-v2').TasksTableRowGroup[]} rows
 */
function sortTasksTableRows(rows) {
	rows.sort((r1, r2) =>
		r1.groupTitle.localeCompare(r2.groupTitle, undefined, { sensitivity: 'base' })
	);
}

/**
 * @param {string[]} versions
 */
export function sortVersions(versions) {
	try {
		versions.sort((v1, v2) => compareLoose(v1, v2)).reverse();
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
		tags: task.tags
	};
}
