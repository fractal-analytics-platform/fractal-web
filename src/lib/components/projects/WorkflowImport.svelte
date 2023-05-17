<script>
	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

	const dispatch = createEventDispatcher();

	// Component properties
	let importing = false;
	let importSuccess = undefined;

	async function handleWorkflowImportForm({ form }) {
		importing = true;

		return async ({ result }) => {
			if (result.type !== 'failure') {
				importing = false;
				importSuccess = true;
				setTimeout(() => {
					importSuccess = false;
				}, 3000);
				form.reset();
				const workflow = result.data;
				dispatch('workflowImported', workflow);
			} else {
				// The form submission failed
				const error = JSON.parse(result.data);
				console.error('Import workflow failed', error);
				new StandardErrorAlert({
					target: document.getElementById('importWorkflowError'),
					props: {
						error
					}
				});
			}
		};
	}
</script>

<div id="importWorkflowError" />

<form method="post" action="?/importWorkflow" use:enhance={handleWorkflowImportForm}>
	<div class="mb-3">
		<label for="workflowFile" class="form-label">Select a workflow file</label>
		<input
			class="form-control"
			accept="application/json"
			type="file"
			name="workflowFile"
			id="workflowFile"
			required
		/>
	</div>

	<button class="btn btn-primary" disabled={importing}>
		{#if importing}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{/if}
		Import
	</button>
</form>

{#if importSuccess}
	<p class="alert alert-primary mt-3">Workflow imported successfully</p>
{/if}
