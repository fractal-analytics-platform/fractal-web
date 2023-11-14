<script>
	import { page } from '$app/stores';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import('$lib/types').User[]} */
	const users = $page.data.users;
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		<li class="breadcrumb-item">
			<a href="/admin">Admin area</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">Manage users</li>
	</ol>
</nav>

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
			<th />
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
				</td>
			</tr>
		{/each}
	</tbody>
</table>
