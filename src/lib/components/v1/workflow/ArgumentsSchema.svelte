<script>
	import { page } from '$app/stores';
	import { createEventDispatcher, tick } from 'svelte';
	import { updateFormEntry } from '$lib/components/v1/workflow/task_form_utils';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import ImportExportArgs from './ImportExportArgs.svelte';
	import { JSchema, getPropertiesToIgnore } from 'fractal-jschema';
	import { deepCopy } from '$lib/common/component_utilities';
	import { JsonSchemaDataError } from 'fractal-jschema/components/form_manager';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1', 'pydantic_v2'];

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	const dispatch = createEventDispatcher();

	export let workflowId = undefined;
	export let workflowTaskId = undefined;
	export let argumentsSchema = undefined;
	export let argumentsSchemaVersion = undefined;
	export let validSchema = undefined;
	export let args = undefined;
	/** @type {string} */
	export let taskName;

	/** @type {JSchema} */
	let schemaComponent;
	export let unsavedChanges = false;
	let savingChanges = false;

	async function handleSaveChanges() {
		errorAlert?.hide();
		try {
			schemaComponent.validateArguments();
		} catch (err) {
			errorAlert = displayStandardErrorAlert(
				getValidationErrorMessage(err),
				'json-schema-validation-errors'
			);
			return;
		}
		const newArgs = schemaComponent.getArguments();
		patchArguments(newArgs);
	}

	/**
	 * @param {object} payload
	 */
	async function handleImport(payload) {
		const initialArgs = deepCopy(args);
		console.log(initialArgs);
		args = payload;
		await tick();
		console.log(schemaComponent.getArguments());
		try {
			schemaComponent.validateArguments();
		} catch (err) {
			args = initialArgs;
			throw new AlertError(getValidationErrorMessage(err));
		}
		await patchArguments(payload);
	}

	/**
	 * @param {object} newArgs
	 */
	async function patchArguments(newArgs) {
		const projectId = $page.params.projectId;
		try {
			savingChanges = true;
			const response = await updateFormEntry(
				projectId,
				workflowId,
				workflowTaskId,
				newArgs,
				'args'
			);
			args = response.args;
			dispatch('argsSaved', { args: deepCopy(response.args) });
			unsavedChanges = false;
			return args;
		} catch (err) {
			displayStandardErrorAlert(err, 'json-schema-validation-errors');
			throw err;
		} finally {
			savingChanges = false;
		}
	}

	/**
	 * @param {any} err
	 */
	function getValidationErrorMessage(err) {
		if (err instanceof JsonSchemaDataError) {
			return err.errors.length === 1 ? err.errors[0] : err.errors;
		} else {
			console.error(err);
			return /** @type {Error}*/ (err).message;
		}
	}

	function handleChanged() {
		unsavedChanges = true;
	}

	function resetChanges() {
		args = args;
		unsavedChanges = false;
	}

	$: {
		if (argumentsSchemaVersion && SUPPORTED_SCHEMA_VERSIONS.includes(argumentsSchemaVersion)) {
			validSchema = true;
		} else {
			validSchema = false;
		}
	}

	$: {
		if (!unsavedChanges) {
			resetChanges();
		}
	}
</script>

<div id="workflow-arguments-schema-panel">
	<div id="json-schema-validation-errors" />
	<div class="args-list">
		<JSchema
			componentId="json-schema"
			schema={argumentsSchema}
			schemaData={args}
			on:change={handleChanged}
			propertiesToIgnore={getPropertiesToIgnore(true)}
			bind:this={schemaComponent}
		/>
	</div>
	<div class="d-flex jschema-controls-bar p-3">
		<ImportExportArgs
			{taskName}
			{args}
			onImport={(json) => handleImport(json)}
			exportDisabled={unsavedChanges || savingChanges}
		/>
		<div>
			<button
				class="btn btn-warning"
				disabled={!unsavedChanges || savingChanges}
				on:click={resetChanges}
			>
				Discard changes
			</button>
		</div>
		<div class="ms-1">
			<button
				class="btn btn-success"
				disabled={!unsavedChanges || savingChanges}
				on:click={handleSaveChanges}
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
