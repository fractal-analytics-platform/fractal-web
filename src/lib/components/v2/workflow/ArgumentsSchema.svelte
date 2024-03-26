<script>
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import JSchema from '$lib/components/common/jschema/JSchema.svelte';
	import { updateFormEntry } from '$lib/components/v2/workflow/task_form_utils';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import ImportExportArgs from './ImportExportArgs.svelte';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1'];

	const dispatch = createEventDispatcher();

	export let workflowId = undefined;
	export let workflowTaskId = undefined;
	export let argumentsSchema = undefined;
	export let argumentsSchemaVersion = undefined;
	export let validSchema = undefined;
	export let args = undefined;
	/** @type {string} */
	export let taskName;
	/** @type {'v1'|'v2'} */
	export let apiVersion;

	/** @type {JSchema} */
	let schemaComponent;
	export let unsavedChanges = false;
	let resetChanges = undefined;
	export let saveChanges = undefined;
	let savingChanges = false;

	async function handleSaveChanges(newArgs) {
		const projectId = $page.params.projectId;
		try {
			savingChanges = true;
			const response = await updateFormEntry(
				projectId,
				workflowId,
				workflowTaskId,
				newArgs,
				'args',
				apiVersion
			);
			args = response.args;
			dispatch('argsSaved', { args: JSON.parse(JSON.stringify(response.args)) });
			return args;
		} catch (err) {
			displayStandardErrorAlert(err, 'json-schema-validation-errors');
			throw err;
		} finally {
			savingChanges = false;
		}
	}

	function handleValidationErrors(errors) {
		displayStandardErrorAlert(errors, 'json-schema-validation-errors');
	}

	$: {
		if (argumentsSchemaVersion && SUPPORTED_SCHEMA_VERSIONS.includes(argumentsSchemaVersion)) {
			validSchema = true;
		} else {
			validSchema = false;
		}
	}
</script>

<div id="workflow-arguments-schema-panel">
	<div id="json-schema-validation-errors" />
	<div class="args-list">
		<JSchema
			bind:unsavedChanges
			bind:discardChanges={resetChanges}
			bind:saveChanges
			schema={argumentsSchema}
			schemaData={args}
			{handleSaveChanges}
			{handleValidationErrors}
			bind:this={schemaComponent}
		/>
	</div>
	<div class="d-flex jschema-controls-bar p-3">
		<ImportExportArgs
			{taskName}
			{args}
			onImport={(json) => schemaComponent.saveChanges(json)}
			exportDisabled={unsavedChanges || savingChanges}
		/>
		<div>
			<button
				class="btn btn-warning"
				disabled={!unsavedChanges || savingChanges}
				on:click={() => resetChanges(args)}
			>
				Discard changes
			</button>
		</div>
		<div class="ms-1">
			<button
				class="btn btn-success"
				disabled={!unsavedChanges || savingChanges}
				on:click={saveChanges}
			>
				{#if savingChanges}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Save changes
			</button>
		</div>
	</div>
</div>

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
