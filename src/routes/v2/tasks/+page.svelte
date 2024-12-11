<script>
	import { page } from '$app/stores';
	import { formatMarkdown } from '$lib/common/component_utilities';
	import Modal from '$lib/components/common/Modal.svelte';
	import FilteredTasksTable from 'fractal-components/tasks/FilteredTasksTable.svelte';

	/** @type {import('fractal-components/types/api').TaskGroupV2[]} */
	let taskGroups = $page.data.taskGroups;

	/** @type {Modal} */
	let modal;

	/** @type {import('fractal-components/types/api').TasksTableRow|null} */
	let selectedTaskRow = null;

	/**
	 * @param {import('fractal-components/types/api').TasksTableRow} taskRow
	 */
	function showDocsInfoModal(taskRow) {
		selectedTaskRow = taskRow;
		modal.show();
	}
</script>

{#if taskGroups.length > 0}
	<div class="row mt-2 mb-2">
		<div class="col">
			Here is the list of currently available tasks. You can add new tasks or edit the current ones
			at the <a href="/v2/tasks/management">Tasks management</a> page.
			<a href="/v2/tasks/management" class="btn btn-primary float-end">
				<i class="bi bi-gear-fill" />
				Manage tasks
			</a>
		</div>
	</div>
{/if}

<FilteredTasksTable {taskGroups}>
	<svelte:fragment slot="extra-columns-colgroup">
		<col width="60" />
	</svelte:fragment>
	<svelte:fragment slot="extra-columns-header">
		<th />
	</svelte:fragment>
	<svelte:fragment slot="extra-columns" let:task>
		<td>
			{#if task.docs_info}
				<button class="btn btn-info" on:click={() => showDocsInfoModal(task)}>
					<i class="bi bi-info-circle" />
				</button>
			{/if}
		</td>
	</svelte:fragment>
</FilteredTasksTable>

<Modal id="task-docs-info-modal" size="xl" scrollable={true} bind:this={modal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">{selectedTaskRow?.task_name}</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html formatMarkdown(selectedTaskRow?.docs_info)}
	</svelte:fragment>
</Modal>
