<script>
	/** @type {import('./form-builder-types').FormBuilderEntry} */
	export let entry;
	/** @type {() => void} */
	export let changeType;
	/** @type {() => void} */
	export let removeProperty;
	/** @type {() => void} */
	export let triggerChanges;
	export let editable = true;
</script>

<div class="input-group mb-2" class:has-validation={entry.error}>
	{#if 'key' in entry}
		<input
			type="text"
			class="form-control"
			placeholder="Argument name"
			class:is-invalid={entry.error}
			bind:value={entry.key}
			on:input={triggerChanges}
			disabled={!editable}
		/>
	{/if}
	{#if entry.type === 'string'}
		<input
			type="text"
			class="form-control"
			placeholder="Argument value"
			class:is-invalid={entry.error}
			bind:value={entry.value}
			on:input={triggerChanges}
			disabled={!editable}
		/>
	{:else if entry.type === 'number'}
		<input
			type="number"
			class="form-control"
			placeholder="Argument value"
			class:is-invalid={entry.error}
			bind:value={entry.value}
			on:input={triggerChanges}
			disabled={!editable}
		/>
	{:else if entry.type === 'boolean'}
		<select
			class="form-select"
			bind:value={entry.value}
			on:change={triggerChanges}
			disabled={!editable}
		>
			<option value={true}>True</option>
			<option value={false}>False</option>
		</select>
	{/if}
	<select class="form-select" bind:value={entry.type} on:change={changeType} disabled={!editable}>
		<option value="string">String</option>
		<option value="number">Number</option>
		<option value="boolean">Boolean</option>
		<option value="object">Object</option>
		<option value="array">Array</option>
	</select>
	<button
		class="btn btn-outline-danger"
		type="button"
		on:click={removeProperty}
		aria-label="Remove property"
		disabled={!editable}
	>
		<i class="bi bi-trash" />
	</button>
	{#if entry.error}
		<div class="invalid-feedback">{entry.error}</div>
	{/if}
</div>
