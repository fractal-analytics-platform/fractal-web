<script>
	import { onMount, tick } from 'svelte';
	import FiltersCreationForm from '../projects/datasets/FiltersCreationForm.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import("$lib/types-v2").WorkflowV2} */
	export let workflow;
	/** @type {import("$lib/types-v2").WorkflowTaskV2} */
	export let workflowTask;
	/** @type {number|undefined} */
	export let selectedDatasetId;
	/** @type {(wft: import("$lib/types-v2").WorkflowTaskV2) => void} */
	export let updateWorkflowTaskCallback;

	/** @type {FiltersCreationForm} */
	let form;

	let saving = false;
	let successfullySaved = false;

	let loadingDatasetFilters = false;
	/** @type {{ [key: string]: Array<string | number | boolean> }} */
	let datasetAttributes = {};
	/** @type {string[]} */
	let datasetTypes = [];
	let selectedDatasetAttributeKey = '';
	let selectedDatasetAttributeValue = '';
	let selectedDatasetTypeKey = '';
	let selectedDatasetTypeValue = true;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	onMount(() => {
		init();
	});

	export async function init() {
		form.init(workflowTask.input_filters.attributes, workflowTask.input_filters.types);

		if (selectedDatasetId === undefined) {
			datasetAttributes = {};
			datasetTypes = [];
		} else {
			const headers = new Headers();
			headers.set('Content-Type', 'application/json');
			loadingDatasetFilters = true;
			const response = await fetch(
				`/api/v2/project/${workflow.project_id}/dataset/${selectedDatasetId}/images/query?page=1&page_size=1&use_dataset_filters=false`,
				{
					method: 'POST',
					headers,
					credentials: 'include',
					body: JSON.stringify({})
				}
			);
			const result = await response.json();
			if (response.ok) {
				/** @type {import('$lib/types-v2').ImagePage} */
				const imagePage = result;
				datasetAttributes = imagePage.attributes;
				datasetTypes = imagePage.types;
			} else {
				errorAlert = displayStandardErrorAlert(result, `errorAlert-inputFilters`);
			}
			loadingDatasetFilters = false;
		}
	}

	async function save() {
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
					input_filters: {
						attributes: form.getAttributes(),
						types: form.getTypes()
					}
				})
			}
		);
		if (response.ok) {
			successfullySaved = true;
			setTimeout(() => {
				successfullySaved = false;
			}, 3000);
			updateWorkflowTaskCallback(await response.json());
		} else {
			errorAlert = displayStandardErrorAlert(await response.json(), `errorAlert-inputFilters`);
		}
		saving = false;
	}

	function onOpenAddDatasetAttributeModal() {
		selectedDatasetAttributeKey = '';
		selectedDatasetAttributeValue = '';
	}

	function addDatasetAttribute() {
		const attributes = form.getAttributes();
		attributes[selectedDatasetAttributeKey] = selectedDatasetAttributeValue;
		form.init(attributes, form.getTypes());
	}

	function onOpenAddDatasetTypeModal() {
		selectedDatasetTypeKey = '';
		selectedDatasetTypeValue = true;
	}

	function addDatasetType() {
		const types = form.getTypes();
		types[selectedDatasetTypeKey] = selectedDatasetTypeValue;
		form.init(form.getAttributes(), types);
	}
</script>

<div class="p-3">
	<FiltersCreationForm bind:this={form} />

	{#if loadingDatasetFilters}
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
	{:else}
		{#if Object.keys(datasetAttributes).length > 0}
			<button
				class="btn btn-outline-primary mb-3"
				type="button"
				data-bs-toggle="modal"
				data-bs-target="#add-attribute-filter-from-dataset-modal"
			>
				Add attribute filter from dataset
			</button>
		{/if}
		{#if datasetTypes.length > 0}
			<button
				class="btn btn-outline-primary mb-3"
				type="button"
				data-bs-toggle="modal"
				data-bs-target="#add-type-filter-from-dataset-modal"
			>
				Add type filter from dataset
			</button>
		{/if}
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

	<Modal
		id="add-attribute-filter-from-dataset-modal"
		onOpen={onOpenAddDatasetAttributeModal}
		centered={true}
	>
		<svelte:fragment slot="header">
			<h1 class="modal-title fs-5">Add attribute filter from dataset</h1>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<label class="form-label" for="datasetAttributeKey"> Attribute Key </label>
			<select
				bind:value={selectedDatasetAttributeKey}
				id="datasetAttributeKey"
				class="form-control"
				on:change={() => (selectedDatasetAttributeValue = '')}
			>
				<option value="">Select...</option>
				{#each Object.keys(datasetAttributes) as k}
					<option>{k}</option>
				{/each}
			</select>
			{#if selectedDatasetAttributeKey !== ''}
				<label class="form-label mt-2" for="datasetAttributeValue"> Attribute Value </label>
				<select
					bind:value={selectedDatasetAttributeValue}
					id="datasetAttributeValue"
					class="form-control"
				>
					<option value="">Select...</option>
					{#each datasetAttributes[selectedDatasetAttributeKey] as value}
						<option>{value}</option>
					{/each}
				</select>
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="footer">
			<button
				class="btn btn-primary"
				on:click={addDatasetAttribute}
				data-bs-dismiss="modal"
				disabled={selectedDatasetAttributeKey === '' || selectedDatasetAttributeValue === ''}
			>
				Add
			</button>
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		</svelte:fragment>
	</Modal>

	<Modal id="add-type-filter-from-dataset-modal" onOpen={onOpenAddDatasetTypeModal} centered={true}>
		<svelte:fragment slot="header">
			<h1 class="modal-title fs-5">Add type filter from dataset</h1>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<label class="form-label" for="datasetTypeKey"> Type Key </label>
			<select bind:value={selectedDatasetTypeKey} id="datasetTypeKey" class="form-control">
				<option value="">Select...</option>
				{#each datasetTypes as t}
					<option>{t}</option>
				{/each}
			</select>
			{#if selectedDatasetTypeKey !== ''}
				<label class="form-label mt-2" for="datasetTypeValue"> Type Value </label>
				<select bind:value={selectedDatasetTypeValue} id="datasetTypeValue" class="form-control">
					<option value={true}>True</option>
					<option value={false}>Frue</option>
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
