<script>
	import { onMount } from 'svelte';
	import { buildTaskTableRows } from 'fractal-components/tasks/task_group_utilities';
	import TaskInfoModal from './TaskInfoModal.svelte';
	import TaskEditModal from './TaskEditModal.svelte';
	import TaskGroupInfoModal from './TaskGroupInfoModal.svelte';
	import TaskGroupEditModal from '$lib/components/v2/tasks/TaskGroupEditModal.svelte';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import TaskGroupManageModal from '$lib/components/v2/tasks/TaskGroupManageModal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').User} user
	 * @property {Array<[ string, Array<import('fractal-components/types/api').TaskGroupSlim> ]>} taskGroups
	 * @property {string|undefined} expandedTaskGroupRow
	 * @property {(updatedGroups: Array<[ string, Array<import('fractal-components/types/api').TaskGroupSlim> ]>) => void} updateTaskGroups
	 * @property {string|null} defaultGroupName
	 */

	/** @type {Props} */
	let {
		user,
		taskGroups,
		expandedTaskGroupRow = $bindable(),
		updateTaskGroups,
		defaultGroupName
	} = $props();

	/** @type {import('$lib/components/v2/tasks/TaskGroupInfoModal.svelte').default|undefined} */
	let taskGroupInfoModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskGroupEditModal.svelte').default|undefined} */
	let taskGroupEditModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskGroupManageModal.svelte').default|undefined} */
	let taskGroupManageModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskInfoModal.svelte').default|undefined} */
	let taskInfoModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskEditModal.svelte').default|undefined} */
	let taskEditModal = $state();

	/**
	 * @type {import('fractal-components/types/api').TasksTableRowGroup[]}
	 */
	let taskGroupRows = $state([]);

	onMount(() => {
		buildRows();
	});

	function buildRows() {
		taskGroupRows = buildTaskTableRows(taskGroups);
	}

	/**
	 * @param {number} index
	 */
	function handleToggleTasks(index) {
		const rowToToggle = taskGroupRows[index].pkg_name;
		if (expandedTaskGroupRow === rowToToggle) {
			expandedTaskGroupRow = undefined;
		} else {
			expandedTaskGroupRow = rowToToggle;
		}
	}

	/**
	 * @param {number} index
	 */
	function handleSwitchVersion(index) {
		const version = taskGroupRows[index].selectedVersion;
		taskGroupRows = taskGroupRows.map((r, i) => {
			if (i === index) {
				return {
					...r,
					selectedVersion: version
				};
			} else {
				return r;
			}
		});
	}

	/**
	 * @param {import('fractal-components/types/api').TaskGroupSlim} updatedGroup
	 */
	function updateEditedTaskGroup(updatedGroup) {
		updateTaskGroups(
			taskGroups.map((row) =>
				row[0] === updatedGroup.pkg_name
					? [row[0], row[1].map((tg) => (tg.id === updatedGroup.id ? updatedGroup : tg))]
					: row
			)
		);
	}

	/**
	 * @param {import('fractal-components/types/api').TaskSlim} editedTask
	 */
	function updateEditedTask(editedTask) {
		updateTaskGroups(
			taskGroups.map((row) => [
				row[0],
				row[1].map((g) => ({
					...g,
					task_list: g.task_list.map((t) => (t.id === editedTask.id ? editedTask : t))
				}))
			])
		);
	}

	/**
	 * @param {import('fractal-components/types/api').TaskGroupSlim} taskGroup
	 */
	function getGroupName(taskGroup) {
		const group = user.group_ids_names?.find((i) => i[0] === taskGroup?.user_group_id);
		if (group) {
			return group[1];
		}
		return '-';
	}

	/**
	 * @param {import('fractal-components/types/api').TasksTableRowGroup} taskGroupRow
	 * @returns {import('fractal-components/types/api').TaskGroupSlim | undefined}
	 */
	function getSelectedGroup(taskGroupRow) {
		return taskGroupRow.groups.find((g) => g.version === taskGroupRow.selectedVersion);
	}
</script>

