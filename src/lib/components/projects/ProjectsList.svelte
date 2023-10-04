<script>
	import { modalProject } from '$lib/stores/projectStores.js';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import { goto } from '$app/navigation';

	// List of projects to be displayed
	export let projects = [];

	let newProjectName = '';
	$: enableCreateProject = !!newProjectName;

	function setModalProject(event) {
		const projectId = event.currentTarget.getAttribute('data-fc-project');
		const project = projects.find((p) => p.id == projectId);
		modalProject.set(project);
	}

	async function handleCreateProject() {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch('/api/v1/project', {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify({
				name: newProjectName
			})
		});

		const result = await response.json();
		if (response.ok) {
			newProjectName = '';
			projects = [...projects, result];
			goto(`/projects/${result.id}`);
		} else {
			displayStandardErrorAlert(result, 'createProjectErrorAlert');
		}
	}

	/**
	 * Deletes a project from the server
	 * @param {number} projectId
	 * @returns {Promise<*>}
	 */
	async function handleDeleteProject(projectId) {
		console.log('Client request project delete');

		const response = await fetch(`/api/v1/project/${projectId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (response.ok) {
			console.log('Project deleted successfully');
			// If the response is successful
			projects = projects.filter((p) => p.id !== projectId);
		} else {
			const result = await response.json();
			console.error(`Unable to delete project ${projectId}`)
			throw new AlertError(result);
		}
	}
</script>

<p class="lead">Projects list</p>
<div class="container">
	<div class="row mt-3 mb-3">
		<div class="col-sm-12">
			<form
				method="post"
				class="row justify-content-end"
				on:submit|preventDefault={handleCreateProject}
			>
				<div class="col-auto">
					<div class="input-group">
						<div class="input-group-text">Project name</div>
						<input
							name="projectName"
							type="text"
							class="form-control"
							bind:value={newProjectName}
						/>
					</div>
				</div>
				<div class="col-auto">
					<button type="submit" class="btn btn-primary" disabled={!enableCreateProject}
						>Create new project</button
					>
				</div>
			</form>
			<div id="createProjectErrorAlert" class="mt-3" />
		</div>
	</div>
	<div class="row">
		<table class="table table-hover align-middle">
			<thead class="table-light">
				<tr>
					<th>Id</th>
					<th>Name</th>
					<th>Options</th>
				</tr>
			</thead>
			<tbody>
				{#each projects as { id, name }}
					<tr>
						<td class="col-2">{id}</td>
						<td class="col-6">{name}</td>
						<td class="col-4">
							<button
								data-fc-project={id}
								class="btn btn-light"
								data-bs-toggle="modal"
								data-bs-target="#projectInfoModal"
								on:click={setModalProject}
							>
								<i class="bi bi-info-circle" /> Info
							</button>
							<a href={'/projects/' + id} class="btn btn-light"
								><i class="bi bi-arrow-up-right-square" /> Open</a
							>
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
			</tbody>
		</table>
	</div>
</div>
