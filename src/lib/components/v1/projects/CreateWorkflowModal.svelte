<script>
	import { AlertError } from '$lib/common/errors';
	import { page } from '$app/stores';
	import Modal from '../../common/Modal.svelte';
	import { goto } from '$app/navigation';

	/** @type {(workflow: import('$lib/types').Workflow) => void} */
	export let handleWorkflowImported;

	// Component properties
	let creating = false;
	let importSuccess = undefined;
	let workflowName = '';

	/** @type {FileList|null} */
	let files = null;
	/** @type {HTMLInputElement|undefined} */
	let fileInput = undefined;

	$: workflowFileSelected = files !== null && files.length > 0;
	$: projectId = $page.params.projectId;

	/** @type {Modal} */
	let modal;

	export function show() {
		modal.show();
	}

	/**
	 * Reset the form fields.
	 */
	export function reset() {
		files = null;
		if (fileInput) {
			fileInput.value = '';
		}
		workflowName = '';
		creating = false;
		modal.hideErrorAlert();
	}

	function handleImportOrCreateWorkflow() {
		modal.confirmAndHide(async () => {
			creating = true;
			if (workflowFileSelected) {
				await handleImportWorkflow();
			} else {
				await handleCreateWorkflow();
			}
		}, () => {
			creating = false;
		});
	}

	async function handleImportWorkflow() {
		const workflowFile = /** @type {FileList}*/ (files)[0];

		const workflowFileContent = await workflowFile.text();
		let workflowMetadata;
		try {
			workflowMetadata = JSON.parse(workflowFileContent);
		} catch (err) {
			console.error(err);
			throw new AlertError('The workflow file is not a valid JSON file');
		}

		if (workflowName) {
			console.log(`Overriding workflow name from ${workflowMetadata.name} to ${workflowName}`);
			workflowMetadata.name = workflowName;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${$page.params.projectId}/workflow/import`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify(workflowMetadata)
		});

		const result = await response.json();
		if (response.ok) {
			// Return a workflow item
			importSuccess = true;
			setTimeout(() => {
				importSuccess = false;
			}, 3000);
			reset();
			const workflow = result;
			handleWorkflowImported(workflow);
		} else {
			console.error('Import workflow failed', result);
			throw new AlertError(result, response.status);
		}
	}

	/**
	 * Creates a new workflow in the server
	 * @returns {Promise<*>}
	 */
	async function handleCreateWorkflow() {
		if (!workflowName) {
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
				name: workflowName
			})
		});

		const result = await response.json();
		if (response.ok) {
			workflowName = '';
			goto(`/v1/projects/${projectId}/workflows/${result.id}`);
		} else {
			throw new AlertError(result, response.status);
		}
	}
</script>

<Modal
	id="createWorkflowModal"
	size="lg"
	centered={true}
	scrollable={true}
	onOpen={reset}
	bind:this={modal}
>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Create new workflow</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<form on:submit|preventDefault={handleImportOrCreateWorkflow}>
			<div class="mb-2">
				<label for="workflowName" class="form-label">Workflow name</label>
				<input
					id="workflowName"
					name="workflowName"
					type="text"
					bind:value={workflowName}
					class="form-control"
				/>
			</div>

			<div class="mb-3">
				<label for="workflowFile" class="form-label">Import workflow from file</label>
				<input
					class="form-control"
					accept="application/json"
					type="file"
					name="workflowFile"
					id="workflowFile"
					bind:this={fileInput}
					bind:files
				/>
			</div>

			<div id="errorAlert-createWorkflowModal" />

			<button
				class="btn btn-primary mt-2"
				disabled={(!workflowName && !workflowFileSelected) || creating}
			>
				{#if creating}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				{#if workflowFileSelected}
					Import workflow
				{:else}
					Create empty workflow
				{/if}
			</button>
		</form>

		{#if importSuccess}
			<p class="alert alert-primary mt-3">Workflow imported successfully</p>
		{/if}
	</svelte:fragment>
</Modal>
