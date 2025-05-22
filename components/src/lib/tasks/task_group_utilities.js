/**
 * @param {Array<[string, Array<import('../types/api').TaskGroupV2>]>} taskGroups
 * @returns {import('../types/api').WorkflowTasksTableRowGroup[]}
 */
export function buildWorkflowTaskTableRows(taskGroups) {
	/** @type {import('../types/api').WorkflowTasksTableRowGroup[]} */
	const rows = [];
	for (const [pkg_name, groups] of taskGroups) {
		/** @type {Array<{ selectedVersion: string, taskVersions: Array<import('../types/api').TasksTableRow> }>} */
		const tasksRows = [];
		for (const taskGroup of groups) {
			for (const task of taskGroup.task_list) {
				const taskProperties = getTaskTableProperties(taskGroup, task);
				let found = false;
				for (const row of tasksRows) {
					if (row.taskVersions.find((tv) => tv.task_name === task.name)) {
						row.taskVersions.push(taskProperties);
						found = true;
						break;
					}
				}
				if (!found) {
					tasksRows.push({
						selectedVersion: taskGroup.version || '',
						taskVersions: [taskProperties]
					});
				}
			}
		}
		rows.push({ pkg_name, tasks: tasksRows });
	}
	return rows;
}

/**
 * @param {import('../types/api').TaskGroupV2} taskGroup
 * @param {import('../types/api').TaskV2} task
 * @returns {import('../types/api').TasksTableRow}
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
		docs_info: task.docs_info || '',
		docs_link: task.docs_link,
		install_instructions: task.install_instructions
	};
}

/**
 * @param {Array<[string, Array<import('../types/api').TaskGroupV2>]>} taskGroups
 * @returns {import('../types/api').TasksTableRowGroup[]}
 */
export function buildTaskTableRows(taskGroups) {
	return taskGroups.map((tg) => ({
		pkg_name: tg[0],
		selectedVersion: tg[1][0].version || '',
		groups: tg[1].map((g) => ({ ...g, version: g.version === null ? '' : g.version }))
	}));
}

/**
 * @param {import('../types/api').TaskGroupActivityStatusV2} status
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
