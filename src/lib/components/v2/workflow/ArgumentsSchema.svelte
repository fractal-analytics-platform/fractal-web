<script>
	import { page } from '$app/stores';
	import {
		AlertError,
		displayStandardErrorAlert,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import ImportExportArgs from './ImportExportArgs.svelte';
	import {
		JSchema,
		stripNullAndEmptyObjectsAndArrays,
		stripIgnoredProperties,
		getPropertiesToIgnore
	} from 'fractal-jschema';
	import FormBuilder from './FormBuilder.svelte';
	import { deepCopy } from '$lib/common/component_utilities';
	import { tick } from 'svelte';
	import { JsonSchemaDataError } from 'fractal-jschema/components/form_manager';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1', 'pydantic_v2'];

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @type {import('$lib/types-v2').WorkflowTaskV2}  */
	export let workflowTask;
	/** @type {(wft: import('$lib/types-v2').WorkflowTaskV2) => void} */
	export let onWorkflowTaskUpdated;

	/** @type {JSchema|undefined} */
	let nonParallelSchemaComponent;
	/** @type {JSchema|undefined} */
	let parallelSchemaComponent;
	let unsavedChangesParallel = false;
	let unsavedChangesNonParallel = false;

	/** @type {FormBuilder|undefined} */
	let nonParallelFormBuilderComponent;
	/** @type {FormBuilder|undefined} */
	let parallelFormBuilderComponent;
	let unsavedChangesFormBuilderParallel = false;
	let unsavedChangesFormBuilderNonParallel = false;

	let savingChanges = false;

	$: unsavedChanges =
		unsavedChangesParallel ||
		unsavedChangesNonParallel ||
		unsavedChangesFormBuilderParallel ||
		unsavedChangesFormBuilderNonParallel;

	$: isSchemaValid = argsSchemaVersionValid(workflowTask.task.args_schema_version);

	$: hasNonParallel =
		workflowTask.task_type === 'non_parallel' || workflowTask.task_type === 'compound';
	$: hasParallel = workflowTask.task_type === 'parallel' || workflowTask.task_type === 'compound';

	$: argsSchemaNonParallel = workflowTask.task.args_schema_non_parallel;

	$: argsSchemaParallel = workflowTask.task.args_schema_parallel;

	$: schemaVersion = workflowTask.task.args_schema_version;

	function handleNonParallelChanged() {
		unsavedChangesNonParallel = true;
	}

	function handleParallelChanged() {
		unsavedChangesParallel = true;
	}

	export function hasUnsavedChanges() {
		return unsavedChanges;
	}

	export async function saveChanges() {
		if (!validateArguments()) {
			return;
		}
		const invalidFormBuilderNonParallel =
			nonParallelFormBuilderComponent && !nonParallelFormBuilderComponent.validateArguments();
		const invalidFormBuilderParallel =
			parallelFormBuilderComponent && !parallelFormBuilderComponent.validateArguments();
		if (invalidFormBuilderNonParallel || invalidFormBuilderParallel) {
			return;
		}
		const payload = {};
		if (hasNonParallel) {
			if (nonParallelSchemaComponent) {
				payload.args_non_parallel = nonParallelSchemaComponent.getArguments();
			} else if (nonParallelFormBuilderComponent) {
				payload.args_non_parallel = nonParallelFormBuilderComponent.getArguments();
			}
		}
		if (hasParallel) {
			if (parallelSchemaComponent) {
				payload.args_parallel = parallelSchemaComponent.getArguments();
			} else if (parallelFormBuilderComponent) {
				payload.args_parallel = parallelFormBuilderComponent.getArguments();
			}
		}
		await patchWorkflow(payload);
	}

	export function discardChanges() {
		workflowTask = workflowTask;
		unsavedChangesNonParallel = false;
		unsavedChangesParallel = false;
		unsavedChangesFormBuilderParallel = false;
		unsavedChangesFormBuilderNonParallel = false;
	}

	/**
	 * @param {object} payload
	 */
	async function handleImport(payload) {
		if (nonParallelSchemaComponent) {
			workflowTask.args_non_parallel = payload.args_non_parallel;
		}
		if (parallelSchemaComponent) {
			workflowTask.args_parallel = payload.args_parallel;
		}
		await tick();
		try {
			nonParallelSchemaComponent?.validateArguments();
			parallelSchemaComponent?.validateArguments();
		} catch (err) {
			throw new AlertError(getValidationErrorMessage(err));
		}
		await patchWorkflow(payload);
	}

	function validateArguments() {
		errorAlert?.hide();
		try {
			nonParallelSchemaComponent?.validateArguments();
			parallelSchemaComponent?.validateArguments();
		} catch (err) {
			const errorAlertData = getValidationErrorMessage(err);
			errorAlert = displayStandardErrorAlert(errorAlertData, 'task-args-validation-errors');
			return false;
		}
		return true;
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

	/**
	 * @param {object} payload
	 */
	async function patchWorkflow(payload) {
		savingChanges = true;
		const projectId = $page.params.projectId;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v2/project/${projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: JSON.stringify(stripNullAndEmptyObjectsAndArrays(deepCopy(payload)))
			}
		);

		if (response.ok) {
			unsavedChangesParallel = false;
			unsavedChangesNonParallel = false;
			const result = await response.json();
			onWorkflowTaskUpdated(result);
		} else {
			displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'task-args-validation-errors'
			);
		}
		savingChanges = false;
	}

	/**
	 * @param {string} argsSchemaVersion
	 */
	function argsSchemaVersionValid(argsSchemaVersion) {
		return argsSchemaVersion && SUPPORTED_SCHEMA_VERSIONS.includes(argsSchemaVersion);
	}

	$: hasNonParallelArgs =
		workflowTask.task.args_schema_non_parallel &&
		Object.keys(
			stripIgnoredProperties(
				workflowTask.task.args_schema_non_parallel,
				getPropertiesToIgnore(false)
			).properties
		).length;

	$: hasParallelArgs =
		argsSchemaParallel &&
		Object.keys(stripIgnoredProperties(argsSchemaParallel, getPropertiesToIgnore(false)).properties)
			.length;

	$: propertiesToIgnore = getPropertiesToIgnore(false);
