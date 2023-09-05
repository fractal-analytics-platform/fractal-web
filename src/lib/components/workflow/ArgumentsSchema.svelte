<script>
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import JSchema from '$lib/components/common/jschema/JSchema.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
	import { updateFormEntry } from '$lib/components/workflow/task_form_utils';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1'];

	const dispatch = createEventDispatcher();

	export let workflowId = undefined;
	export let workflowTaskId = undefined;
	export let argumentsSchema = undefined;
	export let argumentsSchemaVersion = undefined;
	export let validSchema = undefined;
	export let args = undefined;

	let schemaComponent = undefined;
	export let unsavedChanges = false;
	let resetChanges = undefined;
	export let saveChanges = undefined;

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
				args = response.args;
				dispatch('argsSaved', { args: JSON.parse(JSON.stringify(response.args)) });
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
    #workflow-arguments-schema-panel .args-list {
        overflow-y: auto;
        max-height: 60vh;
        position: relative;
    }

    .jschema-controls-bar {
        background-color: whitesmoke;
        margin-top: 5px;
        border-top: 1px solid lightgray;
    }

</style>

<div id='workflow-arguments-schema-panel'>
  <div id='json-schema-validation-errors'></div>
  <div class='args-list'>
    <JSchema bind:unsavedChanges={unsavedChanges} bind:discardChanges={resetChanges} bind:saveChanges={saveChanges}
             schema={argumentsSchema} schemaData={args} {handleSaveChanges} {handleValidationErrors}
             bind:this={schemaComponent} />
  </div>
  <div class='d-flex justify-content-end jschema-controls-bar p-3'>
    <div>
      <button class='btn btn-warning {unsavedChanges ? "" : "disabled"}' on:click={resetChanges.bind(this, args)}>
        Discard changes
      </button>
    </div>
    <div class='ms-1'>
      <button class='btn btn-success {unsavedChanges ? "" : "disabled"}' on:click={saveChanges}>
        Save changes
      </button>
    </div>
  </div>
</div>