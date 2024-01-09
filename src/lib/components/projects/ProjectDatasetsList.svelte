<script>
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError } from '$lib/common/errors';
	import CreateUpdateDatasetModal from './CreateUpdateDatasetModal.svelte';
	import { onMount } from 'svelte';

	/** @type {import('$lib/types').Dataset[]} */
	export let datasets = [];

	let datasetSearch = '';

	$: filteredDatasets = datasets.filter((p) =>
		p.name.toLowerCase().includes(datasetSearch.toLowerCase())
	);

	/** @type {CreateUpdateDatasetModal} */
	let createUpdateDatasetModal;

	function createDatasetCallback(/** @type {import('$lib/types').Dataset} */ newDataset) {
		datasets = [...datasets, newDataset];
	}
	function updateDatasetCallback(/** @type {import('$lib/types').Dataset} */ updatedDataset) {
		datasets = datasets.map((d) => (d.id === updatedDataset.id ? updatedDataset : d));
	}

	/**
	 * Deletes a project's dataset from the server
	 * @param {number} projectId
	 * @param {number} datasetId
	 * @returns {Promise<*>}
	 */
	async function handleDatasetDelete(projectId, datasetId) {
		const response = await fetch(`/api/v1/project/${projectId}/dataset/${datasetId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (response.ok) {
			console.log('Dataset deleted');
			// If the request is successful, we delete the dataset entry in the datasets list
			datasets = datasets.filter((d) => {
				return d.id !== datasetId;
			});
		} else {
			const result = await response.json();
			console.error('Error while deleting dataset:', result);
			throw new AlertError(result);
		}
	}

	onMount(() => {
		datasetSearch = '';
	});
</script>

<div class="container p-0 mt-4">
	<div class="row">
		<div class="col-sm-2">
			<h3 class="fw-light">Datasets</h3>
		</div>
		<div class="col-sm-10">
			<div class="row justify-content-end">
				<div class="col-auto">
					<div class="input-group">
						<input
							name="searchDataset"
							type="text"
							class="form-control"
							placeholder="Search dataset"
							bind:value={datasetSearch}
						/>
					</div>
				</div>
				<div class="col-auto">
					<button
						class="btn btn-primary float-end"
						type="button"
						on:click={() => createUpdateDatasetModal.openForCreate()}
					>
						Create new dataset
					</button>
				</div>
			</div>
		</div>
	</div>
	<div id="datasetCreateErrorAlert" />
	<table class="table align-middle">
		<thead class="table-light">
			<tr>
				<th class="col-4">Name</th>
				<th class="col-4">Type</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#key datasets}
				{#each filteredDatasets as dataset}
					<tr>
						<td>{dataset.name}</td>
						<td>{dataset.type || 'Unknown'}</td>
						<td>
							<a class="btn btn-light" href="/projects/{dataset.project_id}/datasets/{dataset.id}">
								<i class="bi bi-arrow-up-right-square" /> Open
							</a>
							<button
								class="btn btn-primary"
								type="button"
								on:click|preventDefault={() => createUpdateDatasetModal.openForEdit(dataset)}
							>
								<i class="bi bi-pencil" /> Edit
							</button>
							<ConfirmActionButton
								modalId="confirmDatasetDeleteModal{dataset.id}"
								style={'danger'}
								btnStyle="danger"
								buttonIcon="trash"
								label={'Delete'}
								message={`Delete dataset ${dataset.name} from project ${dataset.project_id}`}
								callbackAction={() => handleDatasetDelete(dataset.project_id, dataset.id)}
							/>
						</td>
					</tr>
				{/each}
			{/key}
		</tbody>
	</table>
</div>

<CreateUpdateDatasetModal
	bind:this={createUpdateDatasetModal}
	{createDatasetCallback}
	{updateDatasetCallback}
/>
