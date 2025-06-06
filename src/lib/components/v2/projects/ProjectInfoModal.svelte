<script>
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';

	// ProjectInfoModal component
	import { projectInfoModalV2 } from '$lib/stores';
	import { onDestroy } from 'svelte';
	import Modal from '../../common/Modal.svelte';

	// Project to be displayed
	/** @type {import('fractal-components/types/api').ProjectV2|undefined} */
	let project = $state();

	let loadingDatasets = $state(true);
	/** @type {import('fractal-components/types/api').DatasetV2[]|undefined} */
	let datasets = $state();

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let datasetErrorAlert;

	// Subscription to modalProject store to update project property with respect
	// to the project in the store. Enable app-wide updates to the project to be
	// displayed in this component.
	const unsubscribe = projectInfoModalV2.subscribe(async (selectedProject) => {
		project = selectedProject;
		if (project) {
			loadingDatasets = true;
			datasets = undefined;
			datasetErrorAlert?.hide();
			const response = await fetch(`/api/v2/project/${project.id}/dataset?history=false`, {
				method: 'GET',
				credentials: 'include'
			});
			if (response.ok) {
				/** @type {import('fractal-components/types/api.js').DatasetV2[]} */
				const result = await response.json();
				result.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
				datasets = result;
			} else {
				datasetErrorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					'errorAlert-projectInfoModal'
				);
			}
			loadingDatasets = false;
		} else {
			datasets = undefined;
		}
	});

	function onClose() {
		projectInfoModalV2.set(undefined);
	}

	onDestroy(unsubscribe);
</script>

<Modal id="projectInfoModal" size="lg" {onClose}>
	{#snippet header()}
		{#if project}
			<h1 class="h5 modal-title flex-grow-1">Project {project.name}</h1>
			<a href={'/v2/projects/' + project.id} class="btn btn-light me-3">
				Open <i class="bi bi-arrow-up-right-square"></i>
			</a>
		{/if}
	{/snippet}
	{#snippet body()}
		{#if project}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Project properties</p>
					<ul class="list-group">
						<li class="list-group-item list-group-item-light fw-bold">Name</li>
						<li class="list-group-item">{project.name}</li>
					</ul>
				</div>
			</div>
			<div class="row">
				<div class="col-12">
					{#if loadingDatasets}
						Loading...
					{/if}
					<div id="errorAlert-projectInfoModal"></div>
					{#if datasets}
						<p class="lead">Datasets</p>
						<ul>
							{#each datasets as dataset (dataset.id)}
								<li>
									{dataset.name}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}
</Modal>
