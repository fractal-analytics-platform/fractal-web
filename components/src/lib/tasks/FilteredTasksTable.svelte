<script>
	import { onMount } from 'svelte';
	import { buildWorkflowTaskTableRows } from '../tasks/task_group_utilities';
	import SlimSelect from 'slim-select';
	import ColouredBadge from '../common/ColouredBadge.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {Array<[ string, Array<import('../types/api').TaskGroupV2> ]>} taskGroups
	 * @property {boolean} [showAuthorsInSeparateColumn]
	 * @property {boolean} [showDocLinksInTable]
	 * @property {import('svelte').Snippet} [extraColumnsColgroup]
	 * @property {import('svelte').Snippet} [extraColumnsHeader]
	 * @property {import('svelte').Snippet<[import('../types/api').TasksTableRow]>} [extraColumns]
	 */

	/** @type {Props} */
	let {
		taskGroups,
		showAuthorsInSeparateColumn = true,
		showDocLinksInTable = false,
		extraColumnsColgroup,
		extraColumnsHeader,
		extraColumns
	} = $props();

	/** @type {import('../types/api').WorkflowTasksTableRowGroup[]} */
	let allRows = $state([]);
	/** @type {import('../types/api').WorkflowTasksTableRowGroup[]} */
	let filteredRows = $state([]);
	let groupBy = 'pkg_name';

	let genericSearch = $state('');
	/** @type {SlimSelect|undefined} */
	let categorySelector = undefined;
	let categoryFilter = $state('');
	/** @type {SlimSelect|undefined} */
	let modalitySelector = undefined;
	let modalityFilter = $state('');
	/** @type {SlimSelect|undefined} */
	let packageSelector = undefined;
	let packageFilter = $state('');
	/** @type {SlimSelect|undefined} */
	let tagSelector = undefined;
	let tagFilter = $state('');
	let inputTypeFilter = $state('');

	let groupByLabels = {
		pkg_name: 'Task'
	};

	/**
	 * Needed to prevent infinite loop in $effect
	 * @type {Array<[ string, Array<import('../types/api').TaskGroupV2> ]>|undefined}
	 */
	let storedTaskGroups = undefined;

	$effect(() => {
		if (storedTaskGroups !== taskGroups) {
			storedTaskGroups = taskGroups;
			setup();
		}
	});

	const selectedTasksCount = $derived(filteredRows.reduce((acc, row) => acc + row.tasks.length, 0));
	const tasksCount = $derived(allRows.reduce((acc, row) => acc + row.tasks.length, 0));

	$effect(() => {
		if (
			genericSearch ||
			categoryFilter ||
			modalityFilter ||
			packageFilter ||
			tagFilter ||
			inputTypeFilter
		) {
			filterRows();
		} else {
			filteredRows = allRows;
		}
	});

	function setup() {
		if (!taskGroups) {
			return;
		}
		genericSearch = '';
		setFiltersValues(taskGroups.map((tg) => tg[1]).flatMap((t) => t));
		allRows = buildWorkflowTaskTableRows(taskGroups);
		filterRows();
	}

	function filterRows() {
		filteredRows = allRows
			.map((row) => {
				const filteredTasks = row.tasks.filter((t) => filterRow(getSelectedTask(t)));
				return {
					...row,
					tasks: filteredTasks
				};
			})
			.filter((r) => r.tasks.length > 0);
	}

	/**
	 * @param {import('../types/api').TasksTableRow} row
	 */
	function filterRow(row) {
		return (
			genericSearchMatch(row) &&
			categoryMatch(row) &&
			modalityMatch(row) &&
			tagMatch(row) &&
			packageMatch(row) &&
			inputTypeMatch(row)
		);
	}

	/**
	 * @param {import('../types/api').TasksTableRow} row
	 * @returns {boolean}
	 */
	function genericSearchMatch(row) {
		if (!genericSearch) {
			return true;
		}
		const query = genericSearch.toLowerCase();
		return (
			row.task_name.toLowerCase().includes(query) ||
			row.pkg_name.toLowerCase().includes(query) ||
			(row.category && row.category.toLowerCase().includes(query)) ||
			(row.modality && row.modality.toLowerCase().includes(query)) ||
			(row.authors && row.authors.toLowerCase().includes(query)) ||
			Object.keys(row.input_types).find((k) => k.toLowerCase().includes(query)) !== undefined ||
			row.tags.find((t) => t.toLowerCase().includes(query)) !== undefined
		);
	}

	/**
	 * @param {import('../types/api').TasksTableRow} row
	 * @returns {boolean}
	 */
	function categoryMatch(row) {
		if (!categoryFilter) {
			return true;
		}
		return row.category !== null && row.category === categoryFilter;
	}

	/**
	 * @param {import('../types/api').TasksTableRow} row
	 * @returns {boolean}
	 */
	function modalityMatch(row) {
		if (!modalityFilter) {
			return true;
		}
		return row.modality !== null && row.modality === modalityFilter;
	}

	/**
	 * @param {import('../types/api').TasksTableRow} row
	 * @returns {boolean}
	 */
	function packageMatch(row) {
		if (!packageFilter) {
			return true;
		}
		return row.pkg_name === packageFilter;
	}

	/**
	 * @param {import('../types/api').TasksTableRow} row
	 * @returns {boolean}
	 */
	function tagMatch(row) {
		if (!tagFilter) {
			return true;
		}
		return row.tags.find((t) => t === tagFilter) !== undefined;
	}

	/**
	 * @param {import('../types/api').TasksTableRow} row
	 * @returns {boolean}
	 */
	function inputTypeMatch(row) {
		if (!inputTypeFilter) {
			return true;
		}
		return Object.keys(row.input_types).find((t) => t === inputTypeFilter) !== undefined;
	}

	function resetFilters() {
		genericSearch = '';
		categoryFilter = '';
		categorySelector?.setSelected('');
		modalitySelector?.setSelected('');
		packageSelector?.setSelected('');
		tagSelector?.setSelected('');
	}

	/**
	 * @param {import('../types/api').TaskGroupV2[]} taskGroups
	 */
	function setFiltersValues(taskGroups) {
		setSelectorData(
			categorySelector,
			buildSlimSelectOptions(extractSlimSelectTaskValues(taskGroups, (t) => t.category)),
			'Category'
		);
		setSelectorData(
			modalitySelector,
			buildSlimSelectOptions(extractSlimSelectTaskValues(taskGroups, (t) => t.modality)),
			'Modality'
		);
		setSelectorData(
			packageSelector,
			buildSlimSelectOptions([...new Set(taskGroups.map((tg) => tg.pkg_name))]),
			'Package'
		);
		setSelectorData(
			tagSelector,
			buildSlimSelectOptions([
				...new Set(
					taskGroups
						.flatMap((tg) => tg.task_list)
						.flatMap((t) => t.tags)
						.filter((v) => v !== null)
				)
			]),
			'Tag'
		);
	}

	/**
	 * @param {SlimSelect|undefined} selector
	 * @param {Array<{ text: string, value: string }>} options
	 * @param {string} placeholder
	 */
	function setSelectorData(selector, options, placeholder) {
		selector?.setData([{ text: placeholder, placeholder: true }, ...options]);
	}

	/**
	 * @param {Array<import('../types/api').TaskGroupV2>} taskGroups
	 * @param {(task: import('../types/api').TaskV2) => string | null} mapper
	 * @returns {string[]}
	 */
	function extractSlimSelectTaskValues(taskGroups, mapper) {
		return [
			...new Set(
				taskGroups
					.flatMap((tg) => tg.task_list)
					.map(mapper)
					.filter((v) => v !== null)
			)
		];
	}

	/**
	 * @param {string[]} values
	 */
	function buildSlimSelectOptions(values) {
		return values.map((v) => ({ text: v, value: v }));
	}

	/**
	 * @param {import('../types/api').TasksTableRow} taskProperties
	 */
	function getMetadataCell(taskProperties) {
		const values = [];
		// authors, tags
		values.push(...taskProperties.tags);
		if (taskProperties.authors && !showAuthorsInSeparateColumn) {
			values.push(taskProperties.authors);
		}
		return values.join(', ');
	}

	onMount(() => {
		categorySelector = setSlimSelect('category-filter', 'Select category', 'Category', (value) => {
			categoryFilter = value;
		});
		modalitySelector = setSlimSelect('modality-filter', 'Select modality', 'Modality', (value) => {
			modalityFilter = value;
		});
		packageSelector = setSlimSelect('package-filter', 'Select package', 'Package', (value) => {
			packageFilter = value;
		});
		tagSelector = setSlimSelect('tag-filter', 'Select tag', 'Tag', (value) => {
			tagFilter = value;
		});
		setup();
	});

	/**
	 * @param {string} elementId
	 * @param {string} ariaLabel
	 * @param {string} placeholder
	 * @param {(value: string) => void} afterChange
	 */
	function setSlimSelect(elementId, ariaLabel, placeholder, afterChange) {
		const selectElement = document.getElementById(elementId);
		selectElement?.classList.remove('invisible');
		return new SlimSelect({
			select: `#${elementId}`,
			settings: {
				maxValuesShown: 5,
				showSearch: true,
				allowDeselect: true,
				ariaLabel
			},
			events: {
				afterChange: (selection) => {
					if (selection.length === 0 || selection[0].value === placeholder) {
						afterChange('');
					} else {
						afterChange(selection[0].value);
					}
				}
			}
		});
	}

	/**
	 * @param {{ selectedVersion: string, taskVersions: Array<import('../types/api').TasksTableRow> }} taskRow
	 * @returns {import('../types/api').TasksTableRow}
	 */
	function getSelectedTask(taskRow) {
		return /** @type {import('../types/api').TasksTableRow} */ (
			taskRow.taskVersions.find((t) => t.version === taskRow.selectedVersion)
		);
	}
