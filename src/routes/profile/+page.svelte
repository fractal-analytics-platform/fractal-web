<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert, getValidationMessagesMap } from '$lib/common/errors';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import('$lib/types').User} */
	$: user = $page.data.userInfo;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	let editCacheDir = false;
	let cacheDir = '';
	let cacheDirError = '';

	function toggleEditCacheDir() {
		if (editCacheDir) {
			editCacheDir = false;
			cacheDirError = '';
		} else {
			editCacheDir = true;
			cacheDir = user.cache_dir || '';
		}
	}

	async function saveCacheDir() {
		if (errorAlert) {
			errorAlert.hide();
		}
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/auth/current-user`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({ cache_dir: cacheDir })
		});
		if (response.ok) {
			user.cache_dir = cacheDir;
			editCacheDir = false;
		} else {
			const result = await response.json();
			const errorMap = getValidationMessagesMap(result, response.status);
			if (errorMap && Object.keys(errorMap).length === 1 && 'cache_dir' in errorMap) {
				cacheDirError = errorMap['cache_dir'];
			} else {
				errorAlert = displayStandardErrorAlert(result, 'profileUpdate-error');
			}
		}
	}
</script>

<h3>My profile</h3>

<div class="row mt-4">
	<div class="col-lg-10 col-xl-8">
		<table class="table">
			<colgroup>
				<col width="170" />
				<col width="auto" />
				<col width="auto" />
			</colgroup>
			<tbody>
				<tr>
					<th>User ID</th>
					<td>{user.id}</td>
					<td />
				</tr>
				<tr>
					<th>E-mail</th>
					<td>{user.email}</td>
					<td />
				</tr>
				<tr>
					<th>Username</th>
					<td>{user.username || '-'}</td>
					<td />
				</tr>
				<tr>
					<th>Active</th>
					<td><BooleanIcon value={user.is_active} /></td>
					<td />
				</tr>
				<tr>
					<th>Superuser</th>
					<td><BooleanIcon value={user.is_superuser} /></td>
					<td />
				</tr>
				<tr>
					<th>Verified</th>
					<td><BooleanIcon value={user.is_verified} /></td>
					<td />
				</tr>
				<tr>
					<th>Slurm user</th>
					<td>{user.slurm_user || '-'}</td>
					<td />
				</tr>
				<tr>
					<th>Cache dir</th>
					<td>
						{#if editCacheDir}
							<div class="input-group" class:has-validation={cacheDirError}>
								<input
									type="text"
									class="form-control"
									id="cache-dir"
									bind:value={cacheDir}
									class:is-invalid={cacheDirError}
									on:keydown={(e) => {
										if (e.key === 'Enter') {
											saveCacheDir();
										}
									}}
								/>
								<button class="btn btn-outline-secondary" on:click={toggleEditCacheDir}>
									<i class="bi bi-arrow-counterclockwise" /> Undo
								</button>
								<button class="btn btn-primary" on:click={saveCacheDir}> Save </button>
								{#if cacheDirError}
									<div class="invalid-feedback">{cacheDirError}</div>
								{/if}
							</div>
						{:else}
							{user.cache_dir || '-'}
						{/if}
					</td>
					<td>
						{#if !editCacheDir}
							<button class="btn btn-primary pt-0 pb-0 float-end" on:click={toggleEditCacheDir}>
								<i class="bi bi-pencil" /> Edit
							</button>
						{/if}
					</td>
				</tr>
			</tbody>
		</table>
		<div id="profileUpdate-error" />
	</div>
</div>
