<script>
	// import { page } from '$app/stores';
	import semver from 'semver';

	export let tasks = undefined;

	let selectedTypeOfTask = 'common';
	let selectionTasks = new Map();
	let selectionTasksNames = [];
	let selectedMapKey = undefined;


	function setSelectionTasks(group, tasks) {
		selectionTasks = new Map();
		selectedMapKey = undefined;

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
			selectionTasks.get(task.name).sort(sortTasksByDescendingVersion);
		});
		selectionTasksNames = Array.from(selectionTasks.keys());

	}

	function setSelectedGroup(group) {
		console.log(group);
		selectedTypeOfTask = group;
	}

	function handleSelectedTaskKey(event) {
		selectedMapKey = event.target.value;
	}

	function sortTasksByDescendingVersion(t1, t2) {
		const v1 = semver.coerce(t1.version);
		const v2 = semver.coerce(t2.version);
		return semver.rcompare(v1, v2);
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
        <div class='tab-content'>
          <div class='tab-pane show active' id='common-tasks-tab'>
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
            {#if selectedMapKey && selectedTypeOfTask === 'common'}
              <label for='taskId' class='form-label'>{selectedMapKey}</label>
              <select name='taskId' id='taskId' class='form-select'>
                {#each selectionTasks.get(selectedMapKey) as task}
                  <option value={task.id}>v{task.version}</option>
                {/each}
              </select>
            {/if}
          </div>
          <div class='tab-pane' id='user-tasks-tab'>
            <div class='d-flex flex-row align-items-center'>
              <label for='taskId' class='form-label m-0 flex-grow-1 me-2'>Select task</label>
              {#if selectedTypeOfTask }
                <select on:change={handleSelectedTaskKey} class='form-select w-75'>
                  <option selected>Select available task</option>
                  {#each selectionTasksNames as taskName}
                    <option value={taskName}>{taskName}</option>
                  {/each}
                </select>
              {/if}
            </div>
            <br>
            {#if selectedMapKey && selectedTypeOfTask === 'user'}
              <div class='d-flex flex-row align-items-center'>
                <span for='taskId' class='form-label flex-grow-1 m-0'>Select task version</span>
                <select name='taskId' id='taskId' style='width:auto' class='form-select'>
                  {#each selectionTasks.get(selectedMapKey) as task}
                    <option value={task.id}>v{task.version}</option>
                  {/each}
                </select>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

  </div>

{/if}