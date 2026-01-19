<script>
	import { page } from '$app/state';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { sortDropdownUsers } from '$lib/components/admin/user_utilities';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	const currentUserId = $derived(page.data.userInfo.id);
	const sortedUsers = $derived(sortDropdownUsers([...page.data.users], currentUserId));

	let searched = $state(false);
	let searching = $state(false);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').LinkUserProjectRead> | undefined} */
	let results = $state();
	let currentPage = $state(1);
	let pageSize = $state(50);
	let totalCount = $state(0);

	let projectId = $state('');
	let userId = $state('');
	let isVerified = $state('');
	let isOwner = $state('');

	/**
	 * @param {number} selectedPage
	 * @param {number} selectedPageSize
	 */
	async function search(selectedPage, selectedPageSize) {
		searching = true;
		try {
			if (searchErrorAlert) {
				searchErrorAlert.hide();
			}
			const url = new URL('/api/admin/v2/linkuserproject', window.location.origin);
			if (projectId) {
				url.searchParams.append('project_id', projectId);
			}
			if (userId) {
				url.searchParams.append('user_id', userId);
			}
			if (isVerified) {
				url.searchParams.append('is_verified', isVerified);
			}
			if (isOwner) {
				url.searchParams.append('is_owner', isOwner);
			}

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

	async function resetSearchFields() {
		if (searchErrorAlert) {
			searchErrorAlert.hide();
		}
		projectId = '';
		userId = '';
		isVerified = '';
		isOwner = '';
		searched = false;
		results = undefined;
		currentPage = 1;
		totalCount = 0;
		pageSize = 50;
	}

	/**
	 * @param {number} guestUserId
	 * @param {number} projectId
	 */
	async function verifyGuestInvitation(guestUserId, projectId) {
		const response = await fetch(
			`/api/admin/v2/linkuserproject/verify/?guest_user_id=${guestUserId}&project_id=${projectId}`, {
			method: 'POST'
		});
		if (response.ok) {
			const link = results?.items.find(
				link => link.project_id === projectId && link.user_id === guestUserId
			);
			link.is_verified = true;
			return response.ok;
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<div class="container mt-3">
	<div class="row">
		<div class="col">
			<h1 class="fw-light">Projects Sharing</h1>
		</div>
	</div>

	<div class="row mt-3">
		<div class="col-lg-12">
			<div class="row">
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="projectId">Project Id</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<input type="number" class="form-control" bind:value={projectId} id="projectId" />
						</div>
					</div>
				</div>
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="user">User</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={userId} id="user">
								<option value="">Select...</option>
								{#each sortedUsers as user (user.id)}
									<option value={user.id}>{user.email}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="row mt-2">
		<div class="col-lg-12">
			<div class="row">
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="is_verified">Is Verified</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={isVerified} id="is_verified">
								<option value="">Select...</option>
								<option value="true">True</option>
								<option value="false">False</option>
							</select>
						</div>
					</div>
				</div>
				<div class="col-lg-4 pe-5">
					<div class="row mt-1">
						<div class="col-xl-4 col-lg-5 col-3 col-form-label">
							<label for="is_owner">Is Owner</label>
						</div>
						<div class="col-xl-8 col-lg-7 col-9">
							<select class="form-select" bind:value={isOwner} id="is_owner">
								<option value="">Select...</option>
								<option value="true">True</option>
								<option value="false">False</option>
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col">
			<button class="btn btn-primary mt-4" onclick={() => search(1, pageSize)} disabled={searching}>
				{#if searching}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{:else}
					<i class="bi bi-search"></i>
				{/if}
				Search
			</button>
			<button class="btn btn-warning mt-4" onclick={resetSearchFields} disabled={searching}>
				Reset
			</button>
			<div id="searchError" class="mt-3 mb-3"></div>
		</div>
	</div>

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
								<th>Owner</th>
								<th>Verified</th>
								<th>Permissions</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each results.items as link, index (index)}
								<tr>
									<td>{link.project_id}</td>
									<td>{link.project_name}</td>
									<td>
										<a href={`/v2/admin/users/${link.user_id}`}>
											{link.user_email}
										</a>
									</td>
									<td>
										<BooleanIcon value={link.is_owner} />
									</td>
									<td>
										<BooleanIcon value={link.is_verified} />
									</td>
									<td>{link.permissions}</td>
									<td>
										{#if !link.is_verified && sortedUsers.find(user => user.email === link.user_email)?.is_guest}
											<button
												type="button"
												class="btn btn-primary"
												onclick={() => verifyGuestInvitation(link.user_id, link.project_id)}
											>
												<i class="bi bi-shield-fill-check"></i>
												Verify
											</button>
										{/if}
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
						onPageChange={(currentPage, pageSize) => search(currentPage, pageSize)}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>
