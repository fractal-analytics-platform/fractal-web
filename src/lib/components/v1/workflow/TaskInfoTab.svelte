<script>
	import { formatMarkdown } from '$lib/common/component_utilities';

	/** @type {import("$lib/types").Task} */
	export let task;
</script>

<ul class="list-group">
	<li class="list-group-item list-group-item-light fw-bold">Name</li>
	<li class="list-group-item">{task.name}</li>
	<li class="list-group-item list-group-item-light fw-bold">Version</li>
	<li class="list-group-item">{task.version || '–'}</li>
	<li class="list-group-item list-group-item-light fw-bold">Docs Link</li>
	<li class="list-group-item">
		{#if task.docs_link}
			<a href={task.docs_link} target="_blank">{task.docs_link}</a>
		{:else}
			-
		{/if}
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Docs Info</li>
	<li class="list-group-item">
		{#if task.docs_info}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html formatMarkdown(task.docs_info)}
		{:else}
			-
		{/if}
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Owner</li>
	<li class="list-group-item">{task.owner || '–'}</li>
	<li class="list-group-item list-group-item-light fw-bold">Command</li>
	<li class="list-group-item">
		<code>{task.command}</code>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Source</li>
	<li class="list-group-item">
		<code>{task.source}</code>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Input Type</li>
	<li class="list-group-item">
		<code>{task.input_type}</code>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Output Type</li>
	<li class="list-group-item">
		<code>{task.output_type}</code>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Args Schema Version</li>
	<li class="list-group-item">
		{task.args_schema_version || '–'}
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Args Schema</li>
	<li class="list-group-item">
		{#if task.args_schema}
			<code>
				<pre>{JSON.stringify(task.args_schema, null, 2)}</pre>
			</code>
		{:else}
			-
		{/if}
	</li>
</ul>
