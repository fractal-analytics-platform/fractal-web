<script>
	import { page } from '$app/stores';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import TasksTable from '$lib/components/tasks/TasksTable.svelte';

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	/** @type {import('$lib/types').Task[]} */
	let tasks = $page.data.tasks;

	/**
	 * Instead of replacing the whole tasks object on successful PATCH response, this compatibility map
	 * is used to draw the state of checkboxes. This prevents the complete redraw of the table when the
	 * compatibility of a single task change, avoiding to collapse the opened old versions rows.
	 * @type {{[taskId: string]: boolean}}
	 */
	let compatibilities = Object.fromEntries(tasks.map((t) => [t.id, t.is_v2_compatible]));

	/** @type {number|null} */
	let editingTaskId = null;

	/**
	 * @param {Event} event
	 * @param {import('$lib/types').Task} task
	 */
	async function setV2Compatible(event, task) {
		if (errorAlert) {
			errorAlert.hide();
		}
		editingTaskId = task.id;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const is_v2_compatible = !task.is_v2_compatible;
		const response = await fetch(`/api/admin/v2/task-v1/${task.id}`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ is_v2_compatible })
		});
		if (response.ok) {
			// Update compatibilities map and task object
			compatibilities[task.id] = is_v2_compatible;
			task.is_v2_compatible = is_v2_compatible;
			compatibilities = compatibilities;
		} else {
			const result = await response.json();
			errorAlert = displayStandardErrorAlert(
				new AlertError(result, response.status),
				`errorAlert-tasksCompatibility`
			);
			// reset input state in case of error
			if (event.target instanceof HTMLInputElement) {
				event.target.checked = !is_v2_compatible;
			}
		}
		editingTaskId = null;
	}
</script>

<div>
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="fw-light">v1/v2 tasks compatibility</h1>
	</div>
</div>

<div id="errorAlert-tasksCompatibility" />

<TasksTable {tasks}>
	<svelte:fragment slot="thead">
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>Version</th>
				<th>V2 compatible</th>
			</tr>
		</thead>
	</svelte:fragment>
	<svelte:fragment slot="custom-columns-left" let:task>
		<td>{task.id}</td>
	</svelte:fragment>
	<svelte:fragment slot="custom-columns-right" let:task>
		<td>
			<div class="form-check form-switch">
				<input
					class="form-check-input"
					type="checkbox"
					role="switch"
					id="task-{task.id}-compatible"
					on:change={(event) => setV2Compatible(event, task)}
					checked={compatibilities[task.id]}
					disabled={editingTaskId === task.id}
				/>
				<label class="form-check-label" for="task-{task.id}-compatible">
					{compatibilities[task.id]}
					{#if editingTaskId === task.id}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
					{/if}
				</label>
			</div>
		</td>
	</svelte:fragment>
</TasksTable>
