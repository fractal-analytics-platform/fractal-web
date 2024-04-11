<script>
	import { page } from '$app/stores';
	import JSchema from '$lib/components/v2/workflow/JSchema.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import FormBuilder from './FormBuilder.svelte';
	import ImportExportArgs from './ImportExportArgs.svelte';

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
	let savingChanges = false;

	$: unsavedChanges = unsavedChangesParallel || unsavedChangesNonParallel;

	$: isSchemaValid = argsSchemaVersionValid(
		workflowTask.is_legacy_task
			? workflowTask.task_legacy.args_schema_version
			: workflowTask.task.args_schema_version
	);

	$: hasNonParallel =
		workflowTask.task_type === 'non_parallel' || workflowTask.task_type === 'compound';
	$: hasParallel = workflowTask.task_type === 'parallel' || workflowTask.task_type === 'compound';

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
			console.log(err);
			displayStandardErrorAlert(err, 'json-schema-validation-errors');
			return;
		}
		const payload = {};
		if (hasNonParallel) {
			payload.args_non_parallel = nonParallelSchemaComponent?.getArguments();
		}
		if (hasParallel) {
			payload.args_parallel = parallelSchemaComponent?.getArguments();
		}
		await handleSaveChanges(payload);
	}

	export function discardChanges() {
		nonParallelSchemaComponent?.discardChanges(workflowTask.args_non_parallel);
		parallelSchemaComponent?.discardChanges(workflowTask.args_parallel);
	}

	/**
	 * @param {object} updatedEntry
	 */
	async function saveGenericFormEntryNonParallel(updatedEntry) {
		await handleSaveChanges({ args_non_parallel: updatedEntry });
	}

	/**
	 * @param {object} updatedEntry
	 */
	async function saveGenericFormEntryParallel(updatedEntry) {
		await handleSaveChanges({ args_parallel: updatedEntry });
	}

	/**
	 * @param {object} payload
	 */
	async function handleSaveChanges(payload) {
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
				body: JSON.stringify(payload)
			}
		);

		const result = await response.json();
		if (response.ok) {
			if (result.args_non_parallel) {
				nonParallelSchemaComponent?.setArguments(result.args_non_parallel);
			}
			if (result.args_parallel) {
				parallelSchemaComponent?.setArguments(result.args_parallel);
			}
			onWorkflowTaskUpdated(result);
		} else {
			displayStandardErrorAlert(await result, 'json-schema-validation-errors');
		}
		savingChanges = false;
	}

	/**
	 * @param {string} argsSchemaVersion
	 */
	function argsSchemaVersionValid(argsSchemaVersion) {
		return argsSchemaVersion && SUPPORTED_SCHEMA_VERSIONS.includes(argsSchemaVersion);
	}
</script>

<div id="workflow-arguments-schema-panel">
	<div id="json-schema-validation-errors" />
	{#if workflowTask.task_type === 'non_parallel' || workflowTask.task_type === 'compound'}
		<h5 class="ps-2 mt-3">Args non parallel</h5>
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
				<span id="argsPropertiesFormError" />
				<FormBuilder
					entry={workflowTask.args_non_parallel}
					updateEntry={saveGenericFormEntryNonParallel}
				/>
			</div>
		{/if}
	{/if}
	{#if workflowTask.task_type === 'compound'}
		<hr />
	{/if}
	{#if workflowTask.task_type === 'parallel' || workflowTask.task_type === 'compound'}
		<h5 class="ps-2 mt-3">
			{#if workflowTask.is_legacy_task}
				Args (legacy task)
			{:else}
				Args parallel
			{/if}
		</h5>
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
				<span id="argsPropertiesFormError" />
				<FormBuilder
					entry={workflowTask.args_parallel}
					updateEntry={saveGenericFormEntryParallel}
				/>
			</div>
		{/if}
	{/if}
	<div class="d-flex jschema-controls-bar p-3">
		<ImportExportArgs
			{workflowTask}
			onImport={handleSaveChanges}
			exportDisabled={unsavedChanges || savingChanges}
		/>
		{#if ((!workflowTask.is_legacy_task && workflowTask.task.args_schema_non_parallel) || argsSchemaParallel) && isSchemaValid}
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
