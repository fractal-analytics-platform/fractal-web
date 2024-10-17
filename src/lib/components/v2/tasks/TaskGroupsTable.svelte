<script>
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { onMount, tick } from 'svelte';
	import { buildTaskTableRows, sortVersions } from './task_group_utilities';
	import { AlertError } from '$lib/common/errors';
	import TaskInfoModal from './TaskInfoModal.svelte';
	import TaskEditModal from './TaskEditModal.svelte';
	import TaskGroupInfoModal from './TaskGroupInfoModal.svelte';
	import TaskGroupEditModal from '$lib/components/v2/tasks/TaskGroupEditModal.svelte';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import('$lib/types').User} */
	export let user;
	/**
	 * @type {import('$lib/types-v2').TaskGroupV2[]}
	 */
	export let taskGroups;
	/** @type {string|undefined} */
	export let expandedTaskGroupRow;
	/**
	 * @type {(updatedGroups: import('$lib/types-v2').TaskGroupV2[]) => void}
	 */
	export let updateTaskGroups;

	/** @type {import('$lib/components/v2/tasks/TaskGroupInfoModal.svelte').default} */
	let taskGroupInfoModal;
	/** @type {import('$lib/components/v2/tasks/TaskGroupEditModal.svelte').default} */
	let taskGroupEditModal;
	/** @type {import('$lib/components/v2/tasks/TaskInfoModal.svelte').default} */
	let taskInfoModal;
	/** @type {import('$lib/components/v2/tasks/TaskEditModal.svelte').default} */
	let taskEditModal;

	/**
	 * @type {import('$lib/types-v2').TasksTableRowGroup[]}
	 */
	let taskGroupRows = [];

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
	async function handleSwitchVersion(index) {
		await tick();
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
			const result = await response.json();
			console.error('Error deleting the task group', result);
			throw new AlertError(result);
		}
	}

	/**
	 * @param {import('$lib/types-v2').TaskGroupV2} updatedGroup
	 */
	function updateEditedTaskGroup(updatedGroup) {
		updateTaskGroups(taskGroups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
	}

	/**
	 * @param {import('$lib/types-v2').TaskV2} editedTask
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
	 * @param {import('$lib/types-v2').TaskGroupV2} taskGroup
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
		<col width="350" />
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
							on:change={() => handleSwitchVersion(i)}
							bind:value={taskGroupRow.selectedVersion}
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
						on:click={() => handleToggleTasks(i)}
						aria-label={expandedTaskGroupRow === taskGroupRow.groupTitle
							? 'Collapse tasks'
							: 'Expand tasks'}
					>
						{#if expandedTaskGroupRow === taskGroupRow.groupTitle}
							<i class="bi bi-dash-circle" />
						{:else}
							<i class="bi bi-plus-circle" />
						{/if}
					</button>
				</td>
				<td>
					<button
						class="btn btn-light"
						on:click={() =>
							taskGroupInfoModal.open(taskGroupRow.groups[taskGroupRow.selectedVersion])}
					>
						<i class="bi bi-info-circle" />
						Info
					</button>
					<button
						class="btn btn-primary"
						on:click={() =>
							taskGroupEditModal.open(taskGroupRow.groups[taskGroupRow.selectedVersion])}
					>
						<i class="bi bi-pencil" />
						Edit
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
								on:click={() => {
									taskInfoModal.open(task);
								}}
							>
								<i class="bi bi-info-circle" />
								Info
							</button>
							<button
								class="btn btn-primary"
								on:click={() => {
									taskEditModal.open(task);
								}}
							>
								<i class="bi bi-pencil" />
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
<TaskGroupEditModal bind:this={taskGroupEditModal} {updateEditedTaskGroup} {user} />
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
