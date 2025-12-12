<script>
	import { page } from '$app/state';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import { normalizePayload } from 'fractal-components';
	import { onMount } from 'svelte';

	/** @type {import('fractal-components/types/api').Resource} */
	let resource = $state(page.data.resource);

	let data = $state('');
	let resourceUpdatedMessage = $state('');

	/** @type {FileList|null} */
	let files = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state(undefined);

	let fileError = $state('');

	let active = $state(true);
	/** @type {Modal|undefined} */
	let modal = $state();
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let activeErrorAlert;

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

	onMount(() => {
		data = JSON.stringify(resource, null, 2);
		active = !resource.prevent_new_submissions;
	});

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let saveErrorAlert;
	let saving = $state(false);

	async function saveResource() {
		resourceUpdatedMessage = '';
		saveErrorAlert?.hide();

		const response = await callPutResource(JSON.parse(data));

		if (response.ok) {
			resourceUpdatedMessage = 'Resource updated';
		} else {
			saveErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'saveError'
			);
		}
	}

	/**
	 * @param {object} payload
	 */
	async function callPutResource(payload) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		saving = true;
		const response = await fetch(`/api/admin/v2/resource/${resource.id}`, {
			method: 'PUT',
			credentials: 'include',
			headers,
			body: normalizePayload(payload)
		});
		if (response.ok) {
			resource = await response.json();
			data = JSON.stringify(resource, null, 2);
		}
		saving = false;
		return response;
	}

	function onActiveToggle() {
		activeErrorAlert?.hide();
		if (active) {
			setResourceActive(true);
		} else {
			active = true;
			modal?.show();
		}
	}

	/**
	 * @param {boolean} value
	 */
	async function setResourceActive(value) {
		const newConfig = { ...resource, prevent_new_submissions: !value };
		const response = await callPutResource(newConfig);

		if (response.ok) {
			resource = newConfig;
			data = JSON.stringify(newConfig, null, 2);
			active = value;
		} else {
			activeErrorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'activeError'
			);
		}

		modal?.hide();
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

	<div class="row mb-3">
		<div class="col">
			<div class="form-check form-switch mt-2">
				<input
					class="form-check-input"
					bind:checked={active}
					type="checkbox"
					role="switch"
					id="resourceActive"
					onchange={onActiveToggle}
					disabled={saving}
				/>
				<label class="form-check-label" for="resourceActive">Active</label>
			</div>
		</div>
	</div>

	<div id="activeError"></div>

	<div class="accordion" id="accordionResource">
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button
					class="accordion-button collapsed"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#collapseResource"
					aria-expanded="false"
					aria-controls="collapseResource"
				>
					Edit JSON
				</button>
			</h2>
			<div
				id="collapseResource"
				class="accordion-collapse collapse"
				data-bs-parent="#accordionExample"
			>
				<div class="accordion-body">
					<textarea class="form-control mb-3" bind:value={data} rows="20"></textarea>

					<div id="saveError"></div>
					<StandardDismissableAlert message={resourceUpdatedMessage} autoDismiss={true} />

					<button class="btn btn-primary" onclick={saveResource} disabled={saving}>
						{#if saving}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true">
							</span>
						{/if}
						Save
					</button>
				</div>
			</div>
		</div>
	</div>

	<Modal id="confirmDisableResource" bind:this={modal} centered={true}>
		{#snippet header()}
			<h1 class="modal-title fs-5">Confirm action</h1>
		{/snippet}
		{#snippet body()}
			Do you really want to prevent new submissions on this resource?
		{/snippet}
		{#snippet footer()}
			<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
			<button class="btn btn-primary" onclick={() => setResourceActive(false)}> Confirm </button>
		{/snippet}
	</Modal>
</div>
