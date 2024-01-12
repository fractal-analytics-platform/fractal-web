<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert, getValidationMessagesMap } from '$lib/common/errors';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import('$lib/types').User} */
	$: user = $page.data.userInfo;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	let editSlurmAccounts = false;
	let slurmAccounts = [];
	let slurmAccountsError = '';

	let editCacheDir = false;
	let cacheDir = '';
	let cacheDirError = '';

	function toggleEditSlurmAccounts() {
		if (editSlurmAccounts) {
			editSlurmAccounts = false;
			slurmAccountsError = '';
		} else {
			editSlurmAccounts = true;
			slurmAccounts = user.slurm_accounts;
		}
	}

	function toggleEditCacheDir() {
		if (editCacheDir) {
			editCacheDir = false;
			cacheDirError = '';
		} else {
			editCacheDir = true;
			cacheDir = user.cache_dir || '';
		}
	}

	function addSlurmAccount() {
		slurmAccounts = [...slurmAccounts, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeSlurmAccount(index) {
		slurmAccounts = slurmAccounts.filter((_, i) => i !== index);
	}

	async function saveSlurmAccounts() {
		handlePatch(
			{ slurm_accounts: slurmAccounts },
			() => {
				user.slurm_accounts = slurmAccounts;
				editSlurmAccounts = false;
			},
			(error) => (slurmAccountsError = error),
			'slurm_accounts'
		);
	}

	async function saveCacheDir() {
		handlePatch(
			{ cache_dir: cacheDir },
			() => {
				user.cache_dir = cacheDir;
				editCacheDir = false;
			},
			(error) => (cacheDirError = error),
			'cache_dir'
		);
	}

	/**
	 * @param {object} payload
	 * @param {() => void} onSuccess
	 * @param {(error: string) => void} onError
	 * @param {string} errorKey
	 */
	async function handlePatch(payload, onSuccess, onError, errorKey) {
		if (errorAlert) {
			errorAlert.hide();
		}
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/auth/current-user`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(payload)
		});
		if (response.ok) {
			onSuccess();
		} else {
			const result = await response.json();
			const errorMap = getValidationMessagesMap(result, response.status);
			if (errorMap && Object.keys(errorMap).length === 1 && errorKey in errorMap) {
				onError(errorMap[errorKey]);
			} else {
				errorAlert = displayStandardErrorAlert(result, 'profileUpdate-error');
			}
		}
	}
</script>

<h1 class="fw-light">My profile</h1>

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
					<th>SLURM accounts</th>
					<td>
						{#if editSlurmAccounts}
							<div class="col-sm-9 has-validation">
								{#each slurmAccounts as slurmAccount, i}
									<div class="input-group mb-2" class:is-invalid={slurmAccountsError}>
										<input
											type="text"
											class="form-control"
											id={`slurmAccount-${i}`}
											bind:value={slurmAccount}
											class:is-invalid={slurmAccountsError}
											required
										/>
										<button
											class="btn btn-outline-secondary"
											type="button"
											id="slurm_account_remove_{i}"
											aria-label="Remove SLURM account"
											on:click={() => removeSlurmAccount(i)}
										>
											<i class="bi bi-trash" />
										</button>
									</div>
								{/each}
								<span class="invalid-feedback mb-2">{slurmAccountsError}</span>
								<button class="btn btn-light" type="button" on:click={addSlurmAccount}>
									<i class="bi bi-plus-circle" />
									Add SLURM account
								</button>
							</div>
						{:else if user.slurm_accounts.length > 0}
							{#each user.slurm_accounts as account}
								<span class="badge text-bg-light fw-normal fs-6">{account}</span>
								&nbsp;
							{/each}
						{:else}
							-
						{/if}
					</td>
					<td>
						{#if editSlurmAccounts}
							<button class="btn btn-primary float-end" on:click={saveSlurmAccounts}> Save </button>
							<button class="btn btn-outline-secondary float-end me-1" on:click={toggleEditSlurmAccounts}>
								<i class="bi bi-arrow-counterclockwise" /> Undo
							</button>
						{:else}
							<button
								class="btn btn-primary pt-0 pb-0 float-end"
								on:click={toggleEditSlurmAccounts}
							>
								<i class="bi bi-pencil" /> Edit
							</button>
						{/if}
					</td>
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
