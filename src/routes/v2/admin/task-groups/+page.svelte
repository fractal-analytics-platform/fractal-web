<script>
	import { page } from '$app/stores';
	import { getTimestamp } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import TimestampCell from '$lib/components/jobs/TimestampCell.svelte';
	import TaskGroupEditModal from '$lib/components/v2/tasks/TaskGroupEditModal.svelte';
	import TaskGroupManageModal from '$lib/components/v2/tasks/TaskGroupManageModal.svelte';

	/** @type {Array<import('$lib/types').User>} */
	const users = $page.data.users;
	/** @type {Array<import('$lib/types').Group>} */
	const groups = $page.data.groups;

	let user_id = '';
	let user_group_id = '';
	let pkg_name = '';
	let origin = '';
	/** @type {boolean|null} */
	let privateGroup = null;
	/** @type {boolean|null} */
	let active = null;
	let lastUsedDateMin;
	let lastUsedTimeMin = '';
	let lastUsedDateMax = '';
	let lastUsedTimeMax = '';

	let searched = false;
	let searching = false;
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	/** @type {import('fractal-components/types/api').TaskGroupV2[]} */
	let results = [];

	/** @type {Modal} */
	let infoModal;
	/** @type {import('fractal-components/types/api').TaskGroupV2|null} */
	let selectedTaskGroup = null;

	/** @type {import('$lib/components/v2/tasks/TaskGroupEditModal.svelte').default} */
	let taskGroupEditModal;
	/** @type {import('$lib/components/v2/tasks/TaskGroupManageModal.svelte').default} */
	let taskGroupManageModal;

	async function searchTaskGroups() {
		searching = true;
		try {
			if (searchErrorAlert) {
				searchErrorAlert.hide();
			}
			const url = new URL('/api/admin/v2/task-group', window.location.origin);
			if (user_id) {
				url.searchParams.append('user_id', user_id);
			}
			if (user_group_id) {
				url.searchParams.append('user_group_id', user_group_id);
			}
			if (pkg_name) {
				url.searchParams.append('pkg_name', pkg_name);
			}
			if (origin) {
				url.searchParams.append('origin', origin);
			}
			if (privateGroup !== null) {
				url.searchParams.append('private', privateGroup.toString());
			}
			if (active !== null) {
				url.searchParams.append('active', active.toString());
			}
			const lasUsedTimestampMin = getTimestamp(lastUsedDateMin, lastUsedTimeMin);
			if (lasUsedTimestampMin) {
				url.searchParams.append('timestamp_last_used_min', lasUsedTimestampMin);
			}
			const lasUsedTimestampMax = getTimestamp(lastUsedDateMax, lastUsedTimeMax);
			if (lasUsedTimestampMax) {
				url.searchParams.append('timestamp_last_used_max', lasUsedTimestampMax);
			}
			const response = await fetch(url);
			if (!response.ok) {
				searchErrorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					'searchError'
				);
				return;
			}
			searched = true;
			results = await response.json();
		} finally {
			searching = false;
		}
	}

	function resetSearchFields() {
		if (searchErrorAlert) {
			searchErrorAlert.hide();
		}
		user_id = '';
		user_group_id = '';
		pkg_name = '';
		origin = '';
		lastUsedDateMin = '';
		lastUsedTimeMin = '';
		lastUsedDateMax = '';
		lastUsedTimeMax = '';
		privateGroup = null;
		active = null;
		searched = false;
		results = [];
	}

	/**
	 *
	 * @param {import('fractal-components/types/api').TaskGroupV2} taskGroup
	 */
	function openInfoModal(taskGroup) {
		selectedTaskGroup = taskGroup;
		infoModal.show();
	}

	function onInfoModalClose() {
		selectedTaskGroup = null;
	}

	/**
	 * @param {number} userId
	 * @returns {string}
	 */
	function getUserEmail(userId) {
		return users.find((u) => u.id === userId)?.email || '-';
	}

	/**
	 * @param {number} userGroupId
	 * @returns {string}
	 */
	function getGroupName(userGroupId) {
		return groups.find((g) => g.id === userGroupId)?.name || '-';
	}

	/**
	 * @param {number} groupId
	 */
	async function handleDeleteTaskGroup(groupId) {
		const response = await fetch(`/api/admin/v2/task-group/${groupId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (response.ok) {
			console.log('Task group deleted successfully');
			await searchTaskGroups();
		} else {
			console.error('Error deleting the task group');
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<div>
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="fw-light">Task groups</h1>
	</div>
</div>

<div class="row">
	<div class="col-lg-12">
		<div class="row">
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="pkg_name">Package name</label>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<input type="text" class="form-control" bind:value={pkg_name} id="pkg_name" />
					</div>
				</div>
			</div>
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="user_id">User</label>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<select class="form-select" bind:value={user_id} id="user_id">
							<option value="">Select...</option>
							{#each users as user}
								<option value={user.id}>{user.email}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="user_group_id">Group</label>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<select class="form-select" bind:value={user_group_id} id="user_group_id">
							<option value="">Select...</option>
							{#each groups as group}
								<option value={group.id}>{group.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<div class="row mt-lg-3">
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="private">Private</label>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<select class="form-select" bind:value={privateGroup} id="private">
							<option value={null}>Select...</option>
							<option value={true}>True</option>
							<option value={false}>False</option>
						</select>
					</div>
				</div>
			</div>
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="active">Active</label>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<select class="form-select" bind:value={active} id="active">
							<option value={null}>Select...</option>
							<option value={true}>True</option>
							<option value={false}>False</option>
						</select>
					</div>
				</div>
			</div>
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="origin">Origin</label>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<select class="form-select" bind:value={origin} id="origin">
							<option value="">Select...</option>
							<option value="pypi">PyPI</option>
							<option value="wheel-file">Wheel file</option>
							<option value="other">Other</option>
						</select>
					</div>
				</div>
			</div>
		</div>

		<div class="row mt-3">
			<div class="col-md-3 col-lg-2 mt-2">Last used</div>
			<div class="col-md-9 col-lg-10">
				<div class="row row-cols-md-auto">
					<div class="col-12 mt-1">
						<div class="input-group">
							<div class="input-group-text">Min</div>
							<input
								type="date"
								class="form-control"
								bind:value={lastUsedDateMin}
								id="last_used_date_min"
							/>
							<input
								type="time"
								class="form-control"
								bind:value={lastUsedTimeMin}
								id="last_used_time_min"
							/>
						</div>
					</div>
					<div class="col-12 mt-1">
						<div class="input-group">
							<div class="input-group-text">Max</div>
							<input
								type="date"
								class="form-control"
								bind:value={lastUsedDateMax}
								id="last_used_date_max"
							/>
							<input
								type="time"
								class="form-control"
								bind:value={lastUsedTimeMax}
								id="last_used_time_max"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<button class="btn btn-primary mt-4" on:click={searchTaskGroups} disabled={searching}>
	{#if searching}
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
	{:else}
		<i class="bi bi-search" />
	{/if}
	Search task groups
</button>
<button class="btn btn-warning mt-4" on:click={resetSearchFields} disabled={searching}>
	Reset
</button>

<div id="searchError" class="mt-3 mb-3" />

<div class:d-none={!searched}>
	<p class="text-center">
		The query returned {results.length} matching {results.length !== 1 ? 'results' : 'result'}
	</p>

	{#if results.length > 0}
		<table class="table task-groups-table mt-4">
			<colgroup>
				<col width="60" />
				<col width="auto" />
				<col width="90" />
				<col width="190" />
				<col width="100" />
				<col width="90" />
				<col width="90" />
				<col width="90" />
				<col width="400" />
			</colgroup>
			<thead>
				<tr>
					<th>Id</th>
					<th>Package Name</th>
					<th>Version</th>
					<th>User</th>
					<th>Group</th>
					<th>Active</th>
					<th>Origin</th>
					<th># Tasks</th>
					<th>Options</th>
				</tr>
			</thead>
			<tbody>
				{#each results as taskGroup, taskGroupIndex}
					<tr class:row-grey={taskGroupIndex % 2 === 0}>
						<td>{taskGroup.id}</td>
						<td>{taskGroup.pkg_name}</td>
						<td>{taskGroup.version || '-'}</td>
						<td>{getUserEmail(taskGroup.user_id)}</td>
						<td>{getGroupName(taskGroup.user_group_id)}</td>
						<td>
							<BooleanIcon value={taskGroup.active} />
						</td>
						<td>{taskGroup.origin || '-'}</td>
						<td>{taskGroup.task_list.length}</td>
						<td>
							<button class="btn btn-light" on:click={() => openInfoModal(taskGroup)}>
								<i class="bi bi-info-circle" />
								Info
							</button>
							<button class="btn btn-primary" on:click={() => taskGroupEditModal.open(taskGroup)}>
								<i class="bi bi-pencil" />
								Edit
							</button>
							<button class="btn btn-info" on:click={() => taskGroupManageModal.open(taskGroup)}>
								<i class="bi bi-gear" />
								Manage
							</button>
							<ConfirmActionButton
								modalId="confirmTaskGroupDeleteModal{taskGroup.id}"
								style={'danger'}
								btnStyle="danger"
								buttonIcon="trash"
								label={'Delete'}
								message={`Delete task group ${
									taskGroup.pkg_name +
									(taskGroup.version ? ' (version ' + taskGroup.version + ')' : '')
								}`}
								callbackAction={async () => {
									await handleDeleteTaskGroup(taskGroup.id);
								}}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<TaskGroupEditModal
	bind:this={taskGroupEditModal}
	updateEditedTaskGroup={searchTaskGroups}
	groupIdsNames={groups.map((g) => [g.id, g.name])}
/>
<TaskGroupManageModal bind:this={taskGroupManageModal} admin={true} />

<Modal id="taskInfoModal" bind:this={infoModal} size="xl" onClose={onInfoModalClose}>
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title flex-grow-1">Task-group info</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if selectedTaskGroup}
			<ul class="list-group">
				<li class="list-group-item list-group-item-light fw-bold">Id</li>
				<li class="list-group-item">{selectedTaskGroup.id}</li>
				<li class="list-group-item list-group-item-light fw-bold">Package name</li>
				<li class="list-group-item">{selectedTaskGroup.pkg_name}</li>
				<li class="list-group-item list-group-item-light fw-bold">User</li>
				<li class="list-group-item">{getUserEmail(selectedTaskGroup.user_id)}</li>
				<li class="list-group-item list-group-item-light fw-bold">Group</li>
				<li class="list-group-item">{getGroupName(selectedTaskGroup.user_group_id)}</li>
				<li class="list-group-item list-group-item-light fw-bold">Active</li>
				<li class="list-group-item">
					<BooleanIcon value={selectedTaskGroup.active} />
				</li>
				<li class="list-group-item list-group-item-light fw-bold">Origin</li>
				<li class="list-group-item">{selectedTaskGroup.origin || '-'}</li>
				<li class="list-group-item list-group-item-light fw-bold">Version</li>
				<li class="list-group-item">{selectedTaskGroup.version || '-'}</li>
				<li class="list-group-item list-group-item-light fw-bold">Python version</li>
				<li class="list-group-item">{selectedTaskGroup.python_version || '-'}</li>
				<li class="list-group-item list-group-item-light fw-bold">Path</li>
				<li class="list-group-item">{selectedTaskGroup.path || '-'}</li>
				<li class="list-group-item list-group-item-light fw-bold">Venv path</li>
				<li class="list-group-item">{selectedTaskGroup.venv_path || '-'}</li>
				<li class="list-group-item list-group-item-light fw-bold">Number of files</li>
				<li class="list-group-item">{selectedTaskGroup.venv_file_number || '-'}</li>
				<li class="list-group-item list-group-item-light fw-bold">Size (MB)</li>
				<li class="list-group-item">
					{selectedTaskGroup.venv_size_in_kB
						? (selectedTaskGroup.venv_size_in_kB / 1000).toFixed(2)
						: '-'}
				</li>
				<li class="list-group-item list-group-item-light fw-bold">Pip extras</li>
				<li class="list-group-item">{selectedTaskGroup.pip_extras || '-'}</li>
				<li class="list-group-item list-group-item-light fw-bold">Last used</li>
				<li class="list-group-item">
					<TimestampCell timestamp={selectedTaskGroup.timestamp_last_used} />
				</li>
			</ul>
		{/if}
	</svelte:fragment>
</Modal>

<style>
	.task-groups-table {
		table-layout: fixed;
		min-width: 1150px;
	}

	.task-groups-table thead {
		word-break: break-word;
	}

	.task-groups-table tbody {
		word-break: break-all;
	}

	.row-grey {
		background-color: #f2f2f2;
	}

	input[type='date'] {
		min-width: 190px;
	}
</style>
