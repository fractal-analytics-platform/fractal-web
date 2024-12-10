<script>
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import tasks from '../tasks.json';
	import FilteredTasksTable from 'fractal-components/tasks/FilteredTasksTable.svelte';

	/** @type {import('fractal-components/types/api').TasksTableRow|null} */
	let selectedTaskRow = null;

	/**
	 * @param {import('fractal-components/types/api').TasksTableRow} taskRow
	 */
	function showDocsInfoModal(taskRow) {
		selectedTaskRow = taskRow;
		getBootstrapModal('docs-info-modal').show();
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

<FilteredTasksTable taskGroups={tasks}>
	<svelte:fragment slot="docs-info" let:task>
		{#if task.docs_info}
			<button class="btn btn-info ms-2" on:click={() => showDocsInfoModal(task)}>
				<i class="bi bi-info-circle" />
			</button>
		{/if}
	</svelte:fragment>
</FilteredTasksTable>

<div class="modal modal-xl" id="docs-info-modal" tabindex="-1">
	<div class="modal-dialog modal-dialog-scrollable">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">{selectedTaskRow?.task_name}</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html formatMarkdown(selectedTaskRow?.docs_info)}
			</div>
		</div>
	</div>
</div>
