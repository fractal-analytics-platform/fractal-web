<script>
	import { page } from '$app/state';
	import ProjectDatasetsList from '$lib/components/v2/projects/ProjectDatasetsList.svelte';
	import WorkflowsList from '$lib/components/v2/projects/workflow/WorkflowsList.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { normalizePayload } from 'fractal-components';
	import SharedProjectInfoModal from '$lib/components/v2/projects/SharedProjectInfoModal.svelte';
	import { tick } from 'svelte';

	const maxDescriptionLength = 50;
	const descriptionLengthOffset = 10;
	let expandProjectDescription = $state(false);

	/** @type {import('fractal-components/types/api').ProjectV2} */
	let project = $state(page.data.project);
	/** @type {import('fractal-components/types/api').ProjectAccessRead} */
	const projectAccess = $derived(page.data.projectAccess);
	/** @type {import('fractal-components/types/api').DatasetV2[]} */
	const datasets = $derived(page.data.datasets);
	/** @type {import('fractal-components/types/api').WorkflowV2[]} */
	const workflows = $derived(page.data.workflows);

	/** @type {SharedProjectInfoModal|undefined} */
	let sharedProjectInfoModal = $state();

	let projectUpdatesSuccessMessage = $state('');

	let updatedProjectName = $state('');
	let updatedProjectDescription = $state('');
	let updating = $state(false);

	/** @type {Modal|undefined} */
	let editProjectModal = $state();

	async function handleProjectPropertiesUpdate() {
		editProjectModal?.confirmAndHide(
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
					body: normalizePayload(
						{
							name: updatedProjectName,
							description: updatedProjectDescription
						},
						{ nullifyEmptyStrings: true }
					)
				});

				if (response.ok) {
					console.log('Project updated successfully');
					const result = await response.json();
					project = { ...project, name: result.name, description: result.description };
					projectUpdatesSuccessMessage = 'Project properties successfully updated';
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

	async function showSharedProjectInfo() {
		await sharedProjectInfoModal?.open(project);
	}
</script>

<div class="container mt-3">
	<div class="d-flex justify-content-between align-items-center mb-2">
		<h1 class="fw-light mb-0">Project {project.name} #{project.id}</h1>

		<div class="d-flex gap-2">
			<button
				class="btn btn-light"
				data-bs-toggle="modal"
				data-bs-target="#editProjectModal"
				onclick={() => {
					updatedProjectName = project.name;
					updatedProjectDescription = project.description || '';
				}}
				aria-label="Edit project"
			>
				<i class="bi-info-circle"></i>
			</button>

			{#if projectAccess.is_owner}
				<a href="/v2/projects/{project.id}/sharing" class="btn btn-info">
					<i class="bi bi-share"></i>
					Sharing
				</a>
			{:else}
				<button class="btn btn-light" onclick={() => showSharedProjectInfo()}>
					<i class="bi bi-info-circle"></i>
					Info
				</button>
			{/if}
		</div>
	</div>

	{#if project.description}
		<div class="mb-3">
			<span>
				{#if project.description.length > maxDescriptionLength + descriptionLengthOffset}
					{#if expandProjectDescription}
						{project.description}
					{:else}
						{project.description.substring(0, maxDescriptionLength)}...
					{/if}

					{#if expandProjectDescription}
						<button
							class="btn btn-link fw-light p-0 ms-2"
							onclick={() => (expandProjectDescription = false)}
						>
							Show less
						</button>
					{:else}
						<button
							class="btn btn-link fw-light p-0 ms-2"
							onclick={() => (expandProjectDescription = true)}
						>
							Show more
						</button>
					{/if}
				{:else}
					{project.description}
				{/if}
			</span>

			{#if project.description.length <= maxDescriptionLength + descriptionLengthOffset || expandProjectDescription}
				<button
					class="btn btn-link p-0 ms-2 align-baseline"
					data-bs-toggle="modal"
					data-bs-target="#editProjectModal"
					aria-label="Edit description"
					onclick={async () => {
						updatedProjectName = project.name;
						updatedProjectDescription = project.description || '';
						await tick();
						document.getElementById('projectDescription')?.focus();
					}}
				>
					<i class="bi bi-pencil"></i>
				</button>
			{/if}
		</div>
	{/if}

	<StandardDismissableAlert message={projectUpdatesSuccessMessage} />
</div>

<ProjectDatasetsList {datasets} {project} />
<WorkflowsList {workflows} projectId={project.id} />

<Modal
	id="editProjectModal"
	centered={true}
	bind:this={editProjectModal}
	onOpen={onEditProjectModalOpen}
>
	{#snippet header()}
		{#if project}
			<h1 class="h5 modal-title flex-grow-1">Project {project.name}</h1>
		{/if}
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-editProjectModal"></div>
		{#if project}
			<form
				id="updateProject"
				onsubmit={(e) => {
					e.preventDefault();
					handleProjectPropertiesUpdate();
				}}
			>
				<div class="mb-3">
					<label for="projectName" class="form-label">Name</label>
					<input
						type="text"
						class="form-control"
						name="projectName"
						id="projectName"
						bind:value={updatedProjectName}
						required
					/>
				</div>
				<div class="mb-3">
					<label for="projectDescription" class="form-label">Description</label>
					<textarea
						id="projectDescription"
						bind:value={updatedProjectDescription}
						class="form-control"
						name="projectDescription"
						rows="4"
					></textarea>
				</div>
			</form>
		{/if}
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-primary" form="updateProject" disabled={updating}>
			{#if updating}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
	{/snippet}
</Modal>

<SharedProjectInfoModal bind:this={sharedProjectInfoModal} />
