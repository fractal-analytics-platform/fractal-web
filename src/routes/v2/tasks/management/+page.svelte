<script>
	import { page } from '$app/state';
	import TaskCollection from '$lib/components/v2/tasks/TaskCollection.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import AddSingleTask from '$lib/components/v2/tasks/AddSingleTask.svelte';
	import CustomEnvTask from '$lib/components/v2/tasks/CustomEnvTask.svelte';
	import TaskGroupsTable from '$lib/components/v2/tasks/TaskGroupsTable.svelte';

	/** @type {import('fractal-components/types/api').TaskGroupV2[]} */
	let taskGroups = $state(page.data.taskGroups);

	/** @type {'pypi'|'local'|'single'|'custom_env'} */
	let packageType = $state('pypi');

	/** @type {import('$lib/components/v2/tasks/TaskCollection.svelte').default|undefined} */
	let taskCollectionComponent = $state();

	/** @type {string|undefined} */
	let expandedTaskGroupRow = $state(undefined);

	async function reloadTaskGroupsList() {
		const response = await fetch(`/api/v2/task-group?args_schema=false`, {
			method: 'GET',
			credentials: 'include'
		});
		const result = await response.json();
		if (response.ok) {
			taskGroups = result;
		} else {
			displayStandardErrorAlert(result, 'errorSection');
		}
	}

	/**
	 * @param {import('fractal-components/types/api').TaskGroupV2[]} updatedGroups
	 */
	function updateTaskGroups(updatedGroups) {
		taskGroups = updatedGroups;
	}
</script>

<div class="container mt-3">
	<div class="mb-2" id="errorSection"></div>

	<h3 class="fw-light">Add tasks</h3>

	<div class="form-check-inline">Package type:</div>

	<input
		class="btn-check"
		type="radio"
		name="pypi"
		id="pypi"
		value="pypi"
		bind:group={packageType}
		onclick={() => taskCollectionComponent?.clearForm()}
	/>
	<label class="btn btn-outline-secondary" for="pypi"> PyPI </label>

	<input
		class="btn-check"
		type="radio"
		name="local"
		id="local"
		value="local"
		bind:group={packageType}
		onclick={() => taskCollectionComponent?.clearForm()}
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
				{reloadTaskGroupsList}
				bind:this={taskCollectionComponent}
				user={page.data.user}
			/>
		{:else if packageType === 'single'}
			<AddSingleTask addNewTasks={reloadTaskGroupsList} user={page.data.user} />
		{:else if packageType === 'custom_env'}
			<CustomEnvTask addNewTasks={reloadTaskGroupsList} user={page.data.user} />
		{/if}
	</div>

	<div class="row mt-4">
		<h3 class="fw-light">Task List</h3>
		<div class="col-12">
			{#key taskGroups}
				<TaskGroupsTable
					{taskGroups}
					{updateTaskGroups}
					user={page.data.user}
					bind:expandedTaskGroupRow
				/>
			{/key}
		</div>
	</div>
</div>
