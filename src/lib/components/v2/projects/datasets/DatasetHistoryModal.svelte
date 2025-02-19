<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('fractal-components/types/api').DatasetV2} */
	export let dataset;

	/** @type {Modal} */
	let modal;

	/** @type {Array<import('fractal-components/types/api').HistoryItemV2>} */
	let history = [];
	let loading = false;

	async function onOpen() {
		modal.hideErrorAlert();
		loading = true;
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/history`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);
		if (response.ok) {
			history = await response.json();
		} else {
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
		}
		loading = false;
	}

	function onClose() {
		modal.hideErrorAlert();
		history = [];
	}

	/**
	 * Returns the dataset history formatted in JSON hiding some values.
	 *
	 * @param {import('fractal-components/types/api').HistoryItemV2} historyItem
	 * @returns {string}
	 */
	function formatDatasetHistory(historyItem) {
		return JSON.stringify(
			{
				...historyItem,
				worfklowtask_dump: {
					...historyItem.worfklowtask_dump,
					task: {
						...historyItem.worfklowtask_dump.task,
						args_schema_non_parallel: historyItem.worfklowtask_dump.task.args_schema_non_parallel
							? '[HIDDEN]'
							: undefined,
						args_schema_parallel: historyItem.worfklowtask_dump.task.args_schema_parallel
							? '[HIDDEN]'
							: undefined,
						docs_info: historyItem.worfklowtask_dump.task.docs_info ? '[HIDDEN]' : undefined,
						docs_link: historyItem.worfklowtask_dump.task.docs_link ? '[HIDDEN]' : undefined
					}
				}
			},
			null,
			2
		);
	}
</script>

<Modal
	id="datasetHistoryModal"
	size="xl"
	centered={true}
	scrollable={true}
	{onOpen}
	{onClose}
	bind:this={modal}
>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Dataset history</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-datasetHistoryModal" />
		{#if history && Object.keys(history).length > 0}
			<div class="accordion" id="accordion-dataset-history">
				{#each Object.entries(history) as [index, value]}
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
								Task "{value.worfklowtask_dump.task.name}" - {value.timestamp_started}
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
		{:else if !loading}
			<p>No history</p>
		{:else}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{/if}
	</svelte:fragment>
</Modal>
