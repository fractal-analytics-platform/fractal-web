<script>
	import Modal from '../common/Modal.svelte';

	/** @type {number} */
	export let projectId;
	/** @type {import('$lib/types').Workflow} */
	export let workflow;

	/** @type {(workflow: import('$lib/types').Workflow) => void} */
	export let workflowUpdater;

	/** @type {Modal} */
	let editWorkflowTasksOrderModal;

	/** @type {{id: number, name: string}[]} */
	let editableTasksList = [];

	/**
	 * @param {import('$lib/types').WorkflowTask[]} originalTasksList
	 */
	export function show(originalTasksList) {
		editableTasksList = originalTasksList.map((task) => ({ id: task.id, name: task.task.name }));
		editWorkflowTasksOrderModal.show();
	}

	/**
	 * @param {number} index
	 * @param {'up'|'down'} direction
	 */
	function moveWorkflowTask(index, direction) {
		const wftList = editableTasksList;

		let replaceId;
		switch (direction) {
			case 'up':
				if (index === 0) break;
				replaceId = index - 1;
				break;
			case 'down':
				if (index === wftList.length - 1) break;
				replaceId = index + 1;
		}

		if (replaceId !== undefined) {
			const replaceTask = wftList[replaceId];
			wftList[replaceId] = wftList[index];
			wftList[index] = replaceTask;
			editableTasksList = wftList;
		}
	}

	let workflowTaskSorting = false;

	/**
	 * Reorders a project's workflow in the server
	 * @returns {Promise<*>}
	 */
	async function handleWorkflowOrderUpdate() {
		if (!workflow) {
			return;
		}
		const patchData = {
			reordered_workflowtask_ids: editableTasksList.map((t) => t.id)
		};

		workflowTaskSorting = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${projectId}/workflow/${workflow.id}`, {
			method: 'PATCH',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify(patchData)
		});
		workflowTaskSorting = false;

		const result = await response.json();
		if (response.ok) {
			console.log('Workflow task order updated');
			workflowUpdater(result);
			editWorkflowTasksOrderModal.toggle();
		} else {
			console.error('Workflow task order not updated', result);
			editWorkflowTasksOrderModal.displayErrorAlert(result);
		}
	}
</script>

<Modal id="editWorkflowTasksOrderModal" centered={true} bind:this={editWorkflowTasksOrderModal}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Edit workflow tasks order</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="errorAlert-editWorkflowTasksOrderModal" />
		{#if workflow !== undefined && editableTasksList.length == 0}
			<p class="text-center mt-3">No workflow tasks yet, add one.</p>
		{:else if workflow !== undefined}
			{#key editableTasksList}
				<ul class="list-group list-group-flush">
					{#each editableTasksList as workflowTask, i}
						<li class="list-group-item" data-fs-target={workflowTask.id}>
							<div class="d-flex justify-content-between align-items-center">
								<div>
									{workflowTask.name} #{workflowTask.id}
								</div>
								<div>
									{#if i !== 0}
										<button
											class="btn btn-light"
											on:click|preventDefault={() => moveWorkflowTask(i, 'up')}
										>
											<i class="bi-arrow-up" />
										</button>
									{/if}
									{#if i !== editableTasksList.length - 1}
										<button
											class="btn btn-light"
											on:click|preventDefault={() => moveWorkflowTask(i, 'down')}
										>
											<i class="bi-arrow-down" />
										</button>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/key}
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-primary" on:click|preventDefault={handleWorkflowOrderUpdate} disabled={workflowTaskSorting}>
			{#if workflowTaskSorting}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
			{/if}
			Save
		</button>
	</svelte:fragment>
</Modal>
