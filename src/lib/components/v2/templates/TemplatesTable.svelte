<script>
    import { getAlertErrorFromResponse } from '$lib/common/errors';
	import TemplateUpdateModal from '$lib/components/v2/templates/TemplateUpdateModal.svelte';
    import TemplateInfoModal from '$lib/components/v2/templates/TemplateInfoModal.svelte';
	import TemplateImportModal from '$lib/components/v2/templates/TemplateImportModal.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

    /**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').TemplatePage} templatePage
	 * @property {any} [handleSelect] - A default empty function
	 * @property {'edit'|'select'} modalType
	 */
	/** @type {Props} */
	let {
		templatePage = $bindable(),
		modalType,
		handleSelect,
	} = $props();


	/** @type {import('fractal-components/types/api').WorkflowTemplateGroupMember []}*/
	let selectedTemplates = $state(templatePage.items.map(item => item.templates[0]));	 

	/** @type {TemplateImportModal|undefined} */
	let importTemplateModal = $state(undefined);
    /** @type {TemplateUpdateModal|undefined} */
	let updateTemplateModal = $state(undefined);
    /** @type {TemplateInfoModal|undefined} */
	let infoTemplateModal = $state(undefined);

	// query parametes
	/** @type {number} */
	let currentPage = $derived(templatePage.current_page);
	/** @type {number} */
	let pageSize = $derived(templatePage.page_size);
	/** @type {number|undefined} */
	let templateId = $state(undefined);
	/** @type {boolean} */
	let isOwner = $state(false);
	/** @type {string|undefined} */
	let userEmail = $state(undefined);
	/** @type {string|undefined} */
	let templateName = $state(undefined);
	/** @type {number|undefined} */
	let templateVersion = $state(undefined);

	onMount(() => {
		isOwner = false;
	});
	
	export async function searchTemplate() {
		// Headers
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		// Query parametes
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('page_size', String(pageSize));
		params.set('is_owner', String(isOwner));
		if (templateId) params.set('template_id', String(templateId));
		if (userEmail) params.set('user_email', userEmail);
		if (templateName) params.set('name', templateName);
		if (templateVersion) params.set('version', String(templateVersion));

		let response = await fetch(
            `/api/v2/workflow_template?${params.toString()}`,
			{
				method: 'GET',
				headers,
				credentials: 'include',
			}
		);
		if (response.ok) {
			templatePage = await response.json();
			selectedTemplates = templatePage.items.map(item => item.templates[0]);
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}


	/**
	 * @param {number} templateId
	 * @returns {Promise<void>}
	 */
	async function exportTemplate(templateId) {
		const response = await fetch(`/api/v2/workflow_template/${templateId}/export`, {
			method: 'GET',
			credentials: 'include'
		});
		if (!response.ok) {
			console.error(await response.json());
			return;
		}
		const templateData = await response.json();
		if (templateData !== null) {
			const name = `template-${templateId}-${Date.now().toString()}.json`;
			const file = new File(
				[JSON.stringify(templateData, null, 2)],
				name,
				{
					type: `application/json`
				}
			);
			const fileUrl = URL.createObjectURL(file);
			const linkElement = /** @type {HTMLAnchorElement} */ (
				document.getElementById('downloadTemplateButton')
			);
			linkElement.download = name;
			linkElement.href = fileUrl;
			linkElement.click();
		}
	}

	/**
	 * Deletes a template from the server
	 * @param {number} templateId
	 * @returns {Promise<*>}
	*/
	async function handleDeleteTemplate(templateId) {
		const response = await fetch(`/api/v2/workflow_template/${templateId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (response.ok) {
			console.log('Template deleted');
			if (templatePage.items.length === 1 && currentPage > 1) {
				currentPage = currentPage - 1;
			}
			await searchTemplate();
		} else {
			console.error('Template not deleted');
			throw await getAlertErrorFromResponse(response);
		}
	}

</script>

<div class="container mt-2">

	{#if modalType==='edit'}
	<div class="d-flex justify-content-end align-items-center mb-3">
		<div class="col-2">
			<button
				class="btn btn-outline-primary"
				onclick={() => {importTemplateModal?.show();}}
			>
				<i class="bi-upload"></i>
				Import from JSON file
			</button>
		</div>
	</div>
	{/if}

<div class="card mb-3">
	<div class="card-body">
		<div class="row g-3 align-items-end">
			<div class="col-md">
				<label class="form-label small text-muted">Template ID</label>
				<input
					type="number"
					class="form-control form-control-sm"
					bind:value={templateId}
				/>
			</div>

			<div class="col-md">
				<label class="form-label small text-muted">Name</label>
				<input
					type="text"
					class="form-control form-control-sm"
					bind:value={templateName}
				/>
			</div>

			<div class="col-md">
				<label class="form-label small text-muted">User email</label>
				<select
					class="form-select form-select-sm"
					bind:value={userEmail}
				>
					<option value={undefined}>All users</option>
					{#each templatePage.email_list as email}
						<option value={email}>{email}</option>
					{/each}
				</select>
			</div>

			<div class="col-md">
				<label class="form-label small text-muted">Version</label>
				<input
					type="number"
					class="form-control form-control-sm"
					bind:value={templateVersion}
				/>
			</div>

			<div class="col-md-auto">
				<div class="form-check mt-4 pt-1">
					<input
						id="isOwnerCheckbox"
						type="checkbox"
						class="form-check-input"
						bind:checked={isOwner}
					/>
					<label
						class="form-check-label small"
						for="isOwnerCheckbox"
					>
						Only owned
					</label>
				</div>
			</div>

			<div class="col-md-auto">
				<div class="row mb-1">
					<button
						class="btn btn-secondary btn-sm px-4"
						onclick={async () => {
							currentPage=1;
							templateId=undefined;
							isOwner=false;
							userEmail=undefined;
							templateName=undefined;
							templateVersion=undefined;
							await searchTemplate();
						}}
					>
						Reset filters
					</button>
				</div>
				<div class="row mb-1">
					<button
						class="btn btn-warning btn-sm px-4"
						onclick={async () => {
							currentPage=1;
							await searchTemplate();
						}}
					>
						Apply filters
					</button>
				</div>
			</div>

		</div>
	</div>
</div>

<div class="card mb-3">
<div class="card-body">
<div class="table-responsive mt-2">
	<table class="table" id="dataset-images-table">
		<thead>
			<tr>
                <th>Name</th>
				<th>User email</th>
                <th>Versions</th>
				<th>
					{#if modalType==='edit'}
						Actions
					{:else}
						Select
					{/if}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each templatePage.items as templateGroup, index (index)}
				<tr>
                    <td class="col-5">{templateGroup.template_name}</td>
					<td>{templateGroup.user_email}</td>
                    <td class="col-2">
						<select
							class="form-select"
							aria-label="Version for template '{templateGroup.template_name}' of {templateGroup.user_email}"
							bind:value={selectedTemplates[index]}
						>
							{#each templateGroup.templates as template, i (i)}
								<option value={template}>{template.template_version}</option>
							{/each}
						</select>
					</td>
						{#if modalType === 'edit'}
						<td class="col-2">
							<button
								class="btn btn-outline-primary"
								title="Info"
								onclick={async () => {
									await infoTemplateModal?.open(selectedTemplates[index].template_id);
								}}
								aria-label="Info"
							>
								<i class="bi bi-info-circle"></i>
							</button>
							<button
								class="btn btn-outline-primary"
								title="Download"
								type="button"
								onclick={() => {exportTemplate(selectedTemplates[index].template_id);}}
								aria-label="Download"
							>
								<i class="bi bi-download"></i>
							</button>
							<a id="downloadTemplateButton" class="d-none">Download template link</a>
							{#if page.data.userInfo.email == templateGroup.user_email}
								<button
									class="btn btn-outline-primary"
									title="Edit"
									onclick={async () => {
										await updateTemplateModal?.open(selectedTemplates[index].template_id);
									}}
									aria-label="Edit"
								>
									<i class="bi bi-pencil"></i>

								</button>
								<ConfirmActionButton
									modalId={'downloadTemplateButton' + selectedTemplates[index].template_id}
									style="danger"
									title="Delete"
									btnStyle="outline-danger"
									buttonIcon="trash"
									label=""
									message="Delete template {selectedTemplates[index].template_id}"
									callbackAction={() => handleDeleteTemplate(selectedTemplates[index].template_id)}
								/>
							{/if}
							</td>
						{:else if modalType === 'select'}
							<td class="col-1">
								<button
									class="btn btn-outline-primary"
									title="Select"
									aria-label="Select"
									onclick={async () => {
										await handleSelect(selectedTemplates[index].template_id);
									}}
								>
									<i class="bi bi-check-circle"></i>
								</button>
							</td>
						{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
</div>
</div>

<div>
	<Paginator
		currentPage={currentPage}
		pageSize={pageSize}
		totalCount={templatePage.total_count}
		onPageChange={async (a, b) => {
			currentPage=a;
			pageSize=b;
			await searchTemplate();
		}}
	/>
</div>
</div>

<TemplateUpdateModal
    onTemplateSave={searchTemplate}
	bind:this={updateTemplateModal}
/>

<TemplateInfoModal
	bind:this={infoTemplateModal}
/>

<TemplateImportModal
	onTemplateImport={searchTemplate}
	bind:this={importTemplateModal}
/>