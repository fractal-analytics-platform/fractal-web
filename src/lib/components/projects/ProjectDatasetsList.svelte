<script>
	import { enhance } from '$app/forms';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

	export let datasets = [];

	async function handleCreateDataset({ form }) {
		return async ({ result }) => {
			// If the result is successful, update datasets with result.data
			if (result.type !== 'failure') {
				console.log('Dataset created', result.data);
				const dataset = result.data; // Dataset created
				datasets.push(dataset);
				datasets = datasets;
				form.reset();
			} else {
				console.log('Dataset creation failed', result.data);
				// If the result is a failure, we display the error
				new StandardErrorAlert({
					target: document.getElementById('datasetCreateErrorAlert'),
					props: {
						error: result.data
					}
				});
			}
		};
	}

	async function handleDatasetDelete(projectId, datasetId) {
		await fetch(`/projects/${projectId}/datasets/${datasetId}`, {
			method: 'DELETE',
			credentials: 'include'
		}).then(async (response) => {
			if (response.ok) {
				console.log('Dataset deleted');
				// If the request is successful, we delete the dataset entry in the datasets list
				datasets = datasets.filter((d) => {
					return d.id !== datasetId;
				});
			} else {
				console.error('Error while deleting dataset:', await response.text());
			}
		});
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
						method="post"
						action="?/createDataset"
						class="row row-cols-lg-auto g-3 align-items-center"
						use:enhance={handleCreateDataset}
					>
						<div class="col-12">
							<div class="input-group">
								<div class="input-group-text">Name</div>
								<input
									type="text"
									class="form-control"
									placeholder="dataset name"
									name="datasetName"
									on:change={null}
								/>
							</div>
						</div>
						<div class="col-12">
							<div class="input-group">
								<div class="form-check">
									<input type="checkbox" class="form-check-input" name="datasetReadonly" />
									<div class="form-check-label">Is readonly</div>
								</div>
							</div>
						</div>
						<button class="btn btn-primary" type="submit"> Create dataset </button>
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
							callbackAction={handleDatasetDelete.bind(this, project_id, id)}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
