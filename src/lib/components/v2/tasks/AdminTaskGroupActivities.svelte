<script>
	import { env } from '$env/dynamic/public';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { onDestroy, onMount } from 'svelte';
	import { getTaskGroupActivitiesToUpdate } from './task_group_utilities';
	import { getTaskActivityStatusBadgeClass } from 'fractal-components/tasks/task_group_utilities';
	import AdminTaskGroupActivityLogsModal from './AdminTaskGroupActivityLogsModal.svelte';
	import { getTimestamp } from '$lib/common/component_utilities';
	import { page } from '$app/state';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';
	import Paginator from '$lib/components/common/Paginator.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {Array<import('fractal-components/types/api').User & {id: number}>} [users]
	 */

	/** @type {Props} */
	let { users = [] } = $props();
	/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */
	const sortedUsers = $derived([...users].sort(sortUserByEmailComparator));

	/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').TaskGroupActivityV2>|undefined} */
	let results = $state();
	let currentPage = $state(1);
	let pageSize = $state(10);

	let pkg_name = $state('');
	let status = $state('');
	let action = $state('');
	/** @type {number|null} */
	let taskgroupv2_id = $state(null);
	/** @type {string|undefined} */
	let startDateMin = $state(undefined);
	/** @type {string|undefined} */
	let startTimeMin = $state(undefined);
	/** @type {number|null} */
	let user_id = $state(null);
	/** @type {number|null} */
	let task_group_activity_id = null;

	let searched = $state(false);
	let searching = $state(false);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	/** @type {AdminTaskGroupActivityLogsModal|undefined} */
	let taskGroupActivityLogsModal = $state();
	/** @type {number|null} */
	let openedTaskCollectionLogId = null;

	/**
	 * @param {number} taskCollectionId
	 */
	async function openTaskGroupActivityLogsModal(taskCollectionId) {
		openedTaskCollectionLogId = taskCollectionId;
		await taskGroupActivityLogsModal?.open(taskCollectionId);
	}

	/**
	 * @param {number} newCurrentPage
	 * @param {number} newPageSize
	 */
	async function searchActivities(newCurrentPage = currentPage, newPageSize = pageSize) {
		searching = true;
		try {
			errorAlert?.hide();
			const url = new URL('/api/admin/v2/task-group/activity', window.location.origin);
			url.searchParams.append('page', newCurrentPage.toString());
			url.searchParams.append('page_size', newPageSize.toString());
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
			if (user_id !== null) {
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
			/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').TaskGroupActivityV2>} */
			const activities = await response.json();
			results = activities;
			pageSize = results.page_size;
			currentPage = results.current_page;
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
		searched = false;
		currentPage = 1;
		pageSize = 10;
	}

	const updateTasksCollectionInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	let updateTasksCollectionTimeout = undefined;

	/**
	 * @param {import('fractal-components/types/api').TaskGroupActivityV2[]} activitiesToUpdate
	 */
	async function updateTaskCollectionsState(activitiesToUpdate) {
		if (!results) {
			return;
		}
		results.items = results.items.map((a) => {
			const updatedActivity = activitiesToUpdate.find((u) => u.id === a.id);
			return updatedActivity ?? a;
		});
		const openedTaskCollectionLogToUpdate = activitiesToUpdate.find(
			(u) => u.id === openedTaskCollectionLogId
		)?.log;
		if (openedTaskCollectionLogToUpdate) {
			await taskGroupActivityLogsModal?.updateLog(openedTaskCollectionLogToUpdate);
		}
	}

	async function updateTaskCollectionsInBackground() {
		if (results) {
			const activitiesToUpdate = await getTaskGroupActivitiesToUpdate(results.items, true);
			if (activitiesToUpdate.length > 0) {
				await updateTaskCollectionsState(activitiesToUpdate);
			}
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
		const activityId = page.url.searchParams.get('activity_id');
		if (activityId && !isNaN(Number(activityId))) {
			task_group_activity_id = Number(activityId);
		}
		if (task_group_activity_id !== null) {
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
				<option value="delete">Delete</option>
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
	<div class="col-lg-4 mb-3">
		<div class="input-group">
			<label class="input-group-text" for="user"> User </label>
			<select class="form-select" id="user" bind:value={user_id}>
				<option value={null}>Select...</option>
				{#each sortedUsers as user (user.id)}
					<option value={user.id}>{user.email}</option>
				{/each}
			</select>
		</div>
	</div>
</div>

<button class="btn btn-primary mt-2" onclick={() => searchActivities()} disabled={searching}>
	{#if searching}
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
	{:else}
		<i class="bi bi-search"></i>
	{/if}
	Search activities
</button>
<button class="btn btn-warning mt-2" onclick={resetSearchFields} disabled={searching}>
	Reset
</button>

<div id="searchError" class="mt-3 mb-3"></div>

{#if results}
	<div class:d-none={!searched}>
		<p class="text-center">
			The query returned {results.items.length} matching {results.items.length !== 1
				? 'results'
				: 'result'}
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
					<th>User</th>
					<th>Options</th>
				</tr>
			</thead>
			<tbody>
				{#each results.items as taskGroupActivity (taskGroupActivity.id)}
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
						<td>{getUserEmail(taskGroupActivity.user_id)}</td>
						<td>
							{#if taskGroupActivity.status !== 'pending' && taskGroupActivity.log}
								<button
									class="btn btn-info"
									aria-label="Show activity log"
									onclick={() => openTaskGroupActivityLogsModal(taskGroupActivity.id)}
								>
									<i class="bi bi-info-circle"></i>
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if results.total_count > 0}
			<Paginator
				{currentPage}
				{pageSize}
				singleLine={true}
				totalCount={results.total_count}
				onPageChange={(currentPage, pageSize) => searchActivities(currentPage, pageSize)}
			/>
		{/if}
	</div>
{/if}

<AdminTaskGroupActivityLogsModal bind:this={taskGroupActivityLogsModal} />
