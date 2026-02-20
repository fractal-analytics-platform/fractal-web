<script>
    import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
    import UpdateTemplateModal from '$lib/components/v2/templates/UpdateTemplateModal.svelte';
    /**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').TemplatePage} templatePage
	 */
	/** @type {Props} */
	let {templatePage = $bindable()} = $props();

    /** @type {UpdateTemplateModal|undefined} */
	let updateTemplateModal = undefined;
    
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
							class="btn btn-light"
							onclick={() => updateTemplateModal?.openForEditing(template)}
							aria-label="Edit"
							>
							<span class="text-primary">
							<i class="bi bi-pencil"></i>
							</span>
						</button>
                    </td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<UpdateTemplateModal
    onTemplateSave={async () => {await searchTemplate();}}
	bind:this={updateTemplateModal}
/>