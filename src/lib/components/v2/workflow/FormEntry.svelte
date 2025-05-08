<script>
	import FormBaseEntry from './FormBaseEntry.svelte';
	import FormEntry from './FormEntry.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('./form-builder-types').FormBuilderEntry} entry
	 * @property {Array<import('./form-builder-types').FormBuilderEntry>} parent
	 * @property {number} index
	 * @property {(parent: Array<import('./form-builder-types').FormBuilderEntry>, index: number, type: string) => void} changeType
	 * @property {(parent: Array<import('./form-builder-types').FormBuilderEntry>, hasKey: boolean) => void} addProperty
	 * @property {(parent: Array<import('./form-builder-types').FormBuilderEntry>, index: number) => void} removeProperty
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
</script>

{#if entry.type === 'object' || entry.type === 'array'}
	<div class="accordion mb-2" id="accordion-{entry.id}">
		<div class="accordion-item">
			<h2 class="accordion-header">
				<div
					class="accordion-button collapsed ps-1 pt-1 pb-1"
					data-bs-toggle="collapse"
					data-bs-target="#collapse-{entry.id}"
					aria-expanded="false"
					aria-controls="collapse-{entry.id}"
				>
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
					{#if entry.type === 'object'}
						(obj)
					{:else}
						(list)
					{/if}
				</div>
			</h2>
			<div
				id="collapse-{entry.id}"
				class="accordion-collapse collapse"
				data-bs-parent="#accordion-{entry.id}"
			>
				<div class="accordion-body">
					{#if entry.children}
						{#each entry.children as child, childIndex}
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
