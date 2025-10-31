<script>
	import { page } from '$app/state';
	import TaskCollection from '$lib/components/v2/tasks/TaskCollection.svelte';
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import AddSingleTask from '$lib/components/v2/tasks/AddSingleTask.svelte';
	import CustomEnvTask from '$lib/components/v2/tasks/CustomEnvTask.svelte';
	import TaskGroupsTable from '$lib/components/v2/tasks/TaskGroupsTable.svelte';
	import PixiTask from '$lib/components/v2/tasks/PixiTask.svelte';
	import TaskActivitiesTable from '$lib/components/v2/tasks/TaskActivitiesTable.svelte';

	const user = $derived(page.data.user);
	/** @type {string|null} */
	const defaultGroupName = $derived(page.data.defaultGroupName);

	/** @type {Array<[ string, Array<import('fractal-components/types/api').TaskGroupV2> ]>} */
	let taskGroups = $state(page.data.taskGroups || []);

	/** @type {'pypi'|'local'|'single'|'custom_env'|'pixi'} */
	let packageType = $state('pypi');

	/** @type {import('$lib/components/v2/tasks/TaskCollection.svelte').default|undefined} */
	let taskCollectionComponent = $state();

	/** @type {string|undefined} */
	let expandedTaskGroupRow = $state();

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
	 * @param {Array<[ string, Array<import('fractal-components/types/api').TaskGroupV2> ]>} updatedGroups
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
	<label class="btn btn-outline-secondary" for="local"> Local whl </label>

	<input
		class="btn-check"
		type="radio"
		name="pixi"
		id="pixi"
		value="pixi"
		bind:group={packageType}
	/>
	<label class="btn btn-outline-secondary" for="pixi"> Pixi </label>

	<input
		class="btn-check"
		type="radio"
		name="custom_env"
		id="custom_env"
		value="custom_env"
		bind:group={packageType}
	/>
	<label class="btn btn-outline-secondary" for="custom_env"> Custom Python env </label>

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
			<TaskCollection {packageType} bind:this={taskCollectionComponent} {user} {defaultGroupName} />
		{:else if packageType === 'single'}
			<AddSingleTask addNewTasks={reloadTaskGroupsList} {defaultGroupName} {user} />
		{:else if packageType === 'custom_env'}
			<CustomEnvTask addNewTasks={reloadTaskGroupsList} {defaultGroupName} {user} />
		{:else if packageType === 'pixi'}
			<PixiTask {user} {defaultGroupName} />
		{/if}
	</div>

	<TaskActivitiesTable {reloadTaskGroupsList} />

	<div class="row mt-4">
		<h3 class="fw-light">Task List</h3>
		<div class="col-12">
			{#key taskGroups}
				<TaskGroupsTable {taskGroups} {updateTaskGroups} {defaultGroupName} {user} bind:expandedTaskGroupRow />
			{/key}
		</div>
	</div>
</div>