</script>

<div class="card mb-2" class:invisible={allRows.length === 0} class:collapse={allRows.length === 0}>
	<div class="card-body">
		<div class="row mb-2">
			<div class="col-3 col-lg-6">Filter tasks</div>
			<div class="col-9 col-lg-6">
				<div class="d-flex">
					<div class="flex-fill">
						<div class="input-group input-group-sm">
							<input
								type="text"
								id="taskGenericSearchInput"
								bind:value={genericSearch}
								class="form-control ms-auto"
								placeholder="Search..."
							/>
						</div>
					</div>
					<div>
						<button class="btn btn-outline-secondary btn-sm ms-3" onclick={resetFilters}>
							Reset
						</button>
					</div>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col">
				<select id="package-filter" class="invisible"></select>
			</div>
			<div class="col">
				<select id="category-filter" class="invisible"></select>
			</div>
			<div class="col">
				<select id="modality-filter" class="invisible"></select>
			</div>
			<div class="col">
				<select id="tag-filter" class="invisible"></select>
			</div>
		</div>
	</div>
</div>
{#if allRows.length === 0}
	<p class="mt-4">
		There are no available tasks. You can add new tasks on the
		<a href="/v2/tasks/management">Tasks management</a> page.
	</p>
{:else}
	<div class="card">
		<div class="card-body p-0">
			<table class="table table-borderless" id="filtered-tasks-table">
				<colgroup>
					<col />
					<col />
					<col />
					<col />
					{#if showAuthorsInSeparateColumn}
						<col />
					{/if}
					<col width="120" />
					{@render extraColumnsColgroup?.()}
				</colgroup>
				<thead>
					<tr>
						<th>{groupByLabels[groupBy]}</th>
						<th>Category</th>
						<th>Modality</th>
						<th>Metadata</th>
						{#if showAuthorsInSeparateColumn}
							<th>Author</th>
						{/if}
						<th>Version</th>
						{@render extraColumnsHeader?.()}
					</tr>
				</thead>
				<tbody>
					{#each filteredRows as row, index (index)}
						<tr class="border-top">
							<th colspan="3">{row.pkg_name}</th>
						</tr>
						{#each row.tasks.map((tr) => getSelectedTask(tr)) as task, index (index)}
							{#if task}
								<tr>
									<td class="task-name-col">
										{#if showDocLinksInTable && task.docs_link}
											<a href={task.docs_link} target="_blank">
												{task.task_name}
											</a>
										{:else}
											{task.task_name}
										{/if}
									</td>
									<td>
										{#if task.category}
											<button
												onclick={() =>
													categorySelector?.setSelected(/** @type {string} */ (task.category))}
												class="btn btn-link p-0"
											>
												<ColouredBadge value={task.category} />
											</button>
										{/if}
									</td>
									<td>
										{#if task.modality}
											<button
												onclick={() =>
													modalitySelector?.setSelected(/** @type {string} */ (task.modality))}
												class="btn btn-link p-0"
											>
												<ColouredBadge value={task.modality} />
											</button>
										{/if}
									</td>
									<td class="metadata-col">
										{getMetadataCell(task)}
									</td>
									{#if showAuthorsInSeparateColumn}
										<td class="author-col">
											{task.authors || '-'}
										</td>
									{/if}
									<td class="version-col">
										{#if row.tasks[index].taskVersions.length > 1}
											<select
												class="form-select"
												aria-label="Version for task {task.task_name}"
												bind:value={row.tasks[index].selectedVersion}
											>
												{#each row.tasks[index].taskVersions.map((t) => t.version) as version (version)}
													<option value={version}>{version || 'None'}</option>
												{/each}
											</select>
										{:else}
											{task.version}
										{/if}
									</td>
									{@render extraColumns?.(task)}
								</tr>
							{/if}
						{/each}
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	<p class="mt-3 text-center mb-0">
		Showing {selectedTasksCount} of {tasksCount}
		{tasksCount === 1 ? 'task' : 'tasks'}
	</p>
{/if}

<style>
	:global(#filtered-tasks-table td) {
		vertical-align: middle;
	}
	#filtered-tasks-table tr th:first-child,
	#filtered-tasks-table tr td:first-child {
		padding-left: 15px;
	}
	:global(#filtered-tasks-table tr th) {
		padding-top: 18px;
		padding-bottom: 12px;
		background: transparent;
	}
	.metadata-col,
	.author-col {
		font-size: 85%;
		max-width: 150px;
	}

	.task-name-col {
		max-width: 180px;
	}

	.version-col {
		max-width: 90px;
	}
</style>
