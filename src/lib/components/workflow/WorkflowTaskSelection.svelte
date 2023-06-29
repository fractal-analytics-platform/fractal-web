<script>
	import semver from 'semver';

	export let tasks = undefined;

	let selectedTypeOfTask = 'common';
	let selectionTasks = new Map();
	let selectionTasksNames = [];
	let selectedMapKey = undefined;

	function setSelectionTasks() {

		if (selectedTypeOfTask === 'common') {
			const commonTasks = tasks.filter(task => task.owner === null); // .filter((task, index, self) => self.findIndex(t => t.name === task.name) === index);
			commonTasks.forEach(task => {
				if (!selectionTasks.has(task.name)) {
					selectionTasks.set(task.name, [{ id: task.id, version: task.version }]);
				} else {
					selectionTasks.get(task.name).push({ id: task.id, version: task.version });
				}
				selectionTasks.get(task.name).sort(sortTasksByDescendingVersion);
			});
			selectionTasksNames = Array.from(selectionTasks.keys());
		}

	}

	function handleGroupSelection(event) {
		selectedTypeOfTask = event.target.value;
	}

	function handleSelectedTaskKey(event) {
		selectedMapKey = event.target.value;
	}

	function sortTasksByDescendingVersion(t1, t2) {
		const v1 = semver.coerce(t1.version);
		const v2 = semver.coerce(t2.version);
		return semver.rcompare(v1, v2);
	}

	$: setSelectionTasks(tasks);

</script>

{#if tasks}

  <div class='mb-3'>
    <label class='form-label'>Select task group</label>
    <select on:change={handleGroupSelection} bind:value={selectedTypeOfTask} class='form-select'>
      <option value='user'>User tasks</option>
      <option value='common'>Common</option>
    </select>
    <br>
    <label for='taskId' class='form-label'>Select task</label>
    {#if selectedTypeOfTask }
      <select on:change={handleSelectedTaskKey} class='form-select'>
        <option selected>Select available task</option>
        {#each selectionTasksNames as taskName}
          <option value={taskName}>{taskName}</option>
        {/each}
      </select>
    {/if}
    <br>
    {#if selectedMapKey }
      <label for='taskId' class='form-label'>{selectedMapKey}</label>
      <select name='taskId' id='taskId' class='form-select'>
        {#each selectionTasks.get(selectedMapKey) as task}
          <option value={task.id}>v{task.version}</option>
        {/each}
      </select>
    {/if}
  </div>

{/if}