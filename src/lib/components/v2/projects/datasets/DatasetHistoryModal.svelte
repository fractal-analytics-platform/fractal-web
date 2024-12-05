<script>
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('fractal-components/types/api').DatasetV2} */
	export let dataset;

	/**
	 * Returns the dataset history formatted in JSON hiding some values.
	 *
	 * @param {import('fractal-components/types/api').DatasetHistoryItemV2} historyItem
	 * @returns {string}
	 */
	function formatDatasetHistory(historyItem) {
		return JSON.stringify(
			{
				...historyItem,
				workflowtask: {
					...historyItem.workflowtask,
					task: {
						...historyItem.workflowtask.task,
						args_schema_non_parallel: historyItem.workflowtask.task.args_schema_non_parallel
							? '[HIDDEN]'
							: undefined,
						args_schema_parallel: historyItem.workflowtask.task.args_schema_parallel
							? '[HIDDEN]'
							: undefined,
						docs_info: historyItem.workflowtask.task.docs_info ? '[HIDDEN]' : undefined,
						docs_link: historyItem.workflowtask.task.docs_link ? '[HIDDEN]' : undefined
					}
				}
			},
			null,
			2
		);
	}
</script>

<Modal id="datasetHistoryModal" size="xl" centered={true} scrollable={true}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Dataset history</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if dataset.history && Object.keys(dataset.history).length > 0}
			<div class="accordion" id="accordion-dataset-history">
				{#each Object.entries(dataset.history) as [index, value]}
					<div class="accordion-item">
						<h2 class="accordion-header">
							<button
								class="accordion-button collapsed"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#collapse-dataset-history-{index}"
								aria-expanded="false"
								aria-controls="collapse-dataset-history-{index}"
							>
								Task "{value.workflowtask.task.name}", status "{value.status}"
							</button>
						</h2>
						<div
							id="collapse-dataset-history-{index}"
							class="accordion-collapse collapse"
							data-bs-parent="#accordion-dataset-history"
						>
							<div class="accordion-body">
								<code><pre>{formatDatasetHistory(value)}</pre></code>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p>No history</p>
		{/if}
	</svelte:fragment>
</Modal>
