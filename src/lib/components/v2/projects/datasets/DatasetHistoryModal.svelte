<script>
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('$lib/types-v2').DatasetV2} */
	export let dataset;

	/**
	 * Returns the dataset history formatted in JSON hiding some values.
	 *
	 * @param {import('$lib/types').DatasetHistoryItem} historyItem
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
						args_schema: historyItem.workflowtask.task.args_schema ? '[HIDDEN]' : undefined,
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
		<ul class="list-group">
			{#if dataset.history && Object.keys(dataset.history).length > 0}
				{#each Object.entries(dataset.history) as [_, value]}
					<li class="list-group-item text-bg-light">
						<span>
							Task "{value.workflowtask.task.name}", status "{value.status}"
						</span>
					</li>
					<li class="list-group-item text-break">
						<code><pre>{formatDatasetHistory(value)}</pre></code>
					</li>
				{/each}
			{:else}
				<p>No history</p>
			{/if}
		</ul>
	</svelte:fragment>
</Modal>

<style type="text/css">
	pre {
		white-space: pre-wrap;
		display: inline;
	}
</style>
