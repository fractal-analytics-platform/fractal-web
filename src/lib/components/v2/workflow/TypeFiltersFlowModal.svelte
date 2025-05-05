<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import TypeFiltersCell from './TypeFiltersCell.svelte';

	
	/**
	 * @typedef {Object} Props
	 * @property {import("fractal-components/types/api").WorkflowV2} workflow
	 */

	/** @type {Props} */
	let { workflow } = $props();

	/** @type {Modal} */
	let modal = $state();
	let loading = $state(false);

	/** @type {Array<import("fractal-components/types/api").TypeFiltersFlow>} */
	let typeFiltersFlow = $state([]);

	export async function open() {
		modal.show();
		await loadData();
	}

	async function loadData() {
		modal.hideErrorAlert();
		loading = true;

		const response = await fetch(
			`/api/v2/project/${workflow.project_id}/workflow/${workflow.id}/type-filters-flow`
		);

		if (response.ok) {
			typeFiltersFlow = await response.json();
		} else {
			modal.displayErrorAlert(await getAlertErrorFromResponse(response));
		}

		loading = false;
	}

	/**
	 * @param {number} workflowTaskId
	 */
	function getTaskById(workflowTaskId) {
		return workflow.task_list.filter((t) => t.id === workflowTaskId)[0].task;
	}

	function onClose() {
		typeFiltersFlow = [];
	}
</script>

<Modal id="typeFiltersFlowModal" size="xl" bind:this={modal} {onClose}>
	{#snippet header()}
	
			<h5 class="modal-title">Type filters</h5>
		
	{/snippet}
	{#snippet body()}
	
			<div id="errorAlert-typeFiltersFlowModal"></div>
			{#if loading && !typeFiltersFlow}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			{#if typeFiltersFlow}
				<div class="table-responsive">
					<table class="table table-striped table-bordered">
						<thead>
							<tr>
								<th>Task</th>
								<th>Current</th>
								<th>Input</th>
								<th>Output</th>
							</tr>
						</thead>
						<tbody>
							{#if !loading}
								<!-- eslint-disable-next-line no-unused-vars -->
								{#each typeFiltersFlow as filters}
									<tr>
										<td>
											{getTaskById(Number(filters.workflowtask_id)).name}
										</td>
										<td>
											<TypeFiltersCell filters={filters.current_type_filters} />
										</td>
										<td>
											<TypeFiltersCell filters={filters.input_type_filters} />
										</td>
										<td>
											<TypeFiltersCell filters={filters.output_type_filters} />
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			{/if}
		
	{/snippet}
</Modal>
