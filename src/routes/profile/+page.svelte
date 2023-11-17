<script>
	import { page } from '$app/stores';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import('$lib/types').User} */
	$: user = $page.data.userInfo;
</script>

<h3>My account</h3>

<div class="row mt-4">
	<div class="col-md-8 col-lg-6">
		<table class="table">
			<tbody>
				<tr>
					<th>User ID</th>
					<td>{user.id}</td>
				</tr>
				<tr>
					<th>E-mail</th>
					<td>{user.email}</td>
				</tr>
				<tr>
					<th>Username</th>
					<td>{user.username || '-'}</td>
				</tr>
				<tr>
					<th>Active</th>
					<td><BooleanIcon value={user.is_active} /></td>
				</tr>
				<tr>
					<th>Superuser</th>
					<td><BooleanIcon value={user.is_superuser} /></td>
				</tr>
				<tr>
					<th>Verified</th>
					<td><BooleanIcon value={user.is_verified} /></td>
				</tr>
				<tr>
					<th>Slurm user</th>
					<td>{user.slurm_user || '-'}</td>
				</tr>
				<tr>
					<th>Cache dir</th>
					<td>{user.cache_dir || '-'}</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
