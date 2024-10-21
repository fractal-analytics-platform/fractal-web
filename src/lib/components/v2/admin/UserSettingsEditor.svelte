<script>
	import { nullifyEmptyStrings } from '$lib/common/component_utilities';
	import { FormErrorHandler } from '$lib/common/errors';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';

	/** @type {string} */
	export let runnerBackend;
	/** @type {import('$lib/types').UserSettings} */
	export let settings;
	/** @type {string} */
	export let settingsApiEndpoint;
	/** @type {(response: Response) => Promise<void>} */
	export let onSettingsUpdated = async () => {};

	let settingsUpdatedMessage = '';
	let savingSettings = false;
	let settingsFormSubmitted = false;

	const settingsFormErrorHandler = new FormErrorHandler('genericSettingsError', [
		'cache_dir',
		'slurm_accounts',
		'slurm_user',
		'ssh_host',
		'ssh_username',
		'ssh_private_key_path',
		'ssh_tasks_dir',
		'ssh_jobs_dir'
	]);
	const settingsValidationErrors = settingsFormErrorHandler.getValidationErrorStore();

	function addSlurmAccount() {
		settings.slurm_accounts = [...settings.slurm_accounts, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeSlurmAccount(index) {
		settings.slurm_accounts = settings.slurm_accounts.filter((_, i) => i !== index);
	}

	async function handleSaveSettings() {
		savingSettings = true;
		settingsUpdatedMessage = '';
		try {
			settingsFormSubmitted = true;
			settingsFormErrorHandler.clearErrors();
			const headers = new Headers();
			headers.set('Content-Type', 'application/json');
			const response = await fetch(settingsApiEndpoint, {
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: JSON.stringify(nullifyEmptyStrings({ ...settings, id: undefined }))
			});
			if (!response.ok) {
				await settingsFormErrorHandler.handleErrorResponse(response);
				return;
			}
			await onSettingsUpdated(response);
			settingsUpdatedMessage = 'Settings successfully updated';
		} finally {
			savingSettings = false;
		}
	}
</script>

<div class="row">
	<div class="mt-2 col-lg-7 needs-validation">
		{#if runnerBackend === 'slurm'}
			<div class="row mb-3 has-validation">
				<label for="slurmUser" class="col-sm-3 col-form-label text-end">
					<strong>SLURM user</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="slurmUser"
						bind:value={settings.slurm_user}
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['slurm_user']}
					/>
					<div class="form-text">
						The user on the local SLURM cluster who will be impersonated by Fractal through
						<code>sudo -u</code>
					</div>
					<span class="invalid-feedback">{$settingsValidationErrors['slurm_user']}</span>
				</div>
			</div>
			<div class="row mb-3 has-validation">
				<label for="cacheDir" class="col-sm-3 col-form-label text-end">
					<strong>Cache dir</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="cacheDir"
						bind:value={settings.cache_dir}
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['cache_dir']}
					/>
					<div class="form-text">
						Absolute path to a user-owned folder that will be used as a cache for job-related files
					</div>
					<span class="invalid-feedback">{$settingsValidationErrors['cache_dir']}</span>
				</div>
			</div>
		{:else if runnerBackend === 'slurm_ssh'}
			<div class="row mb-3 has-validation">
				<label for="sshHost" class="col-sm-3 col-form-label text-end">
					<strong>SSH host</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="sshHost"
						bind:value={settings.ssh_host}
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_host']}
					/>
					<div class="form-text">SSH-reachable host where a SLURM client is available</div>
					<span class="invalid-feedback">{$settingsValidationErrors['ssh_host']}</span>
				</div>
			</div>
			<div class="row mb-3 has-validation">
				<label for="sshUsername" class="col-sm-3 col-form-label text-end">
					<strong>SSH username</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="sshUsername"
						bind:value={settings.ssh_username}
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_username']}
					/>
					<div class="form-text">
						The user on the remote SLURM cluster who will be impersonated by Fractal through
						<code>ssh</code>
					</div>
					<span class="invalid-feedback">{$settingsValidationErrors['ssh_username']}</span>
				</div>
			</div>
			<div class="row mb-3 has-validation">
				<label for="sshPrivateKeyPath" class="col-sm-3 col-form-label text-end">
					<strong>SSH Private Key Path</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="sshPrivateKeyPath"
						bind:value={settings.ssh_private_key_path}
						class:is-invalid={settingsFormSubmitted &&
							$settingsValidationErrors['ssh_private_key_path']}
					/>
					<div class="form-text">
						Path of private SSH key for <code>ssh_username</code>
					</div>
					<span class="invalid-feedback">{$settingsValidationErrors['ssh_private_key_path']}</span>
				</div>
			</div>
			<div class="row mb-3 has-validation">
				<label for="sshTasksDir" class="col-sm-3 col-form-label text-end">
					<strong>SSH Tasks Dir</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="sshTasksDir"
						bind:value={settings.ssh_tasks_dir}
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_tasks_dir']}
					/>
					<div class="form-text">
						Task-venvs base folder on <code>ssh_host</code>
					</div>
					<span class="invalid-feedback">{$settingsValidationErrors['ssh_tasks_dir']}</span>
				</div>
			</div>
			<div class="row mb-3 has-validation">
				<label for="sshJobsDir" class="col-sm-3 col-form-label text-end">
					<strong>SSH Jobs Dir</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="sshJobsDir"
						bind:value={settings.ssh_jobs_dir}
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['ssh_jobs_dir']}
					/>
					<div class="form-text">
						Jobs base folder on <code>ssh_host</code>
					</div>
					<span class="invalid-feedback">{$settingsValidationErrors['ssh_jobs_dir']}</span>
				</div>
			</div>
		{/if}
		<div class="row mb-3 has-validation">
			<label for="slurmAccount-0" class="col-sm-3 col-form-label text-end">
				<strong>SLURM accounts</strong>
			</label>
			<div class="col-sm-9 has-validation">
				{#each settings.slurm_accounts as slurmAccount, i}
					<div
						class="input-group mb-2"
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['slurm_accounts']}
					>
						<input
							type="text"
							class="form-control"
							id={`slurmAccount-${i}`}
							bind:value={slurmAccount}
							aria-label={`SLURM account #${i + 1}`}
							class:is-invalid={settingsFormSubmitted &&
								$settingsValidationErrors['slurm_accounts']}
							required
						/>
						<button
							class="btn btn-outline-secondary"
							type="button"
							id="slurm_account_remove_{i}"
							aria-label={`Remove SLURM account #${i + 1}`}
							on:click={() => removeSlurmAccount(i)}
						>
							<i class="bi bi-trash" />
						</button>
					</div>
				{/each}
				<span class="invalid-feedback mb-2">{$settingsValidationErrors['slurm_accounts']}</span>
				<button class="btn btn-light" type="button" on:click={addSlurmAccount}>
					<i class="bi bi-plus-circle" />
					Add SLURM account
				</button>
				<div class="form-text">
					The first account in the list will be used as a default for job execution.
				</div>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-sm-9 offset-sm-3">
				<div id="genericSettingsError" />
				<StandardDismissableAlert message={settingsUpdatedMessage} />
				<button
					type="button"
					on:click={handleSaveSettings}
					class="btn btn-primary"
					disabled={savingSettings}
				>
					{#if savingSettings}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
					{/if}
					Save
				</button>
			</div>
		</div>
	</div>
</div>
