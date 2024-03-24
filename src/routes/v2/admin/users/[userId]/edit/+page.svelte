<script>
	import { page } from '$app/stores';
	import UserEditor from '$lib/components/v2/admin/UserEditor.svelte';

	/** @type {import('$lib/types').User & {group_ids: number[]}} */
	let user = $page.data.user;

	/** @type {import('$lib/types').UserSettings} */
	let settings = $page.data.settings;

	/** @type {Array<import('$lib/types').Group>} */
	let groups = $page.data.groups;

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
			<a href="/v2/admin">Admin area</a>
		</li>
		<li class="breadcrumb-item">
			<a href="/v2/admin/users">Manage users</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">
			Editing user #{user.id} ({user.email})
		</li>
	</ol>
</nav>

<UserEditor {user} {settings} {groups} {save} runnerBackend={$page.data.runnerBackend} />
