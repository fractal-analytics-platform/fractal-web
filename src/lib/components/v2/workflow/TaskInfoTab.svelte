<script>
	import { formatMarkdown } from '$lib/common/component_utilities';

	
	
	/**
	 * @typedef {Object} Props
	 * @property {import("fractal-components/types/api").TaskV2} task
	 * @property {string | null} taskVersion
	 */

	/** @type {Props} */
	let { task, taskVersion } = $props();
</script>

<ul class="list-group">
	<li class="list-group-item list-group-item-light fw-bold">Name</li>
	<li class="list-group-item">{task.name}</li>
	<li class="list-group-item list-group-item-light fw-bold">Type</li>
	<li class="list-group-item">{task.type}</li>
	<li class="list-group-item list-group-item-light fw-bold">Version</li>
	<li class="list-group-item">{taskVersion || '–'}</li>
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
	{#if task.command_non_parallel !== null}
		<li class="list-group-item list-group-item-light fw-bold">Command non parallel</li>
		<li class="list-group-item">
			<code>{task.command_non_parallel}</code>
		</li>
	{/if}
	{#if task.command_parallel !== null}
		<li class="list-group-item list-group-item-light fw-bold">Command parallel</li>
		<li class="list-group-item">
			<code>{task.command_parallel}</code>
		</li>
	{/if}
	<li class="list-group-item list-group-item-light fw-bold">Args Schema Version</li>
	<li class="list-group-item">
		{task.args_schema_version || '–'}
	</li>
	{#if task.command_non_parallel !== null}
		<li class="list-group-item list-group-item-light fw-bold">Args Schema non parallel</li>
		<li class="list-group-item">
			{#if task.args_schema_non_parallel}
				<code>
					<pre>{JSON.stringify(task.args_schema_non_parallel, null, 2)}</pre>
				</code>
			{:else}
				-
			{/if}
		</li>
	{/if}
	{#if task.command_parallel !== null}
		<li class="list-group-item list-group-item-light fw-bold">Args Schema parallel</li>
		<li class="list-group-item">
			{#if task.args_schema_parallel}
				<code>
					<pre>{JSON.stringify(task.args_schema_parallel, null, 2)}</pre>
				</code>
			{:else}
				-
			{/if}
		</li>
	{/if}
</ul>
