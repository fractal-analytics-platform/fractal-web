<script>
	// This component handles the meta properties of a workflow task.
	// Every time the workflow task meta properties are updated within the form, this component should update the server
	// If the server successfully stores the updated meta properties
	// then the status between the client and server is in sync
	//
	// This component also manages the overall form structure of meta properties.
	// The form should be structured in multiple levels of depth, and support complex structure.
	import { page } from '$app/stores';
	import { updateFormEntry } from '$lib/components/v1/workflow/task_form_utils';
	import FormBuilder from '$lib/components/v1/workflow/FormBuilder.svelte';
	import { getOnlyModifiedProperties } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert } from '$lib/common/errors';

	// Workflow id
	export let workflowId;
	/** @type {import('$lib/types').WorkflowTask} */
	export let workflowTask;
	/** @type {'v1'|'v2'} */
	export let apiVersion;

	let metaProperties = {};
	let originalMetaProperties = {};

	$: {
		metaProperties = workflowTask.meta || {};
		updateOriginalMetaProperties();
	}

	async function handleEntryUpdate() {
		const projectId = $page.params.projectId;
		try {
			const modifiedProperties = getOnlyModifiedProperties(originalMetaProperties, metaProperties);
			const updatedMetaProperties = await updateFormEntry(
				projectId,
				workflowId,
				workflowTask.id,
				modifiedProperties,
				'meta',
				apiVersion
			);
			workflowTask.meta = updatedMetaProperties.meta;
			metaProperties = updatedMetaProperties.meta;
			// Updating original properties again
			updateOriginalMetaProperties();
		} catch (error) {
			console.log(error);
			displayStandardErrorAlert(error, 'metaPropertiesFormError');
		}
	}

	function updateOriginalMetaProperties() {
		for (let key in metaProperties) {
			originalMetaProperties[key] = metaProperties[key];
		}
	}
</script>

<div>
	<span id="metaPropertiesFormError" />
	<FormBuilder entry={metaProperties} updateEntry={handleEntryUpdate} />
</div>
