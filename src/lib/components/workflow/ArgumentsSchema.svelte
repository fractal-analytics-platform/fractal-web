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
	let unsavedChanges = false;
	let resetChanges = undefined;
	let saveChanges = undefined;

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

<style>
    #workflow-arguments-schema-panel {
        overflow-y: auto;
        max-height: 60vh;
    }
</style>

<div id='workflow-arguments-schema-panel'>
  <div id='json-schema-validation-errors'></div>
  <div class='d-flex justify-content-end jschema-controls-bar py-2'>
    <div>
      <button class='btn btn-success {unsavedChanges ? "" : "disabled"}' on:click={saveChanges}>
        Save arguments
      </button>
    </div>
    <div>
      <button class='btn btn-warning' on:click={resetChanges.bind(this, args)}>
        Reset arguments
      </button>
    </div>
  </div>
  <div class='args-list'>
    <JSchema bind:unsavedChanges={unsavedChanges} bind:resetChanges={resetChanges} bind:saveChanges={saveChanges}
             schema={argumentsSchema} schemaData={args} {handleSaveChanges} {handleValidationErrors}
             bind:this={schemaComponent} />
  </div>
</div>