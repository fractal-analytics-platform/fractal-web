<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import TypeFiltersCell from './TypeFiltersCell.svelte';

	/** @type {import("fractal-components/types/api").WorkflowV2} */
	export let workflow;

	/** @type {number|undefined} */
	export let selectedDatasetId = undefined;
	/** @type {import('fractal-components/types/api').DatasetV2[]} */
	export let datasets;

	/** @type {Modal} */
	let modal;
	let loading = false;

	/** @type {import("fractal-components/types/api").TypeFiltersFlow|undefined} */
	let typeFiltersFlow;

	/** @type {number|undefined} */
	let firstTaskIndex = undefined;
	/** @type {number|undefined} */
	let lastTaskIndex = undefined;
	let selectedTypeFilter = '';
	/** @type {string[]} */
	let typeFilters = [];

	export async function open() {
		firstTaskIndex = undefined;
		lastTaskIndex = undefined;

		modal.show();

		await loadData();
	}

	async function loadData() {
		modal.hideErrorAlert();
		loading = true;

		const url = new URL(
			`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/type-filters-flow`,
			window.location.origin
		);

		if (selectedDatasetId !== undefined) {
			url.searchParams.append('dataset_id', selectedDatasetId.toString());
		}
		if (firstTaskIndex !== undefined) {
			url.searchParams.append('first_task_index', firstTaskIndex.toString());
		}
		if (lastTaskIndex !== undefined) {
			url.searchParams.append('last_task_index', lastTaskIndex.toString());
		}

		const response = await fetch(url);

		if (response.ok) {
			typeFiltersFlow = await response.json();
			typeFilters = getUniqueTypeFilters();
			if (!typeFilters.includes(selectedTypeFilter)) {
				selectedTypeFilter = '';
			}
		} else {
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
		}

		loading = false;
	}

	function getUniqueTypeFilters() {
		if (!typeFiltersFlow) {
			return [];
		}
		const allTypeFilters = typeFiltersFlow.dataset_filters.flatMap((f) => Object.keys(f));
		return [...new Set(allTypeFilters)].sort((t1, t2) =>
			t1.localeCompare(t2, undefined, { sensitivity: 'base' })
		);
	}

	async function onFirstTaskChanged() {
		// reset last task
		if (
			lastTaskIndex !== undefined &&
			firstTaskIndex !== undefined &&
			firstTaskIndex > lastTaskIndex
		) {
			lastTaskIndex = undefined;
		}
		await loadData();
	}

	function onClose() {
		typeFiltersFlow = undefined;
	}
</script>

<Modal id="typeFiltersFlowModal" size="xl" bind:this={modal} {onClose}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Type filters</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-typeFiltersFlowModal" />
		{#if loading && !typeFiltersFlow}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{/if}
		{#if typeFiltersFlow}
			<div class="row">
				<div class="col">
					<div class="input-group mb-3">
						<label class="input-group-text" for="typeFiltersFlowDataset">Dataset</label>
						<select
							class="form-select"
							id="typeFiltersFlowDataset"
							bind:value={selectedDatasetId}
							on:change={loadData}
						>
							<option value={undefined}>Select...</option>
							{#each datasets as dataset}
								<option value={dataset.id}>{dataset.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="col">
					<div class="input-group mb-3">
						<label class="input-group-text" for="typeFiltersFlowFirstTaskIndex">First task</label>
						<select
							class="form-select"
							id="typeFiltersFlowFirstTaskIndex"
							bind:value={firstTaskIndex}
							on:change={onFirstTaskChanged}
						>
							<option value={undefined}>Select...</option>
							{#each workflow.task_list as wft}
								<option value={wft.order}>{wft.task.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="col">
					<div class="input-group mb-3">
						<label class="input-group-text" for="typeFiltersFlowLastTaskIndex">Last task</label>
						<select
							class="form-select"
							id="typeFiltersFlowLastTaskIndex"
							bind:value={lastTaskIndex}
							on:change={loadData}
						>
							<option value={undefined}>Select...</option>
							{#each workflow.task_list as wft}
								{#if firstTaskIndex === undefined || wft.order >= firstTaskIndex}
									<option value={wft.order}>{wft.task.name}</option>
								{/if}
							{/each}
						</select>
					</div>
				</div>
				<div class="col">
					<div class="input-group mb-3">
						<label class="input-group-text" for="typeFiltersFlowTypeFilter">Type</label>
						<select
							class="form-select"
							id="typeFiltersFlowTypeFilter"
							bind:value={selectedTypeFilter}
						>
							<option value="">Select...</option>
							{#each typeFilters as type}
								<option value={type}>{type}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			<div class="table-responsive">
				<table class="table table-striped table-bordered">
					<thead>
						<tr>
							<th>Task</th>
							<th>Pre</th>
							<th>Input</th>
							<th>Output</th>
							<th>Post</th>
						</tr>
					</thead>
					<tbody>
						{#if !loading}
							<!-- eslint-disable-next-line no-unused-vars -->
							{#each Object.keys(typeFiltersFlow.input_filters) as _, index}
								<tr>
									<td>
										{workflow.task_list[
											firstTaskIndex === undefined ? index : firstTaskIndex + index
										].task.name}
									</td>
									<td>
										<TypeFiltersCell
											{selectedTypeFilter}
											filters={typeFiltersFlow.dataset_filters[index]}
										/>
									</td>
									<td>
										<TypeFiltersCell
											{selectedTypeFilter}
											filters={typeFiltersFlow.input_filters[index]}
										/>
									</td>
									<td>
										<TypeFiltersCell
											{selectedTypeFilter}
											filters={typeFiltersFlow.output_filters[index]}
										/>
									</td>
									<td>
										<TypeFiltersCell
											{selectedTypeFilter}
											filters={typeFiltersFlow.dataset_filters[index + 1]}
										/>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	</svelte:fragment>
</Modal>
