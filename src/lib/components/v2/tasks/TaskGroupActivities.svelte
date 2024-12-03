<script>
	import { env } from '$env/dynamic/public';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { onDestroy, onMount } from 'svelte';
	import {
		getTaskActivityStatusBadgeClass,
		getTaskGroupActivitiesToUpdate
	} from './task_group_utilities';
	import TaskGroupActivityLogsModal from './TaskGroupActivityLogsModal.svelte';
	import { getTimestamp } from '$lib/common/component_utilities';
	import { page } from '$app/stores';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';
	import { sortActivitiesByTimestampStarted } from '$lib/common/task_utilities';

	export let admin = false;

	/** @type {Array<import('$lib/types').User & {id: number}>} */
	export let users = [];
	/** @type {Array<import('$lib/types').User & {id: number}>} */
	let sortedUsers = [];
	$: if (users) {
		sortedUsers = [...users].sort(sortUserByEmailComparator);
	}

	/** @type {import('$lib/types-v2').TaskGroupActivityV2[]} */
	let results = [];

	let pkg_name = '';
	let status = '';
	let action = '';
	/** @type {number|null} */
	let taskgroupv2_id = null;
	/** @type {string|undefined} */
	let startDateMin = undefined;
	/** @type {string|undefined} */
	let startTimeMin = undefined;
	/** @type {number|null} */
	let user_id = null;
	/** @type {number|null} */
	let task_group_activity_id = null;

	let searched = false;
	let searching = false;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	/** @type {TaskGroupActivityLogsModal} */
	let taskGroupActivityLogsModal;
	/** @type {number|null} */
	let openedTaskCollectionLogId = null;

	/**
	 * @param {number} taskCollectionId
	 */
	async function openTaskGroupActivityLogsModal(taskCollectionId) {
		openedTaskCollectionLogId = taskCollectionId;
		await taskGroupActivityLogsModal.open(taskCollectionId);
	}

	async function searchActivities() {
		searching = true;
		try {
			errorAlert?.hide();
			const url = new URL(
				admin ? '/api/admin/v2/task-group/activity' : '/api/v2/task-group/activity',
				window.location.origin
			);
			if (pkg_name) {
				url.searchParams.append('pkg_name', pkg_name);
			}
			if (status) {
				url.searchParams.append('status', status);
			}
			if (action) {
				url.searchParams.append('action', action);
			}
			if (taskgroupv2_id !== null) {
				url.searchParams.append('taskgroupv2_id', taskgroupv2_id.toString());
			}
			if (admin && user_id !== null) {
				url.searchParams.append('user_id', user_id.toString());
			}
			if (task_group_activity_id !== null) {
				url.searchParams.append('task_group_activity_id', task_group_activity_id.toString());
			}
			const timestampStartedMin = getTimestamp(startDateMin, startTimeMin);
			if (timestampStartedMin) {
				url.searchParams.append('timestamp_started_min', timestampStartedMin);
			}

			const response = await fetch(url, {
				method: 'GET',
				credentials: 'include'
			});
			if (!response.ok) {
				errorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					'searchError'
				);
				return;
			}
			/** @type {import('$lib/types-v2').TaskGroupActivityV2[]} */
			const activities = await response.json();
			activities.sort(sortActivitiesByTimestampStarted);
			results = activities;
		} finally {
			searching = false;
			searched = true;
		}
	}

	async function resetSearchFields() {
		pkg_name = '';
		status = '';
		action = '';
		taskgroupv2_id = null;
		startDateMin = undefined;
		startTimeMin = undefined;
		user_id = null;
		task_group_activity_id = null;
		if (admin) {
			searched = false;
		} else {
			await searchActivities();
		}
	}

	const updateTasksCollectionInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	let updateTasksCollectionTimeout = undefined;

	/**
	 * @param {import('$lib/types-v2').TaskGroupActivityV2[]} activitiesToUpdate
	 */
	async function updateTaskCollectionsState(activitiesToUpdate) {
		results = results.map((a) => {
			const updatedActivity = activitiesToUpdate.find((u) => u.id === a.id);
			return updatedActivity ?? a;
		});
		const openedTaskCollectionLogToUpdate = activitiesToUpdate.find(
			(u) => u.id === openedTaskCollectionLogId
		)?.log;
		if (openedTaskCollectionLogToUpdate) {
			await taskGroupActivityLogsModal.updateLog(openedTaskCollectionLogToUpdate);
		}
	}

	async function updateTaskCollectionsInBackground() {
		const activitiesToUpdate = await getTaskGroupActivitiesToUpdate(results, admin);
		if (activitiesToUpdate.length > 0) {
			await updateTaskCollectionsState(activitiesToUpdate);
		}
		clearTimeout(updateTasksCollectionTimeout);
		updateTasksCollectionTimeout = setTimeout(
			updateTaskCollectionsInBackground,
			updateTasksCollectionInterval
		);
	}

	/**
	 * @param {number} userId
	 */
	function getUserEmail(userId) {
		return users.find((u) => u.id === userId)?.email || '-';
	}

	onMount(async () => {
		const activityId = $page.url.searchParams.get('activity_id');
		if (activityId && !isNaN(Number(activityId))) {
			task_group_activity_id = Number(activityId);
		}
		if (!admin || task_group_activity_id !== null) {
			await searchActivities();
		}
		updateTasksCollectionTimeout = setTimeout(
			updateTaskCollectionsInBackground,
			updateTasksCollectionInterval
		);
	});

	onDestroy(() => {
		clearTimeout(updateTasksCollectionTimeout);
	});
