<script>
	import { projectInfoModalV2 } from '$lib/stores';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { getAlertErrorFromResponse, getFieldValidationError } from '$lib/common/errors';
	import { goto } from '$app/navigation';
	import Modal from '../../common/Modal.svelte';
	import { deleteDatasetSelectionsForProject } from '$lib/common/workflow_utilities';
	import { normalizePayload } from 'fractal-components';
	import { resolve } from '$app/paths';

	// List of projects to be displayed

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').ProjectV2[]} [projects]
	 * @property {string} [projectSearch]
	 * @property {Modal|undefined} [newProjectModal]
	 *
	 */

	/** @type {Props} */
	let { projects = $bindable([]), projectSearch = '', newProjectModal = $bindable() } = $props();

	let filteredProjects = $derived(
		projects.filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
	);

	let newProjectName = $state('');
	let newProjectDescription = $state('');
	let newProjectNameError = $state('');

	function onNewProjectModalOpen() {
		newProjectName = '';
		newProjectDescription = '';
		newProjectNameError = '';
		newProjectModal?.hideErrorAlert();
	}

	/**
	 * @param {number} projectId
	 */
	function setProjectInfoModal(projectId) {
		/** @type {import('fractal-components/types/api').ProjectV2} */
		const project = projects.filter((p) => p.id === projectId)[0];
		projectInfoModalV2.set(project);
	}

	let creating = $state(false);

	async function handleCreateProject() {
		newProjectModal?.hideErrorAlert();
		newProjectNameError = '';
		creating = true;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const payload = {
			name: newProjectName
		};

		if (newProjectDescription !== '') {
			payload.description = newProjectDescription;
		}

		const response = await fetch(`/api/v2/project`, {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: normalizePayload(payload)
		});

		const result = await response.json();
		creating = false;
		if (response.ok) {
			newProjectName = '';
			newProjectDescription = '';
			projects = [...projects, result];
			newProjectModal?.hide();
			await goto(
				resolve(`/v2/projects/[projectId]`, {
					projectId: result.id
				})
			);
		} else {
			const error = getFieldValidationError(result, response.status);
			if (error) {
				newProjectNameError = error;
			} else {
				newProjectModal?.displayErrorAlert(result);
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

	/**
	 * @param {number} project_id
	 * @param {boolean} is_starred
	 */
	async function toggleStarredProject(project_id, is_starred) {
		const endpoint = is_starred ? 'unstar' : 'star';
		const response = await fetch(`/api/v2/project/${project_id}/${endpoint}`, {
			method: 'POST'
		});
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		} else {
			projects = projects.map((p) =>
				p.id === project_id ? { ...p, is_starred: !p.is_starred } : p
			);
		}
	}
</script>

<div class="row">
	<div class="col">
		{#if projects.length === 0}
			<p class="mt-3">You currently have no owned project.</p>
		{:else}
			<table class="table table-hover align-middle">
				<thead class="table-light">
					<tr>
						<th class="col-7 col-lg-8">Name</th>
						<th>Options</th>
					</tr>
				</thead>
				<tbody>
					{#key projects}
						{#each filteredProjects as { id, name, is_starred } (id)}
							<tr>
								<td>
									<button
										type="button"
										aria-label="star project"
										class="btn btn-link p-0 border-0 text-warning"
										title="{is_starred ? 'Unstar' : 'Star'} dataset"
										onclick={() => toggleStarredProject(id, is_starred)}
									>
										<i class={`bi ${is_starred ? 'bi-star-fill' : 'bi-star'} me-2`}></i>
									</button>
									<a href={'/v2/projects/' + id}>
										{name}
									</a>
								</td>
								<td>
									<button
										class="btn btn-light"
										data-bs-toggle="modal"
										data-bs-target="#projectInfoModal"
										onclick={() => setProjectInfoModal(id)}
									>
										<i class="bi bi-info-circle"></i> Info
									</button>
									<a href="/v2/projects/{id}/sharing" class="btn btn-info">
										<i class="bi bi-share"></i>
										Sharing
									</a>
									<ConfirmActionButton
										modalId={'confirmDeleteProject' + id}
										style="danger"
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
		{/if}
	</div>
</div>

<Modal
	id="crateNewProjectModal"
	bind:this={newProjectModal}
	onOpen={onNewProjectModalOpen}
	size="md"
	centered={true}
>
	{#snippet header()}
		<h1 class="modal-title fs-5">Create new project</h1>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-crateNewProjectModal"></div>
		<form
			class="row"
			onsubmit={(e) => {
				e.preventDefault();
				handleCreateProject();
			}}
			id="create-project-form"
		>
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
				<div class="row mb-3">
					<label for="projectDescription" class="col-md-3 col-form-label">Description</label>
					<div class="col-md-9">
						<textarea
							id="projectDescription"
							bind:value={newProjectDescription}
							class="form-control"
							rows="4"
						></textarea>
					</div>
				</div>
			</div>
		</form>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button class="btn btn-primary" form="create-project-form" disabled={creating}>
			{#if creating}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Create
		</button>
	{/snippet}
</Modal>
