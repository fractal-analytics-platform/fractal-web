<script>
    import { getAlertErrorFromResponse } from '$lib/common/errors';
	import TemplateUpdateModal from '$lib/components/v2/templates/TemplateUpdateModal.svelte';
    import TemplateInfoModal from '$lib/components/v2/templates/TemplateInfoModal.svelte';
	import TemplateImportModal from '$lib/components/v2/templates/TemplateImportModal.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { pushState } from '$app/navigation';

    /**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').TemplatePage} templatePage
	 * @property {number|undefined} [singleSelectedTemplateId]
	 * @property {number|undefined} [templateId]
	 * @property {boolean} [isOwner]
	 * @property {string|undefined} [userEmail]
	 * @property {string|undefined} [templateName]
	 * @property {number|undefined} [templateVersion]
	 * @property {Array<[number, string]>} [groups]
	 * @property {'edit'|'select'} modalType
	 * @property {any} [handleSelect]
	 */
	/** @type {Props} */
	let {
		templatePage = $bindable(),
		singleSelectedTemplateId = $bindable(undefined),
		templateId: initialTemplateId = undefined,
		isOwner: initialIsOwner = false,
		userEmail: initialUserEmail = undefined,
		templateName: initialTemplateName = undefined,
		templateVersion: initialTemplateVersion = undefined,
		groups = [],
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
	let currentPage = $state(templatePage.current_page);
	/** @type {number} */
	let pageSize = $state(templatePage.page_size);
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

	let lastAppliedState = $state({
		templateId: initialTemplateId,
		isOwner: initialIsOwner,
		userEmail: initialUserEmail,
		templateName: initialTemplateName,
		templateVersion: initialTemplateVersion,
	});

	const currentState = $derived({
		templateId,
		isOwner,
		userEmail,
		templateName,
		templateVersion,
	});

	const isDefault = $derived(
		templateId === undefined &&
		isOwner === false &&
		userEmail === undefined &&
		templateName === undefined &&
		templateVersion === undefined
	);

	const isDirtyFromApplied = $derived(
		currentState.templateId != lastAppliedState.templateId ||
		currentState.isOwner !== lastAppliedState.isOwner ||
		currentState.userEmail !== lastAppliedState.userEmail ||
		(
			currentState.templateName !== lastAppliedState.templateName  &&
			!(
				currentState.templateName === "" &&
				lastAppliedState.templateName === undefined
			)
		) ||
		currentState.templateVersion != lastAppliedState.templateVersion
	);

	const applyClass = $derived(isDirtyFromApplied ? 'btn-primary' : 'btn-secondary');
	const resetClass = $derived(!isDefault ? 'btn-warning' : 'btn-secondary');

	onMount(async () => {/** @type {number|undefined} */
		templateId = initialTemplateId;
		isOwner = initialIsOwner;
		userEmail = initialUserEmail;
		templateName = initialTemplateName;
		templateVersion = initialTemplateVersion;
		await searchTemplate();
	});
	
	export async function searchTemplate() {
		const url = new URL(window.location.href);
		// Headers
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		// Query parametes
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('page_size', String(pageSize));
		params.set('is_owner', String(isOwner));

		templateId && params.set('template_id', String(templateId));
		userEmail && params.set('user_email', userEmail);
		templateName && params.set('name', templateName);
		templateVersion && params.set('version', String(templateVersion));

		if (modalType === "edit") {
			isOwner ? url.searchParams.set('is_owner', String(isOwner)): url.searchParams.delete('is_owner');
			templateId ? url.searchParams.set('template_id', String(templateId)) : url.searchParams.delete('template_id');
			userEmail ? url.searchParams.set('user_email', userEmail) : url.searchParams.delete('user_email');
			templateName ? url.searchParams.set('name', templateName) : url.searchParams.delete('name');
			templateVersion ? url.searchParams.set('version', String(templateVersion)) : url.searchParams.delete('version');
		}
		await tick();
		pushState(url, {});

		let response = await fetch(
            `/api/v2/workflow-template?${params.toString()}`,
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
		const response = await fetch(`/api/v2/workflow-template/${templateId}/export`, {
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
		const response = await fetch(`/api/v2/workflow-template/${templateId}`, {
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
			<div class="col">
				<label for="searchTemplateId" class="form-label small text-muted">Template ID</label>
				<input
					id="searchTemplateId"
					type="number"
					class="form-control form-control-sm"
					min="1"
					bind:value={templateId}
				/>
			</div>

			<div class="col">
				<label for="searchTemplateName" class="form-label small text-muted">Name</label>
				<input
					id="searchTemplateName"
					type="text"
					class="form-control form-control-sm"
					bind:value={templateName}
				/>
			</div>

			<div class="col">
				<label for="searchUserEmail" class="form-label small text-muted">User email</label>
				<select
					id="searchUserEmail"
					class="form-select form-select-sm"
					bind:value={userEmail}
				>
					<option value={undefined}>All users</option>
					{#each templatePage.email_list as email, index (index) }
						<option value={email}>{email}</option>
					{/each}
				</select>
			</div>

			<div class="col">
				<label for="searchTemplateVersion" class="form-label small text-muted">Version</label>
				<input
					id="searchTemplateVersion"
					type="number"
					class="form-control form-control-sm"
					min="1"
					bind:value={templateVersion}
				/>
			</div>

			<div class="col-auto">
				<div class="form-check mb-1">
					<input
						id="isOwnerCheckbox"
						type="checkbox"
						class="form-check-input"
						bind:checked={isOwner}
					/>
					<label class="form-check-label small" for="isOwnerCheckbox">
						Only owned
					</label>
				</div>
			</div>

			<div class="col-auto d-flex gap-2">
				<button
					class="btn {applyClass} btn-sm px-3"
					disabled={!isDirtyFromApplied}
					onclick={async () => {
						currentPage = 1;
						lastAppliedState = { ...currentState };
						await searchTemplate();
					}}
				>
					Apply
				</button>
				<button
					class="btn {resetClass} btn-sm px-3"
					disabled={isDefault}
					onclick={async () => {
						currentPage = 1;
						templateId = undefined;
						isOwner = false;
						userEmail = undefined;
						templateName = undefined;
						templateVersion = undefined;
						lastAppliedState = { ...currentState };
						await searchTemplate();
					}}
				>
					Reset
				</button>
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
				{#if modalType==='select'}
					<th>Select</th>
				{/if}
                <th>Name</th>
				<th>User email</th>
                <th>Versions</th>
				{#if modalType==='edit'}
					<th>Actions</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each templatePage.items as templateGroup, index (index)}
				<tr>
					{#if modalType==='select'}
					 	<td class="col-1">
							<button
								class="btn btn-outline-primary"
								title="Select"
								aria-label="Select"
								onclick={async () => {
									singleSelectedTemplateId = selectedTemplates[index].template_id;
									await handleSelect();
								}}
							>
								<i class="bi bi-plus-circle"></i>
							</button>
						</td>
					{/if}
                    <td class="col-5">{templateGroup.template_name}</td>
					<td>{templateGroup.user_email}</td>
                    <td class="col-2">
						{#if templateGroup.templates.length>1}
						<select
							class="form-select"
							aria-label="Version for template '{templateGroup.template_name}' of {templateGroup.user_email}"
							bind:value={selectedTemplates[index]}
						>
							{#each templateGroup.templates as template, i (i)}
								<option value={template}>{template.template_version}</option>
							{/each}
						</select>
						{:else}
							{templateGroup.templates[0].template_version}
						{/if}
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
	{groups}
	bind:this={updateTemplateModal}
/>

<TemplateInfoModal
	bind:this={infoTemplateModal}
/>

<TemplateImportModal
	onTemplateImport={searchTemplate}
	{groups}
	bind:this={importTemplateModal}
/>