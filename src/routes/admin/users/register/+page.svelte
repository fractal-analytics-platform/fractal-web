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

		return await fetch(`/api/auth/register`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify(user)
		});
	}
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb mb-4">
		<li class="breadcrumb-item">
			<a href="/admin">Admin area</a>
		</li>
		<li class="breadcrumb-item">
			<a href="/admin/users">Manage users</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">Registering new user</li>
	</ol>
</nav>

<UserEditor {user} {save} />