<table class="table align-middle">
	<colgroup>
		<col style="width: 25%" />
		<col style="width: 22%" />
		<col style="width: 8%" />
		<col style="width: 10%" />
		<col style="width: 12%" />
		<col style="width: 10%" />
		<col style="width: auto" />
	</colgroup>
	<thead class="table-light">
		<tr>
			<th>Package</th>
			<th>Owner</th>
			<th>Active</th>
			<th>Group</th>
			<th>Version</th>
			<th>Tasks</th>
			<th>Options</th>
		</tr>
	</thead>
	<tbody>
		{#each taskGroupRows.map((r) => getSelectedGroup(r)) as selectedGroup, i (i)}
			{#if selectedGroup}
				<tr>
					<td>{selectedGroup.pkg_name}</td>
					<td>{selectedGroup.user_email}</td>
					<td>
						<BooleanIcon value={selectedGroup.active} />
					</td>
					<td>
						{getGroupName(selectedGroup)}
					</td>
					<td>
						{#if Object.keys(taskGroupRows[i].groups).length > 1}
							<select
								class="form-select"
								aria-label="Version for {selectedGroup.pkg_name}"
								bind:value={taskGroupRows[i].selectedVersion}
								onchange={() => handleSwitchVersion(i)}
							>
								{#each taskGroupRows[i].groups.map((tg) => tg.version) as version, index (index)}
									<option value={version}>{version || 'None'}</option>
								{/each}
							</select>
						{:else}
							{selectedGroup.version || '-'}
						{/if}
					</td>
					<td>
						{selectedGroup.task_list.length}
						<button
							class="btn btn-link"
							onclick={() => handleToggleTasks(i)}
							aria-label={expandedTaskGroupRow === selectedGroup.pkg_name
								? 'Collapse tasks'
								: 'Expand tasks'}
						>
							{#if expandedTaskGroupRow === selectedGroup.pkg_name}
								<i class="bi bi-chevron-up"></i>
							{:else}
								<i class="bi bi-chevron-down"></i>
							{/if}
						</button>
					</td>
					<td>
						<button
							class="btn btn-light"
							aria-label="Info"
							title="Info"
							onclick={() => taskGroupInfoModal?.open(selectedGroup)}
						>
							<i class="bi bi-info-circle"></i>
						</button>
						<button
							class="btn btn-primary"
							aria-label="Edit"
							title="Edit"
							onclick={() => taskGroupEditModal?.open(selectedGroup)}
						>
							<i class="bi bi-pencil"></i>
						</button>
						<button
							class="btn btn-info"
							aria-label="Manage"
							title="Manage"
							onclick={() => taskGroupManageModal?.open(selectedGroup)}
						>
							<i class="bi bi-gear"></i>
						</button>
					</td>
				</tr>

				{#each selectedGroup.task_list as task (task.id)}
					{#if task}
						<tr class:collapsed={selectedGroup.pkg_name !== expandedTaskGroupRow} class="task-row">
							<td colspan="6" class="text-end">
								<span class="pe-4">{task.name}</span>
							</td>
							<td>
								<button
									class="btn btn-light"
									aria-label="Info"
									title="Info"
									onclick={() => {
										taskInfoModal?.open(task.id, selectedGroup.version || '');
									}}
								>
									<i class="bi bi-info-circle"></i>
								</button>
								{#if selectedGroup.origin === 'other'}
									<button
										class="btn btn-primary"
										aria-label="Edit"
										title="Edit"
										onclick={() => {
											taskEditModal?.open(task.id);
										}}
									>
										<i class="bi bi-pencil"></i>
									</button>
								{/if}
							</td>
						</tr>
					{/if}
				{/each}
			{/if}
		{/each}
	</tbody>
</table>

<TaskGroupInfoModal bind:this={taskGroupInfoModal} {user} />
<TaskGroupEditModal
	bind:this={taskGroupEditModal}
	{updateEditedTaskGroup}
	{defaultGroupName}
	groupIdsNames={user.group_ids_names || []}
/>
<TaskGroupManageModal bind:this={taskGroupManageModal} admin={false} />
<TaskInfoModal bind:this={taskInfoModal} />
<TaskEditModal bind:this={taskEditModal} {updateEditedTask} />

<style>
	:global(tr.expanded td, tr.task-row td) {
		border-bottom-style: dashed;
	}

	:global(tr.collapsed) {
		display: none;
	}

	:global(.old-version) {
		display: table-row;
	}

	:global(tr td) {
		border-bottom-style: dashed;
	}

	:global(tr td) {
		border-bottom-style: solid;
	}
</style>
