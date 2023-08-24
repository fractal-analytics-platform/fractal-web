<script>
	// This component handles the meta properties of a workflow task.
	// Every time the workflow task meta properties are updated within the form, this component should update the server
	// If the server successfully stores the updated meta properties
	// then the status between the client and server is in sync
	//
	// This component also manages the overall form structure of meta properties.
	// The form should be structured in multiple levels of depth, and support complex structure.
	import { page } from '$app/stores';
	import { updateFormEntry } from '$lib/components/workflow/task_form_utils';
	import FormBuilder from '$lib/components/workflow/common/FormBuilder.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
	import { getOnlyModifiedProperties } from '$lib/common/component_utilities';

	// Workflow id
	export let workflowId;
	// Workflow task id
	export let taskId;
	// Workflow task meta properties
	export let metaProperties;
	export let originalMetaProperties;

	if (metaProperties === null || metaProperties === undefined) {
		metaProperties = {};
	}
	if (originalMetaProperties === null || originalMetaProperties === undefined) {
		originalMetaProperties = {};
	}

	async function handleEntryUpdate() {
		const projectId = $page.params.projectId;
		try {
			const modifiedProperties = getOnlyModifiedProperties(originalMetaProperties, metaProperties);
			const updatedMetaProperties = await updateFormEntry(
				projectId,
				workflowId,
				taskId,
				modifiedProperties,
				'meta'
			);
			metaProperties = updatedMetaProperties.meta;
			// Updating original properties again
			for (let key in metaProperties) {
				originalMetaProperties[key] = metaProperties[key];
			}
		} catch (error) {
			console.log(error);
			new StandardErrorAlert({
				target: document.getElementById('metaPropertiesFormError'),
				props: {
					error
				}
			});
		}
	}
</script>

<div>
	<span id="metaPropertiesFormError"></span>
	<FormBuilder entry={metaProperties} updateEntry={handleEntryUpdate} />
</div>
