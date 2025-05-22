<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import PropertyDescription from 'fractal-components/jschema/properties/PropertyDescription.svelte';
	import FilteredTasksTable from 'fractal-components/tasks/FilteredTasksTable.svelte';
	import { formatMarkdown } from '$lib/common/component_utilities';
	import { tick } from 'svelte';
	import { getJsonSchemaData } from 'fractal-components/jschema/jschema_initial_data';
	import { stripNullAndEmptyObjectsAndArrays } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowV2} workflow
	 * @property {(workflow: import('fractal-components/types/api').WorkflowV2) => Promise<void>} onWorkflowTaskAdded
	 */

	/** @type {Props} */
	let { workflow, onWorkflowTaskAdded } = $props();

	/** @type {Modal|undefined} */
	let modal = $state();

	let loading = $state(false);
	let addingTask = $state(false);
	let showDocLinksInTable = false;

	/** @type {Array<[ string, Array<import('fractal-components/types/api').TaskGroupV2> ]>} */
	let taskGroups = $state([]);

	export async function show() {
		loading = true;
		modal?.hideErrorAlert();
		modal?.show();
		const response = await fetch(`/api/v2/task-group?only_active=true&args_schema=false`, {
			method: 'GET',
			credentials: 'include'
		});
		loading = false;
		if (!response.ok) {
			modal?.displayErrorAlert(await response.json());
			return;
		}
		taskGroups = await response.json();
		await tick();
		const searchInput = document.querySelector('#addWorkflowTaskModal input');
		if (searchInput instanceof HTMLElement) {
			searchInput.focus();
		}
	}

	/**
	 * @param {number} taskId
	 */
	async function addTaskToWorkflow(taskId) {
		modal?.confirmAndHide(
			async () => {
				addingTask = true;

				const task = await getTask(taskId);

				const headers = new Headers();
				headers.set('Content-Type', 'application/json');

				// Creating workflow task
				const defaultData = {};

				if (task.args_schema_parallel) {
					defaultData.args_parallel = stripNullAndEmptyObjectsAndArrays(
						getJsonSchemaData(task.args_schema_parallel, 'pydantic_v2')
					);
				}

				if (task.args_schema_non_parallel) {
					defaultData.args_non_parallel = stripNullAndEmptyObjectsAndArrays(
						getJsonSchemaData(task.args_schema_non_parallel, 'pydantic_v2')
					);
				}

				const workflowTaskResponse = await fetch(
					`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/wftask?task_id=${task.id}`,
					{
						method: 'POST',
						credentials: 'include',
						headers,
						body: JSON.stringify(defaultData)
					}
				);

				if (!workflowTaskResponse.ok) {
					console.error('Error while creating workflow task');
					throw await getAlertErrorFromResponse(workflowTaskResponse);
				}

				// Get updated workflow with created task
				const workflowResponse = await fetch(
					`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}`,
					{
						method: 'GET',
						credentials: 'include'
					}
				);

				if (!workflowResponse.ok) {
					console.error('Error while retrieving workflow');
					throw await getAlertErrorFromResponse(workflowResponse);
				}

				const workflowResult = await workflowResponse.json();
				await onWorkflowTaskAdded(workflowResult);
			},
			() => {
				addingTask = false;
			}
		);
	}

	/**
	 * @param {number} taskId
	 * @returns {Promise<import('fractal-components/types/api').TaskV2>}
	 */
	async function getTask(taskId) {
		const response = await fetch(`/api/v2/task/${taskId}`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}

		return await response.json();
	}

	/**
	 * @param {import('fractal-components/types/api').TasksTableRow} taskRow
	 */
	function showTaskInfoButton(taskRow) {
		return taskRow.docs_info || (!showDocLinksInTable && taskRow.docs_link);
	}

	/**
	 * @param {import('fractal-components/types/api').TasksTableRow} taskRow
	 */
	function getTaskInfo(taskRow) {
		let info = '';
		if (taskRow.docs_info) {
			info += taskRow.docs_info;
		}
		if (!showDocLinksInTable && taskRow.docs_link) {
			if (taskRow.docs_info) {
				info += '\n\n---\n'; // markdown hr
			}
			info += taskRow.docs_link;
		}
		return formatMarkdown(info);
	}
</script>

<Modal
	size="xl"
	id="addWorkflowTaskModal"
	centered={true}
	scrollable={true}
	bind:this={modal}
	focus={false}
	inputAutofocus={false}
>
	{#snippet header()}
		<h5 class="modal-title">Add new workflow task</h5>
	{/snippet}
	{#snippet body()}
		{#if loading}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		{/if}
		<div class:invisible={loading} class:collapse={loading}>
			<FilteredTasksTable {taskGroups} showAuthorsInSeparateColumn={false}>
				{#snippet extraColumnsColgroup()}
					<col width="40" />
					<col width="120" />
				{/snippet}
				{#snippet extraColumnsHeader()}
					<th></th>
					<th></th>
				{/snippet}
				{#snippet extraColumns(task)}
					<td>
						{#if showTaskInfoButton(task)}
							<PropertyDescription description={getTaskInfo(task)} html={true} />
						{/if}
					</td>
					<td>
						<button
							class="btn btn-primary"
							disabled={addingTask}
							onclick={() => addTaskToWorkflow(task.task_id)}
						>
							Add task
						</button>
					</td>
				{/snippet}
			</FilteredTasksTable>
		</div>
	{/snippet}
	{#snippet footer()}
		<div id="errorAlert-addWorkflowTaskModal" class="m-0 flex-fill"></div>
	{/snippet}
</Modal>
