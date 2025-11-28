<script>
	import { page } from '$app/state';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';

	/** @type {import('fractal-components/types/api').Group & {user_ids: number[]}} */
	let group = $derived(page.data.group);
	/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */
	let allUsers = $derived(page.data.users);

	let groupUsers = $derived(
		allUsers.filter((u) => group.user_ids.includes(u.id)).sort(sortUserByEmailComparator)
	);
</script>

<div class="container mt-3">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item">
				<a href="/v2/admin">Admin area</a>
			</li>
			<li class="breadcrumb-item">
				<a href="/v2/admin/groups">Manage groups</a>
			</li>
			<li class="breadcrumb-item active" aria-current="page">
				Group #{group.id} ({group.name})
			</li>
		</ol>
	</nav>

	<a href="/v2/admin/groups/{group.id}/edit" class="btn btn-primary float-end">
		<i class="bi bi-pencil"></i>
		Edit
	</a>

	<h4 class="fw-light mt-4 mb-3">Members of the group</h4>

	{#if group.user_ids.length === 0}
		<p>This group has no users.</p>
	{:else}
		<div class="col-6 bg-light p-2 rounded">
			{#each groupUsers as user (user.id)}
				<span class="badge text-bg-secondary me-2 mb-2 fw-normal fs-6">
					<a href="/v2/admin/users/{user.id}" class="text-light">{user.email}</a>
				</span>
			{/each}
		</div>
	{/if}
</div>
