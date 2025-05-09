<script>
	import { env } from '$env/dynamic/public';
	import { onDestroy, onMount } from 'svelte';
	import TaskGroupActivityLogsModal from '$lib/components/v2/tasks/TaskGroupActivityLogsModal.svelte';
	import { FormErrorHandler } from '$lib/common/errors';
	import TaskGroupSelector from './TaskGroupSelector.svelte';
	import { getTaskGroupActivitiesToUpdate } from './task_group_utilities';
	import { getTaskActivityStatusBadgeClass } from 'fractal-components/tasks/task_group_utilities';
	import { sortActivitiesByTimestampStarted } from '$lib/common/task_utilities';

	// This component automatically fecthes updates for task collections activities
	// in pending and ongoing status

	/** @type {import('fractal-components/types/api').TaskGroupActivityV2[]} */
	let recentActivities = $state([]);

	let sortedRecentActivities = $derived(
		[...recentActivities].sort(sortActivitiesByTimestampStarted)
	);

	/**
	 * @typedef {Object} Props
	 * @property {'pypi'|'local'} [packageType]
	 * @property {() => Promise<void>} reloadTaskGroupsList
	 * @property {import('fractal-components/types/api').User} user
	 */

	/** @type {Props} */
	let { packageType = 'pypi', reloadTaskGroupsList, user } = $props();

	let python_package = $state('');
	let package_version = $state('');
	let python_version = $state('');
	let package_extras = $state('');
	/** @type {{key: string, value: string}[]} */
	let pinnedPackageVersions = $state([]);
	let privateTask = $state(false);
	let selectedGroup = $state(null);

	/** @type {FileList|null} */
	let wheelFiles = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let wheelFileInput = $state(undefined);

	/** @type {TaskGroupActivityLogsModal|undefined} */
	let taskGroupActivitiesLogsModal = $state();
	/** @type {number|null} */
	let openedTaskCollectionLogId = null;

	const formErrorHandler = new FormErrorHandler('taskCollectionError', [
		'package',
		'package_version',
		'package_extras',
		'python_version'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	export function clearForm() {
		formErrorHandler.clearErrors();
		python_package = '';
		package_version = '';
		python_version = '';
		package_extras = '';
		pinnedPackageVersions = [];
	}

	const updateTasksCollectionInterval = env.PUBLIC_UPDATE_JOBS_INTERVAL
		? parseInt(env.PUBLIC_UPDATE_JOBS_INTERVAL)
		: 3000;
	let updateTasksCollectionTimeout = undefined;

	// On component load set the taskCollections from the local storage
	onMount(async () => {
		recentActivities = await loadRecentTaskCollections();
		updateTasksCollectionTimeout = setTimeout(
			updateTasksCollectionInBackground,
			updateTasksCollectionInterval
		);
	});

	async function loadRecentTaskCollections() {
		const date = new Date();
		date.setTime(date.getTime() - 24 * 3600 * 1000); // yesterday
		const response = await fetch(
			`/api/v2/task-group/activity?timestamp_started_min=${date.toISOString()}&action=collect`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);
		const result = await response.json();
		if (response.ok) {
			return result;
		}
		console.error('Unable to load recent task collections', result);
		return [];
	}

	let taskCollectionInProgress = $state(false);

	/**
	 * Requests a task collection to the server
	 * @returns {Promise<*>}
	 */
	async function handleTaskCollection() {
		formErrorHandler.clearErrors();

		if (packageType === 'local' && (wheelFiles === null || wheelFiles.length === 0)) {
			formErrorHandler.addValidationError('file', 'Required field');
			return;
		}

		const formData = new FormData();

		if (packageType === 'pypi') {
			formData.append('package', python_package);
		} else if (wheelFiles?.length === 1) {
			formData.append('file', wheelFiles[0]);
		}

		if (python_version) {
			formData.append('python_version', python_version);
		}

		if (package_extras) {
			formData.append('package_extras', package_extras);
		}

		if (packageType === 'pypi' && package_version) {
			formData.append('package_version', package_version);
		}

		const ppv = getPinnedPackageVersionsMap();
		if (ppv) {
			formData.append('pinned_package_versions', JSON.stringify(ppv));
		}

		let url = `/api/v2/task/collect/pip?private=${privateTask}`;
		if (!privateTask) {
			url += `&user_group_id=${selectedGroup}`;
		}

		taskCollectionInProgress = true;
		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			body: formData
		});

		taskCollectionInProgress = false;

		if (response.ok) {
			const result = /** @type {import('fractal-components/types/api').TaskGroupActivityV2} */ (
				await response.json()
			);
			recentActivities = [...recentActivities, result];
			python_package = '';
			package_version = '';
			python_version = '';
			package_extras = '';
			pinnedPackageVersions = [];
			clearWheelFileUpload();
		} else {
			console.error('Task collection request failed');
			await formErrorHandler.handleErrorResponse(response);
		}
	}

	/**
	 * @returns {{[key: string]: string}|undefined}
	 */
	function getPinnedPackageVersionsMap() {
		/** @type {{[key: string]: string}} */
		const map = {};
		for (const ppv of pinnedPackageVersions) {
			if (ppv.key && ppv.value) {
				map[ppv.key] = ppv.value;
			}
		}
		if (Object.keys(map).length === 0) {
			return undefined;
		}
		return map;
	}

	/**
	 * @param {import('fractal-components/types/api').TaskGroupActivityV2[]} activitiesToUpdate
	 */
	async function updateTaskCollectionsState(activitiesToUpdate) {
		recentActivities = recentActivities.map((a) => {
			const updatedActivity = activitiesToUpdate.find((u) => u.id === a.id);
			return updatedActivity ?? a;
		});
		const openedTaskCollectionLogToUpdate = activitiesToUpdate.find(
			(u) => u.id === openedTaskCollectionLogId
		)?.log;
		if (openedTaskCollectionLogToUpdate) {
			await taskGroupActivitiesLogsModal?.updateLog(openedTaskCollectionLogToUpdate);
		}
	}

	/**
	 * @param {number} taskGroupActivityId
	 */
	async function openTaskGroupActivityLogsModal(taskGroupActivityId) {
		openedTaskCollectionLogId = taskGroupActivityId;
		await taskGroupActivitiesLogsModal?.open(taskGroupActivityId);
	}

	function addPackageVersion() {
		pinnedPackageVersions = [...pinnedPackageVersions, { key: '', value: '' }];
	}

	/**
	 * @param {number} index
	 */
	function removePackageVersion(index) {
		pinnedPackageVersions = pinnedPackageVersions.filter((_, i) => i !== index);
	}

	async function updateTasksCollectionInBackground() {
		const activitiesToUpdate = await getTaskGroupActivitiesToUpdate(recentActivities, false);
		if (activitiesToUpdate.length > 0) {
			await updateTaskCollectionsState(activitiesToUpdate);
			const newOkTasks = recentActivities.filter(
				(a) => activitiesToUpdate.map((u) => u.id).includes(a.id) && a.status === 'OK'
			).length;
			if (newOkTasks > 0) {
				await reloadTaskGroupsList();
			}
		}
		clearTimeout(updateTasksCollectionTimeout);
		updateTasksCollectionTimeout = setTimeout(
			updateTasksCollectionInBackground,
			updateTasksCollectionInterval
		);
	}

	function clearWheelFileUpload() {
		wheelFiles = null;
		if (wheelFileInput) {
			wheelFileInput.value = '';
		}
		formErrorHandler.removeValidationError('file');
	}

	onDestroy(() => {
		clearTimeout(updateTasksCollectionTimeout);
	});
