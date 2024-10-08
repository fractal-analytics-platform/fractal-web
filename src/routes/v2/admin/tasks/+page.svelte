<script>
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import { PropertyDescription } from 'fractal-jschema';

	let name = '';
	let kind = '';
	let id = '';
	let source = '';
	let version = '';
	let max_number_of_results = '25';

	let searched = false;
	let searching = false;
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	/** @type {import('$lib/types-v2').TaskV2Info[]} */
	let results = [];

	/** @type {Modal} */
	let infoModal;
	/** @type {import('$lib/types-v2').TaskV2Info|null} */
	let selectedTaskInfo = null;

	async function searchTasks() {
		searching = true;
		try {
			if (searchErrorAlert) {
				searchErrorAlert.hide();
			}
			const url = new URL('/api/admin/v2/task', window.location.origin);
			if (id) {
				url.searchParams.append('id', id);
			}
			if (name) {
				url.searchParams.append('name', name);
			}
			if (id) {
				url.searchParams.append('id', id);
			}
			if (kind) {
				url.searchParams.append('kind', kind);
			}
			if (source) {
				url.searchParams.append('source', source);
			}
			if (version) {
				url.searchParams.append('version', version);
			}
			if (max_number_of_results) {
				url.searchParams.append('max_number_of_results', max_number_of_results);
			}
			const response = await fetch(url);
			const result = await response.json();
			if (!response.ok) {
				searchErrorAlert = displayStandardErrorAlert(
					new AlertError(result, response.status),
					'searchError'
				);
				return;
			}
			searched = true;
			results = result;
		} finally {
			searching = false;
		}
	}

	function resetSearchFields() {
		if (searchErrorAlert) {
			searchErrorAlert.hide();
		}
		name = '';
		kind = '';
		id = '';
		source = '';
		version = '';
		max_number_of_results = '25';
		searched = false;
		results = [];
	}

	/**
	 *
	 * @param {import('$lib/types-v2').TaskV2Info} taskInfo
	 */
	function openInfoModal(taskInfo) {
		selectedTaskInfo = taskInfo;
		infoModal.show();
	}

	function onInfoModalClose() {
		selectedTaskInfo = null;
	}

	/**
	 * @param {number} index
	 */
	function toggleUsersList(index) {
		const list = document.getElementById(`users-list-${index}`);
		const toggler = document.getElementById(`users-list-toggler-${index}`);
		if (list && toggler) {
			toggler.innerText = list.classList.contains('d-none') ? 'Hide' : 'Show';
			list.classList.toggle('d-none');
		}
	}

	/**
	 * @param {import('$lib/types-v2').TaskV2Info} taskInfo
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
</script>

<div>
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="fw-light">Tasks</h1>
	</div>
</div>

<div class="row">
	<div class="col-lg-12">
		<div class="row">
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
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="kind">Kind</label>
						<PropertyDescription
							description="If <code>Common</code>, only include tasks with null <code>owner</code>.<br/>If <code>Users</code>, only include tasks with non-null <code>owner.</code>"
							html={true}
						/>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<select class="form-control" bind:value={kind} id="kind">
							<option value="">All</option>
							<option value="common">Common</option>
							<option value="users">Users</option>
						</select>
					</div>
				</div>
			</div>
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="id">Id</label>
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
		</div>

		<div class="row mt-lg-3">
			<div class="col-lg-4 pe-5">
				<div class="row mt-1">
					<div class="col-xl-4 col-lg-5 col-3 col-form-label">
						<label for="source">Source</label>
						<PropertyDescription
							description="Only include a task if its <code>source</code> contains this value (case insensitive)."
							html={true}
						/>
					</div>
					<div class="col-xl-8 col-lg-7 col-9">
						<input type="text" class="form-control" bind:value={source} id="source" />
					</div>
				</div>
			</div>
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
		</div>

		<div class="row mt-lg-3">
			<div class="col-xl-5 col-lg-6 pe-5">
				<div class="row mt-1">
					<div class="col-xl-7 col-lg-8 col-6 col-form-label">
						<label for="max_number_of_results">Max number of results</label>
						<PropertyDescription
							description="Upper limit on the number of tasks in the response."
							html={true}
						/>
					</div>
					<div class="col-xl-4 col-lg-4 col-6">
						<input
							type="number"
							class="form-control"
							bind:value={max_number_of_results}
							id="max_number_of_results"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<button class="btn btn-primary mt-4" on:click={searchTasks} disabled={searching}>
	{#if searching}
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
	{:else}
		<i class="bi bi-search" />
	{/if}
	Search tasks
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
		<table class="table tasks-table mt-4">
			<colgroup>
				<col width="60" />
				<col width="160" />
				<col width="160" />
				<col width="90" />
				<col width="80" />
				<col width="120" />
				<col width="150" />
				<col width="100" />
			</colgroup>
			<thead>
				<tr>
					<th>Id</th>
					<th>Name</th>
					<th>Source</th>
					<th>Owner</th>
					<th>Version</th>
					<th># Workflows</th>
					<th># Users</th>
					<th>Options</th>
				</tr>
			</thead>
			<tbody>
				{#each results as taskInfo, taskInfoIndex}
					<tr class:row-grey={taskInfoIndex % 2 === 0}>
						<td>{taskInfo.task.id}</td>
						<td>{taskInfo.task.name}</td>
						<td>{taskInfo.task.source || '-'}</td>
						<td>{taskInfo.task.owner || '-'}</td>
						<td>{taskInfo.task.version || '-'}</td>
						<td>
							{taskInfo.relationships.length || '-'}
						</td>
						<td>
							{#if getUsers(taskInfo).length > 0}
								{getUsers(taskInfo).length}
								<button
									class="btn btn-link"
									id="users-list-toggler-{taskInfoIndex}"
									on:click={() => toggleUsersList(taskInfoIndex)}
								>
									Show
								</button>
								<div class="d-none" id="users-list-{taskInfoIndex}">
									{#each getUsers(taskInfo) as user}
										{user}<br />
									{/each}
								</div>
							{:else}
								-
							{/if}
						</td>
						<td>
							<button class="btn btn-light" on:click={() => openInfoModal(taskInfo)}>
								<i class="bi bi-info-circle" />
								Info
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<Modal id="taskInfoModal" bind:this={infoModal} size="lg" onClose={onInfoModalClose}>
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title flex-grow-1">Task info</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
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
								<li class="list-group-item list-group-item-light fw-bold">Task owner</li>
								<li class="list-group-item">{selectedTaskInfo.task.owner || '-'}</li>
								<li class="list-group-item list-group-item-light fw-bold">Task source</li>
								<li class="list-group-item">{selectedTaskInfo.task.source}</li>
								<li class="list-group-item list-group-item-light fw-bold">Command non parallel</li>
								<li class="list-group-item">{selectedTaskInfo.task.command_non_parallel || '-'}</li>
								<li class="list-group-item list-group-item-light fw-bold">Command parallel</li>
								<li class="list-group-item">{selectedTaskInfo.task.command_parallel || '-'}</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<p class="lead">Relationships</p>
			{#if selectedTaskInfo.relationships.length === 0}
				<p class="mb-3">No relationships</p>
			{:else}
				<div class="accordion" id="accordion-relationships">
					{#each selectedTaskInfo.relationships as relationship, index}
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
														{#each relationship.project_users as user}
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
	</svelte:fragment>
</Modal>

<style>
	.tasks-table {
		table-layout: fixed;
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
</style>
