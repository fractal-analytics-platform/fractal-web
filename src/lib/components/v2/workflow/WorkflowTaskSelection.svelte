<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import SlimSelect from 'slim-select';
	import {
		greatestVersionDesc,
		orderTasksByOwnerThenByNameThenByVersion
	} from '$lib/common/component_utilities.js';

	/**
	 * @template {import('$lib/types').Task|import('$lib/types-v2').TaskV2} T
	 * @type {T[]}
	 */
	export let tasks;
	let loadingTasks = false;

	/**
	 * @param {boolean} loading
	 */
	export function setLoadingTasks(loading) {
		loadingTasks = loading;
	}

	/**
	 * @type {'common'|'user'}
	 */
	let selectedTypeOfTask = 'common';
	let selectionTasks = new Map();
	let selectedMapKey;
	let selectedMapTaskVersions = undefined;
	let selectionControl = undefined;
	/**
	 * @template {import('$lib/types').Task|import('$lib/types-v2').TaskV2} T
	 * @type {T[]}
	 */
	let filteredTasks = [];

	export function getSelectedTaskId() {
		const taskIdSelector = document.getElementById('taskId');
		console.log(taskIdSelector);
		if (taskIdSelector instanceof HTMLSelectElement) {
			return taskIdSelector.value;
		}
	}

	export function reset() {
		setSelectionTasks(selectedTypeOfTask, tasks);
	}

	onMount(() => {
		selectionControl = new SlimSelect({
			select: '#advanced-select',
			settings: {
				showSearch: true
			},
			events: {
				afterChange: (selection) => {
					const selectedOption = selection[0];
					if (!selectedOption.placeholder) {
						selectedMapKey = selectedOption.value;
						selectedMapTaskVersions = selectionTasks.get(selectedMapKey);
						if (selectedOption.data.owner !== undefined) {
							selectedMapTaskVersions = selectedMapTaskVersions.filter(
								(t) => t.owner === selectedOption.data.owner
							);
						}
						if (selectedOption.data.package !== undefined) {
							selectedMapTaskVersions = selectedMapTaskVersions.filter(
								(t) => t.package === selectedOption.data.package
							);
						}
						selectedMapTaskVersions.sort(greatestVersionDesc);
					}
				}
			}
		});
		setSelectionControlData();
	});

	/**
	 * @template {import('$lib/types').Task|import('$lib/types-v2').TaskV2} T
	 * @param {T[]} tasks
	 * @param {'common'|'user'} group
	 */
	function setSelectionTasks(group, tasks) {
		selectionTasks = new Map();
		selectedMapKey = null;
		selectedMapTaskVersions = undefined;

		filteredTasks = [];

		if (group === 'common') {
			// @ts-ignore
			filteredTasks = tasks.filter((task) => task.owner === null);
			filteredTasks.forEach((task) => {
				let taskPackage = task.source.split(':')[1];
				if (!selectionTasks.has(task.name)) {
					selectionTasks.set(task.name, [
						{
							id: task.id,
							version: task.version,
							source: task.source,
							package: taskPackage
						}
					]);
				} else {
					const taskVersions = selectionTasks.get(task.name);

					if (taskVersions.find((t) => t.version === task.version && t.package === taskPackage)) {
						// Set the version to null of previous tasks within taskVersions
						taskVersions.forEach((t) => {
							if (t.package === taskPackage) {
								t.version = null;
							}
						});

						taskVersions.push({
							id: task.id,
							version: null,
							source: task.source,
							package: taskPackage
						});
					} else {
						taskVersions.push({
							id: task.id,
							version: task.version,
							source: task.source,
							package: taskPackage
						});
					}
				}
			});
		}

		if (group === 'user') {
			// @ts-ignore
			filteredTasks = tasks.filter((task) => task.owner !== null);
			filteredTasks.forEach((task) => {
				if (!selectionTasks.has(task.name)) {
					selectionTasks.set(task.name, [
						{
							id: task.id,
							version: task.version,
							source: task.source,
							owner: task.owner
						}
					]);
				} else {
					const taskVersions = selectionTasks.get(task.name);

					if (taskVersions.find((t) => t.version === task.version && t.owner === task.owner)) {
						// Set the version to null of previous tasks within taskVersions
						taskVersions.forEach((t) => {
							if (t.owner === task.owner) {
								t.version = null;
							}
						});

						taskVersions.push({
							id: task.id,
							version: null,
							source: task.source,
							owner: task.owner
						});
					} else {
						taskVersions.push({
							id: task.id,
							version: task.version,
							source: task.source,
							owner: task.owner
						});
					}
				}
			});
		}
		setSelectionControlData();
	}

	function setSelectionControlData() {
		/**
		 * @typedef {{ text: string, value?: string, placeholder?: boolean, data?: object }} Option
		 * @typedef {{ label: string, options: Option[] }} NestedOptions
		 * @type {Array<Option | NestedOptions>}
		 */
		let optionsMap = [];

		if (selectedTypeOfTask === 'common') {
			// Group filtered tasks by source
			optionsMap = filteredTasks.reduce((dataOptions, task) => {
				const taskPackage = task.source.split(':')[1]; // Package name
				const sourceIndex = dataOptions.findIndex((d) => d.label === taskPackage);
				if (sourceIndex === -1) {
					dataOptions.push({
						label: taskPackage,
						options: [{ text: task.name, value: task.name, data: { package: taskPackage } }]
					});
				} else {
					// If task name already exists in options, don't add it again
					if (!dataOptions[sourceIndex].options.find((o) => o.text === task.name))
						dataOptions[sourceIndex].options.push({ text: task.name, value: task.name });
				}
				return dataOptions;
			}, /** @type {NestedOptions[]} */ ([]));
		}

		if (selectedTypeOfTask === 'user') {
			filteredTasks = orderTasksByOwnerThenByNameThenByVersion(
				filteredTasks,
				$page.data.userInfo.username
			);
			optionsMap = filteredTasks.reduce((dataOptions, task) => {
				const source = task.owner;
				const sourceIndex = dataOptions.findIndex((d) => d.label === source);
				if (sourceIndex === -1) {
					dataOptions.push({
						label: source,
						options: [{ text: task.name, value: task.name, data: { owner: task.owner } }]
					});
				} else {
					// If task name already exists in options, don't add it again
					if (!dataOptions[sourceIndex].options.find((o) => o.text === task.name))
						dataOptions[sourceIndex].options.push({
							text: task.name,
							value: task.name,
							data: { owner: task.owner }
						});
				}
				return dataOptions;
			}, /** @type {NestedOptions[]} */ ([]));
		}

		optionsMap = [{ text: 'Task selection', placeholder: true }, ...optionsMap];
		selectionControl?.setData(optionsMap);
	}

	/**
	 * @param {'common'|'user'} group
	 */
	function setSelectedGroup(group) {
		selectedTypeOfTask = group;
	}

	$: setSelectionTasks(selectedTypeOfTask, tasks);
