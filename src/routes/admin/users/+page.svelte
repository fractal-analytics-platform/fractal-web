<script>
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';

	/** @type {Array<import('$lib/types').User & {id: number}>} */
	let users = $page.data.users;

	/**
	 * @param {number} userId
	 */
	async function handleDeleteUser(userId) {
		const response = await fetch(`/auth/users/${userId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			const result = await response.json();
			throw new AlertError(result);
		}
		users = users.filter((u) => u.id !== userId);
	}
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		<li class="breadcrumb-item">
			<a href="/admin">Admin area</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">Manage users</li>
	</ol>
</nav>

<a href="/admin/users/register" class="btn btn-primary float-end">
	<i class="bi bi-person-fill-add" />
	Register new user
</a>

<h3>Users list</h3>

<table class="table mt-3">
	<thead>
		<tr>
			<th>Id</th>
			<th>E-mail</th>
			<th>Username</th>
			<th>Active</th>
			<th>Superuser</th>
			<th>Verified</th>
			<th>Slurm user</th>
			<th>Actions</th>
		</tr>
	</thead>
	<tbody>
		{#each users as user}
			<tr class="align-middle">
				<td>{user.id}</td>
				<td>{user.email}</td>
				<td>{user.username || '-'}</td>
				<td><BooleanIcon value={user.is_active} /></td>
				<td><BooleanIcon value={user.is_superuser} /></td>
				<td><BooleanIcon value={user.is_verified} /></td>
				<td>{user.slurm_user || '-'}</td>
				<td>
					<a href="/admin/users/{user.id}" class="btn btn-primary">
						<i class="bi bi-pencil" /> Edit
					</a>
					<ConfirmActionButton
						modalId={'confirmDeleteProject' + user.id}
						style={'danger'}
						btnStyle="danger"
						message="Delete user {user.email}"
						buttonIcon="trash"
						label="Delete"
						callbackAction={() => handleDeleteUser(user.id)}
					/>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
