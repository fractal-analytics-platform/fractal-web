<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').WorkflowV2} workflow
	 * @property {(workflow: import('fractal-components/types/api').WorkflowV2) => void} workflowUpdater
	 */

	/** @type {Props} */
	let { workflow, workflowUpdater } = $props();

	let position = $state('');

	function mockTaskSorting() {
		const updatedList = [];
		const positions = position.split(',').map((p) => Number(p));
		for (let i = 0; i < positions.length; i++) {
			updatedList.push({ ...workflow.task_list[positions[i]] });
			updatedList[i].order = i;
		}
		workflowUpdater({ ...workflow, task_list: updatedList });
	}
</script>

<label for="mock-position">Mock position</label>
<input type="text" id="mock-position" bind:value={position} />
<button onclick={mockTaskSorting}> Apply mock sorting </button>
