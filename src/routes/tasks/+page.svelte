<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities.js';
	import { collectTaskErrorStore } from '$lib/stores/errorStores';
	import { originalTaskStore, taskStore } from '$lib/stores/taskStores';
	import TaskEditModal from '$lib/components/tasks/TaskEditModal.svelte';
	import TaskInfoModal from '$lib/components/tasks/TaskInfoModal.svelte';
	import TaskCollection from '$lib/components/tasks/TaskCollection.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';

	// Error property to be set in order to show errors in UI
	let errorReasons = undefined;
	// Tasks property updated with respect to data store
	let tasks = $page.data.tasks;
	let taskCreateSuccess = false;

	// Store subscriptions
	collectTaskErrorStore.subscribe((error) => {
		if (error) setErrorReasons(error);
	});

	onMount(async () => {
	});

	// Sort tasks
	tasks = orderTasksByOwnerThenByNameThenByVersion(tasks);

	function setErrorReasons(value) {
		errorReasons = value;
		new StandardErrorAlert({
			target: document.getElementById('errorSection'),
			props: {
				error: errorReasons
			}
		});
	}

	function setTaskModal(event) {
		const taskId = event.currentTarget.getAttribute('data-fc-task');
		const task = tasks.find((t) => t.id == taskId);
		taskStore.set(task);
		originalTaskStore.set({ ...task });
	}

	// Updates the tasks list after a task is edited in the modal
	async function updateEditedTask(editedTask) {
		tasks = tasks.filter(t => {
			if (t.id === editedTask.id) {
				return editedTask;
			} else {
				return t;
			}
		});
	}

	async function reloadTaskList() {
		window.location.reload();
	}

	async function handleCreateTask({ form }) {
		return async ({ result }) => {
			if (result.type !== 'failure') {
				form.reset();
				// Add created task to the list
				const task = result.data.task;
				tasks = [...tasks, task];
				taskCreateSuccess = true;
				setTimeout(() => {
					taskCreateSuccess = false;
				}, 3000);
			} else {
				const error = result.data;
				console.error(error);
				setErrorReasons(error);
			}
		};
	}

	async function handleDeleteTask(taskId) {
		const response = await fetch('/tasks/' + taskId, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (response.ok) {
			console.log('Task deleted successfully');
			tasks = tasks.filter((t) => t.id !== taskId);
		} else {
			console.error('Error deleting the task');
			new StandardErrorAlert({
				target: document.getElementById('taskErrorAlert'),
				props: {
					error: await response.json()
				}
			});
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
					{#if taskCreateSuccess}
						<div class="alert alert-success" role="alert">Task created successfully</div>
					{/if}
					<form method="post" action="?/createTask" use:enhance={handleCreateTask}>
						<div class="row g-3">
							<div class="col-6">
								<div class="input-group">
									<div class="input-group-text">Task name</div>
									<input name="name" type="text" class="form-control" />
								</div>
							</div>
							<div class="col-12">
								<div class="input-group">
									<div class="input-group-text">Command</div>
									<input name="command" type="text" class="form-control" />
								</div>
							</div>
							<div class="col-6">
								<div class="input-group">
									<div class="input-group-text">Source</div>
									<input name="source" type="text" class="form-control" />
								</div>
							</div>
							<div class="col-6">
								<div class="input-group">
									<div class="input-group-text">Version</div>
									<input name="version" type="text" class="form-control" />
								</div>
							</div>
							<div class="row" />
							<div class="col-6">
								<div class="input-group">
									<div class="input-group-text">Input type</div>
									<input name="input_type" type="text" class="form-control" />
								</div>
							</div>
							<div class="col-6">
								<div class="input-group">
									<div class="input-group-text">Output type</div>
									<input name="output_type" type="text" class="form-control" />
								</div>
							</div>
							<div class="col-auto">
								<button type="submit" class="btn btn-primary">Create</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>

	<div class="row mt-4">
		<p class="lead">Task List</p>
		<div class="col-12">
			<span id="taskErrorAlert"></span>
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
							<td class="col-1">{task.version || "–"}</td>
							<td class='col-1'>{task.owner || "–"}</td>
							<td class="col-2">
								<button
									data-fc-task={task.id}
									class="btn btn-light"
									data-bs-toggle="modal"
									data-bs-target="#taskInfoModal"
									on:click={setTaskModal}
								>
									<i class="bi bi-info-circle" />
									Info
								</button>
								<button
									on:click={() => {}}
									data-fc-task={task.id}
									class="btn btn-primary"
									data-bs-toggle="modal"
									data-bs-target="#taskEditModal"
									on:click={setTaskModal}
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
<TaskEditModal updateEditedTask={updateEditedTask} />