</script>

<h1 class="fw-light mb-4 fs-2">Task-groups activities</h1>

<div class="row">
	<div class="col mb-3">
		<div class="input-group">
			<label class="input-group-text" for="pkg_name"> Package name </label>
			<input type="text" class="form-control" id="pkg_name" bind:value={pkg_name} />
		</div>
	</div>
	<div class="col-lg-3 mb-3">
		<div class="input-group">
			<label class="input-group-text" for="status"> Status </label>
			<select class="form-select" id="status" bind:value={status}>
				<option value="">Select...</option>
				<option value="pending">Pending</option>
				<option value="ongoing">Ongoing</option>
				<option value="failed">Failed</option>
				<option value="OK">OK</option>
			</select>
		</div>
	</div>
	<div class="col-lg-3 mb-3">
		<div class="input-group">
			<label class="input-group-text" for="action"> Action </label>
			<select class="form-select" id="action" bind:value={action}>
				<option value="">Select...</option>
				<option value="collect">Collect</option>
				<option value="deactivate">Deactivate</option>
				<option value="reactivate">Reactivate</option>
			</select>
		</div>
	</div>
</div>

<div class="row">
	<div class="col-lg-3 mb-3">
		<div class="input-group">
			<label class="input-group-text" for="taskgroupv2_id"> Task-group id </label>
			<input type="number" class="form-control" id="taskgroupv2_id" bind:value={taskgroupv2_id} />
		</div>
	</div>
	<div class="col-lg-5 mb-3">
		<div class="input-group">
			<div class="input-group-text">Timestamp started min</div>
			<input type="date" class="form-control" bind:value={startDateMin} id="start_date_min" />
			<input type="time" class="form-control" bind:value={startTimeMin} id="start_time_min" />
		</div>
	</div>
	{#if admin}
		<div class="col-lg-4 mb-3">
			<div class="input-group">
				<label class="input-group-text" for="user"> User </label>
				<select class="form-select" id="user" bind:value={user_id}>
					<option value={null}>Select...</option>
					{#each sortedUsers as user}
						<option value={user.id}>{user.email}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}
</div>

<button class="btn btn-primary mt-2" on:click={searchActivities} disabled={searching}>
	{#if searching}
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
	{:else}
		<i class="bi bi-search" />
	{/if}
	Search activities
</button>
<button class="btn btn-warning mt-2" on:click={resetSearchFields} disabled={searching}>
	Reset
</button>

<div id="searchError" class="mt-3 mb-3" />

<div class:d-none={!searched}>
	<p class="text-center">
		The query returned {results.length} matching {results.length !== 1 ? 'results' : 'result'}
	</p>

	<table class="table table-hover align-middle">
		<thead>
			<tr>
				<th>Package</th>
				<th>Version</th>
				<th>Action</th>
				<th>Status</th>
				<th>Started</th>
				<th>Ended</th>
				{#if admin}
					<th>User</th>
				{/if}
				<th>Options</th>
			</tr>
		</thead>
		<tbody>
			{#each results as taskGroupActivity}
				<tr>
					<td>{taskGroupActivity.pkg_name}</td>
					<td>
						{taskGroupActivity.version || '-'}
					</td>
					<td>
						{taskGroupActivity.action}
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
					{#if admin}
						<td>{getUserEmail(taskGroupActivity.user_id)}</td>
					{/if}
					<td>
						{#if taskGroupActivity.status !== 'pending' && taskGroupActivity.log}
							<button
								class="btn btn-info"
								aria-label="Show activity log"
								on:click={() => openTaskGroupActivityLogsModal(taskGroupActivity.id)}
							>
								<i class="bi bi-info-circle" />
							</button>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<TaskGroupActivityLogsModal bind:this={taskGroupActivityLogsModal} admin={true} />
