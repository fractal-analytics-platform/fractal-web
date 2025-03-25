<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import TypeFiltersCell from './TypeFiltersCell.svelte';

	/** @type {import("fractal-components/types/api").WorkflowV2} */
	export let workflow;

	/** @type {Modal} */
	let modal;
	let loading = false;

	/** @type {{ [id: string]: import("fractal-components/types/api").TypeFiltersFlow }|undefined} */
	let typeFiltersFlow;

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
	 * @param {number} taskId
	 */
	function getTaskById(taskId) {
		return workflow.task_list.filter((t) => t.id === taskId)[0].task;
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
							{#each Object.entries(typeFiltersFlow) as [taskId, filters], index}
								<tr>
									<td>
										{getTaskById(Number(taskId)).name}
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
	</svelte:fragment>
</Modal>
