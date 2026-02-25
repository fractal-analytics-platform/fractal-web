<script>
    import { getAlertErrorFromResponse } from '$lib/common/errors';
	import TemplateUpdateModal from '$lib/components/v2/templates/TemplateUpdateModal.svelte';
    import TemplateInfoModal from '$lib/components/v2/templates/TemplateInfoModal.svelte';
	import TemplateImportModal from '$lib/components/v2/templates/TemplateImportModal.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import FilteredTemplateTable from './FilteredTemplateTable.svelte';

    /**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').TemplatePage} templatePage
	 */
	/** @type {Props} */
	let {templatePage = $bindable()} = $props();

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
	let queryTemplateId = $state(undefined);
	/** @type {boolean} */
	let queryIsOwner = $state(false);
	/** @type {string|undefined} */
	let queryUserEmail = $state(undefined);
	/** @type {string|undefined} */
	let queryName = $state(undefined);
	/** @type {number|undefined} */
	let queryVersion = $state(undefined);

	onMount(() => {
		queryTemplateId=undefined;
		queryIsOwner=false;
		queryUserEmail=undefined;
		queryName=undefined;
		queryVersion=undefined;
	});

	export async function searchTemplate() {
		// Headers
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		// Query parametes
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('page_size', String(pageSize));
		params.set('is_owner', String(queryIsOwner));
		if (queryTemplateId) params.set('template_id', String(queryTemplateId));
		if (queryUserEmail) params.set('user_email', queryUserEmail);
		if (queryName) params.set('name', queryName);
		if (queryVersion) params.set('version', String(queryVersion));

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
<div class="d-flex justify-content-end align-items-center mb-3">
	<div class="col-2">
		<button
			class="btn btn-outline-primary btn-sm"
			onclick={() => {importTemplateModal?.show();}}
		>
			<i class="bi-upload"></i>
			Import from file
		</button>
	</div>
</div>

<div>
	<FilteredTemplateTable 
		emailList={templatePage.email_list}
		bind:queryTemplateId
		bind:queryIsOwner
		bind:queryUserEmail
		bind:queryName
		bind:queryVersion
		onSubmit={async () => {
			currentPage=1;
			await searchTemplate();
		}}
	/>
</div>

<div class="table-responsive mt-2">
	<table class="table" id="dataset-images-table">
		<thead>
			<tr>
                <th>Name</th>
				<th>User email</th>
                <th>Versions</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each templatePage.items as templateGroup, index (index)}
				<tr>
                    <td>{templateGroup.template_name}</td>
					<td>{templateGroup.user_email}</td>
                    <td>
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
				</tr>
			{/each}
		</tbody>
	</table>
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