<script>
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { onMount } from 'svelte';

    /**
     * @typedef {Object} Props
     * @property {Array<import('./types').TemplateEntry>} templates
	 * @property {Object} templateIdMap
     */

    /** @type {Props} */
    let { templates, templateIdMap } = $props();

	
	/** @type {import('./types').TemplateItem[]}*/
	let selectedTemplates = $state([]);

	$effect(() => {
		selectedTemplates = filteredTemplates.map(item => item.templates[0]);
	});
	
	onMount(() => {
		selectedTemplates = templates.map(item => item.templates[0]);
	})
	
	let templateName = $state('');
	/** @type {number|undefined} */
	let templateVersion = $state(undefined);
	
	/** @type {Array<import('./types').TemplateEntry>}*/
	let filteredTemplates = $derived((() => {
		
		let result;
		if (templateName) {
			result = templates.filter(entry =>
				entry.template_name.toLowerCase().includes(templateName.toLowerCase())
			);
		} else {
			result = templates;
		}
		
		if (templateVersion) {
			result = result
				.map(entry => ({
					...entry,
					templates: entry.templates.filter(t =>
						t.template_version === templateVersion
					)
				}))
				.filter(entry => entry.templates.length > 0);
		}

		return result;
	})());

    /**
	 * @param {number} templateId
	 */
    async function downloadTemplate(templateId) {
        const response = await fetch(`/templates-table/${templateIdMap[templateId]}`);
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `template${templateId}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

	/**
	* @param {number} templateId
	*/
	async function showSelectedTemplateModal(templateId) {
		const response = await fetch(`/templates-table/static/${templateIdMap[templateId]}`);
        templateInfo = await response.json();
		getBootstrapModal('template-info-modal').show();
	}

	function getBootstrapModal(id) {
		const modalElement = document.getElementById(id);
		// @ts-ignore
		// eslint-disable-next-line no-undef
		const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
		if (bootstrapModal) {
			return bootstrapModal;
		}
		// @ts-ignore
		// eslint-disable-next-line no-undef
		return new bootstrap.Modal(modalElement);
	}

	export function formatMarkdown(markdownValue) {
		if (!markdownValue) {
			return '';
		}
		return DOMPurify.sanitize(marked.parse(markdownValue));
	}

	/**
     * @typedef {Object} TemplateInfo
     * @property {string} name
	 * @property {number} version
	 * @property {string} description
    */
	/** @type {TemplateInfo}*/
	let templateInfo = $state({name: "-", version: 0, description: ""})
	


</script>

<div class="card mb-3">
	<div class="card-body">
		<div class="row g-3 align-items-end">
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
				<label for="searchTemplateVersion" class="form-label small text-muted">Version</label>
				<input
					id="searchTemplateVersion"
					type="number"
					class="form-control form-control-sm"
					min="1"
					bind:value={templateVersion}
				/>
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
                <th>Version</th>
                <th></th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredTemplates as templateGroup, index (index)}
				<tr>
                    <td class="col-5">{templateGroup.template_name}</td>
                    <td class="col-2">
						{#if templateGroup.templates.length>1}
						<select
							class="form-select"
							aria-label="Version for template '{templateGroup.template_name}'"
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
                    <td class="col-2">

                    </td>
					<td class="col-1">
						<button
								class="btn btn-outline-primary"
								title="Info"
								type="button"
								aria-label="Info"
                                onclick={async () => {
                                    await showSelectedTemplateModal(selectedTemplates[index].template_id);
                                }}
							>
								<i class="bi bi-info-circle"></i>
						</button>

						<button
								class="btn btn-outline-primary"
								title="Download"
								type="button"
								aria-label="Download"
                                onclick={async () => {
                                    await downloadTemplate(selectedTemplates[index].template_id);
                                }}
							>
								<i class="bi bi-download"></i>
						</button>
						<a id="downloadTemplateButton" class="d-none">Download template link</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
</div>
</div>

<div class="modal modal-xl" id="template-info-modal" tabindex="-1">
	<div class="modal-dialog modal-dialog-scrollable">
		<div class="modal-content">
			<div class="modal-body">
				<ul class="list-group">
					<li class="list-group-item text-bg-light">
						<strong>TEMPLATE NAME</strong>
					</li>
					<li class="list-group-item">
						<span>{templateInfo.name}</span>
					</li>
					<li class="list-group-item text-bg-light">
						<strong>TEMPLATE VERSION</strong>
					</li>
					<li class="list-group-item">
						<span>{templateInfo.version}</span>
					</li>
					
					<li class="list-group-item text-bg-light">
						<strong>TEMPLATE DESCRIPTION</strong>
					</li>
					<li class="list-group-item">
						<span>{templateInfo.description}</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>