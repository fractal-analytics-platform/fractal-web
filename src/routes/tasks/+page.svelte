<script>
	import { page } from '$app/stores';
	import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities.js';
	import { collectTaskErrorStore } from '$lib/stores/errorStores';
	import { originalTaskStore, taskStore } from '$lib/stores/taskStores';
	import TaskEditModal from '$lib/components/tasks/TaskEditModal.svelte';
	import TaskInfoModal from '$lib/components/tasks/TaskInfoModal.svelte';
	import TaskCollection from '$lib/components/tasks/TaskCollection.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import AddSingleTask from '$lib/components/tasks/AddSingleTask.svelte';

	// Error property to be set in order to show errors in UI
	let errorReasons = undefined;

	// Tasks property updated with respect to data store
	/** @type {import('$lib/types').Task[]} */
	let tasks = $page.data.tasks;

	/** @type {'pypi'|'local'|'single'} */
	let packageType = 'pypi';

	// Store subscriptions
	collectTaskErrorStore.subscribe((error) => {
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
	 * @param {number} taskId
	 */
	function setTaskModal(taskId) {
		const task = /** @type {import('$lib/types').Task} */ (tasks.find((t) => t.id === taskId));
		taskStore.set(task);
		originalTaskStore.set({ ...task });
	}

	/**
	 * Updates the tasks list after a task is edited in the modal
	 * @param {import('$lib/types').Task} editedTask
	 */
	async function updateEditedTask(editedTask) {
		const updatedTasks = tasks.filter((t) => {
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
		window.location.reload();
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

	/**
	 * @param {number} index
	 */
	function isOldVersion(index) {
		if (index === 0) {
			return false;
		}
		const currentTask = tasks[index];
		const previousTask = tasks[index - 1];
		return previousTask.name === currentTask.name && previousTask.owner === currentTask.owner;
	}

	/**
	 * @param {number} index
	 */
	function isLastOldVersion(index) {
		if (!isOldVersion(index)) {
			return false;
		}
		if (index === tasks.length - 1) {
			return false;
		}
		const currentTask = tasks[index];
		const nextTask = tasks[index + 1];
		return nextTask.name !== currentTask.name || nextTask.owner !== currentTask.owner;
	}

	/**
	 * @param {number} index
	 */
	function isMainVersion(index) {
		if (isOldVersion(index)) {
			return false;
		}
		if (index === tasks.length - 1) {
			return false;
		}
		const currentTask = tasks[index];
		const nextTask = tasks[index + 1];
		return nextTask.name === currentTask.name && nextTask.owner === currentTask.owner;
	}

	/**
	 * @param {Event} event
	 */
	function handleToggleOldVersions(event) {
		const element = /** @type {HTMLElement} */ (event.target);
		/** @type {HTMLElement|null} */
		let row = /** @type {HTMLElement} */ (element.closest('tr'));
		if (!row.classList.contains('expanded')) {
			closeAllOldVersions(/** @type {HTMLElement} */ (row.closest('table')));
		}
		toggleOldVersions(row);
	}

	/**
	 * @param {HTMLElement} table
	 */
	function closeAllOldVersions(table) {
		const rows = table.querySelectorAll('tr');
		for (const row of rows) {
			if (row.classList.contains('expanded')) {
				toggleOldVersions(row);
			}
		}
	}

	/**
	 * @param {HTMLElement} mainRow
	 */
	function toggleOldVersions(mainRow) {
		mainRow.classList.toggle('expanded');
		/** @type {HTMLElement|null} */
		let row = mainRow;
		while ((row = /** @type {HTMLElement|null} */ (row?.nextSibling))) {
			if (row.classList.contains('old-version')) {
				row.classList.toggle('collapsed');
			} else {
				break;
			}
		}
	}
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center">
		<nav aria-label="breadcrumb">
			<ol class="breadcrumb">
				<li class="breadcrumb-item active" aria-current="page">Tasks</li>
			</ol>
		</nav>
	</div>

	<div class="mb-2" id="errorSection" />

	<p class="lead">Add tasks</p>

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
			<TaskCollection {packageType} />
		{:else}
			<AddSingleTask {addNewTask} />
		{/if}
	</div>

	<div class="row mt-4">
		<p class="lead">Task List</p>
		<div class="col-12">
			<table class="table caption-top align-middle">
				<caption class="text-bg-light border-top border-bottom pe-3 ps-3">
					<div class="d-flex align-items-center justify-content-between">
						<span class="fw-normal" />
						<div>
							<button class="btn btn-outline-primary" on:click={reloadTaskList}>
								<i class="bi bi-arrow-clockwise" />
							</button>
						</div>
					</div>
				</caption>
				<thead class="table-light">
					<tr>
						<th>Name</th>
						<th>Version</th>
						<th>Owner</th>
						<th>Options</th>
					</tr>
				</thead>
				<tbody>
					{#key tasks}
						{#each tasks as task, i}
							<tr
								class:old-version={isOldVersion(i)}
								class:last-old-version={isLastOldVersion(i)}
								class:is-main-version={isMainVersion(i)}
								class:collapsed={isOldVersion(i)}
							>
								<td class="col-3">{isOldVersion(i) ? '' : task.name}</td>
								<td class="col-1">
									{task.version || '–'}
									{#if isMainVersion(i)}
										<button class="btn btn-link" on:click={handleToggleOldVersions}>
											<i class="bi bi-plus-circle" />
										</button>
									{/if}
								</td>
								<td class="col-1">{task.owner || '–'}</td>
								<td class="col-2">
									<button
										class="btn btn-light"
										data-bs-toggle="modal"
										data-bs-target="#taskInfoModal"
										on:click={() => setTaskModal(task.id)}
									>
										<i class="bi bi-info-circle" />
										Info
									</button>
									<button
										class="btn btn-primary"
										data-bs-toggle="modal"
										data-bs-target="#taskEditModal"
										on:click={() => setTaskModal(task.id)}
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
							</tr>
						{/each}
					{/key}
				</tbody>
			</table>
		</div>
	</div>
</div>

<TaskInfoModal />
<TaskEditModal {updateEditedTask} />

<style>
	:global(.is-main-version.expanded td) {
		border-bottom-style: dashed;
	}

	.old-version.collapsed {
		display: none;
	}

	.old-version {
		display: table-row;
	}

	.old-version td {
		border-bottom-style: dashed;
	}

	.last-old-version td {
		border-bottom-style: solid;
	}
</style>
