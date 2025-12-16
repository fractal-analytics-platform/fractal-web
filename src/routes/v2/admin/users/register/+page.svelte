<script>
	import { page } from '$app/state';
	import UserEditor from '$lib/components/v2/admin/UserEditor.svelte';
	import { normalizePayload } from 'fractal-components';
	import { onMount } from 'svelte';

	const runnerBackend = $derived(page.data.runnerBackend);
	const defaultGroupName = $derived(page.data.defaultGroupName);

	/** @type {Array<import('fractal-components/types/api').Group>} */
	const groups = $derived(page.data.groups);

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */
	let user = {
		email: '',
		is_active: true,
		is_superuser: false,
		is_verified: false,
		password: '',
		group_ids_names: [],
		oauth_accounts: [],
		profile_id: null,
		project_dirs: [''],
		slurm_accounts: []
	};

	/** @type {boolean|undefined} */
	let created = $state();
	/** @type {boolean|undefined} */
	let verified = $state();

	/**
	 * @param {import('fractal-components/types/api').User} user
	 * @returns {Promise<Response>}
	 */
	async function save(user) {
		created = undefined;
		verified = undefined;

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		let payload = {
			email: user.email,
			password: user.password,
			profile_id: user.profile_id,
			project_dirs: user.project_dirs
		};

		if (runnerBackend !== 'local') {
			payload.slurm_accounts = user.slurm_accounts;
		}

		const createResponse = await fetch(`/api/auth/register`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(payload, { nullifyEmptyStrings: true })
		});

		if (!createResponse.ok) {
			return createResponse;
		}

		created = true;
		const createdUser = await createResponse.json();

		const response = await fetch(`/api/auth/users/${createdUser.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: normalizePayload({
				is_verified: true
			})
		});

		if (!response.ok) {
			verified = false;
		}

		return response;
	}

	onMount(() => {
		created = undefined;
		verified = undefined;
	});
</script>

<div class="container mt-3">
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

	<UserEditor {user} {groups} saveUser={save} {runnerBackend} {defaultGroupName} />
</div>
