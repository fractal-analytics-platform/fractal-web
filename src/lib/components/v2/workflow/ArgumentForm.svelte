<script>
	import { page } from '$app/stores';
	import { updateFormEntry } from '$lib/components/v2/workflow/task_form_utils';
	import FormBuilder from '$lib/components/v2/workflow/FormBuilder.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import ImportExportArgs from './ImportExportArgs.svelte';
	import { onMount } from 'svelte';

	// This component shall handle a form which the user can use to specify arguments of a workflow-task
	// Upon interacting with this component, a representation of the arguments to be used with a workflow task
	// shall be kept in memory with a key-value object.
	// This component shall permit to:
	// - insert a sequence of key-value-type items
	// - store the sequence in a coherent object
	// - enable the usage of the object that keeps the representation of the list

	export let workflowId;
	/** @type {import('$lib/types-v2').WorkflowTaskV2} */
	export let workflowTask;
	/** @type {'args_non_parallel'|'args_parallel'} */
	export let key;

	onMount(() => {
		if (!workflowTask[key]) {
			workflowTask[key] = {};
		}
	});

	/**
	 * @param {object} updatedEntry
	 */
	async function handleEntryUpdate(updatedEntry) {
		const projectId = $page.params.projectId;
		try {
			const response = await updateFormEntry(
				projectId,
				workflowId,
				workflowTask.id,
				updatedEntry,
				key
			);
			workflowTask[key] = response.args;
		} catch (error) {
			console.error(error);
			displayStandardErrorAlert(error, 'argsPropertiesFormError');
		}
	}
</script>

<div>
	<span id="argsPropertiesFormError" />
	<FormBuilder entry={workflowTask[key]} updateEntry={handleEntryUpdate} />
	<div class="d-flex args-controls-bar p-3 mt-3">
		<ImportExportArgs
			taskName={workflowTask.task.name}
			args={workflowTask[key]}
			onImport={(json) => handleEntryUpdate(json)}
			exportDisabled={false}
		/>
	</div>
</div>

<style>
	.args-controls-bar {
		background-color: whitesmoke;
		margin-top: 5px;
		border-top: 1px solid lightgray;
	}
</style>
