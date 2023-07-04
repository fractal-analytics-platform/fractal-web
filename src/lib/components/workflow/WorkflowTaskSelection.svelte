<script>
	// import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import SlimSelect from 'slim-select';
	import { greatestVersionDesc } from '$lib/common/component_utilities.js';

	export let tasks = undefined;

	let selectedTypeOfTask = 'common';
	let selectionTasks = new Map();
	let selectionTasksNames = [];
	let selectedMapKey;
	let selectedMapTaskVersions = undefined;
	let selectionControl = undefined;
	let filteredTasks = [];


	onMount(() => {
		selectionControl = new SlimSelect({
			select: '#advanced-select',
			events: {
				afterChange: (selection) => {
					const selectedOption = selection[0];
					if (!selectedOption.placeholder) {
						selectedMapKey = selectedOption.value;
						selectedMapTaskVersions = selectionTasks.get(selectedMapKey);
						selectedMapTaskVersions.sort(greatestVersionDesc);
					}
				}
			}
		});
	});

	function setSelectionTasks(group, tasks) {
		selectionTasks = new Map();
		selectionTasksNames = [];
		selectedMapKey = null;
		selectedMapTaskVersions = undefined;

		filteredTasks = [];

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

		setSelectionControlData();
	}

	function setSelectionControlData() {
		let optionsMap = [];

		if (selectedTypeOfTask === 'common') {
			// Group filtered tasks by source
			optionsMap = filteredTasks.reduce((dataOptions, task) => {
				const source = task.source.split(':')[1]; // Package name
				const sourceIndex = dataOptions.findIndex(d => d.label === source);
				if (sourceIndex === -1) {
					dataOptions.push({ label: source, options: [{ text: task.name, value: task.name }] });
				} else {
					// If task name already exists in options, don't add it again
					if (!dataOptions[sourceIndex].options.find(o => o.text === task.name))
						dataOptions[sourceIndex].options.push({ text: task.name, value: task.name });
				}
				return dataOptions;
			}, []);
		}

		if (selectedTypeOfTask === 'user') {
			optionsMap = filteredTasks.reduce((dataOptions, task) => {
				const source = task.owner;
				const sourceIndex = dataOptions.findIndex(d => d.label === source);
				if (sourceIndex === -1) {
					dataOptions.push({ label: source, options: [{ text: task.name, value: task.name }] });
				} else {
					// If task name already exists in options, don't add it again
					if (!dataOptions[sourceIndex].options.find(o => o.text === task.name))
						dataOptions[sourceIndex].options.push({ text: task.name, value: task.name });
				}
				return dataOptions;
			}, []);
		}

		optionsMap = [{ text: 'Task selection', placeholder: true }, ...optionsMap];
		selectionControl?.setData(optionsMap);
	}

	function setSelectedGroup(group) {
		selectedTypeOfTask = group;
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
          <select id='advanced-select' class='' bind:value={selectedMapKey}>
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