</script>

{#if tasks}
	<div class="mb-3">
		<div class="card">
			<div class="card-header">
				<div class="nav nav-tabs card-header-tabs">
					<div class="nav-item">
						<button
							class="nav-link active"
							data-bs-target="#common-tasks-tab"
							data-bs-toggle="tab"
							on:click|preventDefault={() => setSelectedGroup('common')}
						>
							Common tasks
						</button>
					</div>
					<div class="nav-item">
						<button
							class="nav-link"
							data-bs-target="#user-tasks-tab"
							data-bs-toggle="tab"
							on:click|preventDefault={() => setSelectedGroup('user')}
						>
							User tasks
						</button>
					</div>
				</div>
			</div>
			<div class="card-body">
				<label for="taskId" class="form-label">
					Select task
					{#if loadingTasks}
						&nbsp;
						<span class="spinner-border spinner-border-sm" aria-hidden="true" />
					{/if}
				</label>
				{#if selectedTypeOfTask}
					<select id="advanced-select" />
				{/if}
				<br />
				{#if selectedMapKey && selectedMapTaskVersions}
					{#if selectedMapTaskVersions.length > 0}
						<label for="taskId" class="form-label">Select task version</label>
						<select name="taskId" id="taskId" class="form-select">
							{#each selectedMapTaskVersions as task}
								<option value={task.id}>{task.version ? 'v' + task.version : task.source}</option>
							{/each}
						</select>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
