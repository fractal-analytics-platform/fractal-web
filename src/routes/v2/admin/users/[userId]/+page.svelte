<script>
	import { page } from '$app/state';
	import { getSortGroupByNameAllFirstComparator } from '$lib/components/admin/user_utilities.js';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */
	const user = $derived(page.data.user || []);
	/** @type {import('fractal-components/types/api').Profile | undefined} */
	const profile = $derived(page.data.profile);
	/** @type {Array<import('fractal-components/types/api').Group>} */
	const groups = $derived(page.data.groups || []);
	/** @type {string} */
	const runnerBackend = $derived(page.data.runnerBackend);
	/** @type {string|null} */
	const defaultGroupName = $derived(page.data.defaultGroupName);

	let userGroups = $derived(
		user.group_ids_names
			.map((ni) => groups.filter((g) => g.id === ni[0])[0])
			.sort(getSortGroupByNameAllFirstComparator(defaultGroupName))
	);
</script>

<div class="container mt-3">
	<div class="row">
		<div class="col">
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
				<i class="bi bi-pencil"></i>
				Edit
			</a>
		</div>
	</div>
</div>

<div class="container">
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
						{#each userGroups as group (group.id)}
							<a href="/v2/admin/groups/{group.id}" class="me-2">{group.name}</a>
						{/each}
					</td>
				</tr>
				<tr>
					<th>Profile</th>
					<td>
						{#if profile}
							<a href="/v2/admin/resources/{profile.resource_id}/profiles/{profile.id}">
								{profile.name}
							</a>
						{:else}
							-
						{/if}
					</td>
				</tr>
				<tr>
					<th>Project dir</th>
					<td>
						<ul class="ps-3">
							{#each user.project_dirs as dir (dir)}
								<li>{dir}</li>
							{/each}
						</ul>
					</td>
				</tr>
				{#if runnerBackend !== 'local'}
					<tr>
						<th>SLURM accounts</th>
						<td>
							{#if user.slurm_accounts.length > 0}
								{#each user.slurm_accounts as account (account)}
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
	</div>
</div>
