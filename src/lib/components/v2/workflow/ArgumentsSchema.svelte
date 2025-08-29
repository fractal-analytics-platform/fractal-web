<script>
	import { page } from '$app/state';
	import {
		AlertError,
		displayStandardErrorAlert,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import ImportExportArgs from './ImportExportArgs.svelte';
	import { JSchema, getPropertiesToIgnore } from 'fractal-components';
	import FormBuilder from './FormBuilder.svelte';
	import { tick } from 'svelte';
	import { JsonSchemaDataError } from 'fractal-components/jschema/form_manager';
	import {
		isCompoundType,
		hasComputeArguments,
		hasInitialisationArguments,
		hasNonParallelArguments,
		isNonParallelType,
		hasParallelArguments,
		isParallelType
	} from 'fractal-components';
	import { deepCopy, normalizePayload } from 'fractal-components/common/utils';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1', 'pydantic_v2'];

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {(wft: import('fractal-components/types/api').WorkflowTaskV2) => void} onWorkflowTaskUpdated
	 * @property {boolean} [editable]
	 * @property {import('fractal-components/types/jschema').JSONSchemaObjectProperty|null} argsSchemaNonParallel
	 * @property {import('fractal-components/types/jschema').JSONSchemaObjectProperty|null} argsSchemaParallel
	 * @property {object|undefined} [argsNonParallel]
	 * @property {object|undefined} [argsParallel]
	 */

	/** @type {Props} */
	let {
		workflowTask = $bindable(),
		onWorkflowTaskUpdated,
		editable = true,
		argsSchemaNonParallel = null,
		argsSchemaParallel = null,
		argsNonParallel = undefined,
		argsParallel = undefined
	} = $props();

	/** @type {JSchema|undefined} */
	let nonParallelSchemaComponent = $state();
	/** @type {JSchema|undefined} */
	let parallelSchemaComponent = $state();
	let unsavedChangesParallel = $state(false);
	let unsavedChangesNonParallel = $state(false);

	/** @type {FormBuilder|undefined} */
	let nonParallelFormBuilderComponent = $state();
	/** @type {FormBuilder|undefined} */
	let parallelFormBuilderComponent = $state();
	let unsavedChangesFormBuilderParallel = $state(false);
	let unsavedChangesFormBuilderNonParallel = $state(false);

	let savingChanges = $state(false);

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
		if (isNonParallelType(workflowTask.task_type) || isCompoundType(workflowTask.task_type)) {
			if (nonParallelSchemaComponent) {
				payload.args_non_parallel = nonParallelSchemaComponent.getArguments();
			} else if (nonParallelFormBuilderComponent) {
				payload.args_non_parallel = nonParallelFormBuilderComponent.getArguments();
			}
		}
		if (isParallelType(workflowTask.task_type) || isCompoundType(workflowTask.task_type)) {
			if (parallelSchemaComponent) {
				payload.args_parallel = parallelSchemaComponent.getArguments();
			} else if (parallelFormBuilderComponent) {
				payload.args_parallel = parallelFormBuilderComponent.getArguments();
			}
		}
		await patchWorkflow(payload);
	}

	export function discardChanges() {
		workflowTask = deepCopy(workflowTask);
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
		const projectId = page.params.projectId;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(
			`/api/v2/project/${projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: normalizePayload(payload, { deepCopy: true, stripEmptyElements: true })
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

	let unsavedChanges = $derived(
		unsavedChangesParallel ||
			unsavedChangesNonParallel ||
			unsavedChangesFormBuilderParallel ||
			unsavedChangesFormBuilderNonParallel
	);
	let isSchemaValid = $derived(argsSchemaVersionValid(workflowTask.task.args_schema_version));
	let schemaVersion = $derived(workflowTask.task.args_schema_version);
	let propertiesToIgnore = $derived(getPropertiesToIgnore(false));
</script>

<div id="workflow-arguments-schema-panel">
	<div id="task-args-validation-errors"></div>
	{#if isNonParallelType(workflowTask.task_type) || isCompoundType(workflowTask.task_type)}
		{#if hasInitialisationArguments(workflowTask)}
			<h5 class="ps-2 mt-3">Initialisation Arguments</h5>
		{/if}
		{#if argsSchemaNonParallel && isSchemaValid}
			<div class="args-list">
				<JSchema
					componentId="jschema-non-parallel"
					schema={argsSchemaNonParallel}
					schemaData={editable ? workflowTask.args_non_parallel : argsNonParallel}
					{editable}
					{schemaVersion}
					{propertiesToIgnore}
					onchange={handleNonParallelChanged}
					bind:this={nonParallelSchemaComponent}
				/>
			</div>
		{:else}
			<div>
				<FormBuilder
					args={editable ? workflowTask.args_non_parallel : argsNonParallel}
					bind:this={nonParallelFormBuilderComponent}
					bind:unsavedChanges={unsavedChangesFormBuilderNonParallel}
					{editable}
				/>
			</div>
		{/if}
	{/if}
	{#if hasInitialisationArguments(workflowTask) && hasComputeArguments(workflowTask)}
		<hr />
	{/if}
	{#if isParallelType(workflowTask.task_type) || isCompoundType(workflowTask.task_type)}
		{#if hasComputeArguments(workflowTask)}
			<h5 class="ps-2 mt-3">Compute Arguments</h5>
		{/if}
		{#if argsSchemaParallel && isSchemaValid}
			<div class="args-list">
				<JSchema
					componentId="jschema-parallel"
					schema={argsSchemaParallel}
					schemaData={editable ? workflowTask.args_parallel : argsParallel}
					{editable}
					{schemaVersion}
					{propertiesToIgnore}
					onchange={handleParallelChanged}
					bind:this={parallelSchemaComponent}
				/>
			</div>
		{:else}
			<div class="mb-3">
				<FormBuilder
					args={editable ? workflowTask.args_parallel : argsParallel}
					bind:this={parallelFormBuilderComponent}
					bind:unsavedChanges={unsavedChangesFormBuilderParallel}
					{editable}
				/>
			</div>
		{/if}
	{/if}
	{#if !hasNonParallelArguments(workflowTask) && !hasParallelArguments(workflowTask) && (argsSchemaParallel || argsSchemaNonParallel)}
		<p class="mt-3 ps-3">No arguments</p>
	{/if}
	<div class="d-flex jschema-controls-bar p-3">
		<ImportExportArgs
			{workflowTask}
			onImport={handleImport}
			exportDisabled={!editable || unsavedChanges || savingChanges}
		/>
		{#if isSchemaValid || nonParallelFormBuilderComponent || parallelFormBuilderComponent}
			<div>
				<button
					class="btn btn-warning"
					disabled={!editable || !unsavedChanges || savingChanges}
					onclick={discardChanges}
				>
					Discard changes
				</button>
			</div>
			<div class="ms-1">
				<button
					class="btn btn-success"
					type="button"
					disabled={!editable || !unsavedChanges || savingChanges}
					onclick={saveChanges}
				>
					{#if savingChanges}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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
