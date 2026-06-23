<script>
	import { page } from '$app/state';
	import { arrayToCsv, downloadBlob } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { sortDropdownUsers } from '$lib/components/admin/user_utilities';
	import Modal from '$lib/components/common/Modal.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { normalizePayload, PropertyDescription } from 'fractal-components';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	let name = $state('');
	let id = $state('');
	let version = $state('');
	let resource = $state('');
	let taskType = $state('');
	let userId = $state('');
	let pkgName = $state('');
	/** @type {boolean|null} */
	let core = $state(null);
	/** @type {boolean|null} */
	let privateGroup = $state(null);
	/** @type {boolean|null} */
	let activeGroup = $state(null);

	let searched = $state(false);
	let searching = $state(false);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	/** @type {Array<import('fractal-components/types/api').Resource>} */
	const resources = $derived(page.data.resources || []);

	/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').TaskV2Info> | undefined} */
	let results = $state();
	let currentPage = $state(1);
	let pageSize = $state(50);
	let totalCount = $state(0);

	/** @type {Modal|undefined} */
	let infoModal = $state();
	/** @type {import('fractal-components/types/api').TaskV2Info|null} */
	let selectedTaskInfo = $state(null);

	let processingCsv = $state(false);

	/** @type {number[]}*/
	let selectedTasks = $state([]);

	const users = $derived(sortDropdownUsers(page.data.users, page.data.userInfo.id));

	let allIds = $derived(results?.items.map((taskInfo) => taskInfo.task.id) ?? []);
	let allSelected = $derived.by(() => {
		if (allIds.length !== selectedTasks.length) {
			return false;
		}
		const selectedSet = new Set(selectedTasks);
		return allIds.every((id) => selectedSet.has(id));
	});

	function getBaseTasksSearchUrl() {
		const url = new URL('/api/admin/v2/task', window.location.origin);
		if (name) {
			url.searchParams.append('name', name);
		}
		if (id) {
			url.searchParams.append('id', id);
		}
		if (version) {
			url.searchParams.append('version', version);
		}
		if (resource) {
			url.searchParams.append('resource_id', resource);
		}
		if (taskType) {
			url.searchParams.append('task_type', taskType);
		}
		if (core !== null) {
			url.searchParams.append('core', core.toString());
		}
		if (userId) {
			url.searchParams.append('owner_id', String(userId));
		}
		if (pkgName) {
			url.searchParams.append('task_group', pkgName);
		}
		if (privateGroup !== null) {
			url.searchParams.append('private', privateGroup.toString());
		}
		if (activeGroup !== null) {
			url.searchParams.append('active', activeGroup.toString());
		}
		return url;
	}

	/**
	 * @param {number} selectedPage
	 * @param {number} selectedPageSize
	 */
	async function searchTasks(selectedPage, selectedPageSize) {
		searching = true;
		selectedTasks = [];
		try {
			if (searchErrorAlert) {
				searchErrorAlert.hide();
			}
			const url = getBaseTasksSearchUrl();
			url.searchParams.append('page', selectedPage.toString());
			url.searchParams.append('page_size', selectedPageSize.toString());
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
			if (results) {
				currentPage = results.current_page;
				pageSize = results.page_size;
				totalCount = results.total_count;
			}
		} finally {
			searching = false;
		}
	}

	/**
	 * @param {number[]} taskIds
	 */
	async function makeCore(taskIds) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch('/api/admin/v2/task/make-core', {
			method: 'POST',
			headers,
			body: normalizePayload(taskIds)
		});
		if (!response.ok) {
			searchErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'searchError'
			);
		} else {
			if (results) {
				results.items = results.items.map((item) => {
					if (taskIds.includes(item.task.id)) {
						return {
							...item,
							task: {
								...item.task,
								is_core: true
							}
						};
					}
					return item;
				});
			}
		}
	}

	/**
	 * @param {number[]} taskIds
	 */
	async function makeNotCore(taskIds) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch('/api/admin/v2/task/make-not-core', {
			method: 'POST',
			headers,
			body: normalizePayload(taskIds)
		});
		if (!response.ok) {
			searchErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'searchError'
			);
		} else {
			if (results) {
				results.items = results.items.map((item) => {
					if (taskIds.includes(item.task.id)) {
						return {
							...item,
							task: {
								...item.task,
								is_core: false
							}
						};
					}
					return item;
				});
			}
		}
	}

	function resetSearchFields() {
		if (searchErrorAlert) {
			searchErrorAlert.hide();
		}
		name = '';
		id = '';
		version = '';
		resource = '';
		taskType = '';
		core = null;
		userId = '';
		pkgName = '';
		privateGroup = null;
		activeGroup = null;
		searched = false;
		results = undefined;
		currentPage = 1;
		totalCount = 0;
		pageSize = 50;
		selectedTasks = [];
	}

	/**
	 *
	 * @param {import('fractal-components/types/api').TaskV2Info} taskInfo
	 */
	function openInfoModal(taskInfo) {
		selectedTaskInfo = taskInfo;
		infoModal?.show();
	}

	function onInfoModalClose() {
		selectedTaskInfo = null;
	}

	/**
	 * @param {import('fractal-components/types/api').TaskV2Info} taskInfo
	 */
	function getUsers(taskInfo) {
		const allEntries = /** @type {string[]} */ (
			taskInfo.relationships
				.flatMap((r) => r.project_users)
				.map((u) => u?.email)
				.filter((e) => !!e)
		);
		return Array.from(new Set(allEntries)).sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: 'base' })
		);
	}

	async function downloadCSV() {
		if (!results) {
			return;
		}

		processingCsv = true;

		const header = ['id', 'name', 'version', 'type', 'number_of_workflows', 'number_of_users'];

		const url = getBaseTasksSearchUrl();
		const response = await fetch(url);
		if (!response.ok) {
			searchErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'searchError'
			);
			processingCsv = false;
			return;
		}

		const { items } =
			/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').TaskV2Info>} */ (
				await response.json()
			);

		const rows = items.map((info) => [
			info.task.id,
			info.task.name,
			info.task.version,
			info.task.type,
			info.relationships.length,
			getUsers(info).length
		]);

		const csv = arrayToCsv([header, ...rows]);
		downloadBlob(csv, 'tasks.csv', 'text/csv;charset=utf-8;');

		processingCsv = false;
	}

	/**
	 * @param {number} taskId
	 */
	function selectTask(taskId) {
		if (selectedTasks.includes(taskId)) {
			selectedTasks = selectedTasks.filter((t) => t !== taskId);
		} else {
			selectedTasks = [...selectedTasks, taskId];
		}
	}
