<script>
	import { page } from '$app/stores';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import DatasetFiltersForm from './DatasetFiltersForm.svelte';

	/** @type {import('fractal-components/types/api').DatasetV2} */
	export let dataset;
	/** @type {(dataset: import('fractal-components/types/api').DatasetV2) => void} */
	export let updateDatasetCallback;

	/** @type {Modal} */
	let modal;

	/** @type {DatasetFiltersForm} */
	let filtersCreationForm;

	let saving = false;

	async function onOpen() {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/images/query?page=1&page_size=1`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify({})
			}
		);
		if (!response.ok) {
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
			return;
		}

		/** @type {import('fractal-components/types/api').ImagePage} */
		const imagePage = await response.json();
		filtersCreationForm.init(dataset.attribute_filters, dataset.type_filters, imagePage.attributes, imagePage.types);
	}

	async function handleSave() {
		filtersCreationForm.resetErrors();

		modal.hideErrorAlert();
		if (!filtersCreationForm.validateFields()) {
			return;
		}

		saving = true;
		await modal.confirmAndHide(
			async function () {
				const projectId = $page.params.projectId;
				const headers = new Headers();
				headers.set('Content-Type', 'application/json');
				const response = await fetch(`/api/v2/project/${projectId}/dataset/${dataset.id}`, {
					method: 'PATCH',
					credentials: 'include',
					headers,
					body: JSON.stringify({
						attribute_filters: filtersCreationForm.getAttributes(),
						type_filters: filtersCreationForm.getTypes()
					})
				});
				if (!response.ok) {
					console.log('Dataset update failed');
					throw await getAlertErrorFromResponse(response);
				}
				const result = await response.json();
				updateDatasetCallback(result);
			},
			function () {
				saving = false;
			}
		);
	}
</script>

<Modal
	id="datasetFiltersModal"
	centered={true}
	scrollable={true}
	size="lg"
	{onOpen}
	bind:this={modal}
>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Dataset filters</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<DatasetFiltersForm bind:this={filtersCreationForm} />
		<div id="errorAlert-datasetFiltersModal" />
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" on:click={handleSave} disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Save
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
	</svelte:fragment>
</Modal>
