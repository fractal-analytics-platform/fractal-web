<script>
	import { page } from '$app/stores';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';

	export let datasets = [];

	$: newDatasetName = '';
	$: newDatasetReadonly = false;
	$: enableCreateDataset = !!newDatasetName;

	/**
	 * Creates a project's dataset in the server
	 * @returns {Promise<*>}
	 */
	async function handleCreateDataset() {
		if (!enableCreateDataset) {
			return;
		}
		const projectId = $page.params.projectId;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v1/project/${projectId}/dataset`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: newDatasetName,
				read_only: newDatasetReadonly,
				meta: {}
			})
		});
		const result = await response.json();
		if (response.ok) {
			datasets = [...datasets, result];
			newDatasetName = '';
			newDatasetReadonly = false;
		} else {
			console.log('Dataset creation failed', result);
			displayStandardErrorAlert(result, 'datasetCreateErrorAlert');
		}
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
</script>

<div class="container p-0 mt-4">
	<p class="lead">Datasets</p>
	<div id="datasetCreateErrorAlert" />
	<table class="table align-middle caption-top">
		<caption class="text-bg-light border-top border-bottom pe-3 ps-3">
			<div class="d-flex align-items-center justify-content-end">
				<span class="fw-normal" />
				<div>
					<form
						class="row row-cols-lg-auto g-3 align-items-center"
						on:submit|preventDefault={handleCreateDataset}
					>
						<div class="col-12">
							<div class="input-group">
								<div class="input-group-text">Name</div>
								<input
									type="text"
									class="form-control"
									placeholder="dataset name"
									bind:value={newDatasetName}
								/>
							</div>
						</div>
						<div class="col-12">
							<div class="input-group">
								<div class="form-check">
									<input
										type="checkbox"
										class="form-check-input"
										bind:checked={newDatasetReadonly}
									/>
									<div class="form-check-label">Is readonly</div>
								</div>
							</div>
						</div>
						<button class="btn btn-primary" type="submit" disabled={!enableCreateDataset}>
							Create new dataset
						</button>
					</form>
				</div>
			</div>
		</caption>
		<thead class="table-light">
			<tr>
				<th class="col-4">Name</th>
				<th class="col-4">Type</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#each datasets as { name, type, project_id, id }}
				<tr>
					<td>{name}</td>
					<td>{type || 'Unknown'}</td>
					<td>
						<a class="btn btn-light" href="/projects/{project_id}/datasets/{id}"
							><i class="bi bi-arrow-up-right-square" /> Open</a
						>
						<ConfirmActionButton
							modalId="confirmDatasetDeleteModal{id}"
							style={'danger'}
							btnStyle="danger"
							buttonIcon="trash"
							label={'Delete'}
							message={`Delete dataset ${name} from project ${project_id}`}
							callbackAction={() => handleDatasetDelete(project_id, id)}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
