<script>
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { getAlertErrorFromResponse, displayStandardErrorAlert } from '$lib/common/errors';
	import CreateDatasetModal from './datasets/CreateDatasetModal.svelte';
	import { onMount } from 'svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let starDatasetErrorAlert;

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
			method: 'DELETE'
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

	/**
	 * @param {import('fractal-components/types/api').DatasetV2} dataset
	 */
	async function toggleStarredDataset(dataset) {
		starDatasetErrorAlert?.hide();
		const endpoint = dataset.is_starred ? 'unstar' : 'star';
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/${endpoint}`,
			{
				method: 'POST'
			}
		);
		if (!response.ok) {
			starDatasetErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'starDatasetErrorAlert'
			);
		} else {
			datasets = datasets.map((d) =>
				d.id === dataset.id ? { ...d, is_starred: !d.is_starred } : d
			);
		}
	}

	onMount(() => {
		datasetSearch = '';
	});
</script>

<div class="container mt-2">
	<StandardDismissableAlert message={datasetCreatedMessage} autoDismiss={false} />

	<div class="row align-items-center mb-2">
		<div class="col-2">
			<h3 class="fw-light">Datasets</h3>
		</div>

		<div class="col-10">
			<div class="toolbar-actions">
				{#if datasets.length > 0}
					<input
						name="searchDataset"
						type="text"
						class="form-control toolbar-search"
						placeholder="Search dataset"
						bind:value={datasetSearch}
					/>
				{/if}

				<button
					class="btn btn-primary toolbar-button"
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
	<div id="starDatasetErrorAlert"></div>
	{#if datasets.length > 0}
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
								<button
									type="button"
									aria-label="star dataset"
									class="btn btn-link p-0 border-0 text-warning"
									title="{dataset.is_starred ? 'Unstar' : 'Star'} dataset"
									onclick={() => toggleStarredDataset(dataset)}
								>
									<i class={`bi ${dataset.is_starred ? 'bi-star-fill' : 'bi-star'}  me-2`}></i>
								</button>
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
	{:else}
		This project currently has no dataset.
	{/if}
</div>

<CreateDatasetModal {createDatasetCallback} {project} />

<style>
	.toolbar-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5rem;
	}

	.toolbar-search {
		width: 14rem;
	}

	.toolbar-button {
		width: 12rem;
		white-space: nowrap;
		flex-shrink: 0;
	}
</style>
