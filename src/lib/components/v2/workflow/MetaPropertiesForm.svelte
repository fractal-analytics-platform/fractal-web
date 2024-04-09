<script>
	// This component handles the meta properties of a workflow task.
	// Every time the workflow task meta properties are updated within the form, this component should update the server
	// If the server successfully stores the updated meta properties
	// then the status between the client and server is in sync
	//
	// This component also manages the overall form structure of meta properties.
	// The form should be structured in multiple levels of depth, and support complex structure.
	import { page } from '$app/stores';
	import FormBuilder from '$lib/components/v2/workflow/FormBuilder.svelte';
	import { getOnlyModifiedProperties } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert } from '$lib/common/errors';

	/** @type {import('$lib/types-v2').WorkflowTaskV2} */
	export let workflowTask;

	let metaPropertiesNonParallel = {};
	let originalMetaPropertiesNonParallel = {};

	let metaPropertiesParallel = {};
	let originalMetaPropertiesParallel = {};

	$: {
		metaPropertiesNonParallel = workflowTask.meta_non_parallel || {};
		metaPropertiesParallel = workflowTask.meta_parallel || {};
		updateOriginalMetaProperties();
	}

	async function updateMetaNonParallel() {
		const modifiedProperties = getOnlyModifiedProperties(
			originalMetaPropertiesNonParallel,
			metaPropertiesNonParallel
		);
		await handleEntryUpdate({
			meta_non_parallel: modifiedProperties
		});
	}

	async function updateMetaParallel() {
		const modifiedProperties = getOnlyModifiedProperties(
			originalMetaPropertiesParallel,
			metaPropertiesParallel
		);
		await handleEntryUpdate({
			meta_parallel: modifiedProperties
		});
	}

	/**
	 * @param {object} payload
	 */
	async function handleEntryUpdate(payload) {
		const projectId = $page.params.projectId;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v2/project/${projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: JSON.stringify(payload)
			}
		);

		const result = await response.json();
		if (response.ok) {
			workflowTask.meta_non_parallel = result.meta_non_parallel;
			workflowTask.meta_parallel = result.meta_parallel;
			metaPropertiesNonParallel = result.meta_non_parallel || {};
			metaPropertiesParallel = result.meta_parallel || {};
			// Updating original properties again
			updateOriginalMetaProperties();
		} else {
			displayStandardErrorAlert(result, 'metaPropertiesFormError');
		}
	}

	function updateOriginalMetaProperties() {
		for (let key in metaPropertiesNonParallel) {
			originalMetaPropertiesNonParallel[key] = metaPropertiesNonParallel[key];
		}
		for (let key in metaPropertiesParallel) {
			originalMetaPropertiesParallel[key] = metaPropertiesParallel[key];
		}
	}
</script>

<div>
	<span id="metaPropertiesFormError" />
	{#if workflowTask.task_type === 'non_parallel' || workflowTask.task_type === 'compound'}
		<h5>Meta non parallel</h5>
		<FormBuilder entry={metaPropertiesNonParallel} updateEntry={updateMetaNonParallel} />
	{/if}
	{#if workflowTask.task_type === 'compound'}
		<hr />
	{/if}
	{#if workflowTask.task_type === 'parallel' || workflowTask.task_type === 'compound'}
		<h5>Meta parallel</h5>
		<FormBuilder entry={metaPropertiesParallel} updateEntry={updateMetaParallel} />
	{/if}
</div>
