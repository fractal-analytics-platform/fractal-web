<script>
	import { goto } from '$app/navigation';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { normalizePayload } from 'fractal-components';

	let data = $state('');

	/** @type {FileList|null} */
	let files = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state(undefined);

	let fileError = $state('');

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let saveErrorAlert;
	let saving = $state(false);

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
			data = JSON.stringify(value, null, 2);
		} catch {
			fileError = "File doesn't contain valid JSON";
		}
	}

	async function createResource() {
		try {
			saving = true;
			saveErrorAlert?.hide();

			const headers = new Headers();
			headers.set('Content-Type', 'application/json');

			const response = await fetch(`/api/admin/v2/resource`, {
				method: 'POST',
				credentials: 'include',
				headers,
				body: normalizePayload(JSON.parse(data))
			});

			if (response.ok) {
				await goto(`/v2/admin/resources`);
			} else {
				saveErrorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					'saveError'
				);
			}
		} catch (err) {
			saveErrorAlert = displayStandardErrorAlert(err, 'saveError');
		} finally {
			saving = false;
		}
	}
</script>

<div class="container mt-3">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb mb-4">
			<li class="breadcrumb-item">
				<a href="/v2/admin">Admin area</a>
			</li>
			<li class="breadcrumb-item">
				<a href="/v2/admin/resources">Resources</a>
			</li>
			<li class="breadcrumb-item active" aria-current="page">Create new resource</li>
		</ol>
	</nav>
</div>

<div class="container">
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
	<div class="row">
		<div class="col">
			<textarea class="form-control mb-3" bind:value={data} rows="15"></textarea>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<div id="saveError"></div>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<button class="btn btn-primary" onclick={createResource} disabled={saving}>
				{#if saving}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"> </span>
				{/if}
				Create resource
			</button>
		</div>
	</div>
</div>
