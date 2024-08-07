<script>
	import { env } from '$env/dynamic/public';
	import { onDestroy, onMount } from 'svelte';
	import { modalTaskCollectionId } from '$lib/stores/taskStores';
	import TaskCollectionLogsModal from '$lib/components/v2/tasks/TaskCollectionLogsModal.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import { AlertError, FormErrorHandler } from '$lib/common/errors';

	const LOCAL_STORAGE_TASK_COLLECTIONS = 'TaskCollectionsV2';

	// This component, when receives a collectTaskAction successful result
	// should store in local storage the collection request id
	// successive reloads of the list of collection requests shall update
	// the status of collections
	// List of collection status:
	// -  installing
	// -  collecting
	// -  fail
	// -  ok
	// If a collection status is ok, the component shall remove the collection
	// request from the localStorage
	// If a collection status is fail, the component shall request the logs
	// If a collection status is collecting, the component shall fetch update
	// If a collection status is installing, the component shall fetch update

	// Component properties
	/** @type {import('$lib/types').TasksCollections[]} */
	let taskCollections = [];
	/** @type {import('$lib/types').TasksCollectionsStateData|undefined} */
	let taskCollectionAlreadyPresent = undefined;

	/** @type {'pypi'|'local'} */
	export let packageType = 'pypi';

	/** @type {() => Promise<void>} */
	export let reloadTaskList;

	let python_package = '';
	let package_version = '';
	let python_version = '';
	let package_extras = '';
	/** @type {{key: string, value: string}[]} */
	let pinnedPackageVersions = [];

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
		taskCollections = loadTaskCollectionsFromStorage();
		await updateTaskCollectionsState();
		updateTasksCollectionTimeout = setTimeout(
			updateTasksCollectionInBackground,
			updateTasksCollectionInterval
		);
	});

	let taskCollectionInProgress = false;

	/**
	 * Requests a task collection to the server
	 * @returns {Promise<*>}
	 */
	async function handleTaskCollection() {
		formErrorHandler.clearErrors();
		taskCollectionAlreadyPresent = undefined;

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const requestData = {
			package: python_package,
			python_version,
			package_extras
		};

		if (packageType === 'pypi') {
			requestData.package_version = package_version;
		}

		const ppv = getPinnedPackageVersionsMap();
		if (ppv) {
			requestData.pinned_package_versions = ppv;
		}

		taskCollectionInProgress = true;
		const response = await fetch(`/api/v2/task/collect/pip`, {
			method: 'POST',
			credentials: 'include',
			headers: headers,
			body: JSON.stringify(requestData, replaceEmptyStrings)
		});
		taskCollectionInProgress = false;

		if (response.ok) {
			const result = /** @type {import('$lib/types').TasksCollectionsState} */ (
				await response.json()
			);
			if (response.status === 200) {
				console.log('Task collection already exists');
				taskCollectionAlreadyPresent = result.data;
				taskCollectionAlreadyPresent.package = python_package;
				setTimeout(() => {
					taskCollectionAlreadyPresent = undefined;
				}, 5500);
			} else {
				console.log('Task collection created', result);
				if (package_version) {
					result.data.package_version = package_version;
				}
				// Add task collection to local storage
				storeCreatedTaskCollection(result);
			}
			python_package = '';
			package_version = '';
			python_version = '';
			package_extras = '';
			pinnedPackageVersions = [];
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
	 * @param {import('$lib/types').TasksCollectionsState} taskCollection
	 */
	function storeCreatedTaskCollection(taskCollection) {
		taskCollections.push({
			id: taskCollection.id,
			status: taskCollection.data.status,
			pkg: taskCollection.data.package,
			package_version: taskCollection.data.package_version,
			timestamp: taskCollection.timestamp
		});
		updateTaskCollections(taskCollections);
	}

	/**
	 * Fetches a task collection from the server
	 * @param {number} taskCollectionId
	 * @returns {Promise<import('$lib/types').TasksCollectionsState|undefined>}
	 */
	async function getTaskCollection(taskCollectionId) {
		const response = await fetch(`/api/v2/task/collect/${taskCollectionId}?verbose=True`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await response.json();
		if (response.ok) {
			console.log('Retrieved collection status', result);
			return result;
		} else {
			if (response.status === 404) {
				console.log(
					`Missing task collection ${taskCollectionId} will be deleted from local storage`
				);
				return undefined;
			} else {
				console.error('Failed to fetch task collection status', result);
				throw new AlertError(result);
			}
		}
	}

	/**
	 * @param {import('$lib/types').TasksCollections[]|null} collectionsToUpdate
	 */
	async function updateTaskCollectionsState(collectionsToUpdate = null) {
		const collections = collectionsToUpdate ?? taskCollections;
		const updates = await Promise.allSettled(collections.map((tc) => getTaskCollection(tc.id)));

		const failure = /** @type {PromiseRejectedResult|undefined} */ (
			updates.find((u) => u.status === 'rejected')
		);
		if (failure) {
			formErrorHandler.setGenericError(failure.reason);
		}

		const successfulUpdates =
			/** @type {PromiseFulfilledResult<import('$lib/types').TasksCollectionsState|undefined>[]} */ (
				updates.filter((u) => u.status === 'fulfilled')
			).map((u) => u.value);

		const updatedTaskCollections = [];

		for (const oldTaskCollection of taskCollections) {
			const updatedTaskCollection = successfulUpdates.find(
				(u) => u !== undefined && u.id === oldTaskCollection.id
			);
			if (!updatedTaskCollection) {
				updatedTaskCollections.push(oldTaskCollection);
				continue;
			}
			oldTaskCollection.status = updatedTaskCollection.data.status;
			oldTaskCollection.logs = updatedTaskCollection.data.logs;
			updatedTaskCollections.push(oldTaskCollection);
		}

		// Update task collections list
		updateTaskCollections(updatedTaskCollections);
	}

	/**
	 * @returns {import('$lib/types').TasksCollections[]}
	 */
	function loadTaskCollectionsFromStorage() {
		// Parse local storage task collections value
		const storageContent = window.localStorage.getItem(LOCAL_STORAGE_TASK_COLLECTIONS);
		if (storageContent) {
			return JSON.parse(storageContent) || [];
		}
		return [];
	}

	/**
	 * @param {import('$lib/types').TasksCollections[]} updatedCollectionTasks
	 */
	function updateTaskCollections(updatedCollectionTasks) {
		window.localStorage.setItem(
			LOCAL_STORAGE_TASK_COLLECTIONS,
			JSON.stringify(updatedCollectionTasks)
		);
		taskCollections = updatedCollectionTasks;
	}

	async function clearTaskCollections() {
		updateTaskCollections([]);
	}

	/**
	 * @param {number} taskCollectionId
	 */
	function removeTaskCollection(taskCollectionId) {
		updateTaskCollections(taskCollections.filter((tc) => tc.id != taskCollectionId));
	}

	/**
	 * @param {import('$lib/types').TaskCollectStatus} status
	 */
	function statusBadge(status) {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'text-bg-light';
			case 'installing':
			case 'collecting':
				return 'text-bg-primary';
			case 'fail':
				return 'text-bg-danger';
			case 'ok':
				return 'text-bg-success';
		}
	}

	function setTaskCollectionLogsModal(event) {
		const id = event.currentTarget.getAttribute('data-fc-tc');
		modalTaskCollectionId.set(id);
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
		const collectionsToCheck = taskCollections.filter(
			(t) => t.status !== 'OK' && t.status !== 'fail'
		);
		if (collectionsToCheck.length > 0) {
			const collectionsToCheckIds = collectionsToCheck.map((c) => c.id);
			await updateTaskCollectionsState(collectionsToCheck);
			const newOkTasks = taskCollections.filter(
				(t) => collectionsToCheckIds.includes(t.id) && t.status === 'OK'
			).length;
			if (newOkTasks > 0) {
				await reloadTaskList();
			}
		}
		clearTimeout(updateTasksCollectionTimeout);
		updateTasksCollectionTimeout = setTimeout(
			updateTasksCollectionInBackground,
			updateTasksCollectionInterval
		);
	}

	onDestroy(() => {
		clearTimeout(updateTasksCollectionTimeout);
	});
</script>

<TaskCollectionLogsModal />

<div>
	{#if taskCollectionAlreadyPresent}
		<div id="task-collection-already-present" class="alert alert-success">
			<div>{taskCollectionAlreadyPresent.package}</div>
			<div class="mt-2 fw-bold">{taskCollectionAlreadyPresent.info}</div>
		</div>
	{/if}
	<form on:submit|preventDefault={handleTaskCollection}>
		<div class="row">
			<div
				class="mb-2"
				class:col-md-6={packageType === 'pypi'}
				class:col-md-12={packageType === 'local'}
			>
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
				<div class="form-text">
					{#if packageType === 'pypi'}
						The name of a package published on PyPI
					{:else}
						The full path to a wheel file
					{/if}
				</div>
			</div>
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
						class="form-control"
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
		{#each pinnedPackageVersions as ppv, i}
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
							on:click|preventDefault={() => removePackageVersion(i)}
						>
							<i class="bi bi-trash" />
						</button>
					</div>
				</div>
			</div>
		{/each}
		<div class="row">
			<div class="col-12 mb-1">
				<button class="btn btn-light" on:click|preventDefault={addPackageVersion}>
					<i class="bi bi-plus-circle" /> Add pinned package version
				</button>
			</div>
		</div>

		<div id="taskCollectionError" class="mt-3" />

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
	{#if taskCollections.length > 0}
		<div class="mb-5">
			<table class="table table-hover caption-top align-middle">
				<caption class="text-bg-light border-top border-bottom pe-3 ps-3">
					<div class="d-flex align-items-center justify-content-between">
						<span class="fw-normal">Task collections</span>
						<div>
							<ConfirmActionButton
								modalId="confirmClearTaskCollections"
								btnStyle="outline-secondary"
								buttonIcon="trash"
								label="Clear"
								message="Clear task collections requests"
								callbackAction={clearTaskCollections}
							/>
						</div>
					</div>
				</caption>
				<thead>
					<tr>
						<th>Timestamp</th>
						<th>Package</th>
						<th>Version</th>
						<th>Status</th>
						<th>Options</th>
					</tr>
				</thead>
				<tbody>
					{#key taskCollections}
						{#each taskCollections as { timestamp, status, package_version, pkg, id, logs }}
							<tr>
								<td class="col-2">{new Date(timestamp).toLocaleString()}</td>
								<td>{pkg}</td>
								<td class="col-1">
									<code>{package_version ? package_version : 'Unspecified'}</code>
								</td>
								<td class="col-1"><span class="badge {statusBadge(status)}">{status}</span></td>
								<td class="col-2">
									<ConfirmActionButton
										modalId="removeTaskCollectionModal{id}"
										btnStyle="warning"
										buttonIcon="trash"
										message="Remove a task collection log"
										callbackAction={async () => removeTaskCollection(id)}
									/>
									{#if status == 'fail' || (status == 'OK' && logs !== '')}
										<button
											class="btn btn-info"
											data-fc-tc={id}
											data-bs-toggle="modal"
											data-bs-target="#collectionTaskLogsModal"
											on:click={setTaskCollectionLogsModal}
										>
											<i class="bi bi-info-circle" />
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					{/key}
				</tbody>
			</table>
		</div>
	{/if}
</div>
