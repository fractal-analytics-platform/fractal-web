<script>
	import { page } from '$app/stores';
	import { sortUserByEmailComparator } from '$lib/common/user_utilities';

	/** @type {import('$lib/types').Group & {user_ids: number[]}} */
	$: group = $page.data.group;
	/** @type {Array<import('$lib/types').User & {id: number}>} */
	$: allUsers = $page.data.users;

	$: groupUsers = allUsers
		.filter((u) => group.user_ids.includes(u.id))
		.sort(sortUserByEmailComparator);
</script>

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
	<i class="bi bi-pencil" />
	Edit
</a>

<h4 class="fw-light mt-4 mb-3">Members of the group</h4>

{#if group.user_ids.length === 0}
	<p>
		This group has no users.
		<a href="/v2/admin/groups/{group.id}/edit" class="btn btn-primary ms-3">Edit</a>
	</p>
{:else}
	<div class="col-6 bg-light p-2 rounded">
		{#each groupUsers as user}
			<span class="badge text-bg-secondary me-2 mb-2 fw-normal fs-6">
				<a href="/v2/admin/users/{user.id}" class="text-light">{user.email}</a>
			</span>
		{/each}
	</div>
{/if}
