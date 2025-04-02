<script>
	import { projectInfoModalV2 } from '$lib/stores/projectStores.js';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { getAlertErrorFromResponse, getFieldValidationError } from '$lib/common/errors';
	import { goto } from '$app/navigation';
	import Modal from '../../common/Modal.svelte';
	import { deleteDatasetSelectionsForProject } from '$lib/common/workflow_utilities';

	// List of projects to be displayed
	/** @type {import('fractal-components/types/api').ProjectV2[]} */
	export let projects = [];

	let projectSearch = '';

	$: filteredProjects = projects.filter((p) =>
		p.name.toLowerCase().includes(projectSearch.toLowerCase())
	);

	/** @type {Modal} */
	let newProjectModal;

	let newProjectName = '';
	let newProjectNameError = '';

	function onNewProjectModalOpen() {
		newProjectName = '';
		newProjectNameError = '';
		newProjectModal.hideErrorAlert();
	}

	/**
	 * @param {number} projectId
	 */
	function setProjectInfoModal(projectId) {
		/** @type {import('fractal-components/types/api').ProjectV2} */
		const project = projects.filter((p) => p.id === projectId)[0];
		projectInfoModalV2.set(project);
	}

	let creating = false;

	async function handleCreateProject() {
		newProjectModal.hideErrorAlert();
		newProjectNameError = '';
		creating = true;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/project`, {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify({
				name: newProjectName
			})
		});

		const result = await response.json();
		creating = false;
		if (response.ok) {
			newProjectName = '';
			projects = [...projects, result];
			newProjectModal.hide();
			goto(`/v2/projects/${result.id}`);
		} else {
			const error = getFieldValidationError(result, response.status);
			if (error) {
				newProjectNameError = error;
			} else {
				newProjectModal.displayErrorAlert(result);
			}
		}
	}

	/**
	 * Deletes a project from the server
	 * @param {number} projectId
	 * @returns {Promise<*>}
	 */
	async function handleDeleteProject(projectId) {
		console.log('Client request project delete');

		const response = await fetch(`/api/v2/project/${projectId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (response.ok) {
			console.log('Project deleted successfully');
			// If the response is successful
			projects = projects.filter((p) => p.id !== projectId);
			deleteDatasetSelectionsForProject(projectId);
		} else {
			console.error(`Unable to delete project ${projectId}`);
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<div class="row mt-3 mb-3">
	<div class="col-sm-12">
		<div class="row justify-content-end">
			<div class="col-auto">
				<div class="input-group">
					<input
						name="searchProject"
						type="text"
						class="form-control"
						placeholder="Search"
						bind:value={projectSearch}
					/>
				</div>
			</div>
			<div class="col-auto">
				<button class="btn btn-primary" on:click={() => newProjectModal.show()}>
					Create new project
				</button>
			</div>
		</div>
	</div>
</div>
<div class="row">
	<table class="table table-hover align-middle">
		<thead class="table-light">
			<tr>
				<th class="col-7 col-lg-8">Name</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#key projects}
				{#each filteredProjects as { id, name }}
					<tr>
						<td>
							<a href={'/v2/projects/' + id}>
								{name}
							</a>
						</td>
						<td>
							<button
								class="btn btn-light"
								data-bs-toggle="modal"
								data-bs-target="#projectInfoModal"
								on:click={() => setProjectInfoModal(id)}
							>
								<i class="bi bi-info-circle" /> Info
							</button>
							<ConfirmActionButton
								modalId={'confirmDeleteProject' + id}
								style={'danger'}
								btnStyle="danger"
								message="Delete project {name}"
								buttonIcon="trash"
								label="Delete"
								callbackAction={() => handleDeleteProject(id)}
							/>
						</td>
					</tr>
				{/each}
			{/key}
		</tbody>
	</table>
</div>

<Modal
	id="crateNewProjectModal"
	bind:this={newProjectModal}
	onOpen={onNewProjectModalOpen}
	size="md"
	centered={true}
>
	<svelte:fragment slot="header">
		<h1 class="modal-title fs-5">Create new project</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-crateNewProjectModal" />
		<form class="row" on:submit|preventDefault={handleCreateProject} id="create-project-form">
			<div class="col">
				<div class="row mb-3">
					<label for="projectName" class="col-md-3 col-form-label">Project name</label>
					<div class="col-md-9">
						<input
							id="projectName"
							type="text"
							bind:value={newProjectName}
							class="form-control"
							class:is-invalid={newProjectNameError}
							required
						/>
						{#if newProjectNameError}
							<div class="invalid-feedback">{newProjectNameError}</div>
						{/if}
					</div>
				</div>
			</div>
		</form>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button class="btn btn-primary" form="create-project-form" disabled={creating}>
			{#if creating}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Create
		</button>
	</svelte:fragment>
</Modal>
