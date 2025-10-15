<script>
	import { page } from '$app/state';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { normalizePayload } from 'fractal-components';
	import { onMount } from 'svelte';

	/** @type {import('fractal-components/types/api').Resource} */
	const resource = $derived(page.data.resource);

	let data = $state('');
	let resourceUpdatedMessage = $state('');

	/** @type {FileList|null} */
	let files = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state(undefined);

	let fileError = $state('');

	async function loadFromFile() {
		fileError = '';

		if (!files) {
			return;
		}

		let content = '';
		try {
			const file = files[0];
			content = await file.text();
		} catch {
			fileError = 'Unable to read file';
			return;
		}

		try {
			const value = JSON.parse(content);
			data = JSON.stringify(removeUnmodifiableFields(value), null, 2);
		} catch {
			fileError = "File doesn't contain valid JSON";
		}
	}

	onMount(() => {
		data = JSON.stringify(removeUnmodifiableFields(resource), null, 2);
	});

	/**
	 * @param {import('fractal-components/types/api').Resource} resource
	 */
	function removeUnmodifiableFields(resource) {
		return {
			...resource,
			id: undefined,
			type: undefined,
			timestamp_created: undefined,
			jobs_runner_config: undefined
		};
	}

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let saveErrorAlert;
	let saving = $state(false);

	async function saveResource() {
		try {
			resourceUpdatedMessage = '';
			saving = true;
			saveErrorAlert?.hide();

			const headers = new Headers();
			headers.set('Content-Type', 'application/json');

			const response = await fetch(`/api/admin/v2/resource/${resource.id}`, {
				method: 'PATCH',
				credentials: 'include',
				headers,
				body: normalizePayload(JSON.parse(data))
			});

			if (response.ok) {
				resourceUpdatedMessage = 'Resource updated';
			} else {
				saveErrorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					'saveError'
				);
			}
		} finally {
			saving = false;
		}
	}
</script>

<div class="container mt-3">
	<div class="row">
		<div class="col">
			<nav aria-label="breadcrumb">
				<ol class="breadcrumb">
					<li class="breadcrumb-item">
						<a href="/v2/admin">Admin area</a>
					</li>
					<li class="breadcrumb-item">
						<a href="/v2/admin/resources">Resources</a>
					</li>
					<li class="breadcrumb-item active" aria-current="page">
						Edit {resource.name} (#{resource.id})
					</li>
				</ol>
			</nav>
		</div>
	</div>

	<div class="row">
		<div class="col mb-3">
			<div class="input-group has-validation">
				<label for="resourceFile" class="input-group-text">
					<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Load from file
				</label>
				<input
					class="form-control schemaFile"
					accept="application/json"
					type="file"
					name="resourceFile"
					id="resourceFile"
					bind:this={fileInput}
					bind:files
					onchange={loadFromFile}
					class:is-invalid={fileError}
				/>
				<span class="invalid-feedback">{fileError}</span>
			</div>
		</div>
	</div>

	<textarea class="form-control mb-3" bind:value={data} rows="20"></textarea>

	<div id="saveError"></div>

	<StandardDismissableAlert message={resourceUpdatedMessage} autoDismiss={true} />

	<button class="btn btn-primary" onclick={saveResource} disabled={saving}>
		{#if saving}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"> </span>
		{/if}
		Save
	</button>
</div>
