<script>
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import CreateDatasetModal from './datasets/CreateDatasetModal.svelte';
	import { onMount } from 'svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').ProjectV2} project
	 * @property {import('fractal-components/types/api').DatasetV2[]} [datasets]
	 */

	/** @type {Props} */
	let { project, datasets = $bindable([]) } = $props();

	let datasetSearch = $state('');
	let datasetCreatedMessage = $state('');

	let filteredDatasets = $derived(
		datasets.filter((p) => p.name.toLowerCase().includes(datasetSearch.toLowerCase()))
	);

	function createDatasetCallback(
		/** @type {import('fractal-components/types/api').DatasetV2} */ newDataset
	) {
		datasetCreatedMessage = `Created new dataset with Zarr dir ${newDataset.zarr_dir}`;
		datasets = [...datasets, newDataset].sort((a, b) =>
			a.name < b.name ? -1 : a.name > b.name ? 1 : 0
		);
	}

	/**
	 * Deletes a project's dataset from the server
	 * @param {number} projectId
	 * @param {number} datasetId
	 * @returns {Promise<*>}
	 */
	async function handleDatasetDelete(projectId, datasetId) {
		const response = await fetch(`/api/v2/project/${projectId}/dataset/${datasetId}`, {
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
			console.error('Error while deleting dataset');
			throw await getAlertErrorFromResponse(response);
		}
	}

	onMount(() => {
		datasetSearch = '';
	});
</script>

<div class="container mt-2">
	<StandardDismissableAlert message={datasetCreatedMessage} autoDismiss={false} />

	<div class="col-sm-2">
		<h3 class="fw-light">Datasets</h3>
	</div>
	<div class="col-sm-10 mb-2">
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
					data-bs-target="#createDatasetModal"
					data-bs-toggle="modal"
					onclick={() => (datasetCreatedMessage = '')}
				>
					Create new dataset
				</button>
			</div>
		</div>
	</div>
	<div id="datasetCreateErrorAlert"></div>
	<table class="table align-middle">
		<thead class="table-light">
			<tr>
				<th class="col-7 col-lg-8">Name</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#key datasets}
				{#each filteredDatasets as dataset (dataset.id)}
					<tr>
						<td>
							<a href="/v2/projects/{dataset.project_id}/datasets/{dataset.id}">
								{dataset.name}
							</a>
						</td>
						<td>
							<ConfirmActionButton
								modalId="confirmDatasetDeleteModal{dataset.id}"
								style="danger"
								btnStyle="danger"
								buttonIcon="trash"
								label="Delete"
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

<CreateDatasetModal {createDatasetCallback} {project} />
