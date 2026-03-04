<script>
	import { page } from '$app/state';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import ImportExportArgs from './ImportExportArgs.svelte';
	import { JSchema, getPropertiesToIgnore } from 'fractal-components';
	import FormBuilder from 'fractal-components/common/FormBuilder.svelte';
	import { onMount } from 'svelte';
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

	let nonParallelSavedData = $state();
	let nonParallelValid = $state(true);

	/**
	 * @param {any} data
	 */
	function handleNonParallelChanged(data) {
		if (changed(nonParallelSavedData, data)) {
			unsavedChangesNonParallel = true;
		}
		nonParallelSavedData = data;
	}

	let parallelSavedData = $state();
	let parallelValid = $state(true);

	/**
	 * @param {any} data
	 */
	function handleParallelChanged(data) {
		if (changed(parallelSavedData, data)) {
			unsavedChangesParallel = true;
		}
		parallelSavedData = data;
	}

	/**
	 * @param {any} oldValue
	 * @param {any} newValue
	 */
	function changed(oldValue, newValue) {
		if (!oldValue) {
			return false;
		}
		return JSON.stringify($state.snapshot(oldValue)) !== newValue;
	}

	export function hasUnsavedChanges() {
		return unsavedChanges;
	}

	export async function saveChanges() {
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
	async function patchWorkflow(payload) {
		savingChanges = true;
		const projectId = page.params.projectId;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const options = { deepCopy: true, stripEmptyElements: true, stringify: false };

		const response = await fetch(
			`/api/v2/project/${projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: JSON.stringify({
					args_non_parallel: normalizePayload(payload.args_non_parallel, options),
					args_parallel: normalizePayload(payload.args_parallel, options)
				})
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

	onMount(() => {
		if (argsSchemaNonParallel && isSchemaValid) {
			nonParallelSchemaComponent?.update(
				argsSchemaNonParallel,
				editable ? workflowTask.args_non_parallel : argsNonParallel
			);
		}

		if (argsSchemaParallel && isSchemaValid) {
			parallelSchemaComponent?.update(
				argsSchemaParallel,
				editable ? workflowTask.args_parallel : argsParallel
			);
		}
	});
</script>

<div id="workflow-arguments-schema-panel">
	<div id="task-args-validation-errors"></div>
	{#if !nonParallelValid || !parallelValid}
		<div class="alert alert-danger m-2">Data is not valid</div>
	{/if}
	{#if isNonParallelType(workflowTask.task_type) || isCompoundType(workflowTask.task_type)}
		{#if hasInitialisationArguments(workflowTask)}
			<h5 class="ps-2 mt-3">Initialisation Arguments</h5>
		{/if}
		{#if argsSchemaNonParallel && isSchemaValid}
			<div class="args-list">
				<JSchema
					componentId="jschema-non-parallel"
					{editable}
					{schemaVersion}
					{propertiesToIgnore}
					onchange={handleNonParallelChanged}
					bind:this={nonParallelSchemaComponent}
					bind:dataValid={nonParallelValid}
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
					{editable}
					{schemaVersion}
					{propertiesToIgnore}
					onchange={handleParallelChanged}
					bind:this={parallelSchemaComponent}
					bind:dataValid={parallelValid}
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
			onImport={patchWorkflow}
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
