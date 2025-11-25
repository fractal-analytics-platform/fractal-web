<script>
	import { page } from '$app/state';
	import ProjectsList from '$lib/components/v2/projects/ProjectsList.svelte';
	import ProjectInfoModal from '$lib/components/v2/projects/ProjectInfoModal.svelte';
	import InvitationNotification from '$lib/components/v2/projects/InvitationNotification.svelte';
	import { onMount } from 'svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import SharedProjectInfoModal from '$lib/components/v2/projects/SharedProjectInfoModal.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';

	/** @type {import('fractal-components/types/api').ProjectV2[]} */
	const projects = $derived(page.data.projects || []);
	/** @type {import('fractal-components/types/api').ProjectInvitation[]} */
	const invitations = $derived(page.data.invitations);

	/** @type {import('fractal-components/types/api').ProjectV2[]} */
	let sharedProjects = $state([]);
	/** @type {SharedProjectInfoModal|undefined} */
	let sharedProjectInfoModal = $state();

	/** @type {'my_projects'|'shared_projects'} */
	let selectedTab = $state('my_projects');

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	async function loadSharedProjects() {
		errorAlert?.hide();
		const response = await fetch(`/api/v2/project?is_owner=false`, {
			method: 'GET'
		});
		if (response.ok) {
			sharedProjects = await response.json();
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'projectsError'
			);
		}
	}

	/**
	 * @param {import('fractal-components/types/api').ProjectV2} project
	 */
	async function showSharedProjectInfo(project) {
		await sharedProjectInfoModal?.open(project);
	}

	/**
	 * @param {number} projectId
	 */
	async function handleLeaveProject(projectId) {
		const response = await fetch(`/api/v2/project/${projectId}/access/`, {
			method: 'DELETE'
		});
		if (response.ok) {
			sharedProjects = sharedProjects.filter((p) => {
				return p.id !== projectId;
			});
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}

	onMount(async () => {
		await loadSharedProjects();
	});
</script>

<div class="container">
	<div class="row mt-4">
		<div class="col">
			{#if invitations.length > 0}
				{#each invitations as invitation}
					<InvitationNotification {invitation} onAccept={loadSharedProjects} />
				{/each}
			{/if}
		</div>
	</div>

	<div class="row">
		<div class="column">
			<div id="projectsError"></div>
			<ul class="nav nav-tabs">
				<li class="nav-item">
					<button
						class="nav-link {selectedTab === 'my_projects' ? 'active' : ''}"
						onclick={() => (selectedTab = 'my_projects')}
						aria-current={selectedTab === 'my_projects'}
					>
						My projects
					</button>
				</li>
				<li class="nav-item">
					<button
						class="nav-link {selectedTab === 'shared_projects' ? 'active' : ''}"
						onclick={() => (selectedTab = 'shared_projects')}
						aria-current={selectedTab === 'shared_projects'}
					>
						Shared with me
					</button>
				</li>
			</ul>
		</div>
	</div>

	{#if selectedTab === 'my_projects'}
		<ProjectsList {projects} />
	{:else if sharedProjects.length === 0}
		<p class="mt-3">There are currently no projects shared with you.</p>
	{:else}
		<table class="table table-hover align-middle mt-3">
			<thead class="table-light">
				<tr>
					<th class="col-7 col-lg-8">Name</th>
					<th>Options</th>
				</tr>
			</thead>
			<tbody>
				{#each sharedProjects as project}
					<tr>
						<td>
							<a href={`/v2/projects/${project.id}`}>
								{project.name}
							</a>
						</td>
						<td>
							<button class="btn btn-light" onclick={() => showSharedProjectInfo(project)}>
								<i class="bi bi-info-circle"></i> Info
							</button>
							<ConfirmActionButton
								modalId="confirmLeaveProjectModal{project.id}"
								style="danger"
								btnStyle="danger"
								buttonIcon="bi-box-arrow-right"
								label="Leave"
								message={`Leave project ${project.name}`}
								callbackAction={() => handleLeaveProject(project.id)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<ProjectInfoModal />
	<SharedProjectInfoModal bind:this={sharedProjectInfoModal} />
</div>
