<script>
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { onMount } from 'svelte';
	import { buildTaskTableRows, sortVersions } from 'fractal-components/tasks/task_group_utilities';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import TaskInfoModal from './TaskInfoModal.svelte';
	import TaskEditModal from './TaskEditModal.svelte';
	import TaskGroupInfoModal from './TaskGroupInfoModal.svelte';
	import TaskGroupEditModal from '$lib/components/v2/tasks/TaskGroupEditModal.svelte';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import TaskGroupManageModal from '$lib/components/v2/tasks/TaskGroupManageModal.svelte';

	
	
	
	
	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').User} user
	 * @property {import('fractal-components/types/api').TaskGroupV2[]} taskGroups
	 * @property {string|undefined} expandedTaskGroupRow
	 * @property {(updatedGroups: import('fractal-components/types/api').TaskGroupV2[]) => void} updateTaskGroups
	 */

	/** @type {Props} */
	let {
		user,
		taskGroups,
		expandedTaskGroupRow = $bindable(),
		updateTaskGroups
	} = $props();

	/** @type {import('$lib/components/v2/tasks/TaskGroupInfoModal.svelte').default} */
	let taskGroupInfoModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskGroupEditModal.svelte').default} */
	let taskGroupEditModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskGroupManageModal.svelte').default} */
	let taskGroupManageModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskInfoModal.svelte').default} */
	let taskInfoModal = $state();
	/** @type {import('$lib/components/v2/tasks/TaskEditModal.svelte').default} */
	let taskEditModal = $state();

	/**
	 * @type {import('fractal-components/types/api').TasksTableRowGroup[]}
	 */
	let taskGroupRows = $state([]);

	onMount(() => {
		buildRows();
	});

	function buildRows() {
		taskGroupRows = buildTaskTableRows(taskGroups, 'pkg_name');
	}

	/**
	 * @param {number} index
	 */
	function handleToggleTasks(index) {
		const rowToToggle = taskGroupRows[index].groupTitle;
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
	 * @param {number} groupId
	 */
	async function handleDeleteTaskGroup(groupId) {
		const response = await fetch(`/api/v2/task-group/${groupId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (response.ok) {
			console.log('Task group deleted successfully');
			updateTaskGroups(taskGroups.filter((g) => g.id !== groupId));
		} else {
			console.error('Error deleting the task group');
			throw await getAlertErrorFromResponse(response);
		}
	}

	/**
	 * @param {import('fractal-components/types/api').TaskGroupV2} updatedGroup
	 */
	function updateEditedTaskGroup(updatedGroup) {
		updateTaskGroups(taskGroups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
	}

	/**
	 * @param {import('fractal-components/types/api').TaskV2} editedTask
	 */
	function updateEditedTask(editedTask) {
		updateTaskGroups(
			taskGroups.map((g) => ({
				...g,
				task_list: g.task_list.map((t) => (t.id === editedTask.id ? editedTask : t))
			}))
		);
	}

	/**
	 * @param {import('fractal-components/types/api').TaskGroupV2} taskGroup
	 */
	function getGroupName(taskGroup) {
		const group = user.group_ids_names?.find((i) => i[0] === taskGroup?.user_group_id);
		if (group) {
			return group[1];
		}
		return '-';
	}
</script>

<table class="table align-middle">
	<colgroup>
		<col width="auto" />
		<col width="90" />
		<col width="100" />
		<col width="120" />
		<col width="100" />
		<col width="400" />
	</colgroup>
	<thead class="table-light">
		<tr>
			<th>Package</th>
			<th>Active</th>
			<th>Group</th>
			<th>Version</th>
			<th>Tasks</th>
			<th>Options</th>
		</tr>
	</thead>
	<tbody>
		{#each taskGroupRows as taskGroupRow, i}
			<tr>
				<td>{taskGroupRow.groupTitle}</td>
				<td>
					<BooleanIcon value={taskGroupRow.groups[taskGroupRow.selectedVersion].active} />
				</td>
				<td>
					{getGroupName(taskGroupRow.groups[taskGroupRow.selectedVersion])}
				</td>
				<td>
					{#if Object.keys(taskGroupRow.groups).length > 1}
						<select
							class="form-select"
							aria-label="Version for {taskGroupRow.groupTitle}"
							bind:value={taskGroupRow.selectedVersion}
							onchange={() => handleSwitchVersion(i)}
						>
							{#each sortVersions(Object.keys(taskGroupRow.groups)) as version}
								<option value={version}>{version || 'None'}</option>
							{/each}
						</select>
					{:else}
						{taskGroupRow.selectedVersion || '-'}
					{/if}
				</td>
				<td>
					{taskGroupRow.groups[taskGroupRow.selectedVersion].task_list.length}
					<button
						class="btn btn-link"
						onclick={() => handleToggleTasks(i)}
						aria-label={expandedTaskGroupRow === taskGroupRow.groupTitle
							? 'Collapse tasks'
							: 'Expand tasks'}
					>
						{#if expandedTaskGroupRow === taskGroupRow.groupTitle}
							<i class="bi bi-dash-circle"></i>
						{:else}
							<i class="bi bi-plus-circle"></i>
						{/if}
					</button>
				</td>
				<td>
					<button
						class="btn btn-light"
						onclick={() =>
							taskGroupInfoModal.open(taskGroupRow.groups[taskGroupRow.selectedVersion])}
					>
						<i class="bi bi-info-circle"></i>
						Info
					</button>
					<button
						class="btn btn-primary"
						onclick={() =>
							taskGroupEditModal.open(taskGroupRow.groups[taskGroupRow.selectedVersion])}
					>
						<i class="bi bi-pencil"></i>
						Edit
					</button>
					<button
						class="btn btn-info"
						onclick={() =>
							taskGroupManageModal.open(taskGroupRow.groups[taskGroupRow.selectedVersion])}
					>
						<i class="bi bi-gear"></i>
						Manage
					</button>
					<ConfirmActionButton
						modalId="confirmTaskGroupDeleteModal{taskGroupRow.groupTitle}"
						style={'danger'}
						btnStyle="danger"
						buttonIcon="trash"
						label={'Delete'}
						message={`Delete task group ${
							taskGroupRow.groupTitle +
							(taskGroupRow.selectedVersion
								? ' (version ' + taskGroupRow.selectedVersion + ')'
								: '')
						}`}
						callbackAction={async () => {
							await handleDeleteTaskGroup(taskGroupRow.groups[taskGroupRow.selectedVersion].id);
						}}
					/>
				</td>
			</tr>

			{#each taskGroupRow.groups[taskGroupRow.selectedVersion].task_list as task}
				{#if task}
					<tr class:collapsed={taskGroupRow.groupTitle !== expandedTaskGroupRow} class="task-row">
						<td colspan="5" class="text-end">
							<span class="pe-4">{task.name}</span>
						</td>
						<td>
							<button
								class="btn btn-light"
								onclick={() => {
									taskInfoModal.open(task, taskGroupRow.selectedVersion);
								}}
							>
								<i class="bi bi-info-circle"></i>
								Info
							</button>
							<button
								class="btn btn-primary"
								onclick={() => {
									taskEditModal.open(task);
								}}
							>
								<i class="bi bi-pencil"></i>
								Edit
							</button>
						</td>
					</tr>
				{/if}
			{/each}
		{/each}
	</tbody>
</table>

<TaskGroupInfoModal bind:this={taskGroupInfoModal} {user} />
<TaskGroupEditModal
	bind:this={taskGroupEditModal}
	{updateEditedTaskGroup}
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
