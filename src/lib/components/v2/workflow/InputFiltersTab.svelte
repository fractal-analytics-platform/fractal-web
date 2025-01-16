<script>
	import { onMount } from 'svelte';
	import InputFiltersTypesForm from '../projects/datasets/InputFiltersTypesForm.svelte';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import("fractal-components/types/api").WorkflowV2} */
	export let workflow;
	/** @type {import("fractal-components/types/api").WorkflowTaskV2} */
	export let workflowTask;
	/** @type {number|undefined} */
	export let selectedDatasetId;
	/** @type {(wft: import("fractal-components/types/api").WorkflowTaskV2) => void} */
	export let updateWorkflowTaskCallback;

	/** @type {InputFiltersTypesForm} */
	let form;

	let saving = false;
	let successfullySaved = false;

	let loadingDatasetFilters = false;
	/** @type {string[]} */
	let datasetTypes = [];
	let selectedDatasetTypeKey = '';
	let selectedDatasetTypeValue = true;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	onMount(() => {
		init();
	});

	export async function init() {
		if (!form.hasUnsavedChanges()) {
			form.init(workflowTask.type_filters);
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

		const valid = form.validateFields();
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
				body: JSON.stringify({
					type_filters: form.getTypes()
				})
			}
		);
		if (response.ok) {
			successfullySaved = true;
			setTimeout(() => {
				successfullySaved = false;
			}, 3000);
			form.save();
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
		return form.hasUnsavedChanges();
	}

	export function discardChanges() {
		form.discardChanges();
	}

	function onOpenAddDatasetTypeModal() {
		selectedDatasetTypeKey = '';
		selectedDatasetTypeValue = true;
	}

	function addDatasetType() {
		form.importType(selectedDatasetTypeKey, selectedDatasetTypeValue);
	}
</script>

<div class="p-3">
	<InputFiltersTypesForm bind:this={form} />

	{#if loadingDatasetFilters}
		<span class="spinner-border spinner-border-sm mb-3" role="status" aria-hidden="true" />
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

	<div id="errorAlert-inputFilters" />

	{#if successfullySaved}
		<div class="alert alert-success">Input filters successfully updated</div>
	{/if}

	<button type="button" class="btn btn-primary" on:click={save} disabled={saving}>
		{#if saving}
			<div class="spinner-border spinner-border-sm" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		{/if}
		Save
	</button>

	<Modal id="add-type-filter-from-dataset-modal" onOpen={onOpenAddDatasetTypeModal} centered={true}>
		<svelte:fragment slot="header">
			<h1 class="modal-title fs-5">Add type filter from dataset</h1>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<label class="form-label" for="datasetTypeKey"> Type Key </label>
			<select bind:value={selectedDatasetTypeKey} id="datasetTypeKey" class="form-select">
				<option value="">Select...</option>
				{#each datasetTypes as t}
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
		</svelte:fragment>
		<svelte:fragment slot="footer">
			<button
				class="btn btn-primary"
				on:click={addDatasetType}
				data-bs-dismiss="modal"
				disabled={selectedDatasetTypeKey === ''}
			>
				Add
			</button>
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		</svelte:fragment>
	</Modal>
</div>
