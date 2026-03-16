<script>
    /**
     * @typedef {Object} Props
     * @property {Array<import('./types').TemplateEntry>} templates
     */

    /** @type {Props} */
    let { templates } = $props();

	/** @type {Array<import('./types').TemplateEntry>}*/
    let filteredTemplates = $derived((() => {

		let result = lastAppliedState.templateName
			? templates.filter(entry =>
				entry.template_name.toLowerCase().includes(lastAppliedState.templateName.toLowerCase())
			)
			: templates;

		if (lastAppliedState.templateVersion) {
			result = result
				.map(entry => ({
					...entry,
					templates: entry.templates.filter(t =>
						t.template_version === lastAppliedState.templateVersion
					)
				}))
				.filter(entry => entry.templates.length > 0);
		}

		return result;
	})());

	/** @type {import('./types').TemplateItem}*/
	let selectedTemplates = $state(templates.map(item => item.templates[0]));

	$effect(() => {
		selectedTemplates = filteredTemplates.map(item => item.templates[0]);
	});

	/** @type {string|undefined} */
	let templateName = $state(undefined);
	/** @type {number|undefined} */
	let templateVersion = $state(undefined);

    let lastAppliedState = $state({
		templateName: undefined,
		templateVersion: undefined,
	});
	

    const currentState = $derived({templateName, templateVersion});
    const isDefault = $derived(lastAppliedState.templateName === undefined && lastAppliedState.templateVersion === undefined);
    const isDirtyFromApplied = $derived(
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

    /**
	 * @param {number} templateId
	 */
    async function downloadTemplate(templateId) {
        const response = await fetch(`/templates-table/template${templateId}.json`);
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `template${templateId}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }
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

			<div class="col-auto d-flex gap-2">
				<button
					class="btn {applyClass} btn-sm px-3"
                    disabled={!isDirtyFromApplied}
                    onclick={() => {
						lastAppliedState.templateName = currentState.templateName || undefined;
						lastAppliedState.templateVersion = currentState.templateVersion || undefined;
                    }}
				>
					Apply
				</button>
				<button
					class="btn {resetClass} btn-sm px-3"
                    disabled={isDefault}
                    onclick={() => {
                        templateName = undefined;
                        templateVersion = undefined;
                        lastAppliedState = { ...currentState };
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
                <th>Name</th>
                <th>Versions</th>
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
                    <td class="col-2">

                    </td>
					<td class="col-1">
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
