<script>
	import { page } from '$app/stores';

	/** @type {import('$lib/types').User} */
	let user = getUser();

	let password = '';
	let confirmPassword = '';

	function getUser() {
		const user = $page.data.user;
		return {
			...user,
			username: user.username ?? ''
		};
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

<div class="row">
	<form class="col-lg-7">
		<div class="row mb-3">
			<label for="userId" class="col-sm-3 col-form-label text-end">
				<strong>Id</strong>
			</label>
			<div class="col-sm-9">
				<input type="text" readonly class="form-control-plaintext" id="userId" value={user.id} />
			</div>
		</div>
		<div class="row mb-3">
			<label for="userEmail" class="col-sm-3 col-form-label text-end">
				<strong>E-mail</strong>
			</label>
			<div class="col-sm-9">
				<input type="text" class="form-control" id="userEmail" bind:value={user.email} />
			</div>
		</div>
		<div class="row mb-3">
			<label for="username" class="col-sm-3 col-form-label text-end">
				<strong>Username</strong>
			</label>
			<div class="col-sm-9">
				<input
					autocomplete="off"
					aria-autocomplete="none"
					type="text"
					class="form-control"
					id="username"
					bind:value={user.username}
				/>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<div class="form-check">
					<input
						class="form-check-input"
						type="checkbox"
						id="active"
						bind:checked={user.is_active}
					/>
					<label class="form-check-label" for="active"> Active </label>
				</div>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<div class="form-check">
					<input
						class="form-check-input"
						type="checkbox"
						id="superuser"
						bind:checked={user.is_superuser}
					/>
					<label class="form-check-label" for="superuser"> Superuser </label>
				</div>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<div class="form-check">
					<input
						class="form-check-input"
						type="checkbox"
						id="verified"
						bind:checked={user.is_verified}
					/>
					<label class="form-check-label" for="verified"> Verified </label>
				</div>
			</div>
		</div>
		<div class="row mb-3">
			<label for="password" class="col-sm-3 col-form-label text-end">
				<strong>Password</strong>
			</label>
			<div class="col-sm-9">
				<input
					type="password"
					autocomplete="new-password"
					class="form-control"
					id="password"
					bind:value={password}
				/>
			</div>
		</div>
		<div class="row mb-3">
			<label for="confirmPassword" class="col-sm-3 col-form-label text-end">
				<strong>Confirm password</strong>
			</label>
			<div class="col-sm-9">
				<input
					type="password"
					class="form-control"
					id="confirmPassword"
					bind:value={confirmPassword}
				/>
			</div>
		</div>
		<div class="row mb-3">
			<label for="slurmUser" class="col-sm-3 col-form-label text-end">
				<strong>Slurm user</strong>
			</label>
			<div class="col-sm-9">
				<input type="text" class="form-control" id="slurmUser" bind:value={user.slurm_user} />
			</div>
		</div>
		<div class="row mb-3">
			<label for="cacheDir" class="col-sm-3 col-form-label text-end">
				<strong>Cache dir</strong>
			</label>
			<div class="col-sm-9">
				<input type="text" class="form-control" id="cacheDir" bind:value={user.cache_dir} />
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<button class="btn btn-primary"> Save </button>
			</div>
		</div>
	</form>
</div>
