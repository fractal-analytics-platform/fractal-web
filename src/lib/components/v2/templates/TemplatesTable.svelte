<script>
    import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import TemplateUpdateModal from '$lib/components/v2/templates/TemplateUpdateModal.svelte';
    import TemplateInfoModal from '$lib/components/v2/templates/TemplateInfoModal.svelte';

    /**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').TemplatePage} templatePage
	 */
	/** @type {Props} */
	let {templatePage = $bindable()} = $props();

    /** @type {TemplateUpdateModal|undefined} */
	let updateTemplateModal = undefined;
    /** @type {TemplateInfoModal|undefined} */
	let infoTemplateModal = undefined;
    
    /** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;



    /**
	 * @param {number|null} currentPage
	 * @param {number|null} pageSize
	 */
	export async function searchTemplate(currentPage = null, pageSize = null) {
		if (currentPage === null) {
			currentPage = templatePage.current_page;
		}
		if (pageSize === null) {
			pageSize = templatePage.page_size;
		}
		
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

</script>

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
							onclick={() => infoTemplateModal?.openInfo(template)}
							aria-label="Info"
						>
							<i class="bi bi-info-circle"></i>
						</button>
                        <button
							class="btn btn-outline-primary"
							onclick={() => updateTemplateModal?.openForEditing(template)}
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
                        <button
                            class="btn btn-outline-danger"
                            type="button"
                            onclick={() => null}
                            aria-label="Delete"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<TemplateUpdateModal
    onTemplateSave={async () => {await searchTemplate();}}
	bind:this={updateTemplateModal}
/>

<TemplateInfoModal
	bind:this={infoTemplateModal}
/>