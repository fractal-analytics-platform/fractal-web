<script>
	import { goto } from '$app/navigation';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import CreateWorkflowModal from './CreateWorkflowModal.svelte';
	import { onMount } from 'svelte';
	import { saveSelectedDataset } from '$lib/common/workflow_utilities';
	import { normalizePayload } from 'fractal-components';

	// The list of workflows

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowV2[]} [workflows]
	 * @property {any} [projectId] - Set the projectId prop to reference a specific project for each workflow
	 */

	/** @type {Props} */
	let { workflows = $bindable([]), projectId = undefined } = $props();

	let workflowSearch = $state('');

	let filteredWorkflows = $derived(
		workflows.filter((p) => p.name.toLowerCase().includes(workflowSearch.toLowerCase()))
	);

	/** @type {CreateWorkflowModal|undefined} */
	let createWorkflowModal = $state();

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

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
	 * @param {boolean} redirect
	 */
	async function handleWorkflowImported(importedWorkflow, redirect = true) {
		workflows.push(importedWorkflow);
		workflows = workflows;
		if (redirect) {
			await goto(`/v2/projects/${projectId}/workflows/${importedWorkflow.id}`);
		}
	}

	/**
	 * @param {number} id
	 */
	async function exportWorkflow(id) {
		const response = await fetch(`/api/v2/project/${projectId}/workflow/${id}/export`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-workflow-list'
			);
			return;
		}

		return await response.json();
	}

	/**
	 * @param {object} data
	 * @param {boolean} redirect
	 */
	async function importWorkflow(data, redirect) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/project/${projectId}/workflow/import`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(data)
		});

		if (!response.ok) {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-workflow-list'
			);
			return;
		}

		const newWorkflow = await response.json();
		await handleWorkflowImported(newWorkflow, redirect);
	}

	/**
	 * @param {string} name
	 */
	function getNewWorkflowName(name) {
		// remove _copy{_n} suffix, if present
		name = name.replace(/_copy_?\d*$/, '');

		const names = new Set(workflows.map((w) => w.name));
		const baseCopy = `${name}_copy`;
		if (!names.has(baseCopy)) {
			return baseCopy;
		}

		let i = 1;
		while (true) {
			const candidate = `${baseCopy}_${i}`;
			if (!names.has(candidate)) {
				return candidate;
			}
			i++;
		}
	}

	/**
	 * @param {number} id
	 */
	async function duplicateWorkflow(id) {
		errorAlert?.hide();

		const workflowData = await exportWorkflow(id);
		if (!workflowData) {
			return;
		}
		await importWorkflow(
			{
				...workflowData,
				name: getNewWorkflowName(workflowData.name)
			},
			false
		);
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
					onclick={() => {
						createWorkflowModal?.show();
					}}
				>
					Create new workflow
				</button>
			</div>
		</div>
	</div>

	<div id="errorAlert-workflow-list"></div>

	<table class="table align-middle caption-top">
		<thead class="table-light">
			<tr>
				<th class="col-7 col-lg-8">Name</th>
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#key workflows}
				{#each filteredWorkflows as { id, name } (id)}
					<tr>
						<td>
							<a href="/v2/projects/{projectId}/workflows/{id}">
								{name}
							</a>
						</td>
						<td>
							<a href="/v2/projects/{projectId}/workflows/{id}/jobs" class="btn btn-light">
								<i class="bi-journal-code"></i> List jobs
							</a>
							<button class="btn btn-info" type="button" onclick={() => duplicateWorkflow(id)}>
								<i class="bi bi-copy"></i> Duplicate
							</button>
							<ConfirmActionButton
								modalId={'deleteConfirmModal' + id}
								style="danger"
								btnStyle="danger"
								buttonIcon="trash"
								label="Delete"
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
