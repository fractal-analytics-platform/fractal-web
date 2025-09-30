<script>
	import { env } from '$env/dynamic/public';
	import { onDestroy, onMount } from 'svelte';
	import { sortActivitiesByTimestampStarted } from '$lib/common/task_utilities';
	import { getTaskActivityStatusBadgeClass } from 'fractal-components/tasks/task_group_utilities';
	import { getTaskGroupActivitiesToUpdate } from './task_group_utilities';
	import TaskGroupActivityLogsModal from '$lib/components/v2/tasks/TaskGroupActivityLogsModal.svelte';
	import { recentActivities } from '$lib/stores';

	// This component automatically fecthes updates for task recent activities
	// in pending and ongoing status

	/**
	 * @typedef {Object} Props
	 * @property {() => Promise<void>} reloadTaskGroupsList
	 */

	/** @type {Props} */
	let { reloadTaskGroupsList } = $props();

	let sortedRecentActivities = $derived(
		[...$recentActivities].sort(sortActivitiesByTimestampStarted)
	);

	/** @type {number|null} */
	let openedTaskActivityLogId = null;

	/** @type {TaskGroupActivityLogsModal|undefined} */
	let taskGroupActivitiesLogsModal = $state();

	/**
	 * @param {import('fractal-components/types/api').TaskGroupActivityV2[]} activitiesToUpdate
	 */
	async function updateTaskActivitiesState(activitiesToUpdate) {
		recentActivities.set(
			$recentActivities.map((a) => {
				const updatedActivity = activitiesToUpdate.find((u) => u.id === a.id);
				return updatedActivity ?? a;
			})
		);
		const openedTaskActivityLogToUpdate = activitiesToUpdate.find(
			(u) => u.id === openedTaskActivityLogId
		)?.log;
		if (openedTaskActivityLogToUpdate) {
			await taskGroupActivitiesLogsModal?.updateLog(openedTaskActivityLogToUpdate);
		}
	}

	/**
	 * @param {number} taskGroupActivityId
	 */
	async function openTaskGroupActivityLogsModal(taskGroupActivityId) {
		openedTaskActivityLogId = taskGroupActivityId;
		await taskGroupActivitiesLogsModal?.open(taskGroupActivityId);
	}

	async function updateTasksActivitiesInBackground() {
		const activitiesToUpdate = await getTaskGroupActivitiesToUpdate($recentActivities, false);
		if (activitiesToUpdate.length > 0) {
			await updateTaskActivitiesState(activitiesToUpdate);
			const newOkTasks = $recentActivities.filter(
				(a) => activitiesToUpdate.map((u) => u.id).includes(a.id) && a.status === 'OK'
			).length;
			if (newOkTasks > 0) {
				await reloadTaskGroupsList();
			}
		}
		clearTimeout(updateTasksActivitiesTimeout);
		updateTasksActivitiesTimeout = setTimeout(
			updateTasksActivitiesInBackground,
			updateTasksActivitiesInterval
		);
	}

	async function loadRecentTaskActivities() {
		const date = new Date();
		date.setTime(date.getTime() - 24 * 3600 * 1000); // yesterday
		const response = await fetch(
			`/api/v2/task-group/activity?timestamp_started_min=${date.toISOString()}`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);
		const result = await response.json();
		if (response.ok) {
			return result;
		}
		console.error('Unable to load recent task activities', result);
		return [];
	}

	const updateTasksActivitiesInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	let updateTasksActivitiesTimeout = undefined;

	onMount(async () => {
		recentActivities.set(await loadRecentTaskActivities());
		updateTasksActivitiesTimeout = setTimeout(
			updateTasksActivitiesInBackground,
			updateTasksActivitiesInterval
		);
	});

	onDestroy(() => {
		clearTimeout(updateTasksActivitiesTimeout);
	});
</script>

{#if $recentActivities.length > 0}
	<a href="/v2/tasks/activities" class="btn btn-light float-end">
		<i class="bi bi-info-circle"></i>
		Show all activities
	</a>
{/if}
<h4 class="fw-light mt-3">Recent task activities</h4>
{#if $recentActivities.length === 0}
	<p class="mb-5">
		No recent activities
		<a href="/v2/tasks/activities" class="btn btn-light ms-3">
			<i class="bi bi-info-circle"></i>
			Show all activities
		</a>
	</p>
{:else}
	<div class="mb-5">
		<table class="table table-hover align-middle">
			<thead>
				<tr>
					<th>Package</th>
					<th>Version</th>
					<th>Status</th>
					<th>Started</th>
					<th>Ended</th>
					<th>Options</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedRecentActivities as taskGroupActivity (taskGroupActivity.id)}
					<tr>
						<td>{taskGroupActivity.pkg_name}</td>
						<td>
							<code>{taskGroupActivity.version || 'Unspecified'}</code>
						</td>
						<td>
							<span class="badge {getTaskActivityStatusBadgeClass(taskGroupActivity.status)}">
								{taskGroupActivity.status}
							</span>
						</td>
						<td>{new Date(taskGroupActivity.timestamp_started).toLocaleString()}</td>
						<td>
							{taskGroupActivity.timestamp_ended
								? new Date(taskGroupActivity.timestamp_ended).toLocaleString()
								: '-'}
						</td>
						<td>
							{#if taskGroupActivity.status !== 'pending' && taskGroupActivity.log}
								<button
									class="btn btn-info"
									onclick={() => openTaskGroupActivityLogsModal(taskGroupActivity.id)}
									aria-label="Info"
								>
									<i class="bi bi-info-circle"></i>
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<TaskGroupActivityLogsModal bind:this={taskGroupActivitiesLogsModal} admin={false} />
