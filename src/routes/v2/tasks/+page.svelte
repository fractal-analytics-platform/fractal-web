<script>
	import { page } from '$app/stores';
	import { orderTasksByGroupThenByNameThenByVersion } from '$lib/common/component_utilities.js';
	import TaskEditModal from '$lib/components/v2/tasks/TaskEditModal.svelte';
	import TaskInfoModal from '$lib/components/v2/tasks/TaskInfoModal.svelte';
	import TaskCollection from '$lib/components/v2/tasks/TaskCollection.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import AddSingleTask from '$lib/components/v2/tasks/AddSingleTask.svelte';
	import TasksTable from '$lib/components/tasks/TasksTable.svelte';
	import CustomEnvTask from '$lib/components/v2/tasks/CustomEnvTask.svelte';

	// Tasks property updated with respect to data store
	/** @type {import('$lib/types-v2').TaskV2[]} */
	let tasks = $page.data.tasks;

	/** @type {'pypi'|'local'|'single'|'custom_env'} */
	let packageType = 'pypi';

	/** @type {import('$lib/components/v2/tasks/TaskInfoModal.svelte').default} */
	let taskInfoModal;
	/** @type {import('$lib/components/v2/tasks/TaskEditModal.svelte').default} */
	let taskEditModal;
	/** @type {import('$lib/components/v2/tasks/TaskCollection.svelte').default} */
	let taskCollectionComponent;

	/**
	 * @param {import('$lib/types-v2').TaskV2[]} tasks
	 */
	function sortTasks(tasks) {
		return orderTasksByGroupThenByNameThenByVersion(tasks, 'desc');
	}

	/**
	 * Updates the tasks list after a task is edited in the modal
	 * @param {import('$lib/types-v2').TaskV2} editedTask
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
	 * @param {import('$lib/types-v2').TaskV2[]} newTasks
	 */
	function addNewTasks(newTasks) {
		const updatedTasks = [...tasks, ...newTasks];
		sortTasks(updatedTasks);
		tasks = updatedTasks;
	}

	async function reloadTaskList() {
		const response = await fetch(
			`/api/v2/task?args_schema_parallel=false&args_schema_non_parallel=false`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);
		const result = await response.json();
		if (response.ok) {
			sortTasks(result);
			tasks = result;
		} else {
			displayStandardErrorAlert(result, 'errorSection');
		}
	}

	/**
	 * Deletes a task from the server
	 * @param {number} taskId
	 * @returns {Promise<*>}
	 */
	async function handleDeleteTask(taskId) {
		const response = await fetch(`/api/v2/task/${taskId}`, {
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
		on:click={() => taskCollectionComponent?.clearForm()}
	/>
	<label class="btn btn-outline-secondary" for="pypi"> PyPI </label>

	<input
		class="btn-check"
		type="radio"
		name="local"
		id="local"
		value="local"
		bind:group={packageType}
		on:click={() => taskCollectionComponent?.clearForm()}
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

	<input
		class="btn-check"
		type="radio"
		name="custom_env"
		id="custom_env"
		value="custom_env"
		bind:group={packageType}
	/>
	<label class="btn btn-outline-secondary" for="custom_env"> Custom Python env </label>

	<div class="mt-3">
		{#if packageType === 'pypi' || packageType === 'local'}
			<TaskCollection
				{packageType}
				{reloadTaskList}
				bind:this={taskCollectionComponent}
				user={$page.data.user}
			/>
		{:else if packageType === 'single'}
			<AddSingleTask {addNewTasks} user={$page.data.user} />
		{:else if packageType === 'custom_env'}
			<CustomEnvTask {addNewTasks} user={$page.data.user} />
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
						<col width="350" />
					</colgroup>
					<thead class="table-light">
						<tr>
							<th>Name</th>
							<th>Version</th>
							<th>Options</th>
						</tr>
					</thead>
				</svelte:fragment>
				<svelte:fragment slot="custom-columns-right" let:task>
					<td>
						<button
							class="btn btn-light"
							data-bs-toggle="modal"
							data-bs-target="#taskInfoModal"
							on:click={() =>
								taskInfoModal.open(/** @type {import('$lib/types-v2').TaskV2} */ (task))}
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
