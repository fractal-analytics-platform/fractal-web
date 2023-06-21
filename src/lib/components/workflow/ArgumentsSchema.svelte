<script>
	import { page } from '$app/stores';
	import JSchema from '$lib/components/common/jschema/JSchema.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
	import { updateFormEntry } from '$lib/components/workflow/task_form_utils';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1'];

	export let workflowId = undefined;
	export let workflowTaskId = undefined;
	export let argumentsSchema = undefined;
	export let argumentsSchemaVersion = undefined;
	export let validSchema = undefined;
	export let args = undefined;

	let schemaComponent = undefined;

	function handleSaveChanges(newArgs) {
		return new Promise((resolve, reject) => {
			const projectId = $page.params.projectId;
			updateFormEntry(
				projectId,
				workflowId,
				workflowTaskId,
				newArgs,
				'args'
			).then(response => {
				resolve(response.args);
			}).catch(err => {
				new StandardErrorAlert({
					target: document.getElementById('json-schema-validation-errors'),
					props: {
						error: err
					}
				});
				reject(err);
			});
		});
	}

	function handleValidationErrors(errors) {
		new StandardErrorAlert({
			target: document.getElementById('json-schema-validation-errors'),
			props: {
				error: errors
			}
		});
	}

	$: {
		if (argumentsSchemaVersion && SUPPORTED_SCHEMA_VERSIONS.includes(argumentsSchemaVersion)) {
			validSchema = true;
		} else {
			validSchema = false;
		}
	}

</script>

<div>
  <div id='json-schema-validation-errors'></div>
  <button on:click={() => { schemaComponent.resetChanges(args) }}>Reset</button>
  <JSchema schema={argumentsSchema} schemaData={args} {handleSaveChanges} {handleValidationErrors}
           bind:this={schemaComponent} />
</div>