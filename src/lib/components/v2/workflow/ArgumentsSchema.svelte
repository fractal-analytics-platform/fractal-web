<script>
	import { page } from '$app/stores';
	import JSchema from '$lib/components/v2/workflow/JSchema.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import ImportExportArgs from './ImportExportArgs.svelte';
	import {
		stripNullAndEmptyObjectsAndArrays,
		stripSchemaProperties
	} from '$lib/components/common/jschema/schema_management';
	import FormBuilder from './FormBuilder.svelte';

	const SUPPORTED_SCHEMA_VERSIONS = ['pydantic_v1'];

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

	$: isSchemaValid = argsSchemaVersionValid(
		workflowTask.is_legacy_task
			? workflowTask.task_legacy.args_schema_version
			: workflowTask.task.args_schema_version
	);

	$: hasNonParallel =
		workflowTask.task_type === 'non_parallel' || workflowTask.task_type === 'compound';
	$: hasParallel = workflowTask.task_type === 'parallel' || workflowTask.task_type === 'compound';

	$: argsSchemaNonParallel = workflowTask.is_legacy_task
		? null
		: workflowTask.task.args_schema_non_parallel;

	$: argsSchemaParallel = workflowTask.is_legacy_task
		? workflowTask.task_legacy.args_schema
		: workflowTask.task.args_schema_parallel;

	export function hasUnsavedChanges() {
		return unsavedChanges;
	}

	export async function saveChanges() {
		try {
			nonParallelSchemaComponent?.validateArguments();
			parallelSchemaComponent?.validateArguments();
		} catch (err) {
			console.error(err);
			displayStandardErrorAlert(err, 'task-args-validation-errors');
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
		await handleSaveChanges(payload);
	}

	export function discardChanges() {
		nonParallelSchemaComponent?.discardChanges(workflowTask.args_non_parallel);
		parallelSchemaComponent?.discardChanges(workflowTask.args_parallel);
		nonParallelFormBuilderComponent?.discardChanges(workflowTask.args_non_parallel);
		parallelFormBuilderComponent?.discardChanges(workflowTask.args_parallel);
	}

	/**
	 * @param {object} payload
	 */
	async function handleSaveChanges(payload) {
		if (nonParallelSchemaComponent) {
			nonParallelSchemaComponent.validateArguments(payload.args_non_parallel);
		}
		if (parallelSchemaComponent) {
			parallelSchemaComponent.validateArguments(payload.args_parallel);
		}

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
				body: JSON.stringify(stripNullAndEmptyObjectsAndArrays(payload))
			}
		);

		const result = await response.json();
		if (response.ok) {
			const argsNonParallel = deepCopyArgs(result.args_non_parallel);
			const argsParallel = deepCopyArgs(result.args_parallel);
			if (result.args_non_parallel) {
				nonParallelSchemaComponent?.setArguments(argsNonParallel);
			}
			if (result.args_parallel) {
				parallelSchemaComponent?.setArguments(argsParallel);
			}
			onWorkflowTaskUpdated(result);
		} else {
			displayStandardErrorAlert(await result, 'task-args-validation-errors');
		}
		savingChanges = false;
	}

	/**
	 * Returns a deep copy of the arguments object to avoid side effects from the JSchema component.
	 * @param {object|null} args
	 */
	function deepCopyArgs(args) {
		if (typeof args === 'object') {
			return JSON.parse(JSON.stringify(args));
		}
		return null;
	}

	/**
	 * @param {string} argsSchemaVersion
	 */
	function argsSchemaVersionValid(argsSchemaVersion) {
		return argsSchemaVersion && SUPPORTED_SCHEMA_VERSIONS.includes(argsSchemaVersion);
	}

	$: hasNonParallelArgs =
		!workflowTask.is_legacy_task &&
		workflowTask.task.args_schema_non_parallel &&
		Object.keys(
			stripSchemaProperties(workflowTask.task.args_schema_non_parallel, workflowTask.is_legacy_task)
				.properties
		).length;

	$: hasParallelArgs =
		argsSchemaParallel &&
		Object.keys(stripSchemaProperties(argsSchemaParallel, workflowTask.is_legacy_task).properties)
			.length;
</script>

<div id="workflow-arguments-schema-panel">
	<div id="task-args-validation-errors" />
	{#if workflowTask.task_type === 'non_parallel' || workflowTask.task_type === 'compound'}
		{#if (hasNonParallelArgs && hasParallelArgs) || (workflowTask.task_type === 'compound' && !workflowTask.is_legacy_task && !workflowTask.task.args_schema_non_parallel)}
			<h5 class="ps-2 mt-3">Initialisation Arguments</h5>
		{/if}
		{#if !workflowTask.is_legacy_task && workflowTask.task.args_schema_non_parallel && isSchemaValid}
			<div class="args-list">
				<JSchema
					bind:unsavedChanges={unsavedChangesNonParallel}
					schema={workflowTask.task.args_schema_non_parallel}
					schemaData={workflowTask.args_non_parallel}
					legacy={workflowTask.is_legacy_task}
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
	{#if (hasNonParallelArgs && hasParallelArgs) || (workflowTask.task_type === 'compound' && !argsSchemaParallel && !workflowTask.is_legacy_task && !workflowTask.task.args_schema_non_parallel)}
		<hr />
	{/if}
	{#if workflowTask.task_type === 'parallel' || workflowTask.task_type === 'compound'}
		{#if (hasParallelArgs && hasNonParallelArgs) || (workflowTask.task_type === 'compound' && !argsSchemaParallel)}
			<h5 class="ps-2 mt-3">Compute Arguments</h5>
		{/if}
		{#if argsSchemaParallel && isSchemaValid}
			<div class="args-list">
				<JSchema
					bind:unsavedChanges={unsavedChangesParallel}
					schema={argsSchemaParallel}
					schemaData={workflowTask.args_parallel}
					legacy={workflowTask.is_legacy_task}
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
			onImport={handleSaveChanges}
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
