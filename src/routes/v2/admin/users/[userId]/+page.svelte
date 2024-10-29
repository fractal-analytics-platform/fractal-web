<script>
	import { page } from '$app/stores';
	import { sortGroupByNameAllFirstComparator } from '$lib/components/admin/user_utilities.js';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import('$lib/types').User & {group_ids_names: Array<[number, string]>}} */
	const user = $page.data.user;
	/** @type {import('$lib/types').UserSettings} */
	const settings = $page.data.settings;
	/** @type {Array<import('$lib/types').Group>} */
	const groups = $page.data.groups;
	/** @type {string} */
	const runnerBackend = $page.data.runnerBackend;

	$: userGroups = user.group_ids_names
		.map((ni) => groups.filter((g) => g.id === ni[0])[0])
		.sort(sortGroupByNameAllFirstComparator);
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		<li class="breadcrumb-item">
			<a href="/v2/admin">Admin area</a>
		</li>
		<li class="breadcrumb-item">
			<a href="/v2/admin/users">Manage users</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">
			User #{user.id} ({user.email})
		</li>
	</ol>
</nav>

<a href="/v2/admin/users/{user.id}/edit" class="btn btn-primary float-end">
	<i class="bi bi-pencil" />
	Edit
</a>

<div class="row mt-4">
	<div class="col-md-10 col-lg-8">
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
					<th>Groups</th>
					<td>
						{#each userGroups as group}
							<a href="/v2/admin/groups/{group.id}" class="me-2">{group.name}</a>
						{/each}
					</td>
				</tr>
			</tbody>
		</table>

		{#if runnerBackend === 'slurm' || runnerBackend === 'slurm_ssh'}
			<h4 class="fw-light ms-2 mt-4">Settings</h4>
			<table class="table">
				<tbody>
					{#if runnerBackend === 'slurm'}
						<tr>
							<th>SLURM user</th>
							<td>{settings.slurm_user || '-'}</td>
						</tr>
						<tr>
							<th>Cache dir</th>
							<td>{settings.cache_dir || '-'}</td>
						</tr>
					{/if}
					{#if runnerBackend === 'slurm_ssh'}
						<tr>
							<th>SSH host</th>
							<td>{settings.ssh_host || '-'}</td>
						</tr>
						<tr>
							<th>SSH username</th>
							<td>{settings.ssh_username || '-'}</td>
						</tr>
						<tr>
							<th>SSH Private Key Path</th>
							<td>{settings.ssh_private_key_path || '-'}</td>
						</tr>
						<tr>
							<th>SSH Tasks Dir</th>
							<td>{settings.ssh_tasks_dir || '-'}</td>
						</tr>
						<tr>
							<th>SSH Jobs Dir</th>
							<td>{settings.ssh_jobs_dir || '-'}</td>
						</tr>
					{/if}
					{#if runnerBackend === 'slurm' || runnerBackend === 'slurm_ssh'}
						<tr>
							<th>SLURM accounts</th>
							<td>
								{#if settings.slurm_accounts.length > 0}
									{#each settings.slurm_accounts as account}
										<span class="badge text-bg-light fw-normal fs-6">{account}</span>
										&nbsp;
									{/each}
								{:else}
									-
								{/if}
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		{/if}
	</div>
</div>
