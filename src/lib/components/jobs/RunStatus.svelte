<script>
	/** @type {number} */
	export let projectId;
	/** @type {number} */
	export let datasetId;
	/** @type {number} */
	export let workflowTaskId;
	/** @type {import('fractal-components/types/api').HistoryRunAggregated} */
	export let run;
	/** @type {number} */
	export let index;
	/** @type {import('./RunStatusModal.svelte').default} */
	export let runStatusModal;

	function openModal() {
		runStatusModal.open(projectId, run.id, datasetId, workflowTaskId, index);
	}
</script>

<span class="d-flex">
	<span class="d-flex">
		{#if run.num_submitted_units > 0}
			<button
				aria-label="Submitted images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={openModal}
			>
				<span class="d-flex">
					<span class="pe-1 status-wrapper text-primary">
						{run.num_submitted_units}
					</span>
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
				on:click={openModal}
			>
				<span class="d-flex">
					<span class="status-wrapper text-success ps-1">
						{run.num_done_units}
					</span>
					<i class="status-icon bi bi-check text-success pe-1" />
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
				on:click={openModal}
			>
				<span class="d-flex">
					<span class="status-wrapper text-danger ps-1">
						{run.num_failed_units}
					</span>
					<i class="status-icon bi bi-x text-danger pe-1" />
				</span>
			</button>
		{/if}
	</span>
</span>
