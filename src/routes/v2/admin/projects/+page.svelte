<script>
	import { page } from '$app/state';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { PropertyDescription } from 'fractal-components';
	import { sortUsers } from '$lib/components/admin/user_utilities';
	import { updateFormEntry } from '$lib/components/v2/workflow/task_form_utils';

	let name = $state('');
	let id = $state('');

	/** @type {string|undefined} */
	let userId = $state(undefined);

	const currentUserId = $derived(page.data.userInfo.id);
	const users = $derived(sortDropdownUsers(page.data.users));

	/**
	 * @param {import('fractal-components/types/api').User[]} users
	 */
	function sortDropdownUsers(users) {
		const usersCopy =
			/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */ ([...users]);
		sortUsers(usersCopy, currentUserId, false);
		return usersCopy;
	}

	let searched = $state(false);
	let searching = $state(false);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').ProjectSuperuser> | undefined} */
	let results = $state();

	let currentPage = $state(1);
	let pageSize = $state(50);
	let totalCount = $state(0);

	/** @type {Modal|undefined} */
	let changeOwnershipModal = $state();
	/** @type {import('fractal-components/types/api').ProjectSuperuser|null} */
	let selectedProject = $state(null);
	/** @type {string|undefined} */
	let newOwnerId = $state(undefined);
	let confirmation = $state(false);

	/**
	 * @param {import('fractal-components/types/api').ProjectSuperuser} project
	 */
	function openChangeOwnershipModal(project) {
		selectedProject = project;
		changeOwnershipModal?.show();
	}

	function onChangeOwnershipModalClose() {
		confirmation = false;
		selectedProject = null;
		newOwnerId = undefined;
	}

	function getBaseProjectsSearchUrl() {
		const url = new URL('/api/admin/v2/project', window.location.origin);
		if (name) {
			url.searchParams.append('name', name);
		}
		if (id) {
			url.searchParams.append('project_id', id);
		}
		if (userId) {
			url.searchParams.append(
				'user_email',
				users.find((user) => String(user.id) == userId)?.email || ''
			);
		}
		return url;
	}

	/**
	 * @param {number} selectedPage
	 * @param {number} selectedPageSize
	 */
	async function searchProject(selectedPage, selectedPageSize) {
		searching = true;
		try {
			if (searchErrorAlert) {
				searchErrorAlert.hide();
			}
			const url = getBaseProjectsSearchUrl();
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

	function resetSearchFields() {
		if (searchErrorAlert) {
			searchErrorAlert.hide();
		}
		name = '';
		id = '';
		userId = undefined;
		searched = false;
		results = undefined;
		currentPage = 1;
		totalCount = 0;
		pageSize = 50;
	}

	async function handleChangeOwner() {
		changeOwnershipModal?.confirmAndHide(async () => {
			const response = await fetch(
				`/api/admin/v2/project/${selectedProject?.id}?user_id=${newOwnerId}`,
				{
					method: 'PATCH',
					credentials: 'include'
				}
			);
			if (!response.ok) {
				throw await getAlertErrorFromResponse(response);
			}
			await searchProject(currentPage, pageSize);
			});
	}
</script>

<div class="container mt-3">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="fw-light">Projects</h1>
	</div>

	<div class="row">
		<div class="col-lg-12">
			<div class="row">
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="id">Id</label>
							<PropertyDescription
								description="Only include the project with this <code>id</code> (if any)."
								html={true}
							/>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<input type="number" class="form-control" bind:value={id} id="id" />
						</div>
					</div>
				</div>
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="name">Name</label>
							<PropertyDescription
								description="Only include a project if its <code>name</code> contains this value (case insensitive)."
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
						<label class="col-3 col-form-label" for="user">User</label>
						<div class="col-9">
							<select class="form-select" bind:value={userId} id="user">
								<option value={undefined}>All</option>
								{#each users as user (user.id)}
									<option value={user.id}>{user.email}</option>
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
		onclick={() => searchProject(1, pageSize)}
		disabled={searching}
	>
		{#if searching}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		{:else}
			<i class="bi bi-search"></i>
		{/if}
		Search projects
	</button>
	<button class="btn btn-warning mt-4" onclick={resetSearchFields} disabled={searching}>
		Reset
	</button>

	<div id="searchError" class="mt-3 mb-3"></div>

	<div class="row">
		<div class="col">
			<div class:d-none={!searched}>
				{#if results && results.total_count === 0}
					<p class="text-center">The query returned 0 matching results</p>
				{/if}

				{#if results && results.items.length > 0}
					<table class="table tasks-table mt-4 mb-4">
						<thead>
							<tr>
								<th>Project Id</th>
								<th>Project Name</th>
								<th>User</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each results.items as project, index (index)}
								<tr>
									<td>{project.id}</td>
									<td>{project.name}</td>
									<td>
										<a
											href={`/v2/admin/users/${users.find((user) => user.email === project.user_email)?.id}`}
										>
											{project.user_email}
										</a>
									</td>
									<td>
										<button
											class="btn btn-outline-primary"
											onclick={() => openChangeOwnershipModal(project)}
										>
											Change ownership
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
						onPageChange={(currentPage, pageSize) => searchProject(currentPage, pageSize)}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<Modal
	id="changeOwnershipModal"
	bind:this={changeOwnershipModal}
	size="lg"
	onClose={onChangeOwnershipModalClose}
>
	{#snippet body()}
		{#if !confirmation}
			<p class="mb-3">
				Transfer the ownership of Project {selectedProject?.id}
				(<strong>{selectedProject?.name}</strong>) to a new user.
			</p>

			<div class="alert alert-warning d-flex align-items-center gap-2">
				<i class="bi bi-exclamation-triangle-fill"></i>
				<div>
					The current owner (<code>{selectedProject?.user_email}</code>) will lose access to this
					project.
				</div>
			</div>

			<div class="row mt-1">
				<label class="col-3 col-form-label" for="user">New owner</label>
				<div class="col-9">
					<select class="form-select" bind:value={newOwnerId} id="user">
						<option value={undefined}>Select...</option>
						{#each users.filter((user) => user.email !== selectedProject?.user_email) as user (user.id)}
							<option value={user.id}>{user.email}</option>
						{/each}
					</select>
				</div>
			</div>
			<button
				class="btn btn-primary mt-4"
				onclick={() => {confirmation = true;}}
				disabled={!newOwnerId}
			>
				Change owner
			</button>
		{:else}
			<div class="mb-4">
				<p class="mb-2">
					You are about to transfer ownership of Project {selectedProject?.id}
					(<strong>{selectedProject?.name}</strong>):
				</p>

				<div class="p-3 border rounded bg-light">
					<div class="mb-2">
						<span class="text-muted">From</span> <br />
						<code>{selectedProject?.user_email}</code>
					</div>

					<div>
						<span class="text-muted">To</span> <br />
						<code>
							{users.find((user) => String(user.id) == newOwnerId)?.email}
						</code>
					</div>
				</div>
			</div>
			<div id="errorAlert-changeOwnershipModal" class="mt-3"></div>
			<div class="d-flex gap-2">
				<button class="btn btn-primary" onclick={handleChangeOwner}>
					Confirm
				</button>

				<button
					class="btn btn-danger"
					onclick={() => {
						confirmation = false;
						newOwnerId = undefined;
					}}
				>
					Cancel
				</button>
			</div>
		{/if}


	{/snippet}
</Modal>
