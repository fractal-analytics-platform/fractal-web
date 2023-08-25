<script>
	import { enhance } from '$app/forms';
	import { fieldHasValue } from '$lib/common/component_utilities';
	import { goto } from '$app/navigation';
	import WorkflowImport from '$lib/components/projects/WorkflowImport.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

	// The list of workflows
	export let workflows = [];
	// Set the projectId prop to reference a specific project for each workflow
	export let projectId = undefined;
	// Control whether the user can send or not the form
	let enableCreateWorkflow = false;
	let validationError = false;

	async function handleCreateWorkflow({ form }) {
		return async ({ result }) => {
			// If the result type is not failure, then a new workflow resource has been created
			if (result.type !== 'failure') {
				// Reset the form
				form.reset();
				// Workflow resource
				const workflow = result.data;
				// Go to the new workflow page
				goto(`/projects/${projectId}/workflows/${workflow.id}`);
			} else {
				// Instantiate a new standard error alert
				new StandardErrorAlert({
					target: document.getElementById('workflowCreateAlertError'),
					props: {
						error: result.data
					}
				});
			}
		};
	}

	async function handleDeleteWorkflow(workflowId) {
		const result = await fetch('/projects/' + projectId + '/workflows/' + workflowId, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (result.ok) {
			console.log('Workflow deleted');
			// Workflow has been deleted
			workflows = workflows.filter((wkf) => {
				return wkf.id !== workflowId;
			});
		} else {
			console.error('Workflow not deleted', result.statusText);
			// Instantiate a new standard error alert
			new StandardErrorAlert({
				target: document.getElementById('workflowDeleteAlertError'),
				props: {
					error: result.statusText
				}
			});
		}
	}

	function handleWorkflowImported(event) {
		const importedWorkflow = event.detail;
		workflows.push(importedWorkflow);
		workflows = workflows;
	}
</script>

<div class="modal" id="importWorkflowModal">
	<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Import workflow</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<WorkflowImport on:workflowImported={handleWorkflowImported} />
			</div>
		</div>
	</div>
</div>

<div class="container p-0 mt-4">
	<p class="lead">Workflows</p>
	<div id="workflowCreateAlertError" />
	<div id="workflowDeleteAlertError" />
	<table class="table align-middle caption-top">
		<caption class='text-bg-light border-top border-bottom pe-3 ps-3'>
			<div class='d-flex align-items-center justify-content-between'>
				<span class='fw-normal'>
					<button
						type="button"
						class="btn btn-primary"
						data-bs-toggle="modal"
						data-bs-target="#importWorkflowModal">
						Import workflow
				</button>
				</span>
				<div>
					<form
						method='post'
						action='?/createWorkflow'
						class='row row-cols-lg-auto g-3 align-items-center'
						use:enhance={handleCreateWorkflow}
					>
						<div class='col-12'>
							<div class='input-group'>
								<div class='input-group-text'>Name</div>
								<input
									type='text'
									class="form-control {validationError ? 'is-invalid' : ''}"
									placeholder='workflow name'
									name='workflowName'
									on:input={(event) => {enableCreateWorkflow = fieldHasValue(event)}}
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
						<a href="/projects/{projectId}/jobs?workflow={id}" class="btn btn-light"
							><i class="bi-journal-code" /> List jobs</a
						>
						<ConfirmActionButton
							modalId={'deleteConfirmModal' + id}
							style={'danger'}
							btnStyle="danger"
							buttonIcon="trash"
							label={'Delete'}
							message="Delete workflow {name}"
							callbackAction={handleDeleteWorkflow.bind(this, id)}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
