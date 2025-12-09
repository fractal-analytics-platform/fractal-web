<script>
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import tasks from '../tasks.json';
	import FilteredTasksTable from 'fractal-components/tasks/FilteredTasksTable.svelte';
	import 'slim-select/styles';

	/** @type {import('fractal-components/types/api').TasksTableRow|null} */
	let selectedTaskRow = $state(null);
	let modalText = $state('');

	/**
	 * @param {import('fractal-components/types/api').TasksTableRow} taskRow
	 */
	function showSelectedTaskModal(taskRow, text) {
		selectedTaskRow = taskRow;
		modalText = text;
		getBootstrapModal('task-info-modal').show();
	}

	function getBootstrapModal(id) {
		const modalElement = document.getElementById(id);
		// @ts-ignore
		// eslint-disable-next-line no-undef
		const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
		if (bootstrapModal) {
			return bootstrapModal;
		}
		// @ts-ignore
		// eslint-disable-next-line no-undef
		return new bootstrap.Modal(modalElement);
	}

	export function formatMarkdown(markdownValue) {
		if (!markdownValue) {
			return '';
		}
		return DOMPurify.sanitize(marked.parse(markdownValue));
	}
</script>

<FilteredTasksTable taskGroups={tasks} showDocLinksInTable={true}>
	{#snippet extraColumnsColgroup()}
		<col width="60" />
		<col width="60" />
	{/snippet}
	{#snippet extraColumnsHeader()}
		<th></th>
		<th></th>
	{/snippet}
	{#snippet extraColumns(task)}
		<td>
			{#if task.docs_info}
				<button class="btn btn-info" onclick={() => showSelectedTaskModal(task, task.docs_info)}>
					<i class="bi bi-info-circle"></i>
				</button>
			{/if}
		</td>
		<td>
			{#if task.install_instructions}
				<button
					class="btn btn-primary me-2"
					onclick={() => showSelectedTaskModal(task, task.install_instructions)}
				>
					<i class="bi bi-plus-circle"></i>
				</button>
			{/if}
		</td>
	{/snippet}
</FilteredTasksTable>

<div class="modal modal-xl" id="task-info-modal" tabindex="-1">
	<div class="modal-dialog modal-dialog-scrollable">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">{selectedTaskRow?.task_name}</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html formatMarkdown(modalText)}
			</div>
		</div>
	</div>
</div>
