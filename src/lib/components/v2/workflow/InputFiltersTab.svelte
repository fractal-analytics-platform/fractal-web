<script>
	import { onMount } from 'svelte';
	import InputFiltersTypesForm from '../projects/datasets/InputFiltersTypesForm.svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import { normalizePayload } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {import("fractal-components/types/api").WorkflowV2} workflow
	 * @property {import("fractal-components/types/api").WorkflowTaskV2} workflowTask
	 * @property {number|undefined} selectedDatasetId
	 * @property {(wft: import("fractal-components/types/api").WorkflowTaskV2) => void} updateWorkflowTaskCallback
	 */

	/** @type {Props} */
	let { workflow, workflowTask, selectedDatasetId, updateWorkflowTaskCallback } = $props();

	/** @type {InputFiltersTypesForm|undefined} */
	let form = $state();

	let saving = $state(false);
	let successfullySaved = $state(false);

	let loadingDatasetFilters = $state(false);
	/** @type {string[]} */
	let datasetTypes = $state([]);
	let selectedDatasetTypeKey = $state('');
	let selectedDatasetTypeValue = $state(true);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	onMount(() => {
		init();
	});

	export async function init() {
		if (!form?.hasUnsavedChanges()) {
			form?.init(workflowTask.type_filters);
		}

		if (selectedDatasetId === undefined) {
			datasetTypes = [];
		} else {
			const headers = new Headers();
			headers.set('Content-Type', 'application/json');
			loadingDatasetFilters = true;
			const response = await fetch(
				`/api/v2/project/${workflow.project_id}/dataset/${selectedDatasetId}/images/query?page=1&page_size=1`,
				{
					method: 'POST',
					headers,
					credentials: 'include',
					body: JSON.stringify({})
				}
			);
			if (response.ok) {
				/** @type {import('fractal-components/types/api').ImagePage} */
				const imagePage = await response.json();
				datasetTypes = imagePage.types;
			} else {
				errorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					`errorAlert-inputFilters`
				);
			}
			loadingDatasetFilters = false;
		}
	}

	export async function save() {
		if (errorAlert) {
			errorAlert.hide();
		}
		successfullySaved = false;

		const valid = form?.validateFields();
		if (!valid) {
			return;
		}

		saving = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/wftask/${workflowTask.id}`,
			{
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: normalizePayload({
					type_filters: form?.getTypes()
				})
			}
		);
		if (response.ok) {
			successfullySaved = true;
			setTimeout(() => {
				successfullySaved = false;
			}, 3000);
			form?.save();
			const result = await response.json();
			updateWorkflowTaskCallback(result);
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				`errorAlert-inputFilters`
			);
		}
		saving = false;
	}

	/**
	 * @returns {boolean}
	 */
	export function hasUnsavedChanges() {
		return form?.hasUnsavedChanges() || false;
	}

	export function discardChanges() {
		form?.discardChanges();
	}

	function onOpenAddDatasetTypeModal() {
		selectedDatasetTypeKey = '';
		selectedDatasetTypeValue = true;
	}

	function addDatasetType() {
		form?.importType(selectedDatasetTypeKey, selectedDatasetTypeValue);
	}
</script>

<div class="p-3">
	<InputFiltersTypesForm task={workflowTask.task} bind:this={form} />

	{#if loadingDatasetFilters}
		<span class="spinner-border spinner-border-sm mb-3" role="status" aria-hidden="true"></span>
	{:else if datasetTypes.length > 0}
		<button
			class="btn btn-outline-primary mb-3"
			type="button"
			data-bs-toggle="modal"
			data-bs-target="#add-type-filter-from-dataset-modal"
		>
			Add type filter from dataset
		</button>
	{/if}

	<div id="errorAlert-inputFilters"></div>

	{#if successfullySaved}
		<div class="alert alert-success">Input filters successfully updated</div>
	{/if}

	<button type="button" class="btn btn-primary" onclick={save} disabled={saving}>
		{#if saving}
			<div class="spinner-border spinner-border-sm" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		{/if}
		Save
	</button>

	<Modal id="add-type-filter-from-dataset-modal" onOpen={onOpenAddDatasetTypeModal} centered={true}>
		{#snippet header()}
			<h1 class="modal-title fs-5">Add type filter from dataset</h1>
		{/snippet}
		{#snippet body()}
			<label class="form-label" for="datasetTypeKey"> Type Key </label>
			<select bind:value={selectedDatasetTypeKey} id="datasetTypeKey" class="form-select">
				<option value="">Select...</option>
				{#each datasetTypes as t (t)}
					<option>{t}</option>
				{/each}
			</select>
			{#if selectedDatasetTypeKey !== ''}
				<label class="form-label mt-2" for="datasetTypeValue"> Type Value </label>
				<select bind:value={selectedDatasetTypeValue} id="datasetTypeValue" class="form-select">
					<option value={true}>True</option>
					<option value={false}>False</option>
				</select>
			{/if}
		{/snippet}
		{#snippet footer()}
			<button
				class="btn btn-primary"
				onclick={addDatasetType}
				data-bs-dismiss="modal"
				disabled={selectedDatasetTypeKey === ''}
			>
				Add
			</button>
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		{/snippet}
	</Modal>
</div>

<ul class="list-group p-3">
	<li class="list-group-item list-group-item-light fw-bold">Input Types</li>
	<li class="list-group-item">
		{#if Object.keys(workflowTask.task.input_types).length === 0}
			-
		{:else}
			<table class="table table-borderless mb-0">
				<tbody>
					{#each Object.keys(workflowTask.task.input_types) as key (key)}
						<tr class="d-flex">
							<td><code>{key}</code></td>
							<td class="flex-grow"><BooleanIcon value={workflowTask.task.input_types[key]} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Output Types</li>
	<li class="list-group-item">
		{#if Object.keys(workflowTask.task.output_types).length === 0}
			-
		{:else}
			<table class="table table-borderless mb-0">
				<tbody>
					{#each Object.keys(workflowTask.task.output_types) as key (key)}
						<tr class="d-flex">
							<td><code>{key}</code></td>
							<td class="flex-grow"><BooleanIcon value={workflowTask.task.output_types[key]} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</li>
</ul>
