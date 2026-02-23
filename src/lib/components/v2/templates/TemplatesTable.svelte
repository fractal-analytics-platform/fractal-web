<script>
    import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import TemplateUpdateModal from '$lib/components/v2/templates/TemplateUpdateModal.svelte';
    import TemplateInfoModal from '$lib/components/v2/templates/TemplateInfoModal.svelte';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';

    /**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').TemplatePage} templatePage
	 */
	/** @type {Props} */
	let {templatePage = $bindable()} = $props();

	/** @type {import('fractal-components/types/api').WorkflowTemplate}*/
	let templateOnModal = $state(templatePage.items[0]);

    /** @type {TemplateUpdateModal|undefined} */
	let updateTemplateModal = undefined;
    /** @type {TemplateInfoModal|undefined} */
	let infoTemplateModal = undefined;
    
    /** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;


	/**
	 * @param {number} currentPage
	 * @param {number} pageSize
	 */
	export async function searchTemplate(currentPage, pageSize) {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		let response = await fetch(
            `/api/v2/workflow_template?page=${currentPage}&page_size=${pageSize}`,
			{
				method: 'GET',
				headers,
				credentials: 'include',
			}
		);
		if (response.ok) {
			templatePage = await response.json();
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'datasetImagesError'
			);
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
			if (templatePage.items.length === 1 && templatePage.current_page > 1) {
				await searchTemplate(templatePage.current_page - 1, templatePage.page_size)
			}
			else {
				await searchTemplate(templatePage.current_page, templatePage.page_size)
			}
		} else {
			console.error('Workflow not deleted');
			throw await getAlertErrorFromResponse(response);
		}
	}

</script>

<div class="container mt-2">
<div class="d-flex justify-content-end align-items-center mb-3">
	<div>
		<button class="btn btn-outline-success btn-sm" onclick={() => {}}>
			<i class="bi-upload"></i>
			Import from file
		</button>
	</div>
</div>
<div class="table-responsive mt-2">
	<table class="table" id="dataset-images-table">
		<thead>
			<tr>
				<th>User email</th>
                <th>Name</th>
                <th>Version</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each templatePage.items as template, index (index)}
				<tr>
					<td>{template.user_email}</td>
                    <td>{template.name}</td>
                    <td>{template.version}</td>
                    <td class="col-2">
                        <button
							class="btn btn-outline-primary"
							onclick={() => {
								templateOnModal=template;
								infoTemplateModal?.open();
							}}
							aria-label="Info"
						>
							<i class="bi bi-info-circle"></i>
						</button>
                        <button
							class="btn btn-outline-primary"
							onclick={() => {
								templateOnModal=template;
								updateTemplateModal?.open();
							}}
							aria-label="Edit"
						>
							<i class="bi bi-pencil"></i>

						</button>
                        <button
                            class="btn btn-outline-primary"
                            type="button"
                            onclick={() => {exportTemplate(template.id);}}
                            aria-label="Download"
                        >
                            <i class="bi bi-download"></i>
                        </button>
						<a id="downloadTemplateButton" class="d-none">Download template link</a>
						<ConfirmActionButton
							modalId={'downloadTemplateButton' + template.id}
							style="danger"
							btnStyle="outline-danger"
							buttonIcon="trash"
							label=""
							message="Delete template {template.id}"
							callbackAction={() => handleDeleteTemplate(template.id)}
						/>
                    </td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<div>
	<Paginator
		currentPage={templatePage.current_page}
		pageSize={templatePage.page_size}
		totalCount={templatePage.total_count}
		onPageChange={async (currentPage, pageSize) => {
			await searchTemplate(currentPage, pageSize);
		}}
	/>
</div>
</div>

<TemplateUpdateModal
    onTemplateSave={async () => {
		await searchTemplate(templatePage.current_page, templatePage.page_size);
	}}
	template={templateOnModal}
	bind:this={updateTemplateModal}
/>

<TemplateInfoModal
	template={templateOnModal}
	bind:this={infoTemplateModal}
/>