<script>
	/** @type {import('./form-builder-types').FormBuilderEntry} */
	export let entry;
	/** @type {() => void} */
	export let changeType;
	/** @type {() => void} */
	export let removeProperty;
	/** @type {() => void} */
	export let triggerChanges;
</script>

<div class="input-group mb-2" class:has-validation={entry.error}>
	{#if 'key' in entry}
		<input
			type="text"
			class="form-control"
			placeholder="Arg name"
			class:is-invalid={entry.error}
			bind:value={entry.key}
			on:input={triggerChanges}
		/>
	{/if}
	{#if entry.type === 'string'}
		<input
			type="text"
			class="form-control"
			placeholder="Argument default value"
			class:is-invalid={entry.error}
			on:input={triggerChanges}
			bind:value={entry.value}
		/>
	{:else if entry.type === 'number'}
		<input
			type="number"
			class="form-control"
			placeholder="Argument default value"
			class:is-invalid={entry.error}
			on:input={triggerChanges}
			bind:value={entry.value}
		/>
	{:else if entry.type === 'boolean'}
		<select class="form-control" bind:value={entry.value} on:change={triggerChanges}>
			<option value={true}>True</option>
			<option value={false}>False</option>
		</select>
	{/if}
	<select class="form-control" bind:value={entry.type} on:change={changeType}>
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
	>
		<i class="bi bi-trash" />
	</button>
	{#if entry.error}
		<div class="invalid-feedback">{entry.error}</div>
	{/if}
</div>
