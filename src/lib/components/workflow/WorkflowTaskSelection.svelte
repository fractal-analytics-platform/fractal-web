<script>
	// import { page } from '$app/stores';
	import { greatestVersionDesc } from '$lib/common/component_utilities.js';

	export let tasks = undefined;

	let selectedTypeOfTask = 'common';
	let selectionTasks = new Map();
	let selectionTasksNames = [];
	let selectedMapKey;
	let selectedMapTaskVersions = undefined;


	function setSelectionTasks(group, tasks) {
		selectionTasks = new Map();
		selectionTasksNames = [];
		selectedMapKey = null;
		selectedMapTaskVersions = undefined;

		let filteredTasks = [];

		if (group === 'common') {
			filteredTasks = tasks.filter(task => task.owner === null); // .filter((task, index, self) => self.findIndex(t => t.name === task.name) === index);
		}

		if (group === 'user') {
			filteredTasks = tasks.filter(task => task.owner !== null);
		}

		filteredTasks.forEach(task => {
			if (!selectionTasks.has(task.name)) {
				selectionTasks.set(task.name, [{ id: task.id, version: task.version }]);
			} else {
				selectionTasks.get(task.name).push({ id: task.id, version: task.version });
			}
		});
		selectionTasksNames = Array.from(selectionTasks.keys());

	}

	function setSelectedGroup(group) {
		console.log(group);
		selectedTypeOfTask = group;
	}

	function handleSelectedTaskKey(event) {
		selectedMapKey = event.target.value;
		selectedMapTaskVersions = selectionTasks.get(selectedMapKey);
		selectedMapTaskVersions.sort(greatestVersionDesc);
	}

	$: setSelectionTasks(selectedTypeOfTask, tasks);

</script>

{#if tasks}

  <div class='mb-3'>

    <div class='card'>
      <div class='card-header'>
        <div class='nav nav-tabs card-header-tabs'>
          <div class='nav-item'>
            <a class='nav-link active' href='#' data-bs-target='#common-tasks-tab' data-bs-toggle='tab'
               on:click|preventDefault={setSelectedGroup.bind(this, 'common')}>Common tasks</a>
          </div>
          <div class='nav-item'>
            <a class='nav-link' href='#' data-bs-target='#user-tasks-tab' data-bs-toggle='tab'
               on:click|preventDefault={setSelectedGroup.bind(this, 'user')}>User tasks</a>
          </div>
        </div>
      </div>
      <div class='card-body'>
        <label for='taskId' class='form-label'>Select task</label>
        {#if selectedTypeOfTask }
          <select on:change={handleSelectedTaskKey} class='form-select' bind:value={selectedMapKey}>
            <option selected value={null}>Select available task</option>
            {#each selectionTasksNames as taskName}
              <option value={taskName}>{taskName}</option>
            {/each}
          </select>
        {/if}
        <br>
        {#if selectedMapKey && selectedMapTaskVersions }
          {#if selectedMapTaskVersions.length > 0}
            <label for='taskId' class='form-label'>Select task version</label>
            <select name='taskId' id='taskId' class='form-select'>
              {#each selectionTasks.get(selectedMapKey) as task}
                <option value={task.id}>{task.version ? 'v' + task.version : 'Not specified'}</option>
              {/each}
            </select>
          {/if}
        {/if}
      </div>
    </div>

  </div>

{/if}