<script>
	import FormBaseEntry from './FormBaseEntry.svelte';
	import FormEntry from './FormEntry.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('../types/form').FormBuilderEntry} entry
	 * @property {Array<import('../types/form').FormBuilderEntry>} parent
	 * @property {number} index
	 * @property {(parent: Array<import('../types/form').FormBuilderEntry>, index: number, type: string) => void} changeType
	 * @property {(parent: Array<import('../types/form').FormBuilderEntry>, hasKey: boolean) => void} addProperty
	 * @property {(parent: Array<import('../types/form').FormBuilderEntry>, index: number) => void} removeProperty
	 * @property {() => void} triggerChanges
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let {
		entry = $bindable(),
		parent,
		index,
		changeType,
		addProperty,
		removeProperty,
		triggerChanges,
		editable = true
	} = $props();

	/**
	 * @param {string} entryId
	 */
	async function toggleCollapse(entryId) {
		const element = document.querySelector(`#accordion-${entryId} .accordion-button`);
		if (element instanceof HTMLElement) {
			element.classList.toggle('collapsed');
		}
	}
</script>

{#if entry.type === 'object' || entry.type === 'array'}
	<div class="accordion mb-2 form-entry" id="accordion-{entry.id}">
		<div class="accordion-item">
			<h2 class="accordion-header">
				<div class="accordion-button collapsed ps-1 pt-1 pb-1">
					<div class="input-group w-50 me-3" class:has-validation={entry.error}>
						{#if 'key' in entry}
							<input
								type="text"
								class="form-control"
								placeholder="Argument name"
								class:is-invalid={entry.error}
								bind:value={entry.key}
								data-bs-toggle="collapse"
								data-bs-target=""
								oninput={triggerChanges}
								disabled={!editable}
							/>
						{/if}
						<button
							class="btn btn-outline-danger"
							type="button"
							onclick={() => removeProperty(parent, index)}
							aria-label="Remove property"
							data-bs-toggle="collapse"
							data-bs-target=""
							disabled={!editable}
						>
							<i class="bi bi-trash"></i>
						</button>
						{#if entry.error}
							<div class="invalid-feedback">{entry.error}</div>
						{/if}
					</div>
					<button
						class="btn btn-form-entry-toggle"
						aria-controls="collapse-{entry.id}"
						aria-expanded="false"
						data-bs-toggle="collapse"
						data-bs-target="#collapse-{entry.id}"
						aria-label={entry.type === 'object' ? 'Toggle object' : 'Toggle list'}
						onclick={() => toggleCollapse(entry.id)}
					>
						{#if entry.type === 'object'}
							(obj)
						{:else}
							(list)
						{/if}
					</button>
				</div>
			</h2>
			<div
				id="collapse-{entry.id}"
				class="accordion-collapse collapse"
				data-bs-parent="#accordion-{entry.id}"
			>
				<div class="accordion-body">
					{#if entry.children}
						{#each entry.children as child, childIndex (childIndex)}
							{#if child.type === 'object' || child.type === 'array'}
								<FormEntry
									bind:entry={entry.children[childIndex]}
									{editable}
									parent={entry.children}
									index={childIndex}
									{changeType}
									{removeProperty}
									{addProperty}
									{triggerChanges}
								/>
							{:else}
								<FormBaseEntry
									bind:entry={entry.children[childIndex]}
									{editable}
									{triggerChanges}
									changeType={() => {
										if ('children' in entry) {
											changeType(entry.children, childIndex, child.type);
										}
									}}
									removeProperty={() => {
										if ('children' in entry) {
											removeProperty(entry.children, childIndex);
										}
									}}
								/>
							{/if}
						{/each}
						<div class="d-flex justify-content-center align-items-center mt-3">
							<button
								class="btn btn-secondary"
								onclick={() => {
									if ('children' in entry) {
										addProperty(entry.children, entry.type === 'object');
									}
								}}
								disabled={!editable}
							>
								Add property
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<FormBaseEntry
		bind:entry
		{editable}
		{triggerChanges}
		changeType={() => changeType(parent, index, entry.type)}
		removeProperty={() => removeProperty(parent, index)}
	/>
{/if}

<style>
	.form-entry .accordion-button {
		position: relative;
	}

	.form-entry .input-group {
		position: relative;
		z-index: 300;
	}

	.btn-form-entry-toggle::before {
		content: '';
		cursor: pointer;
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 200;
	}

	.btn-form-entry-toggle:focus-visible::before {
		box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
		border-top-left-radius: var(--bs-accordion-inner-border-radius);
		border-top-right-radius: var(--bs-accordion-inner-border-radius);
	}

	.btn-form-entry-toggle {
		border: 0 !important;
	}
</style>
