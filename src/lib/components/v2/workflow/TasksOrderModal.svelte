<script>
	import { preventDefault } from 'svelte/legacy';

	import { onMount } from 'svelte';
	import Modal from '../../common/Modal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {number} projectId
	 * @property {import('fractal-components/types/api').WorkflowV2} workflow
	 * @property {(workflow: import('fractal-components/types/api').WorkflowV2) => void} workflowUpdater
	 */

	/** @type {Props} */
	let { projectId, workflow, workflowUpdater } = $props();

	/** @type {Modal|undefined} */
	let editWorkflowTasksOrderModal = $state();

	/** @type {{id: number, name: string}[]} */
	let editableTasksList = $state([]);

	// used to hide drag and drop ghost image
	let transparentImage;

	/**
	 * @param {import('fractal-components/types/api').WorkflowTaskV2[]} originalTasksList
	 */
	export function show(originalTasksList) {
		editableTasksList = originalTasksList.map((wt) => ({
			id: wt.id,
			name: wt.task.name
		}));
		editWorkflowTasksOrderModal?.show();
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

	let workflowTaskSorting = $state(false);

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

		const response = await fetch(`/api/v2/project/${projectId}/workflow/${workflow.id}`, {
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
			editWorkflowTasksOrderModal?.toggle();
		} else {
			console.error('Workflow task order not updated', result);
			editWorkflowTasksOrderModal?.displayErrorAlert(result);
		}
	}

	/** @type {number|undefined} */
	let draggedWftId = $state(undefined);
	/** @type {number|undefined} */
	let draggedWftIndex = $state(undefined);

	/**
	 * @param {number} workflowTaskId
	 * @param {number} index
	 * @param {DragEvent} event
	 */
	function handleDragStart(workflowTaskId, index, event) {
		draggedWftId = workflowTaskId;
		draggedWftIndex = index;
		// set transparent drag image
		if (event.dataTransfer && event.target instanceof Element) {
			event.dataTransfer.setDragImage(transparentImage, 0, 0);
		}
	}

	/**
	 * @param {DragEvent} event
	 */
	function handleDragOver(event) {
		if (draggedWftId === undefined || event.dataTransfer === null) {
			return;
		}

		const buttons = document.querySelectorAll('#workflow-tasks-order .btn-draggable');

		const mouseY = event.clientY;
		const draggedWftPos = editableTasksList.indexOf(
			editableTasksList.filter((wft) => wft.id === draggedWftId)[0]
		);

		let position = 0;
		for (const button of buttons) {
			const { y, height } = button.getBoundingClientRect();
			if (mouseY < y + height) {
				break;
			}
			position++;
		}

		if (position !== draggedWftPos) {
			moveWorkflowTask(draggedWftPos, position > draggedWftPos ? 'down' : 'up');
		}

		event.preventDefault();
	}

	function handleDragEnd() {
		draggedWftId = undefined;
		draggedWftIndex = undefined;
	}

	onMount(() => {
		transparentImage = getTransparentImage();
	});

	function getTransparentImage() {
		const image = new Image();
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		const ctx = canvas.getContext('2d');
		if (ctx != null) {
			ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Fully transparent
			ctx.fillRect(0, 0, 1, 1);
		}
		image.src = canvas.toDataURL();
		return image;
	}
</script>

<Modal id="editWorkflowTasksOrderModal" centered={true} bind:this={editWorkflowTasksOrderModal}>
	{#snippet header()}
		<h5 class="modal-title">Edit workflow tasks order</h5>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-editWorkflowTasksOrderModal"></div>
		{#if workflow !== undefined && editableTasksList.length == 0}
			<p class="text-center mt-3">No workflow tasks yet, add one.</p>
		{:else if workflow !== undefined}
			<div class="fw-light mb-3">Sort the elements by dragging them to the desired position.</div>
			<div
				id="workflow-tasks-order"
				role="region"
				tabindex="-1"
				ondragover={handleDragOver}
				ondrop={handleDragEnd}
			>
				{#each editableTasksList as workflowTask, i}
					<div
						class="btn w-100 mt-2 border border-secondary btn-draggable"
						data-fs-target={workflowTask.id}
						draggable={true}
						role="button"
						tabindex="0"
						class:active={draggedWftIndex === i}
						class:dragged={workflowTask.id === draggedWftId}
						ondragstart={(event) => handleDragStart(workflowTask.id, i, event)}
						ondragend={handleDragEnd}
					>
						{workflowTask.name}
					</div>
				{/each}
			</div>
		{/if}
	{/snippet}
	{#snippet footer()}
		<button
			class="btn btn-primary"
			onclick={preventDefault(handleWorkflowOrderUpdate)}
			disabled={workflowTaskSorting}
		>
			{#if workflowTaskSorting}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
	{/snippet}
</Modal>

<style>
	.dragged,
	.btn-draggable:hover:not(.active) {
		background-color: #c8e5ff !important;
	}
</style>
