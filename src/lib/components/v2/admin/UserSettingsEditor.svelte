<script>
	import { FormErrorHandler } from '$lib/common/errors';
	import { deepCopy, normalizePayload, nullifyEmptyStrings } from 'fractal-components';
	import { onMount } from 'svelte';

	let settingsFormSubmitted = $state(false);

	/** @type {import('fractal-components/types/api').UserSettings|undefined} */
	let originalSettings = $state();

	/**
	 * @typedef {Object} Props
	 * @property {string} runnerBackend
	 * @property {import('fractal-components/types/api').UserSettings} settings
	 * @property {string} settingsApiEndpoint
	 * @property {(response: Response) => Promise<void>} [onSettingsUpdated]
	 * @property {boolean} [pendingChanges]
	 */

	/** @type {Props} */
	let {
		runnerBackend,
		settings,
		settingsApiEndpoint,
		onSettingsUpdated = async () => {},
		pendingChanges = $bindable(false)
	} = $props();

	let editableSettings = $state();

	$effect(() => {
		const original = $state.snapshot(originalSettings);
		const edited = $state.snapshot(editableSettings);
		pendingChanges =
			editableSettings && JSON.stringify(original) !== JSON.stringify(nullifyEmptyStrings(edited));
	});

	$effect(() => {
		editableSettings = deepCopy(settings);
	});

	onMount(() => {
		originalSettings = deepCopy(nullifyEmptyStrings(settings));
		editableSettings = deepCopy(settings);
	});

	const settingsFormErrorHandler = new FormErrorHandler('genericSettingsError', [
		'slurm_accounts',
		'project_dir'
	]);
	const settingsValidationErrors = settingsFormErrorHandler.getValidationErrorStore();

	function addSlurmAccount() {
		editableSettings.slurm_accounts = [...editableSettings.slurm_accounts, ''];
	}

	/**
	 * @param {number} index
	 */
	function removeSlurmAccount(index) {
		editableSettings.slurm_accounts = editableSettings.slurm_accounts.filter((_, i) => i !== index);
	}

	export async function handleSaveSettings() {
		settingsFormSubmitted = true;
		settingsFormErrorHandler.clearErrors();
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(settingsApiEndpoint, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: normalizePayload({ ...editableSettings, id: undefined }, { nullifyEmptyStrings: true })
		});
		if (!response.ok) {
			await settingsFormErrorHandler.handleErrorResponse(response);
			return false;
		}
		await onSettingsUpdated(response);
		originalSettings = deepCopy(nullifyEmptyStrings(editableSettings));
		return true;
	}
</script>

{#if editableSettings}
	<div class="row">
		<div class="mt-2 col-lg-7 needs-validation">
			<div class="row mb-3 has-validation">
				<label for="projectDir" class="col-sm-3 col-form-label text-end">
					<strong>Project dir</strong>
				</label>
				<div class="col-sm-9">
					<input
						type="text"
						class="form-control"
						id="projectDir"
						bind:value={editableSettings.project_dir}
						class:is-invalid={settingsFormSubmitted && $settingsValidationErrors['project_dir']}
					/>
					<div class="form-text">
						A base folder used for default <code>zarr_dir</code> paths
					</div>
					<span class="invalid-feedback">{$settingsValidationErrors['project_dir']}</span>
				</div>
			</div>
			{#if runnerBackend !== 'local'}
				<div class="row mb-3 has-validation">
					<label for="slurmAccount-0" class="col-sm-3 col-form-label text-end">
						<strong>SLURM accounts</strong>
					</label>
					<div class="col-sm-9 has-validation">
						<!-- eslint-disable-next-line no-unused-vars -->
						{#each editableSettings.slurm_accounts as _, i (i)}
							<div
								class="input-group mb-2"
								class:is-invalid={settingsFormSubmitted &&
									$settingsValidationErrors['slurm_accounts']}
							>
								<input
									type="text"
									class="form-control"
									id={`slurmAccount-${i}`}
									bind:value={editableSettings.slurm_accounts[i]}
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
									onclick={() => removeSlurmAccount(i)}
								>
									<i class="bi bi-trash"></i>
								</button>
							</div>
						{/each}
						<span class="invalid-feedback mb-2">{$settingsValidationErrors['slurm_accounts']}</span>
						<button class="btn btn-light" type="button" onclick={addSlurmAccount}>
							<i class="bi bi-plus-circle"></i>
							Add SLURM account
						</button>
						<div class="form-text">
							The first account in the list will be used as a default for job execution.
						</div>
					</div>
				</div>
			{/if}
			<div class="row">
				<div class="col-sm-9 offset-sm-3">
					<div id="genericSettingsError"></div>
				</div>
			</div>
		</div>
	</div>
{/if}
