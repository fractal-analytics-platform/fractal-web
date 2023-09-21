<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { collectTaskErrorStore } from '$lib/stores/errorStores';
	import { modalTaskCollectionId } from '$lib/stores/taskStores';
	import TaskCollectionLogsModal from '$lib/components/tasks/TaskCollectionLogsModal.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import { AlertError } from '$lib/common/errors';

	const LOCAL_STORAGE_TASK_COLLECTIONS = 'TaskCollections';

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
	let taskCollections = [];
	let taskCollectionAlreadyPresent = undefined;

	let python_package = '';
	let package_version = '';
	let python_version = '';
	let package_extras = '';

	// On component load set the taskCollections from the local storage
	onMount(async () => {
		if (browser) {
			taskCollections = loadTaskCollectionsFromStorage();
		}
		await updateTaskCollectionsState();
	});

	/**
	 * Requests a task collection to the server
	 * @returns {Promise<*>}
	 */
	async function handleTaskCollection() {
		taskCollectionAlreadyPresent = undefined;

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const requestData = {
			package: python_package,
			// Optional
			package_version,
			python_version,
			package_extras
		};

		const response = await fetch('/api/v1/task/collect/pip', {
			method: 'POST',
			credentials: 'include',
			headers: headers,
			body: JSON.stringify(requestData, replaceEmptyStrings)
		});

		const result = await response.json();
		if (response.ok) {
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
		} else {
			console.error('Task collection request failed: ', result);
			collectTaskErrorStore.set(result);
		}
	}

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
	 * @param {string} taskCollectionId
	 * @returns {Promise<*>}
	 */
	async function getTaskCollection(taskCollectionId) {
		const response = await fetch(`/api/v1/task/collect/${taskCollectionId}?verbose=True`, {
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

	async function updateTaskCollectionsState() {
		const updates = await Promise.allSettled(taskCollections.map((tc) => getTaskCollection(tc.id)));

		const updatedTaskCollections = [];
		for (const update of updates) {
			if (update.status === 'rejected') {
				collectTaskErrorStore.set(update.reason);
			} else {
				const updatedTaskCollection = update.value;
				if (!updatedTaskCollection) {
					// Removing missing task collection
					continue;
				}
				const oldTaskCollection = taskCollections.find((tc) => tc.id === updatedTaskCollection.id);
				if (!oldTaskCollection) {
					continue;
				}
				oldTaskCollection.status = updatedTaskCollection.data.status;
				oldTaskCollection.logs = updatedTaskCollection.data.logs;
				updatedTaskCollections.push(oldTaskCollection);
			}
		}

		// Update task collections list
		updateTaskCollections(updatedTaskCollections);
	}

	function loadTaskCollectionsFromStorage() {
		if (browser) {
			// Parse local storage task collections value
			// @ts-ignore
			return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_TASK_COLLECTIONS)) || [];
		}
		// Fallback to empty task collections list
		return [];
	}

	function updateTaskCollections(updatedCollectionTasks) {
		if (browser) {
			window.localStorage.setItem(
				LOCAL_STORAGE_TASK_COLLECTIONS,
				JSON.stringify(updatedCollectionTasks)
			);
			taskCollections = updatedCollectionTasks;
		}
	}

	async function clearTaskCollections() {
		updateTaskCollections([]);
	}

	function removeTaskCollection(taskCollectionId) {
		updateTaskCollections(taskCollections.filter((tc) => tc.id != taskCollectionId));
	}

	// Component utilities
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
		<div class="row g-3">
			<div class="col-6">
				<div class="input-group">
					<div class="input-group-text">
						<span class="font-monospace">Package</span>
					</div>
					<input
						name="package"
						type="text"
						class="form-control"
						required
						bind:value={python_package}
					/>
				</div>
			</div>
			<div class="col-6">
				<div class="input-group">
					<div class="input-group-text">
						<span class="font-monospace">Package Version</span>
					</div>
					<input
						name="package_version"
						type="text"
						class="form-control"
						bind:value={package_version}
					/>
				</div>
			</div>
			<div class="col-6">
				<div class="input-group">
					<div class="input-group-text">
						<span class="font-monospace">Python Version</span>
					</div>
					<input
						name="python_version"
						type="text"
						class="form-control"
						bind:value={python_version}
					/>
				</div>
			</div>
			<div class="col-6">
				<div class="input-group">
					<div class="input-group-text">
						<span class="font-monospace">Package extras</span>
					</div>
					<input
						name="package_extras"
						type="text"
						class="form-control"
						bind:value={package_extras}
					/>
				</div>
			</div>
			<div class="col-auto">
				<button type="submit" class="btn btn-primary">Collect</button>
			</div>
		</div>
	</form>
	{#if taskCollections.length > 0}
		<hr />
		<div class="">
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
							<button class="btn btn-primary" on:click={updateTaskCollectionsState}>
								Refresh <i class="bi bi-arrow-clockwise" />
							</button>
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
				</tbody>
			</table>
		</div>
	{/if}
</div>
