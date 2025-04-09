<script>
	import { page } from '$app/stores';
	import { nullifyEmptyStrings, removeNullValues } from '$lib/common/component_utilities';
	import UserEditor from '$lib/components/v2/admin/UserEditor.svelte';

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */
	let user = $page.data.user;

	/** @type {import('fractal-components/types/api').UserSettings} */
	let settings = $page.data.settings;

	/** @type {Array<import('fractal-components/types/api').Group>} */
	let groups = $page.data.groups;

	/**
	 * @param {import('fractal-components/types/api').User} user
	 * @returns {Promise<Response>}
	 */
	async function save(user) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		return await fetch(`/api/auth/users/${user.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(
				removeNullValues(
					nullifyEmptyStrings({
						email: user.email,
						password: user.password,
						username: user.username,
						is_active: user.is_active,
						is_superuser: user.is_superuser,
						is_verified: user.is_verified
					})
				)
			)
		});
	}
</script>

<div class="container mt-3">
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

	<UserEditor {user} {settings} {groups} saveUser={save} runnerBackend={$page.data.runnerBackend} />
</div>
