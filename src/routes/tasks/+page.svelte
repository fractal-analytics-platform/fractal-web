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

	// Store subscriptions
	collectTaskErrorStore.subscribe((error) => {
		if (error) setErrorReasons(error);
	});

	// Sort tasks
	tasks = orderTasksByOwnerThenByNameThenByVersion(tasks);

	function setErrorReasons(value) {
		errorReasons = value;
		displayStandardErrorAlert(errorReasons, 'errorSection');
	}

	/**
	 * @param {number} taskId
	 */
	function setTaskModal(taskId) {
		const task = /** @type {import('$lib/types').Task} */ (tasks.find((t) => t.id === taskId));
		taskStore.set(task);
		originalTaskStore.set({ ...task });
	}

	// Updates the tasks list after a task is edited in the modal
	async function updateEditedTask(editedTask) {
		tasks = tasks.filter((t) => {
			if (t.id === editedTask.id) {
				return editedTask;
			} else {
				return t;
			}
		});
	}

	/**
	 * @param {import('$lib/types').Task} task
	 */
	function addNewTask(task) {
		tasks = [...tasks, task];
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
</script>

<div class="d-flex justify-content-between align-items-center">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item active" aria-current="page">Tasks</li>
		</ol>
	</nav>
</div>

<div class="container">
	<div class="mb-3" id="errorSection" />
	<p class="lead">Add tasks</p>
	<div class="accordion">
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button
					class="accordion-button collapsed"
					data-bs-toggle="collapse"
					data-bs-target="#taskCollection"
				>
					Collect tasks from a package
				</button>
			</h2>
			<div id="taskCollection" class="accordion-collapse collapse">
				<div class="accordion-body">
					<TaskCollection />
				</div>
			</div>
		</div>
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button
					class="accordion-button collapsed"
					data-bs-toggle="collapse"
					data-bs-target="#addTask"
				>
					Add a single task
				</button>
			</h2>
			<div id="addTask" class="accordion-collapse collapse">
				<div class="accordion-body">
					<AddSingleTask {addNewTask} />
				</div>
			</div>
		</div>
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
					{#each tasks as task}
						<tr>
							<td class="col-3">{task.name}</td>
							<td class="col-1">{task.version || '–'}</td>
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
				</tbody>
			</table>
		</div>
	</div>
</div>

<TaskInfoModal />
<TaskEditModal {updateEditedTask} />
