<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ProjectDatasetsList from '$lib/components/projects/ProjectDatasetsList.svelte';
	import WorkflowsList from '$lib/components/projects/WorkflowsList.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';

	// Component properties
	let project = $page.data.project;
	let workflows = $page.data.workflows;
	let projectUpdatesSuccess = undefined;

	let updatedProjectName = '';
	let projectPropertiesErrorAlert = undefined;

	onMount(async () => {
		// Remove old error when opening the modal
		const editProjectModal = document.getElementById('editProjectModal');
		if (editProjectModal) {
			editProjectModal.addEventListener('show.bs.modal', () => {
				if (projectPropertiesErrorAlert) {
					projectPropertiesErrorAlert.hide();
				}
			});
		}
	});

	async function handleProjectPropertiesUpdate() {
		projectUpdatesSuccess = undefined;
		if (!updatedProjectName) {
			return;
		}

		// Remove old error
		if (projectPropertiesErrorAlert) {
			projectPropertiesErrorAlert.hide();
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
			projectUpdatesSuccess = true;
			setTimeout(() => {
				projectUpdatesSuccess = undefined;
			}, 3000);
			project.name = result.name;
		} else {
			console.error('Error while updating project', result);
			projectPropertiesErrorAlert = displayStandardErrorAlert(result, 'projectPropertiesError');
			projectUpdatesSuccess = false;
		}
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
		<a href={`/projects/${project?.id}/jobs`} class="btn btn-light">
			<i class="bi-journal-code" /> Jobs
		</a>
	</div>
</div>

{#if project}
	<div class="container">
		<div class="d-flex justify-content-between align-items-center my-3">
			<h1>Project {project.name} #{project.id}</h1>
		</div>

		<ProjectDatasetsList datasets={project.dataset_list} />
		<WorkflowsList {workflows} projectId={project.id} />
	</div>
{/if}

<div class="modal" id="editProjectModal">
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Project properties</h5>
				<button class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<div id="projectPropertiesError" />
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
			</div>
			<div class="modal-footer">
				{#if projectUpdatesSuccess}
					<div class="m-2 p-2 alert alert-success d-flex align-items-center">
						<i class="bi bi-check-circle" />
						<div class="ms-2">Properties updated</div>
					</div>
				{/if}
				<button class="btn btn-primary" form="updateProject">Save</button>
			</div>
		</div>
	</div>
</div>
