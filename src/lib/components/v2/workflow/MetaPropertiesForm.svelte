<script>
	// This component handles the meta properties of a workflow task.
	// Every time the workflow task meta properties are updated within the form, this component should update the server
	// If the server successfully stores the updated meta properties
	// then the status between the client and server is in sync
	//
	// This component also manages the overall form structure of meta properties.
	// The form should be structured in multiple levels of depth, and support complex structure.
	import { page } from '$app/state';
	import FormBuilder from '$lib/components/v2/workflow/FormBuilder.svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { isCompoundType, isNonParallelType, isParallelType } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {(wft: import('fractal-components/types/api').WorkflowTaskV2) => void} onWorkflowTaskUpdated
	 * @property {boolean} [editable]
	 * @property {any} [metaNonParallel]
	 * @property {any} [metaParallel]
	 */

	/** @type {Props} */
	let {
		workflowTask,
		onWorkflowTaskUpdated,
		editable = true,
		metaNonParallel = {},
		metaParallel = {}
	} = $props();

	/** @type {FormBuilder|undefined} */
	let nonParallelFormBuilderComponent = $state();
	/** @type {FormBuilder|undefined} */
	let parallelFormBuilderComponent = $state();
	let unsavedChangesFormBuilderParallel = $state(false);
	let unsavedChangesFormBuilderNonParallel = $state(false);
	let savingChanges = $state(false);

	const metaPropertiesNonParallel = $derived(
		editable ? workflowTask.meta_non_parallel || {} : metaNonParallel || {}
	);

	const metaPropertiesParallel = $derived(
		editable ? workflowTask.meta_parallel || {} : metaParallel || {}
	);

	let unsavedChanges = $derived(
		unsavedChangesFormBuilderParallel || unsavedChangesFormBuilderNonParallel
	);

	export async function saveChanges() {
		const invalidNonParallel =
			nonParallelFormBuilderComponent && !nonParallelFormBuilderComponent.validateArguments();
		const invalidParallel =
			parallelFormBuilderComponent && !parallelFormBuilderComponent.validateArguments();
		if (invalidNonParallel || invalidParallel) {
			return;
		}
		const payload = {};
		if (nonParallelFormBuilderComponent) {
			payload.meta_non_parallel = nonParallelFormBuilderComponent.getArguments();
		}
		if (parallelFormBuilderComponent) {
			payload.meta_parallel = parallelFormBuilderComponent.getArguments();
		}
		await handleEntryUpdate(payload);
	}

	/**
	 * @param {object} payload
	 */
	async function handleEntryUpdate(payload) {
		const projectId = page.params.projectId;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		savingChanges = true;
		const response = await fetch(
			`/api/v2/project/${projectId}/workflow/${workflowTask.workflow_id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: JSON.stringify(payload)
			}
		);
		savingChanges = false;

		if (response.ok) {
			const result = await response.json();
			onWorkflowTaskUpdated(result);
		} else {
			displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'metaPropertiesFormError'
			);
		}
	}

	export function discardChanges() {
		if (nonParallelFormBuilderComponent) {
			nonParallelFormBuilderComponent.discardChanges(workflowTask.meta_non_parallel);
		}
		if (parallelFormBuilderComponent) {
			parallelFormBuilderComponent.discardChanges(workflowTask.meta_parallel);
		}
	}

	export function hasUnsavedChanges() {
		return unsavedChanges;
	}
</script>

<div class="mt-2">
	<span id="metaPropertiesFormError"></span>
</div>
{#if isNonParallelType(workflowTask.task_type) || isCompoundType(workflowTask.task_type)}
	{#if isCompoundType(workflowTask.task_type)}
		<h5 class="ms-2">Initialisation Meta</h5>
	{/if}
	{#key editable || metaPropertiesNonParallel}
		<FormBuilder
			{editable}
			args={metaPropertiesNonParallel}
			bind:this={nonParallelFormBuilderComponent}
			bind:unsavedChanges={unsavedChangesFormBuilderNonParallel}
		/>
	{/key}
{/if}
{#if isCompoundType(workflowTask.task_type)}
	<hr />
{/if}
{#if isParallelType(workflowTask.task_type) || isCompoundType(workflowTask.task_type)}
	{#if isCompoundType(workflowTask.task_type)}
		<h5 class="ms-2">Compute Meta</h5>
	{/if}
	{#key editable || metaPropertiesParallel}
		<FormBuilder
			{editable}
			args={metaPropertiesParallel}
			bind:this={parallelFormBuilderComponent}
			bind:unsavedChanges={unsavedChangesFormBuilderParallel}
		/>
	{/key}
{/if}

<div class="p-3 clearfix metaproperties-controls-bar">
	<div class="ms-1 float-end">
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
	<div class="float-end">
		<button
			class="btn btn-warning"
			disabled={!editable || !unsavedChanges || savingChanges}
			onclick={discardChanges}
		>
			Discard changes
		</button>
	</div>
</div>

<style>
	.metaproperties-controls-bar {
		background-color: whitesmoke;
		margin-top: 5px;
		border-top: 1px solid lightgray;
	}
</style>
