<script>
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import Modal from '../../common/Modal.svelte';
	import { formatMarkdown } from 'fractal-components/common/utils';

	/** @type {import('fractal-components/types/api').TaskV2|undefined} */
	let task = $state();
	/** @type {string|undefined} */
	let taskVersion = $state();

	/** @type {Modal|undefined} */
	let modal = $state();
	let loading = $state(false);

	/**
	 *
	 * @param {number} taskId
	 * @param {string|undefined} taskGroupVersion
	 */
	export async function open(taskId, taskGroupVersion) {
		modal?.show();
		taskVersion = taskGroupVersion;

		// Retrieving all the fields
		loading = true;
		const response = await fetch(`/api/v2/task/${taskId}`);

		const result = await response.json();

		if (response.ok) {
			task = result;
		} else {
			modal?.displayErrorAlert('Unable to load task');
			task = undefined;
		}
		loading = false;
	}
</script>

<Modal id="taskInfoModal" size="xl" bind:this={modal}>
	{#snippet header()}
		{#if task}
			<h1 class="h5 modal-title">Task {task.name}</h1>
		{/if}
	{/snippet}
	{#snippet body()}
		<span id="errorAlert-taskInfoModal"></span>
		{#if task}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Task properties</p>
					<div class="list-group">
						<div class="list-group-item list-group-item-light fw-bold">Name</div>
						<div class="list-group-item">{task.name}</div>
						<div class="list-group-item list-group-item-light fw-bold">Version</div>
						<div class="list-group-item">{taskVersion || '-'}</div>
						<div class="list-group-item list-group-item-light fw-bold">Type</div>
						<div class="list-group-item">{task.type}</div>
						{#if task.command_non_parallel !== null}
							<div class="list-group-item list-group-item-light fw-bold">Command non parallel</div>
							<div class="list-group-item"><code>{task.command_non_parallel}</code></div>
						{/if}
						{#if task.command_parallel !== null}
							<div class="list-group-item list-group-item-light fw-bold">Command parallel</div>
							<div class="list-group-item"><code>{task.command_parallel}</code></div>
						{/if}
						<div class="list-group-item list-group-item-light fw-bold">Input Types</div>
						<div class="list-group-item">
							<table class="table table-borderless mb-0">
								<tbody>
									{#each Object.keys(task.input_types) as key (key)}
										<tr class="d-flex">
											<td><code>{key}</code></td>
											<td class="flex-grow"><BooleanIcon value={task.input_types[key]} /></td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<div class="list-group-item list-group-item-light fw-bold">Output Types</div>
						<div class="list-group-item">
							<table class="table table-borderless mb-0">
								<tbody>
									{#each Object.keys(task.output_types) as key (key)}
										<tr class="d-flex">
											<td><code>{key}</code></td>
											<td class="flex-grow"><BooleanIcon value={task.output_types[key]} /></td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<div class="list-group-item list-group-item-light fw-bold">Docs Link</div>
						<div class="list-group-item">
							{#if task.docs_link}
								<a href={task.docs_link} target="_blank">{task?.docs_link}</a>
							{:else}
								-
							{/if}
						</div>
						<div class="list-group-item list-group-item-light fw-bold">Docs Info</div>
						<div class="list-group-item">
							{#if task.docs_info}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html formatMarkdown(task.docs_info)}
							{:else}
								-
							{/if}
						</div>

						{#if task.command_non_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if Object.keys(task.meta_non_parallel).length > 0}
								<div class="accordion" id="accordion-meta-non-parallel">
									<div class="accordion-item rounded-0">
										<h2 class="accordion-header">
											<button
												class="accordion-button list-group-item-light fw-bold collapsed rounded-0"
												type="button"
												data-bs-toggle="collapse"
												data-bs-target="#collapse-meta-non-parallel"
												aria-expanded="false"
												aria-controls="collapse-meta-non-parallel"
											>
												Initialisation Meta
											</button>
										</h2>
										<div
											id="collapse-meta-non-parallel"
											class="accordion-collapse collapse"
											data-bs-parent="#accordion-meta-non-parallel"
										>
											<div class="accordion-body">
												<code>
													<pre>{JSON.stringify(task.meta_non_parallel, null, 2)}</pre>
												</code>
											</div>
										</div>
									</div>
								</div>
							{:else}
								<div class="list-group-item list-group-item-light fw-bold">Initialisation Meta</div>
								<div class="list-group-item">-</div>
							{/if}
						{/if}
						{#if task.command_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if Object.keys(task.meta_parallel).length > 0}
								<div class="accordion" id="accordion-meta-parallel">
									<div class="accordion-item rounded-0">
										<h2 class="accordion-header">
											<button
												class="accordion-button list-group-item-light fw-bold collapsed rounded-0"
												type="button"
												data-bs-toggle="collapse"
												data-bs-target="#collapse-meta-parallel"
												aria-expanded="false"
												aria-controls="collapse-meta-parallel"
											>
												Compute Meta
											</button>
										</h2>
										<div
											id="collapse-meta-parallel"
											class="accordion-collapse collapse"
											data-bs-parent="#accordion-meta-parallel"
										>
											<div class="accordion-body">
												<code>
													<pre>{JSON.stringify(task.meta_parallel, null, 2)}</pre>
												</code>
											</div>
										</div>
									</div>
								</div>
							{:else}
								<div class="list-group-item list-group-item-light fw-bold">Compute Meta</div>
								<div class="list-group-item">-</div>
							{/if}
						{/if}
						<div class="list-group-item list-group-item-light fw-bold">Args Schema Version</div>
						<div class="list-group-item">{task.args_schema_version || '-'}</div>
						{#if task.command_non_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if task.args_schema_non_parallel}
								<div class="accordion" id="accordion-args-schema-non-parallel">
									<div class="accordion-item rounded-0">
										<h2 class="accordion-header">
											<button
												class="accordion-button list-group-item-light fw-bold collapsed rounded-0"
												type="button"
												data-bs-toggle="collapse"
												data-bs-target="#collapse-args-schema-non-parallel"
												aria-expanded="false"
												aria-controls="collapse-args-schema-non-parallel"
											>
												Args Schema non parallel
											</button>
										</h2>
										<div
											id="collapse-args-schema-non-parallel"
											class="accordion-collapse collapse"
											data-bs-parent="#accordion-args-schema-non-parallel"
										>
											<div class="accordion-body">
												<code>
													<pre>{JSON.stringify(task.args_schema_non_parallel, null, 2)}</pre>
												</code>
											</div>
										</div>
									</div>
								</div>
							{:else}
								<div class="list-group-item list-group-item-light fw-bold">
									Args Schema non parallel
								</div>
								<div class="list-group-item">-</div>
							{/if}
						{/if}
						{#if task.command_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if task.args_schema_parallel}
								<div class="accordion" id="accordion-args-schema-parallel">
									<div class="accordion-item rounded-0">
										<h2 class="accordion-header">
											<button
												class="accordion-button list-group-item-light fw-bold collapsed rounded-0"
												type="button"
												data-bs-toggle="collapse"
												data-bs-target="#collapse-args-schema-parallel"
												aria-expanded="false"
												aria-controls="collapse-args-schema-parallel"
											>
												Args Schema parallel
											</button>
										</h2>
										<div
											id="collapse-args-schema-parallel"
											class="accordion-collapse collapse"
											data-bs-parent="#accordion-args-schema-parallel"
										>
											<div class="accordion-body">
												<code>
													<pre>{JSON.stringify(task.args_schema_parallel, null, 2)}</pre>
												</code>
											</div>
										</div>
									</div>
								</div>
							{:else}
								<div class="list-group-item list-group-item-light fw-bold">
									Args Schema parallel
								</div>
								<div class="list-group-item">-</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	{/snippet}
</Modal>
