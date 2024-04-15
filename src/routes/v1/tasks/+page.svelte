<script>
	import { page } from '$app/stores';
	import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities.js';
	import { collectTaskErrorStore } from '$lib/stores/errorStores';
	import TaskEditModal from '$lib/components/v1/tasks/TaskEditModal.svelte';
	import TaskInfoModal from '$lib/components/v1/tasks/TaskInfoModal.svelte';
	import TaskCollection from '$lib/components/v1/tasks/TaskCollection.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import AddSingleTask from '$lib/components/v1/tasks/AddSingleTask.svelte';
	import { onDestroy } from 'svelte';
	import TasksTable from '$lib/components/tasks/TasksTable.svelte';

	// Error property to be set in order to show errors in UI
	let errorReasons = undefined;

	// Tasks property updated with respect to data store
	/** @type {import('$lib/types').Task[]} */
	let tasks = $page.data.tasks;

	/** @type {'pypi'|'local'|'single'} */
	let packageType = 'pypi';

	/** @type {import('$lib/components/v1/tasks/TaskInfoModal.svelte').default} */
	let taskInfoModal;
	/** @type {import('$lib/components/v1/tasks/TaskEditModal.svelte').default} */
	let taskEditModal;

	// Store subscriptions
	const unsubscribe = collectTaskErrorStore.subscribe((error) => {
		if (error) setErrorReasons(error);
	});

	function setErrorReasons(value) {
		errorReasons = value;
		displayStandardErrorAlert(errorReasons, 'errorSection');
	}

	/**
	 * @param {import('$lib/types').Task[]} tasks
	 */
	function sortTasks(tasks) {
		return orderTasksByOwnerThenByNameThenByVersion(tasks, null, 'desc');
	}

	/**
	 * Updates the tasks list after a task is edited in the modal
	 * @param {import('$lib/types').Task} editedTask
	 */
	async function updateEditedTask(editedTask) {
		const updatedTasks = tasks.map((t) => {
			if (t.id === editedTask.id) {
				return editedTask;
			} else {
				return t;
			}
		});
		sortTasks(updatedTasks);
		tasks = updatedTasks;
	}

	/**
	 * @param {import('$lib/types').Task} task
	 */
	function addNewTask(task) {
		const updatedTasks = [...tasks, task];
		sortTasks(updatedTasks);
		tasks = updatedTasks;
	}

	async function reloadTaskList() {
		const response = await fetch(`/api/v1/task?args_schema=false`, {
			method: 'GET',
			credentials: 'include'
		});
		const result = await response.json();
		if (response.ok) {
			sortTasks(result);
			tasks = result;
		} else {
			setErrorReasons(result);
		}
	}

	/**
	 * Deletes a task from the server
	 * @param {number} taskId
	 * @returns {Promise<*>}
	 */
	async function handleDeleteTask(taskId) {
		const response = await fetch(`/api/v1/task/${taskId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (response.ok) {
			console.log('Task deleted successfully');
			tasks = tasks.filter((t) => t.id !== taskId);
		} else {
			const result = await response.json();
			console.error('Error deleting the task', result);
			throw new AlertError(result);
		}
	}

	onDestroy(unsubscribe);
</script>

<div>
	<div class="mb-2" id="errorSection" />

	<h3 class="fw-light">Add tasks</h3>

	<div class="form-check-inline">Package type:</div>

	<input
		class="btn-check"
		type="radio"
		name="pypi"
		id="pypi"
		value="pypi"
		bind:group={packageType}
	/>
	<label class="btn btn-outline-secondary" for="pypi"> PyPI </label>

	<input
		class="btn-check"
		type="radio"
		name="local"
		id="local"
		value="local"
		bind:group={packageType}
	/>
	<label class="btn btn-outline-secondary" for="local"> Local </label>

	<input
		class="btn-check"
		type="radio"
		name="single"
		id="single"
		value="single"
		bind:group={packageType}
	/>
	<label class="btn btn-outline-secondary" for="single"> Single task </label>

	<div class="mt-3">
		{#if packageType === 'pypi' || packageType === 'local'}
			<TaskCollection {packageType} {reloadTaskList} />
		{:else}
			<AddSingleTask {addNewTask} />
		{/if}
	</div>

	<div class="row mt-4">
		<h3 class="fw-light">Task List</h3>
		<div class="col-12">
			<TasksTable {tasks}>
				<svelte:fragment slot="thead">
					<colgroup>
						<col width="auto" />
						<col width="100" />
						<col width="auto" />
						<col width="350" />
					</colgroup>
					<thead class="table-light">
						<tr>
							<th>Name</th>
							<th>Version</th>
							<th>Owner</th>
							<th>Options</th>
						</tr>
					</thead>
				</svelte:fragment>
				<svelte:fragment slot="custom-columns-right" let:task>
					<td>{task.owner || '–'}</td>
					<td>
						<button
							class="btn btn-light"
							data-bs-toggle="modal"
							data-bs-target="#taskInfoModal"
							on:click={() => taskInfoModal.open(task)}
						>
							<i class="bi bi-info-circle" />
							Info
						</button>
						<button
							class="btn btn-primary"
							data-bs-toggle="modal"
							data-bs-target="#taskEditModal"
							on:click={() => taskEditModal.open(task)}
						>
							<i class="bi bi-pencil" />
							Edit
						</button>
						<ConfirmActionButton
							modalId="confirmTaskDeleteModal{task.id}"
							style={'danger'}
							btnStyle="danger"
							buttonIcon="trash"
							label={'Delete'}
							message={`Delete task ${task.name}`}
							callbackAction={() => handleDeleteTask(task.id)}
						/>
					</td>
				</svelte:fragment>
			</TasksTable>
		</div>
	</div>
</div>

<TaskInfoModal bind:this={taskInfoModal} />
<TaskEditModal bind:this={taskEditModal} {updateEditedTask} />
