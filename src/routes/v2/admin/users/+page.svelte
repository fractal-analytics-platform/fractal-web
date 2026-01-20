<script>
	import { page } from '$app/state';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { sortUsers } from '$lib/components/admin/user_utilities';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { onMount } from 'svelte';

	const currentUserId = $derived(page.data.userInfo?.id);
	const currentUserEmail = $derived(page.data.userInfo?.email);
	/** @type {Array<import('fractal-components/types/api').Profile>} */
	const profiles = $derived(page.data.profiles);

	/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */
	let users = $state([]);
	/** @type {Record<string, import('fractal-components/types/api').Profile | undefined>} */
	const userProfiles = $derived(
		Object.fromEntries(users.map((u) => [u.id, profiles.find((p) => p.id === u.profile_id)]))
	);

	const deleteEnabled = false;

	/**
	 * @param {number} userId
	 */
	async function handleDeleteUser(userId) {
		const response = await fetch(`/api/auth/users/${userId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		users = sortUsers(
			users.filter((u) => u.id !== userId),
			currentUserId
		);
	}

	onMount(() => {
		users = sortUsers(page.data.users, currentUserId);
	});
</script>

<div class="container mt-3">
	<a href="/v2/admin/users/register" class="btn btn-primary float-end">
		<i class="bi bi-person-fill-add"></i>
		Register new user
	</a>

	<h1 class="fw-light">Users list</h1>

	<table class="table mt-3">
		<thead>
			<tr>
				<th>Id</th>
				<th>E-mail</th>
				<th>Active</th>
				<th>Superuser</th>
				<th>Verified</th>
				<th>Guest</th>
				<th>Profile</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#key users}
				{#each users as user (user.id)}
					<tr class="align-middle">
						<td>{user.id}</td>
						<td>{user.email}</td>
						<td><BooleanIcon value={user.is_active} /></td>
						<td><BooleanIcon value={user.is_superuser} /></td>
						<td><BooleanIcon value={user.is_verified} /></td>
						<td><BooleanIcon value={user.is_guest} /></td>
						<td>
							{#if userProfiles[user.id]}
								<a
									href="/v2/admin/resources/{userProfiles[user.id]
										?.resource_id}/profiles/{userProfiles[user.id]?.id}"
								>
									{userProfiles[user.id]?.name}
								</a>
							{:else}
								-
							{/if}
						</td>
						<td>
							<a href="/v2/admin/users/{user.id}" class="btn btn-light">
								<i class="bi-info-circle"></i> Info
							</a>
							<a href="/v2/admin/users/{user.id}/edit" class="btn btn-primary">
								<i class="bi bi-pencil"></i> Edit
							</a>
							{#if deleteEnabled && user.email !== currentUserEmail}
								<ConfirmActionButton
									modalId={'confirmDeleteProject' + user.id}
									style="danger"
									btnStyle="danger"
									message="Delete user {user.email}"
									buttonIcon="trash"
									label="Delete"
									callbackAction={() => handleDeleteUser(user.id)}
								/>
							{/if}
						</td>
					</tr>
				{/each}
			{/key}
		</tbody>
	</table>
</div>
