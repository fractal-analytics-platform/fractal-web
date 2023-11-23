<script>
	import { page } from '$app/stores';
	import ProjectDatasetsList from '$lib/components/projects/ProjectDatasetsList.svelte';
	import WorkflowsList from '$lib/components/projects/WorkflowsList.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { AlertError } from '$lib/common/errors';

	// Component properties
	let project = $page.data.project;
	let datasets = $page.data.datasets;
	let workflows = $page.data.workflows;
	let projectUpdatesSuccessMessage = '';

	let updatedProjectName = '';

	/** @type {Modal} */
	let editProjectModal;

	async function handleProjectPropertiesUpdate() {
		editProjectModal.confirmAndHide(async () => {
			projectUpdatesSuccessMessage = '';
			if (!updatedProjectName) {
				return;
			}

			const headers = new Headers();
			headers.set('Content-Type', 'application/json');

			const response = await fetch(`/api/v1/project/${project.id}`, {
				method: 'PATCH',
				credentials: 'include',
				mode: 'cors',
				headers,
				body: JSON.stringify({
					name: updatedProjectName
				})
			});

			const result = await response.json();
			if (response.ok) {
				console.log('Project updated successfully');
				projectUpdatesSuccessMessage = 'Project properties successfully updated';
				project.name = result.name;
			} else {
				console.error('Error while updating project', result);
				throw new AlertError(result);
			}
		});
	}

	function onEditProjectModalOpen() {
		projectUpdatesSuccessMessage = '';
	}
</script>

<div class="d-flex justify-content-between align-items-center">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/projects">Projects</a>
			</li>
			{#if project}
				<li class="breadcrumb-item active" aria-current="page">{project.name}</li>
			{/if}
		</ol>
	</nav>
	<div>
		<button
			class="btn btn-light"
			data-bs-toggle="modal"
			data-bs-target="#editProjectModal"
			on:click={() => (updatedProjectName = project.name)}
		>
			<i class="bi-gear-wide-connected" />
		</button>
	</div>
</div>

{#if project}
	<div class="container">
		<div class="d-flex justify-content-between align-items-center my-3">
			<h1>Project {project.name} #{project.id}</h1>
		</div>

		<StandardDismissableAlert message={projectUpdatesSuccessMessage} />
		<ProjectDatasetsList {datasets} />
		<WorkflowsList {workflows} projectId={project.id} />
	</div>
{/if}

<Modal id="editProjectModal" centered={true} bind:this={editProjectModal} onOpen={onEditProjectModalOpen}>
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
		<button class="btn btn-primary" form="updateProject">Save</button>
	</svelte:fragment>
</Modal>