</script>

<TaskGroupActivityLogsModal bind:this={taskGroupActivitiesLogsModal} admin={false} />

<div>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleTaskCollection();
		}}
	>
		<div class="row">
			{#if packageType === 'pypi'}
				<div class="mb-2 col-md-6">
					<div class="input-group has-validation">
						<div class="input-group-text">
							<label class="font-monospace" for="package">Package</label>
						</div>
						<input
							name="package"
							id="package"
							type="text"
							class="form-control"
							required
							class:is-invalid={$validationErrors['package']}
							bind:value={python_package}
						/>
						<span class="invalid-feedback">{$validationErrors['package']}</span>
					</div>
					<div class="form-text">The name of a package published on PyPI</div>
				</div>
			{:else if packageType === 'local'}
				<div class="mb-2 col-md-6">
					<div class="input-group has-validation">
						<label for="wheelFile" class="input-group-text">
							<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Upload a wheel file
						</label>
						<input
							class="form-control"
							accept=".whl"
							type="file"
							name="wheelFile"
							id="wheelFile"
							bind:this={wheelFileInput}
							bind:files={wheelFiles}
							class:is-invalid={$validationErrors['file']}
						/>
						{#if wheelFiles && wheelFiles.length > 0}
							<button class="btn btn-outline-secondary" onclick={clearWheelFileUpload}>
								Clear
							</button>
						{/if}
						<span class="invalid-feedback">{$validationErrors['file']}</span>
					</div>
				</div>
			{/if}
			{#if packageType === 'pypi'}
				<div class="col-md-6 mb-2">
					<div class="input-group has-validation">
						<div class="input-group-text">
							<label class="font-monospace" for="package_version">Package Version</label>
						</div>
						<input
							id="package_version"
							name="package_version"
							type="text"
							class="form-control"
							class:is-invalid={$validationErrors['package_version']}
							bind:value={package_version}
						/>
						<span class="invalid-feedback">{$validationErrors['package_version']}</span>
					</div>
				</div>
			{/if}
		</div>
		<div class="row mb-2 mt-2">
			<div class="col">
				<span class="fw-bold text-secondary">Optional arguments</span>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6 mb-2">
				<div class="input-group has-validation">
					<div class="input-group-text">
						<label class="font-monospace" for="python_version">Python Version</label>
					</div>
					<select
						id="python_version"
						name="python_version"
						class="form-select"
						bind:value={python_version}
						class:is-invalid={$validationErrors['python_version']}
					>
						<option value="">Select...</option>
						<option>3.9</option>
						<option>3.10</option>
						<option>3.11</option>
						<option>3.12</option>
					</select>
					<span class="invalid-feedback">{$validationErrors['python_version']}</span>
				</div>
				<div class="form-text">Python version to install and run the package tasks</div>
			</div>
			<div class="col-md-6 mb-2">
				<div class="input-group has-validation">
					<div class="input-group-text">
						<label class="font-monospace" for="package_extras">Package extras</label>
					</div>
					<input
						id="package_extras"
						name="package_extras"
						type="text"
						class="form-control"
						class:is-invalid={$validationErrors['package_extras']}
						bind:value={package_extras}
					/>
					<span class="invalid-feedback">{$validationErrors['package_extras']}</span>
				</div>
				<div class="form-text">
					Package extras to include in the <code>pip install</code> command
				</div>
			</div>
		</div>
		{#if pinnedPackageVersions.length > 0}
			<p class="mt-2">Pinned packages versions:</p>
		{/if}
		{#each pinnedPackageVersions as ppv, i (i)}
			<div class="row">
				<div class="col-xl-6 col-lg-8 col-md-12 mb-2">
					<div class="input-group">
						<label class="input-group-text" for="ppv_key_{i}">Name</label>
						<input
							type="text"
							class="form-control"
							id="ppv_key_{i}"
							bind:value={ppv.key}
							required
						/>
						<label class="input-group-text" for="ppv_value_{i}">Version</label>
						<input
							type="text"
							class="form-control"
							id="ppv_value_{i}"
							bind:value={ppv.value}
							required
						/>
						<button
							class="btn btn-outline-secondary"
							type="button"
							id="ppv_remove_{i}"
							aria-label="Remove pinned package version"
							onclick={(e) => {
								e.preventDefault();
								removePackageVersion(i);
							}}
						>
							<i class="bi bi-trash"></i>
						</button>
					</div>
				</div>
			</div>
		{/each}
		<div class="row">
			<div class="col-12 mb-1">
				<button
					class="btn btn-light"
					onclick={(e) => {
						e.preventDefault();
						addPackageVersion();
					}}
				>
					<i class="bi bi-plus-circle"></i> Add pinned package version
				</button>
			</div>
		</div>

		<TaskGroupSelector
			id="task-collection"
			groupIdsNames={user.group_ids_names || []}
			bind:privateTask
			bind:selectedGroup
		/>

		<div id="taskCollectionError" class="mt-3"></div>

		<div class="row">
			<div class="col-auto">
				<button type="submit" class="btn btn-primary mb-3" disabled={taskCollectionInProgress}>
					{#if taskCollectionInProgress}
						<div class="spinner-border spinner-border-sm" role="status">
							<span class="visually-hidden">Collecting...</span>
						</div>
					{/if}
					Collect
				</button>
			</div>
		</div>
	</form>
	{#if recentActivities.length > 0}
		<a href="/v2/tasks/activities" class="btn btn-light float-end">
			<i class="bi bi-info-circle"></i>
			Show all activities
		</a>
	{/if}
	<h4 class="fw-light mt-3">Task collections</h4>
	{#if recentActivities.length === 0}
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
</div>