</script>

<div class="container mt-3">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="fw-light">Tasks</h1>
	</div>

	<div class="row">
		<div class="col-lg-12">
			<div class="row">
				<!-- ID -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="id">ID</label>
							<PropertyDescription
								description="Only include the task with this <code>id</code> (if any)."
								html={true}
							/>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<input type="number" class="form-control" bind:value={id} id="id" />
						</div>
					</div>
				</div>
				<!-- Name -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="name">Name</label>
							<PropertyDescription
								description="Only include a task if its <code>name</code> contains this value (case insensitive)."
								html={true}
							/>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<input type="text" class="form-control" bind:value={name} id="name" />
						</div>
					</div>
				</div>
				<!-- Type -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="task_type">Task type</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={taskType} id="task_type">
								<option value="">Select...</option>
								<option value="compound">compound</option>
								<option value="converter_compound">converter_compound</option>
								<option value="non_parallel">non_parallel</option>
								<option value="converter_non_parallel">converter_non_parallel</option>
								<option value="parallel">parallel</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			<div class="row mt-lg-3">
				<!-- Group name -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="pkg-name">Group name</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<input type="text" class="form-control" bind:value={pkgName} id="pkg-name" />
						</div>
					</div>
				</div>
				<!-- Version -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="version">Version</label>
							<PropertyDescription
								description="Only include a task if its <code>version</code> matches this value."
								html={true}
							/>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<input type="text" class="form-control" bind:value={version} id="version" />
						</div>
					</div>
				</div>
				<!-- Owner -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="user">Owner</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={userId} id="user">
								<option value="">Select...</option>
								{#each users as user (user.id)}
									<option value={user.id}>{user.email}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>

			<div class="row mt-lg-3">
				<!-- Core -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="core">Core</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={core} id="core">
								<option value={null}>Select...</option>
								<option value={true}>True</option>
								<option value={false}>False</option>
							</select>
						</div>
					</div>
				</div>
				<!-- Private -->
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
				<!-- Active -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="active">Active</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={activeGroup} id="active">
								<option value={null}>Select...</option>
								<option value={true}>True</option>
								<option value={false}>False</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			<div class="row mt-lg-3">
				<!-- Resource -->
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="resource">Resource</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={resource} id="resource">
								<option value="">Select...</option>
								{#each resources as resource (resource.id)}
									<option value={resource.id}>{resource.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<button
		class="btn btn-primary mt-4"
		onclick={() => searchTasks(1, pageSize)}
		disabled={searching}
	>
		{#if searching}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		{:else}
			<i class="bi bi-search"></i>
		{/if}
		Search tasks
	</button>
	<button class="btn btn-warning mt-4" onclick={resetSearchFields} disabled={searching}>
		Reset
	</button>

	<div id="searchError" class="mt-3 mb-3"></div>

	<div class:d-none={!searched}>
		{#if results && results.total_count === 0}
			<p class="text-center">The query returned 0 matching results</p>
		{/if}

		{#if results && results.items.length > 0}
			<div class="d-flex justify-content-end align-items-center mb-3">
				<div>
					{#if selectedTasks.length > 0}
						<button
							class="btn btn-outline-secondary"
							onclick={async () => {
								await makeCore(selectedTasks);
							}}
							aria-label="Make all core"
						>
							<i class="bi bi-patch-check-fill verified-core-icon"></i>
							Make core
						</button>
						<button
							class="btn btn-outline-secondary"
							onclick={async () => {
								await makeNotCore(selectedTasks);
							}}
							aria-label="Make all not core"
						>
							<i class="bi bi-patch-check text-secondary"></i>
							Make not core
						</button>
					{/if}
					<button class="btn btn-outline-secondary" onclick={downloadCSV} disabled={processingCsv}>
						{#if processingCsv}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
							></span>
						{:else}
							<i class="bi-download"></i>
						{/if}
						Download CSV
					</button>
				</div>
			</div>
			<table class="table tasks-table mt-3 mb-4" style="table-layout: fixed">
				<colgroup>
					<col width="30" />
					<col width="50" />
					<col width="30" />
					<col width="350" />
					<col width="200" />
					<col width="90" />
					<col width="70" />
					<col width="150" />
					<col width="100" />
					<col width="75" />
					<col width="63" />
					<col width="60" />
					<col width="30" />
				</colgroup>
				<thead>
					<tr>
						<th>
							<input
								id="selector-all"
								type="checkbox"
								class="form-check-input"
								onchange={(event) => {
									if (event.currentTarget.checked) {
										selectedTasks = allIds;
									} else {
										selectedTasks = [];
									}
								}}
								checked={allSelected}
								title={allSelected ? 'Deselect all' : 'Select all'}
							/>
						</th>
						<th>ID</th>
						<th></th>
						<th>Name</th>
						<th>Package</th>
						<th>Version</th>
						<th>Active</th>
						<th>Owner</th>
						<th>Group</th>
						<th># Users</th>
						<th># WFs</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each results.items as taskInfo, taskInfoIndex (taskInfoIndex)}
						<tr class:row-grey={taskInfoIndex % 2 === 0}>
							<td>
								<input
									id="selector-{taskInfo.task.id}"
									type="checkbox"
									class="form-check-input"
									onchange={() => selectTask(taskInfo.task.id)}
									checked={selectedTasks.includes(taskInfo.task.id)}
									aria-label="Select task {taskInfo.task.name}"
								/>
							</td>
							<td>{taskInfo.task.id}</td>
							<td class="task-core-col">
								<button
									type="button"
									class="core-icon-button"
									aria-label={taskInfo.task.is_core ? 'Make not core' : 'Make core'}
									title={taskInfo.task.is_core
										? 'The task is core. Click to make it not core.'
										: 'The task is not core. Click to make it core.'}
									onclick={async () => {
										if (taskInfo.task.is_core) {
											await makeNotCore([taskInfo.task.id]);
										} else {
											await makeCore([taskInfo.task.id]);
										}
									}}
								>
									<i
										class={taskInfo.task.is_core
											? 'bi bi-patch-check-fill verified-core-icon'
											: 'bi bi-patch-check text-secondary'}
									></i>
								</button>
							</td>
							<td>
								{taskInfo.task.name}
							</td>
							<td class="text-truncate" title={taskInfo.task.pkg_name}>
								{taskInfo.task.pkg_name}
							</td>
							<td class="text-truncate" title={taskInfo.task.version}>
								{taskInfo.task.version || '-'}
							</td>
							<td><BooleanIcon value={taskInfo.task.active} /></td>
							<td class="text-truncate" title={taskInfo.task.owner}>
								{taskInfo.task.owner}
							</td>
							<td>{taskInfo.task.user_group || '-'}</td>
							<td>{getUsers(taskInfo).length || '-'}</td>
							<td>{taskInfo.relationships.length || '-'}</td>
							<td>
								<button
									class="btn btn-light"
									aria-label="Info"
									onclick={() => openInfoModal(taskInfo)}
								>
									<i class="bi bi-info-circle"></i>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<Paginator
				{currentPage}
				{pageSize}
				{totalCount}
				singleLine={true}
				onPageChange={(currentPage, pageSize) => searchTasks(currentPage, pageSize)}
			/>
		{/if}
	</div>
</div>

<Modal id="taskInfoModal" bind:this={infoModal} size="lg" onClose={onInfoModalClose}>
	{#snippet header()}
		<h1 class="h5 modal-title flex-grow-1">Task info</h1>
	{/snippet}
	{#snippet body()}
		{#if selectedTaskInfo}
			<div class="accordion mb-3" id="accordion-task-properties">
				<div class="accordion-item">
					<h2 class="accordion-header">
						<button
							class="accordion-button collapsed"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#collapse-task-properties"
							aria-expanded="false"
							aria-controls="collapse-task-properties"
						>
							Task properties
						</button>
					</h2>
					<div
						id="collapse-task-properties"
						class="accordion-collapse collapse"
						data-bs-parent="#accordion-task-properties"
					>
						<div class="accordion-body p-0">
							<ul class="list-group noborders">
								<li class="list-group-item list-group-item-light fw-bold">Task id</li>
								<li class="list-group-item">{selectedTaskInfo.task.id}</li>
								<li class="list-group-item list-group-item-light fw-bold">Task name</li>
								<li class="list-group-item">{selectedTaskInfo.task.name}</li>
								<li class="list-group-item list-group-item-light fw-bold">Task type</li>
								<li class="list-group-item">{selectedTaskInfo.task.type}</li>
								<li class="list-group-item list-group-item-light fw-bold">Command non parallel</li>
								<li class="list-group-item">{selectedTaskInfo.task.command_non_parallel || '-'}</li>
								<li class="list-group-item list-group-item-light fw-bold">Command parallel</li>
								<li class="list-group-item">{selectedTaskInfo.task.command_parallel || '-'}</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			{#if getUsers(selectedTaskInfo).length > 0}
				<div class="accordion mb-3" id="accordion-relationships">
					<div class="accordion-item">
						<h2 class="accordion-header">
							<button
								class="accordion-button collapsed"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#collapse-xy"
								aria-expanded="false"
								aria-controls="collapse-xy"
							>
								User list
							</button>
						</h2>
						<div
							id="collapse-xy"
							class="accordion-collapse collapse"
							data-bs-parent="#accordion-relationships"
						>
							<div class="accordion-body p-0">
								<ul class="list-group noborders">
									{#each getUsers(selectedTaskInfo) as user, index (index)}
										<li class="list-group-item">{user}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<p class="lead">Relationships</p>
			{#if selectedTaskInfo.relationships.length === 0}
				<p class="mb-3">No relationships</p>
			{:else}
				<div class="accordion" id="accordion-relationships">
					{#each selectedTaskInfo.relationships as relationship, index (index)}
						<div class="accordion-item">
							<h2 class="accordion-header">
								<button
									class="accordion-button collapsed"
									type="button"
									data-bs-toggle="collapse"
									data-bs-target="#collapse-{index}"
									aria-expanded="false"
									aria-controls="collapse-{index}"
								>
									{relationship.project_name} - {relationship.workflow_name}
								</button>
							</h2>
							<div
								id="collapse-{index}"
								class="accordion-collapse collapse"
								data-bs-parent="#accordion-relationships"
							>
								<div class="accordion-body p-0">
									<ul class="list-group noborders">
										<li class="list-group-item list-group-item-light fw-bold">Project id</li>
										<li class="list-group-item">{relationship.project_id}</li>
										<li class="list-group-item list-group-item-light fw-bold">Project name</li>
										<li class="list-group-item">{relationship.project_name}</li>
										<li class="list-group-item list-group-item-light fw-bold">Workflow id</li>
										<li class="list-group-item">{relationship.workflow_id}</li>
										<li class="list-group-item list-group-item-light fw-bold">Workflow name</li>
										<li class="list-group-item">{relationship.workflow_name}</li>
										<li class="list-group-item list-group-item-light fw-bold">Project users</li>
										<li class="list-group-item p-0">
											{#if relationship.project_users}
												<table class="table table-borderless mb-0">
													<thead>
														<tr>
															<th>User Id</th>
															<th>User E-mail</th>
														</tr>
													</thead>
													<tbody>
														{#each relationship.project_users as user (user.id)}
															<tr>
																<td>{user.id}</td>
																<td>{user.email}</td>
															</tr>
														{/each}
													</tbody>
												</table>
											{:else}
												-
											{/if}
										</li>
									</ul>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	{/snippet}
</Modal>

<style>
	.tasks-table tbody td {
		vertical-align: middle;
	}

	.tasks-table {
		table-layout: fixed;
		min-width: 900px;
	}

	.tasks-table thead {
		word-break: break-word;
	}

	.tasks-table tbody {
		word-break: break-all;
	}

	.row-grey {
		background-color: #f2f2f2;
	}

	.noborders li {
		border-right: 0 !important;
		border-left: 0 !important;
	}
	.noborders li:first-child {
		border-top: 0 !important;
	}
	.noborders li:last-child {
		border-bottom: 0 !important;
	}

	td.task-core-col {
		vertical-align: middle;
		width: 1%;
		white-space: nowrap;
	}

	.core-icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding: 0;
		margin: 0;
		border: 0;
		background: transparent;

		color: inherit;
		line-height: 1;
		cursor: pointer;
		appearance: none;
	}

	.core-icon-button:hover,
	.core-icon-button:active,
	.core-icon-button:focus {
		background: transparent;
		border: 0;
		box-shadow: none;
	}

	.core-icon-button:focus-visible {
		outline: 2px solid #1da1f2;
		outline-offset: 2px;
		border-radius: 999px;
	}

	.verified-core-icon {
		color: #1da1f2;
		line-height: 1;
	}
</style>
