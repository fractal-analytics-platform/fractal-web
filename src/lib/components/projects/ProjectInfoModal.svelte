<script>
	import { displayStandardErrorAlert } from '$lib/common/errors';

	// ProjectInfoModal component
	import { modalProject } from '$lib/stores/projectStores';
	import { onDestroy } from 'svelte';
	import Modal from '../common/Modal.svelte';

	// Project to be displayed
	/** @type {import('$lib/types').Project|undefined} */
	let project = undefined;

	let loadingDatasets = true;
	/** @type {import('$lib/types').Dataset[]|undefined} */
	let datasets = undefined;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let datasetErrorAlert;

	// Subscription to modalProject store to update project property with respect
	// to the project in the store. Enable app-wide updates to the project to be
	// displayed in this component.
	const unsubscribe = modalProject.subscribe(async (selectedProject) => {
		project = selectedProject;
		if (project) {
			loadingDatasets = true;
			datasets = undefined;
			datasetErrorAlert?.hide();
			const response = await fetch(`/api/v1/project/${project.id}/dataset`, {
				method: 'GET',
				credentials: 'include'
			});
			const result = await response.json();
			if (response.ok) {
				datasets = result;
			} else {
				datasetErrorAlert = displayStandardErrorAlert(result, 'errorAlert-projectInfoModal');
			}
			loadingDatasets = false;
		} else {
			datasets = undefined;
		}
	});

	function onClose() {
		modalProject.set(undefined);
	}

	onDestroy(unsubscribe);
</script>

<Modal id="projectInfoModal" size="lg" {onClose}>
	<svelte:fragment slot="header">
		{#if project}
			<h1 class="h5 modal-title flex-grow-1">Project {project.name}</h1>
			<a href={'/projects/' + project.id} class="btn btn-light me-3">
				Open <i class="bi bi-arrow-up-right-square" />
			</a>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if project}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Project properties</p>
					<ul class="list-group">
						<li class="list-group-item list-group-item-light fw-bold">Name</li>
						<li class="list-group-item">{project.name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Read only</li>
						<li class="list-group-item">{project.read_only ? 'Yes' : 'No'}</li>
					</ul>
				</div>
			</div>
			<div class="row">
				<div class="col-12">
					{#if loadingDatasets}
						Loading...
					{/if}
					<div id="errorAlert-projectInfoModal" />
					{#if datasets}
						<p class="lead">Datasets</p>
						<table class="table">
							<thead class="table-light">
								<tr>
									<th>Name</th>
									<th>Readonly</th>
									<th># Resources</th>
									<th>Type</th>
								</tr>
							</thead>
							<tbody>
								{#each datasets as { name, read_only, resource_list, type }}
									<tr>
										<td>{name}</td>
										<td>{read_only ? 'Yes' : 'No'}</td>
										<td>{resource_list.length}</td>
										<td>{type == '' ? 'Unknown' : type}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			</div>
		{/if}
	</svelte:fragment>
</Modal>
