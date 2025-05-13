<script>
	import { page } from '$app/state';
	import { nullifyEmptyStrings } from '$lib/common/component_utilities';
	import {
		AlertError,
		displayStandardErrorAlert,
		getValidationMessagesMap
	} from '$lib/common/errors';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { onMount } from 'svelte';

	/**
	 * @type {import('fractal-components/types/api').UserSettings}
	 */
	const settings = $derived(page.data.settings);
	const runnerBackend = $derived(page.data.runnerBackend);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	let slurmAccounts = $state([]);
	let slurmAccountsError = $state('');

	let settingsUpdatedMessage = $state('');

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
		settingsUpdatedMessage = '';
		slurmAccountsError = '';
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const payload = {
			slurm_accounts: slurmAccounts
		};
		const response = await fetch(`/api/auth/current-user/settings`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(nullifyEmptyStrings(payload))
		});
		const result = await response.json();
		if (response.ok) {
			initFields(result);
			settingsUpdatedMessage = 'User settings successfully updated';
		} else {
			const errorMap = getValidationMessagesMap(result, response.status);
			let errorShown = false;
			if (errorMap) {
				if ('slurm_accounts' in errorMap) {
					slurmAccountsError = errorMap['slurm_accounts'];
					errorShown = true;
				}
			}
			if (!errorShown) {
				errorAlert = displayStandardErrorAlert(
					new AlertError(result, response.status),
					'settingsUpdate-error'
				);
			}
		}
	}

	/**
	 * @param {import('fractal-components/types/api').UserSettings} settings
	 */
	function initFields(settings) {
		slurmAccounts = settings.slurm_accounts;
	}

	onMount(() => {
		initFields(page.data.settings);
	});
</script>

<div class="container mt-3">
	<h1 class="fw-light mb-4">My settings</h1>

	<div class="row mb-4">
		<div class="col-lg-2 col-sm-4 fw-bold">Project dir</div>
		<div class="col-lg-6 col-sm-8">
			{settings.project_dir || '-'}
		</div>
	</div>
	{#if runnerBackend !== 'local'}
		{#if runnerBackend === 'slurm'}
			<div class="row mb-4">
				<div class="col-lg-2 col-sm-4 fw-bold">SLURM user</div>
				<div class="col-lg-6 col-sm-8">
					{settings.slurm_user || '-'}
				</div>
			</div>
		{/if}
		{#if runnerBackend === 'slurm_ssh'}
			<div class="row mb-4">
				<div class="col-lg-2 col-sm-4 fw-bold">SSH username</div>
				<div class="col-lg-6 col-sm-8">
					{settings.ssh_username || '-'}
				</div>
			</div>
		{/if}
		<div class="row mb-3">
			<div class="col-lg-2 col-sm-4 fw-bold">SLURM accounts</div>
			<div class="col-lg-6 col-sm-8">
				<div class="col-sm-9 has-validation">
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
		</div>

		<div class="row">
			<div class="col">
				<div id="settingsUpdate-error"></div>
				<StandardDismissableAlert message={settingsUpdatedMessage} />
				<button class="btn btn-primary" onclick={save}> Save </button>
			</div>
		</div>
	{/if}
</div>
