<script>
	import { goto } from '$app/navigation';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError } from '$lib/common/errors';
	import CreateWorkflowModal from './CreateWorkflowModal.svelte';
	import { onMount } from 'svelte';
	import { each } from 'svelte/internal';

	// The list of workflows
	/** @type {import('$lib/types').Workflow[]} */
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

	/**
	 * @param {import('$lib/types').Workflow} importedWorkflow
	 */
	function handleWorkflowImported(importedWorkflow) {
		workflows.push(importedWorkflow);
		workflows = workflows;
		goto(`/projects/${projectId}/workflows/${importedWorkflow.id}`);
	}

	onMount(() => {
		workflowSearch = '';
	});
</script>

<CreateWorkflowModal {handleWorkflowImported} bind:this={createWorkflowModal} />

<div class="container p-0 mt-5">
	<div class="row">
		<div class="col-sm-2">
			<h3 class="fw-light">Workflows</h3>
		</div>
		<div class="col-sm-10">
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
						on:click={() => createWorkflowModal.show()}
					>
						Create new workflow
					</button>
				</div>
			</div>
		</div>
	</div>
	<table class="table align-middle caption-top">
		<thead class="table-light">
			<tr>
				<th class="col-4">Id</th>
				<th class="col-4">Name</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#key workflows}
				{#each filteredWorkflows as { id, name }}
					<tr>
						<td>{id}</td>
						<td>{name}</td>
						<td>
							<a href="/projects/{projectId}/workflows/{id}" class="btn btn-light">
								<i class="bi bi-arrow-up-right-square" />
								Open
							</a>
							<a href="/projects/{projectId}/workflows/{id}/jobs" class="btn btn-light">
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
