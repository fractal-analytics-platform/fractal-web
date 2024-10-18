<script>
	import { AlertError } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import { buildWorkflowTaskTableRows, removeIdenticalTaskGroups, sortVersions } from '../tasks/task_group_utilities';

	/** @type {import('$lib/types-v2').WorkflowV2} */
	export let workflow;
	/** @type {import('$lib/types').User & {group_ids_names: Array<[number, string]>}} */
	export let user;
	/** @type {(workflow: import('$lib/types-v2').WorkflowV2) => Promise<void>} */
	export let onWorkflowTaskAdded;

	/** @type {Modal} */
	let modal;

	/** @type {import('$lib/types-v2').WorkflowTasksTableRowGroup[]} */
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
		const response = await fetch(`/api/v2/task-group?only_active=true`, {
			method: 'GET',
			credentials: 'include'
		});
		const result = await response.json();
		loading = false;
		if (!response.ok) {
			modal.displayErrorAlert(result);
			return;
		}
		const filteredGroups = removeIdenticalTaskGroups(result, user);
		rows = buildWorkflowTaskTableRows(filteredGroups, groupBy);
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
									{#if task.taskVersions[task.selectedVersion]}
										<tr>
											<td>{task.taskVersions[task.selectedVersion].task_name}</td>
											<td class="metadata-cell">
												{getMetadataCell(task.taskVersions[task.selectedVersion])}
											</td>
											<td>
												{#if Object.keys(task.taskVersions).length > 1}
													<select
														class="form-select"
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
									{/if}
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
