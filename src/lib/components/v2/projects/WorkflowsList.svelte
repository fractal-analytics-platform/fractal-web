<script>
	import { goto } from '$app/navigation';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import CreateWorkflowModal from './CreateWorkflowModal.svelte';
	import { onMount } from 'svelte';
	import { saveSelectedDataset } from '$lib/common/workflow_utilities';

	// The list of workflows
	/** @type {import('fractal-components/types/api').WorkflowV2[]} */
	export let workflows = [];
	// Set the projectId prop to reference a specific project for each workflow
	export let projectId = undefined;

	let workflowSearch = '';

	$: filteredWorkflows = workflows.filter((p) =>
		p.name.toLowerCase().includes(workflowSearch.toLowerCase())
	);

	/** @type {CreateWorkflowModal} */
	let createWorkflowModal;

	/**
	 * Deletes a project's workflow from the server
	 * @param {number} workflowId
	 * @returns {Promise<*>}
	 */
	async function handleDeleteWorkflow(workflowId) {
		const response = await fetch(`/api/v2/project/${projectId}/workflow/${workflowId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (response.ok) {
			console.log('Workflow deleted');
			const deletedWorkflow = workflows.filter((w) => w.id === workflowId)[0];
			workflows = workflows.filter((w) => w.id !== workflowId);
			saveSelectedDataset(deletedWorkflow, undefined);
		} else {
			console.error('Workflow not deleted');
			throw await getAlertErrorFromResponse(response);
		}
	}

	/**
	 * @param {import('fractal-components/types/api').WorkflowV2} importedWorkflow
	 */
	function handleWorkflowImported(importedWorkflow) {
		workflows.push(importedWorkflow);
		workflows = workflows;
		goto(`/v2/projects/${projectId}/workflows/${importedWorkflow.id}`);
	}

	onMount(() => {
		workflowSearch = '';
	});
</script>

<CreateWorkflowModal {handleWorkflowImported} bind:this={createWorkflowModal} />

<div class="container mt-5">
	<div class="col-sm-2">
		<h3 class="fw-light">Workflows</h3>
	</div>
	<div class="col-sm-10 mb-2">
		<div class="row justify-content-end">
			<div class="col-auto">
				<div class="input-group">
					<input
						name="searchWorkflow"
						type="text"
						class="form-control"
						placeholder="Search workflow"
						bind:value={workflowSearch}
					/>
				</div>
			</div>
			<div class="col-auto">
				<button
					class="btn btn-primary float-end"
					type="submit"
					on:click={() => {
						createWorkflowModal.show();
					}}
				>
					Create new workflow
				</button>
			</div>
		</div>
	</div>

	<table class="table align-middle caption-top">
		<thead class="table-light">
			<tr>
				<th class="col-7 col-lg-8">Name</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#key workflows}
				{#each filteredWorkflows as { id, name }}
					<tr>
						<td>
							<a href="/v2/projects/{projectId}/workflows/{id}">
								{name}
							</a>
						</td>
						<td>
							<a href="/v2/projects/{projectId}/workflows/{id}/jobs" class="btn btn-light">
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
			{/key}
		</tbody>
	</table>
</div>
