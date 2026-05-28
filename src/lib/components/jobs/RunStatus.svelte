<script>
	import { isParallelType } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').DatasetV2} dataset
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {import('fractal-components/types/api').HistoryRunAggregated} run
	 * @property {number} index
	 * @property {import('./RunStatusModal.svelte').default} runStatusModal
	 */

	/** @type {Props} */
	let { dataset, workflowTask, run, index, runStatusModal } = $props();

	let showNumbers = $derived(isParallelType(workflowTask.task_type));

	function openModal() {
		runStatusModal.open(run.id, dataset, workflowTask, index);
	}
</script>

<span class="d-flex">
	<span class="d-flex">
		{#if run.num_units_with_warnings > 0}
			<button
				aria-label="Warnings"
				aria-disabled="true"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				onclick={(event) => event.preventDefault()}
			>
				<span class="d-flex">
					{#if showNumbers}
						<span class="status-wrapper text-secondary pe-1">
							{run.num_units_with_warnings}
						</span>
					{/if}
					<i
						class="status-icon status-icon-warning bi bi-exclamation-triangle-fill text-secondary pt-1 pe-1"
					></i>
				</span>
			</button>
		{/if}
		{#if run.num_submitted_units > 0}
			<button
				aria-label="Submitted images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				onclick={openModal}
			>
				<span class="d-flex">
					{#if showNumbers}
						<span class="pe-1 status-wrapper text-primary">
							{run.num_submitted_units}
						</span>
					{/if}
					<div
						class="mt-1 pe-1 spinner-border spinner-border-sm text-primary status-wrapper"
						role="status"
					>
						<span class="visually-hidden">Loading...</span>
					</div>
				</span>
			</button>
		{/if}
		{#if run.num_done_units > 0}
			<button
				aria-label="Done images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				onclick={openModal}
			>
				<span class="d-flex">
					{#if showNumbers}
						<span class="status-wrapper text-success ps-1">
							{run.num_done_units}
						</span>
					{/if}
					<i class="status-icon bi bi-check text-success pe-1"></i>
				</span>
			</button>
		{/if}
		{#if run.num_done_units > 0 && run.num_failed_units > 0}
			/
		{/if}
		{#if run.num_failed_units > 0}
			<button
				aria-label="Failed images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				onclick={openModal}
			>
				<span class="d-flex">
					{#if showNumbers}
						<span class="status-wrapper text-danger ps-1">
							{run.num_failed_units}
						</span>
					{/if}
					<i class="status-icon bi bi-x text-danger pe-1"></i>
				</span>
			</button>
		{/if}
	</span>
</span>

<style>
	.status-modal-btn[aria-disabled='true'] {
		pointer-events: none;
		cursor: default;
	}

	.status-icon-warning {
		font-size: 100%;
	}
</style>