</script>

<div id="workflow-arguments-schema-panel">
	<div id="task-args-validation-errors" />
	{#if workflowTask.task_type === 'non_parallel' || workflowTask.task_type === 'compound'}
		{#if (hasNonParallelArgs && hasParallelArgs) || (workflowTask.task_type === 'compound' && !workflowTask.task.args_schema_non_parallel)}
			<h5 class="ps-2 mt-3">Initialisation Arguments</h5>
		{/if}
		{#if workflowTask.task.args_schema_non_parallel && isSchemaValid}
			<div class="args-list">
				<JSchema
					componentId="jschema-non-parallel"
					schema={workflowTask.task.args_schema_non_parallel}
					schemaData={workflowTask.args_non_parallel}
					{schemaVersion}
					{propertiesToIgnore}
					on:change={handleNonParallelChanged}
					bind:this={nonParallelSchemaComponent}
				/>
			</div>
		{:else}
			<div>
				<FormBuilder
					args={workflowTask.args_non_parallel}
					bind:this={nonParallelFormBuilderComponent}
					bind:unsavedChanges={unsavedChangesFormBuilderNonParallel}
				/>
			</div>
		{/if}
	{/if}
	{#if (hasNonParallelArgs && hasParallelArgs) || (workflowTask.task_type === 'compound' && !argsSchemaParallel && !workflowTask.task.args_schema_non_parallel)}
		<hr />
	{/if}
	{#if workflowTask.task_type === 'parallel' || workflowTask.task_type === 'compound'}
		{#if (hasParallelArgs && hasNonParallelArgs) || (workflowTask.task_type === 'compound' && !argsSchemaParallel)}
			<h5 class="ps-2 mt-3">Compute Arguments</h5>
		{/if}
		{#if argsSchemaParallel && isSchemaValid}
			<div class="args-list">
				<JSchema
					componentId="jschema-parallel"
					schema={argsSchemaParallel}
					schemaData={workflowTask.args_parallel}
					{schemaVersion}
					{propertiesToIgnore}
					on:change={handleParallelChanged}
					bind:this={parallelSchemaComponent}
				/>
			</div>
		{:else}
			<div class="mb-3">
				<FormBuilder
					args={workflowTask.args_parallel}
					bind:this={parallelFormBuilderComponent}
					bind:unsavedChanges={unsavedChangesFormBuilderParallel}
				/>
			</div>
		{/if}
	{/if}
	{#if !hasNonParallelArgs && !hasParallelArgs && (argsSchemaParallel || argsSchemaNonParallel)}
		<p class="mt-3 ps-3">No arguments</p>
	{/if}
	<div class="d-flex jschema-controls-bar p-3">
		<ImportExportArgs
			{workflowTask}
			onImport={handleImport}
			exportDisabled={unsavedChanges || savingChanges}
		/>
		{#if isSchemaValid || nonParallelFormBuilderComponent || parallelFormBuilderComponent}
			<div>
				<button
					class="btn btn-warning"
					disabled={!unsavedChanges || savingChanges}
					on:click={discardChanges}
				>
					Discard changes
				</button>
			</div>
			<div class="ms-1">
				<button
					class="btn btn-success"
					type="button"
					disabled={!unsavedChanges || savingChanges}
					on:click={saveChanges}
				>
					{#if savingChanges}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
					{/if}
					Save changes
				</button>
			</div>
		{/if}
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
