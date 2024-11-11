<script>
	import { page } from '$app/stores';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import AttributesTypesForm from './AttributesTypesForm.svelte';

	/** @type {import('$lib/types-v2').DatasetV2} */
	export let dataset;
	/** @type {(dataset: import('$lib/types-v2').DatasetV2) => void} */
	export let updateDatasetCallback;

	/** @type {Modal} */
	let modal;

	/** @type {AttributesTypesForm} */
	let filtersCreationForm;

	let saving = false;

	function onOpen() {
		filtersCreationForm.init(dataset.filters.attributes, dataset.filters.types);
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
						filters: {
							attributes: filtersCreationForm.getAttributes(),
							types: filtersCreationForm.getTypes()
						}
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
		<AttributesTypesForm bind:this={filtersCreationForm} />
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
