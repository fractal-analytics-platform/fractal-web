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

<h2 class="fw-light mb-3">Members of the group</h2>

{#if group.user_ids.length === 0}
	<p>
		This group has no users.
		<a href="/v2/admin/groups/{group.id}/edit" class="btn btn-primary ms-3">Edit</a>
	</p>
{:else}
	<ul>
		{#each groupUsers as user}
			<li><a href="/v2/admin/users/{user.id}">{user.email}</a></li>
		{/each}
	</ul>
{/if}
