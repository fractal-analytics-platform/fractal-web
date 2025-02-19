<script>
	import { page } from '$app/stores';
	import { nullifyEmptyStrings, removeNullValues } from '$lib/common/component_utilities';
	import UserEditor from '$lib/components/v2/admin/UserEditor.svelte';
	import { onMount } from 'svelte';

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */
	let user = {
		email: '',
		is_active: true,
		is_superuser: false,
		is_verified: false,
		username: '',
		password: '',
		group_ids_names: [],
		oauth_accounts: []
	};

	/** @type {undefined|boolean} */
	let created = undefined;
	let verified = undefined;

	/**
	 * @param {import('fractal-components/types/api').User} user
	 * @returns {Promise<Response>}
	 */
	async function save(user) {
		created = undefined;
		verified = undefined;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const createResponse = await fetch(`/api/auth/register`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify(
				removeNullValues(
					nullifyEmptyStrings({
						email: user.email,
						password: user.password,
						username: user.username
					})
				)
			)
		});

		if (!createResponse.ok) {
			return createResponse;
		}

		created = true;
		const createdUser = await createResponse.json();

		const verifiedResponse = await fetch(`/api/auth/users/${createdUser.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				is_verified: true
			})
		});

		if (!verifiedResponse.ok) {
			verified = false;
		}

		return verifiedResponse;
	}

	onMount(() => {
		created = undefined;
		verified = undefined;
	});
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb mb-4">
		<li class="breadcrumb-item">
			<a href="/v2/admin">Admin area</a>
		</li>
		<li class="breadcrumb-item">
			<a href="/v2/admin/users">Manage users</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">Registering new user</li>
	</ol>
</nav>

{#if created === true && verified === false}
	<div class="alert alert-warning">
		<strong>Warning</strong>: The user was created but an error happened while setting the
		<code>is_verified</code> flag on it.
	</div>
{/if}

<UserEditor {user} saveUser={save} runnerBackend={$page.data.runnerBackend} />
