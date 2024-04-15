<script>
	import { onMount } from 'svelte';
	import FiltersCreationForm from '../projects/datasets/FiltersCreationForm.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';

	/** @type {import("$lib/types-v2").WorkflowV2} */
	export let workflow;
	/** @type {import("$lib/types-v2").WorkflowTaskV2} */
	export let workflowTask;
	/** @type {(wft: import("$lib/types-v2").WorkflowTaskV2) => void} */
	export let updateWorkflowTaskCallback;

	/** @type {FiltersCreationForm} */
	let form;

	let saving = false;
	let successfullySaved = false;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	onMount(() => {
		init();
	});

	export function init() {
		form.init(workflowTask.input_filters.attributes, workflowTask.input_filters.types);
	}

	async function save() {
		if (errorAlert) {
			errorAlert.hide();
		}
		successfullySaved = false;

		const valid = form.validateFields();
		if (!valid) {
			return;
		}

		saving = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: JSON.stringify({
					input_filters: {
						attributes: form.getAttributes(),
						types: form.getTypes()
					}
				})
			}
		);
		if (response.ok) {
			successfullySaved = true;
			setTimeout(() => {
				successfullySaved = false;
			}, 3000);
			updateWorkflowTaskCallback(await response.json());
		} else {
			errorAlert = displayStandardErrorAlert(await response.json(), `errorAlert-inputFilters`);
		}
		saving = false;
	}
</script>

<div class="p-3">
	<FiltersCreationForm bind:this={form} />

	<div id="errorAlert-inputFilters" />

	{#if successfullySaved}
		<div class="alert alert-success">Input filters successfully updated</div>
	{/if}

	<button type="button" class="btn btn-primary" on:click={save} disabled={saving}>
		{#if saving}
			<div class="spinner-border spinner-border-sm" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		{/if}
		Save
	</button>
</div>
