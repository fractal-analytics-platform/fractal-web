<script>
	import { createEventDispatcher } from 'svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { page } from '$app/stores';

	const dispatch = createEventDispatcher();

	// Component properties
	let importing = false;
	let importSuccess = undefined;
	let workflowName = undefined;

	let errorAlert;
	/** @type {FileList|null} */
	let files = null;
	/** @type {HTMLInputElement|undefined} */
	let fileInput = undefined;

	/**
	 * Reset the form fields.
	 */
	export function reset() {
		files = null;
		if (fileInput) {
			fileInput.value = '';
		}
		workflowName = undefined;
		if (errorAlert) {
			errorAlert.hide();
		}
	}

	/**
	 * Request the import of a project's workflow to the server.
	 */
	async function handleWorkflowImportForm() {
		if (!files || files.length === 0) {
			return;
		}
		importing = true;
		if (errorAlert) {
			errorAlert.hide();
		}

		const workflowFile = files[0];

		const workflowFileContent = await workflowFile.text();
		let workflowMetadata;
		try {
			workflowMetadata = JSON.parse(workflowFileContent);
		} catch (err) {
			console.error(err);
			importing = false;
			errorAlert = displayStandardErrorAlert(
				'The workflow file is not a valid JSON file',
				'importWorkflowError'
			);
			return;
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

		importing = false;

		const result = await response.json();
		if (response.ok) {
			// Return a workflow item
			importSuccess = true;
			setTimeout(() => {
				importSuccess = false;
			}, 3000);
			reset();
			const workflow = result;
			dispatch('workflowImported', workflow);
		} else {
			console.error('Import workflow failed', result);
			errorAlert = displayStandardErrorAlert(result, 'importWorkflowError');
		}
	}
</script>

<div id="importWorkflowError" />

<form on:submit|preventDefault={handleWorkflowImportForm}>
	<div class="mb-3">
		<label for="workflowFile" class="form-label">Select a workflow file</label>
		<input
			class="form-control"
			accept="application/json"
			type="file"
			name="workflowFile"
			id="workflowFile"
			bind:this={fileInput}
			bind:files
			required
		/>
	</div>

	<div class="mb-2">
		<label for="workflowName" class="form-label">Override workflow name (optional)</label>
		<input
			id="workflowName"
			name="workflowName"
			type="text"
			bind:value={workflowName}
			class="form-control"
		/>
	</div>

	<button class="btn btn-primary mt-2" disabled={importing}>
		{#if importing}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{/if}
		Import
	</button>
</form>

{#if importSuccess}
	<p class="alert alert-primary mt-3">Workflow imported successfully</p>
{/if}
