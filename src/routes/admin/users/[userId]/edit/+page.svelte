<script>
	import { page } from '$app/stores';
	import UserEditor from '$lib/components/admin/UserEditor.svelte';

	/** @type {import('$lib/types').User} */
	let user = $page.data.user;

	/**
	 * @param {import('$lib/types').User} user
	 * @returns {Promise<Response>}
	 */
	async function save(user) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		return await fetch(`/api/auth/users/${user.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(user)
		});
	}
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
			Editing user #{user.id} ({user.email})
		</li>
	</ol>
</nav>

<h3 class="mb-3">Editing user #{user.id} ({user.email})</h3>

<UserEditor {user} {save} />
