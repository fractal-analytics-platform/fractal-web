<script>
	import { page } from '$app/state';
	import {
		AlertError,
		displayStandardErrorAlert,
		getValidationMessagesMap
	} from '$lib/common/errors';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { normalizePayload } from 'fractal-components';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import { onMount } from 'svelte';

	/** @type {import('fractal-components/types/api').User & {group_ids_names: Array<[number, string]>}} */
	const user = $derived(page.data.user);
	/** @type {import('fractal-components/types/api').ProfileInfo} */
	const profile = $derived(page.data.profile);

	const runnerBackend = $derived(page.data.runnerBackend);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @type {string[]} */
	let slurmAccounts = $state([]);
	let slurmAccountsError = $state('');

	let userUpdatedMessage = $state('');

	function addSlurmAccount() {
		slurmAccounts = [...slurmAccounts, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeSlurmAccount(index) {
		slurmAccounts = slurmAccounts.filter((_, i) => i !== index);
	}

	async function save() {
		if (errorAlert) {
			errorAlert.hide();
		}
		userUpdatedMessage = '';
		slurmAccountsError = '';
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const payload = {
			slurm_accounts: slurmAccounts
		};
		const response = await fetch(`/api/auth/current-user`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: normalizePayload(payload, { nullifyEmptyStrings: true })
		});
		const result = await response.json();
		if (response.ok) {
			initFields(result);
			userUpdatedMessage = 'User successfully updated';
		} else {
			const errorMap = getValidationMessagesMap(result, response.status);
			let errorShown = false;
			if (errorMap) {
				if ('slurm_accounts' in errorMap) {
					slurmAccountsError = /** @type {string} */ (errorMap['slurm_accounts']);
					errorShown = true;
				}
			}
			if (!errorShown) {
				errorAlert = displayStandardErrorAlert(
					new AlertError(result, response.status),
					'userUpdate-error'
				);
			}
		}
	}

	/**
	 * @param {import('fractal-components/types/api').User} user
	 */
	function initFields(user) {
		slurmAccounts = user.slurm_accounts;
	}

	onMount(() => {
		initFields(page.data.user);
	});
</script>

<div class="container mt-3">
	<h1 class="fw-light">My profile</h1>

	<div class="row mt-4">
		<div class="col-lg-10 col-xl-8">
			<table class="table">
				<colgroup>
					<col width="170" />
					<col width="auto" />
				</colgroup>
				<tbody>
					<tr>
						<th>User ID</th>
						<td>{user.id}</td>
					</tr>
					<tr>
						<th>E-mail</th>
						<td>{user.email}</td>
					</tr>
					<tr>
						<th>Active</th>
						<td><BooleanIcon value={user.is_active} /></td>
					</tr>
					<tr>
						<th>Superuser</th>
						<td><BooleanIcon value={user.is_superuser} /></td>
					</tr>
					<tr>
						<th>Verified</th>
						<td><BooleanIcon value={user.is_verified} /></td>
					</tr>
					<tr>
						<th>Groups</th>
						<td>
							{#each user.group_ids_names as [id, group_name] (id)}
								<span class="badge text-bg-light me-2 mb-2 fs-6 fw-normal">{group_name}</span>
							{/each}
						</td>
					</tr>
					<tr>
						<th>OAuth2 accounts</th>
						<td>
							{#if user.oauth_accounts.length === 0}
								-
							{:else}
								<table class="table mb-0">
									<tbody>
										{#each user.oauth_accounts as account (account.id)}
											<tr>
												<th>{account.oauth_name}</th>
												<td>{account.account_email}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</td>
					</tr>
					<tr>
						<th>Has profile</th>
						<td><BooleanIcon value={profile.has_profile} /></td>
					</tr>
					{#if profile.has_profile}
						<tr>
							<th>Profile name</th>
							<td>{profile.profile_name}</td>
						</tr>
						<tr>
							<th>Resource name</th>
							<td>{profile.resource_name}</td>
						</tr>
						{#if profile.username}
							<tr>
								<th>Profile username</th>
								<td>{profile.username}</td>
							</tr>
						{/if}
					{/if}
					<tr>
						<th>Project dirs</th>
						<td>
							<ul class="ps-3">
								{#each user.project_dirs as dir (dir)}
									<li>{dir}</li>
								{/each}
							</ul>
						</td>
					</tr>

					{#if runnerBackend !== 'local'}
						<tr>
							<th>SLURM accounts</th>
							<td>
								<div class="row">
									<div class="col has-validation">
										<!-- eslint-disable-next-line no-unused-vars -->
										{#each slurmAccounts as _, i (i)}
											<div class="input-group mb-2" class:is-invalid={slurmAccountsError}>
												<input
													type="text"
													class="form-control"
													id={`slurmAccount-${i}`}
													bind:value={slurmAccounts[i]}
													class:is-invalid={slurmAccountsError}
													aria-label="SLURM account {i + 1}"
													required
												/>
												<button
													class="btn btn-outline-secondary"
													type="button"
													id="slurm_account_remove_{i}"
													aria-label="Remove SLURM account"
													onclick={() => removeSlurmAccount(i)}
												>
													<i class="bi bi-trash"></i>
												</button>
											</div>
										{/each}
										<span class="invalid-feedback mb-2">{slurmAccountsError}</span>
										<button class="btn btn-light" type="button" onclick={addSlurmAccount}>
											<i class="bi bi-plus-circle"></i>
											Add SLURM account
										</button>
									</div>
								</div>
								<div class="row mt-2">
									<div class="col">
										<div id="userUpdate-error"></div>
										<StandardDismissableAlert message={userUpdatedMessage} />
										<button class="btn btn-primary" onclick={save}> Save </button>
									</div>
								</div>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
