<script>
	import { formatMarkdown } from '$lib/common/component_utilities';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	/** @type {import("$lib/types-v2").TaskV2} */
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
	<li class="list-group-item list-group-item-light fw-bold">Source</li>
	<li class="list-group-item">
		<code>{task.source}</code>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Input Type</li>
	<li class="list-group-item">
		<table class="table table-borderless mb-0">
			<tbody>
				{#each Object.keys(task.input_types) as key}
					<tr class="d-flex">
						<td><code>{key}</code></td>
						<td class="flex-grow">
							<BooleanIcon value={task.input_types[key]} />
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</li>
	<li class="list-group-item list-group-item-light fw-bold">Output Type</li>
	<li class="list-group-item">
		<table class="table table-borderless mb-0">
			<tbody>
				{#each Object.keys(task.output_types) as key}
					<tr class="d-flex">
						<td><code>{key}</code></td>
						<td class="flex-grow">
							<BooleanIcon value={task.output_types[key]} />
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</li>
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
