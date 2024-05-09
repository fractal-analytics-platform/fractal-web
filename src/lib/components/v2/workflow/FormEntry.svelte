<script>
	import FormBaseEntry from './FormBaseEntry.svelte';

	/** @type {import('./form-builder-types').FormBuilderEntry} */
	export let entry;
	/** @type {Array<import('./form-builder-types').FormBuilderEntry>} */
	export let parent;
	/** @type {number} */
	export let index;
	/** @type {(parent: Array<import('./form-builder-types').FormBuilderEntry>, index: number, type: string) => void} */
	export let changeType;
	/** @type {(parent: Array<import('./form-builder-types').FormBuilderEntry>, hasKey: boolean) => void} */
	export let addProperty;
	/** @type {(parent: Array<import('./form-builder-types').FormBuilderEntry>, index: number) => void} */
	export let removeProperty;
	/** @type {() => void} */
	export let triggerChanges;
</script>

{#if entry.type === 'object' || entry.type === 'array'}
	<div class="accordion mb-2" id="accordion-{entry.id}">
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button
					class="accordion-button collapsed ps-1 pt-1 pb-1"
					type="button"
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
								on:input={triggerChanges}
							/>
						{/if}
						<button
							class="btn btn-outline-danger"
							type="button"
							on:click={() => removeProperty(parent, index)}
							aria-label="Remove property"
							data-bs-toggle="collapse"
							data-bs-target=""
						>
							<i class="bi bi-trash" />
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
				</button>
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
								<svelte:self
									entry={child}
									parent={entry.children}
									index={childIndex}
									{changeType}
									{removeProperty}
									{addProperty}
									{triggerChanges}
								/>
							{:else}
								<FormBaseEntry
									entry={child}
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
								on:click={() => {
									if ('children' in entry) {
										addProperty(entry.children, entry.type === 'object');
									}
								}}
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
		{entry}
		{triggerChanges}
		changeType={() => changeType(parent, index, entry.type)}
		removeProperty={() => removeProperty(parent, index)}
	/>
{/if}
