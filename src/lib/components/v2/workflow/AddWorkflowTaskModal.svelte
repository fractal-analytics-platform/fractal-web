<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import PropertyDescription from 'fractal-components/jschema/properties/PropertyDescription.svelte';
	import FilteredTasksTable from 'fractal-components/tasks/FilteredTasksTable.svelte';
	import { removeIdenticalTaskGroups } from 'fractal-components/tasks/task_group_utilities';
	import { formatMarkdown } from '$lib/common/component_utilities';
	import { tick } from 'svelte';

	/** @type {import('fractal-components/types/api').WorkflowV2} */
	export let workflow;
	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */
	export let user;
	/** @type {(workflow: import('fractal-components/types/api').WorkflowV2) => Promise<void>} */
	export let onWorkflowTaskAdded;

	/** @type {Modal} */
	let modal;

	let loading = false;
	let addingTask = false;
	let showDocLinksInTable = false;

	/** @type {Array<import('fractal-components/types/api').TaskGroupV2>} */
	let taskGroups = [];

	export async function show() {
		loading = true;
		modal.hideErrorAlert();
		modal.show();
		const response = await fetch(`/api/v2/task-group?only_active=true&args_schema=false`, {
			method: 'GET',
			credentials: 'include'
		});
		loading = false;
		if (!response.ok) {
			modal.displayErrorAlert(await response.json());
			return;
		}
		const allTaskGroups = await response.json();
		taskGroups = removeIdenticalTaskGroups(allTaskGroups, user);
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
						body: JSON.stringify({})
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
	<svelte:fragment slot="header">
		<h5 class="modal-title">Add new workflow task</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if loading}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{/if}
		<div class:invisible={loading} class:collapse={loading}>
			<FilteredTasksTable {taskGroups} showAuthorsInSeparateColumn={false}>
				<svelte:fragment slot="extra-columns-colgroup">
					<col width="40" />
					<col width="120" />
				</svelte:fragment>
				<svelte:fragment slot="extra-columns-header">
					<th />
					<th />
				</svelte:fragment>
				<svelte:fragment slot="extra-columns" let:task>
					<td>
						{#if showTaskInfoButton(task)}
							<PropertyDescription description={getTaskInfo(task)} html={true} />
						{/if}
					</td>
					<td>
						<button
							class="btn btn-primary"
							disabled={addingTask}
							on:click={() => addTaskToWorkflow(task.task_id)}
						>
							Add task
						</button>
					</td>
				</svelte:fragment>
			</FilteredTasksTable>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<div id="errorAlert-addWorkflowTaskModal" class="m-0 flex-fill" />
	</svelte:fragment>
</Modal>
