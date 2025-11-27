<script>
	import { page } from '$app/state';
	import ProjectDatasetsList from '$lib/components/v2/projects/ProjectDatasetsList.svelte';
	import WorkflowsList from '$lib/components/v2/projects/WorkflowsList.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { normalizePayload } from 'fractal-components';
	import SharedProjectInfoModal from '$lib/components/v2/projects/SharedProjectInfoModal.svelte';

	/** @type {import('fractal-components/types/api').ProjectV2} */
	const project = $derived(page.data.project);
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
					body: normalizePayload({
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

	async function showSharedProjectInfo() {
		await sharedProjectInfoModal?.open(project);
	}
</script>

{#if project}
	<div class="container d-flex justify-content-between align-items-center">
		<div class="d-flex justify-content-between align-items-center mt-3 mb-2">
			<h1 class="fw-light">Project {project.name} #{project.id}</h1>
		</div>
		<div>
			<button
				class="btn btn-light"
				data-bs-toggle="modal"
				data-bs-target="#editProjectModal"
				onclick={() => (updatedProjectName = project.name)}
				aria-label="Edit project"
			>
				<i class="bi-pencil"></i>
			</button>
			{#if projectAccess.is_owner}
				<a href="/v2/projects/{project.id}/sharing" class="btn btn-info">
					<i class="bi bi-share"></i>
					Sharing
				</a>
			{:else}
				<button class="btn btn-light" onclick={() => showSharedProjectInfo()}>
					<i class="bi bi-info-circle"></i> Info
				</button>
			{/if}
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
	{#snippet header()}
		<h5 class="modal-title">Project properties</h5>
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
