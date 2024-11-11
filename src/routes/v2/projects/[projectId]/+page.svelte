<script>
	import { page } from '$app/stores';
	import ProjectDatasetsList from '$lib/components/v2/projects/ProjectDatasetsList.svelte';
	import WorkflowsList from '$lib/components/v2/projects/WorkflowsList.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { getAlertErrorFromResponse } from '$lib/common/errors';

	// Component properties
	let project = $page.data.project;
	let datasets = $page.data.datasets;
	let workflows = $page.data.workflows;
	let projectUpdatesSuccessMessage = '';

	let updatedProjectName = '';
	let updating = false;

	/** @type {Modal} */
	let editProjectModal;

	async function handleProjectPropertiesUpdate() {
		editProjectModal.confirmAndHide(
			async () => {
				updating = true;
				projectUpdatesSuccessMessage = '';
				if (!updatedProjectName) {
					return;
				}

				const headers = new Headers();
				headers.set('Content-Type', 'application/json');

				const response = await fetch(`/api/v2/project/${project.id}`, {
					method: 'PATCH',
					credentials: 'include',
					mode: 'cors',
					headers,
					body: JSON.stringify({
						name: updatedProjectName
					})
				});

				if (response.ok) {
					console.log('Project updated successfully');
					projectUpdatesSuccessMessage = 'Project properties successfully updated';
					const result = await response.json();
					project.name = result.name;
				} else {
					console.error('Error while updating project');
					throw await getAlertErrorFromResponse(response);
				}
			},
			() => {
				updating = false;
			}
		);
	}

	function onEditProjectModalOpen() {
		projectUpdatesSuccessMessage = '';
	}
</script>

{#if project}
	<div class="d-flex justify-content-between align-items-center">
		<div class="d-flex justify-content-between align-items-center mt-2 mb-2">
			<h1 class="fw-light">Project {project.name} #{project.id}</h1>
		</div>
		<div>
			<button
				class="btn btn-light"
				data-bs-toggle="modal"
				data-bs-target="#editProjectModal"
				on:click={() => (updatedProjectName = project.name)}
			>
				<i class="bi-pencil" />
			</button>
		</div>
	</div>

	<StandardDismissableAlert message={projectUpdatesSuccessMessage} />
	<ProjectDatasetsList {datasets} />
	<WorkflowsList {workflows} projectId={project.id} />
{/if}

<Modal
	id="editProjectModal"
	centered={true}
	bind:this={editProjectModal}
	onOpen={onEditProjectModalOpen}
>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Project properties</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-editProjectModal" />
		{#if project}
			<form id="updateProject" on:submit|preventDefault={handleProjectPropertiesUpdate}>
				<div class="mb-3">
					<label for="projectName" class="form-label">Project name</label>
					<input
						type="text"
						class="form-control"
						name="projectName"
						id="projectName"
						bind:value={updatedProjectName}
						required
					/>
				</div>
			</form>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" form="updateProject" disabled={updating}>
			{#if updating}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Save
		</button>
	</svelte:fragment>
</Modal>
