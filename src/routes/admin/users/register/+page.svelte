<script>
	import UserEditor from '$lib/components/admin/UserEditor.svelte';

	/** @type {import('$lib/types').User} */
	let user = {
		email: '',
		is_active: true,
		is_superuser: false,
		is_verified: true,
		username: '',
		slurm_user: '',
		cache_dir: '',
		password: ''
	};

	/**
	 * @param {import('$lib/types').User} user
	 * @returns {Promise<Response>}
	 */
	async function save(user) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		return await fetch(`/auth/register`, {
			method: 'POST',
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
		<li class="breadcrumb-item active" aria-current="page">Registering new user</li>
	</ol>
</nav>

<h3 class="mb-3">Registering new user</h3>

<UserEditor {user} {save} />
