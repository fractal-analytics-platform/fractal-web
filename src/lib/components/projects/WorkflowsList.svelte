<script>
	import { goto } from '$app/navigation';
	import WorkflowImport from '$lib/components/projects/WorkflowImport.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '../common/Modal.svelte';

	// The list of workflows
	export let workflows = [];
	// Set the projectId prop to reference a specific project for each workflow
	export let projectId = undefined;
	// Control whether the user can send or not the form
	let newWorkflowName = '';
	$: enableCreateWorkflow = !!newWorkflowName;
	let validationError = false;

	/** @type {WorkflowImport} */
	let workflowImportComponent;

	/**
	 * Creates a new workflow in the server
	 * @returns {Promise<*>}
	 */
	async function handleCreateWorkflow() {
		if (!enableCreateWorkflow) {
			return;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${projectId}/workflow`, {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify({
				name: newWorkflowName
			})
		});

		const result = await response.json();
		if (response.ok) {
			newWorkflowName = '';
			goto(`/projects/${projectId}/workflows/${result.id}`);
		} else {
			displayStandardErrorAlert(result, 'workflowCreateAlertError');
		}
	}

	/**
	 * Deletes a project's workflow from the server
	 * @param {number} workflowId
	 * @returns {Promise<*>}
	 */
	async function handleDeleteWorkflow(workflowId) {
		const response = await fetch(`/api/v1/project/${projectId}/workflow/${workflowId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (response.ok) {
			console.log('Workflow deleted');
			workflows = workflows.filter((wkf) => {
				return wkf.id !== workflowId;
			});
		} else {
			const result = await response.json();
			console.error('Workflow not deleted', result);
			throw new AlertError(result);
		}
	}

	function handleWorkflowImported(event) {
		const importedWorkflow = event.detail;
		workflows.push(importedWorkflow);
		workflows = workflows;
	}
</script>

<Modal id="importWorkflowModal" size="lg" centered="{true}" scrollable={true}>
	<div class="modal-header">
		<h5 class="modal-title">Import workflow</h5>
		<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
	</div>
	<div class="modal-body">
		<WorkflowImport on:workflowImported={handleWorkflowImported} bind:this={workflowImportComponent} />
	</div>
</Modal>

<div class="container p-0 mt-4">
	<p class="lead">Workflows</p>
	<div id="workflowCreateAlertError" />
	<table class="table align-middle caption-top">
		<caption class="text-bg-light border-top border-bottom pe-3 ps-3">
			<div class="d-flex align-items-center justify-content-between">
				<span class="fw-normal">
					<button
						type="button"
						class="btn btn-primary"
						data-bs-toggle="modal"
						data-bs-target="#importWorkflowModal"
						on:click={() => workflowImportComponent.reset()}
					>
						Import workflow
					</button>
				</span>
				<div>
					<form
						class="row row-cols-lg-auto g-3 align-items-center"
						on:submit|preventDefault={handleCreateWorkflow}
					>
						<div class="col-12">
							<div class="input-group">
								<div class="input-group-text">Name</div>
								<input
									type="text"
									class="form-control {validationError ? 'is-invalid' : ''}"
									placeholder="workflow name"
									name="workflowName"
									bind:value={newWorkflowName}
								/>
							</div>
						</div>
						<button class="btn btn-primary" disabled={!enableCreateWorkflow} type="submit">
							Create new workflow
						</button>
					</form>
				</div>
			</div>
		</caption>
		<thead class="table-light">
			<tr>
				<th class="col-4">Id</th>
				<th class="col-4">Name</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#each workflows as { id, name }}
				<tr>
					<td>{id}</td>
					<td>{name}</td>
					<td>
						<a href="/projects/{projectId}/workflows/{id}" class="btn btn-light">
							<i class="bi bi-arrow-up-right-square" />
							Open
						</a>
						<a href="/projects/{projectId}/jobs?workflow={id}" class="btn btn-light">
							<i class="bi-journal-code" /> List jobs
						</a>
						<ConfirmActionButton
							modalId={'deleteConfirmModal' + id}
							style={'danger'}
							btnStyle="danger"
							buttonIcon="trash"
							label={'Delete'}
							message="Delete workflow {name}"
							callbackAction={() => handleDeleteWorkflow(id)}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
