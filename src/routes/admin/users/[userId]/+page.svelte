<script>
	import { page } from '$app/stores';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import('$lib/types').User} */
	const user = $page.data.user;
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		<li class="breadcrumb-item">
			<a href="/admin">Admin area</a>
		</li>
		<li class="breadcrumb-item">
			<a href="/admin/users">Manage users</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">
			User #{user.id} ({user.email})
		</li>
	</ol>
</nav>

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
					<th>SLURM user</th>
					<td>{user.slurm_user || '-'}</td>
				</tr>
				<tr>
					<th>SLURM accounts</th>
					<td>
						{#if user.slurm_accounts.length > 0}
							{#each user.slurm_accounts as account}
								<span class="badge text-bg-light fw-normal fs-6">{account}</span>
								&nbsp;
							{/each}
						{:else}
							-
						{/if}
					</td>
				</tr>
				<tr>
					<th>Cache dir</th>
					<td>{user.cache_dir || '-'}</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
