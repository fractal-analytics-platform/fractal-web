<script>
	import { AlertError } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import compareLoose from 'semver/functions/compare-loose';

	/** @type {import('$lib/types-v2').WorkflowV2} */
	export let workflow;
	/** @type {(workflow: import('$lib/types-v2').WorkflowV2) => Promise<void>} */
	export let onWorkflowTaskAdded;

	/** @type {Modal} */
	let modal;

	/** @type {import('$lib/types-v2').TasksTableRowGroup[]} */
	let rows = [];
	let loading = false;
	let addingTask = false;
	let groupBy = 'pkg_name';

	let groupByLabels = {
		pkg_name: 'Package Name'
	};

	/** @type {number|undefined} */
	let taskOrder = undefined;

	export async function show() {
		taskOrder = undefined;
		loading = true;
		modal.hideErrorAlert();
		modal.show();
		const response = await fetch(`/api/v2/task-group`, {
			method: 'GET',
			credentials: 'include'
		});
		const result = await response.json();
		loading = false;
		if (!response.ok) {
			modal.displayErrorAlert(result);
			return;
		}
		rows = buildTaskTableRows(result);
	}

	/**
	 * @param {import('$lib/types-v2').TaskGroupV2[]} taskGroups
	 * @returns {import('$lib/types-v2').TasksTableRowGroup[]}
	 */
	function buildTaskTableRows(taskGroups) {
		/** @type {import('$lib/types-v2').TasksTableRowGroup[]} */
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
		sortTasksTableRows(rows);
		return rows;
	}

	/**
	 * @param {import('$lib/types-v2').TasksTableRowGroup[]} rows
	 */
	function sortTasksTableRows(rows) {
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
	 * @param {string[]} versions
	 */
	function sortVersions(versions) {
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

	/**
	 * @param {number} taskId
	 */
	async function addTaskToWorkflow(taskId) {
		modal.confirmAndHide(
			async () => {
				addingTask = true;

				const headers = new Headers();
				headers.set('Content-Type', 'application/json');

				// Creating workflow task
				const workflowTaskResponse = await fetch(
					`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/wftask?task_id=${taskId}`,
					{
						method: 'POST',
						credentials: 'include',
						headers,
						body: JSON.stringify({
							order: taskOrder
						})
					}
				);

				const workflowTaskResult = await workflowTaskResponse.json();

				if (!workflowTaskResponse.ok) {
					console.error('Error while creating workflow task', workflowTaskResult);
					throw new AlertError(workflowTaskResult);
				}

				// Get updated workflow with created task
				const workflowResponse = await fetch(
					`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}`,
					{
						method: 'GET',
						credentials: 'include'
					}
				);

				const workflowResult = await workflowResponse.json();

				if (!workflowResponse.ok) {
					console.error('Error while retrieving workflow', workflowResult);
					throw new AlertError(workflowResult);
				}

				await onWorkflowTaskAdded(workflowResult);
			},
			() => {
				addingTask = false;
			}
		);
	}

	/**
	 * @param {import('$lib/types-v2').TasksTableRow} taskProperties
	 */
	function getMetadataCell(taskProperties) {
		const values = [];
		//category, modality, authors, tags
		if (taskProperties.category) {
			values.push(taskProperties.category);
		}
		if (taskProperties.modality) {
			values.push(taskProperties.modality);
		}
		values.push(...taskProperties.tags);
		if (taskProperties.authors) {
			values.push(taskProperties.authors);
		}
		return values.join(', ');
	}
</script>

<Modal
	size="xl"
	id="addWorkflowTaskModal"
	centered={true}
	scrollable={true}
	bind:this={modal}
	inputAutofocus={false}
>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Add new workflow task</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if loading}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{/if}
		{#if rows.length === 0}
			<p>There are no tasks.</p>
		{:else}
			<div class="card">
				<div class="card-body p-0">
					<table class="table table-borderless" id="workflow-tasks-table">
						<thead>
							<tr>
								<th class="bg-transparent">{groupByLabels[groupBy]}</th>
								<th>Metadata</th>
								<th class="bg-transparent" colspan="2">Version</th>
							</tr>
						</thead>
						<tbody>
							{#each rows as row}
								<tr class="border-top">
									<th colspan="3">{row.groupTitle}</th>
								</tr>
								{#each row.tasks as task}
									<tr>
										<td>{task.taskVersions[task.selectedVersion].task_name}</td>
										<td class="metadata-cell">
											{getMetadataCell(task.taskVersions[task.selectedVersion])}
										</td>
										<td>
											{#if Object.keys(task.taskVersions).length > 1}
												<select
													class="form-control"
													aria-label="Version for task {task.taskVersions[task.selectedVersion]
														.task_name}"
													bind:value={task.selectedVersion}
												>
													{#each sortVersions(Object.keys(task.taskVersions)) as version}
														<option value={version}>{version || 'None'}</option>
													{/each}
												</select>
											{:else}
												{task.taskVersions[task.selectedVersion].version}
											{/if}
										</td>
										<td>
											<button
												class="btn btn-primary"
												disabled={addingTask}
												on:click={() =>
													addTaskToWorkflow(task.taskVersions[task.selectedVersion].task_id)}
											>
												Add task
											</button>
										</td>
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<div id="errorAlert-addWorkflowTaskModal" class="flex-fill" />
		<div class="input-group m-0">
			<label for="taskOrder" class="input-group-text">Task order in workflow</label>
			<input
				id="taskOrder"
				type="number"
				name="taskOrder"
				class="form-control"
				placeholder="Leave it blank to append at the end"
				min="0"
				max={workflow?.task_list.length}
				bind:value={taskOrder}
			/>
		</div>
	</svelte:fragment>
</Modal>

<style>
	#workflow-tasks-table td {
		vertical-align: middle;
	}
	#workflow-tasks-table tr th:first-child,
	#workflow-tasks-table tr td:first-child {
		padding-left: 15px;
	}
	#workflow-tasks-table tr th {
		padding-top: 18px;
		padding-bottom: 12px;
	}
	.metadata-cell {
		font-size: 85%;
		max-width: 150px;
	}
</style>
