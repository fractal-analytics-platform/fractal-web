<script>
	import { formatMarkdown } from '$lib/common/component_utilities';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';
	import Modal from '../../common/Modal.svelte';

	/** @type {import('$lib/types-v2').TaskV2|undefined} */
	let task;

	/** @type {Modal} */
	let modal;
	let loading = false;

	/**
	 *
	 * @param {import('$lib/types-v2').TaskV2} taskToLoad
	 */
	export async function open(taskToLoad) {
		modal.show();
		task = taskToLoad;

		// Retrieving the args_schema field
		loading = true;
		const response = await fetch(`/api/v2/task/${taskToLoad.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await response.json();

		if (response.ok) {
			task = result;
		} else {
			modal.displayErrorAlert('Unable to load task');
			task = undefined;
		}
		loading = false;
	}
</script>

<Modal id="taskInfoModal" size="xl" bind:this={modal}>
	<svelte:fragment slot="header">
		{#if task}
			<h1 class="h5 modal-title">Task {task.name}</h1>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		<span id="errorAlert-taskInfoModal" />
		{#if task}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Task properties</p>
					<ul class="list-group">
						<li class="list-group-item list-group-item-light fw-bold">Name</li>
						<li class="list-group-item">{task.name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Version</li>
						<li class="list-group-item">{task.version || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Owner</li>
						<li class="list-group-item">{task.owner || '-'}</li>
						{#if task.command_non_parallel !== null}
							<li class="list-group-item list-group-item-light fw-bold">Command non parallel</li>
							<li class="list-group-item"><code>{task.command_non_parallel}</code></li>
						{/if}
						{#if task.command_parallel !== null}
							<li class="list-group-item list-group-item-light fw-bold">Command parallel</li>
							<li class="list-group-item"><code>{task.command_parallel}</code></li>
						{/if}
						<li class="list-group-item list-group-item-light fw-bold">Source</li>
						<li class="list-group-item"><code>{task.source}</code></li>
						<li class="list-group-item list-group-item-light fw-bold">Input Types</li>
						<li class="list-group-item">
							<table class="table table-borderless mb-0">
								<tbody>
									{#each Object.keys(task.input_types) as key}
										<tr class="d-flex">
											<td><code>{key}</code></td>
											<td class="flex-grow"><BooleanIcon value={task.input_types[key]} /></td>
										</tr>
									{/each}
								</tbody>
							</table>
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Output Types</li>
						<li class="list-group-item">
							<table class="table table-borderless mb-0">
								<tbody>
									{#each Object.keys(task.output_types) as key}
										<tr class="d-flex">
											<td><code>{key}</code></td>
											<td class="flex-grow"><BooleanIcon value={task.output_types[key]} /></td>
										</tr>
									{/each}
								</tbody>
							</table>
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Docs Link</li>
						<li class="list-group-item">
							{#if task.docs_link}
								<a href={task.docs_link} target="_blank">{task?.docs_link}</a>
							{:else}
								-
							{/if}
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Docs Info</li>
						<li class="list-group-item">
							{#if task.docs_info}
								{@html formatMarkdown(task.docs_info)}
							{:else}
								-
							{/if}
						</li>

						{#if task.command_non_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if Object.keys(task.meta_non_parallel).length > 0}
								<div
									class="accordion"
									id="accordion-meta-non-parallel"
								>
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
								<li class="list-group-item list-group-item-light fw-bold">
									Initialisation Meta
								</li>
								<li class="list-group-item">-</li>
							{/if}
						{/if}
						{#if task.command_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if Object.keys(task.meta_parallel).length > 0}
								<div
									class="accordion"
									id="accordion-meta-parallel"
								>
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
								<li class="list-group-item list-group-item-light fw-bold">
									Compute Meta
								</li>
								<li class="list-group-item">-</li>
							{/if}
						{/if}
						<li class="list-group-item list-group-item-light fw-bold">Args Schema Version</li>
						<li class="list-group-item">{task.args_schema_version || '-'}</li>
						{#if task.command_non_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if task.args_schema_non_parallel}
								<div
									class="accordion"
									id="accordion-args-schema-non-parallel"
								>
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
								<li class="list-group-item list-group-item-light fw-bold">
									Args Schema non parallel
								</li>
								<li class="list-group-item">-</li>
							{/if}
						{/if}
						{#if task.command_parallel !== null}
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if task.args_schema_parallel}
								<div
									class="accordion"
									id="accordion-args-schema-parallel"
								>
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
								<li class="list-group-item list-group-item-light fw-bold">
									Args Schema parallel
								</li>
								<li class="list-group-item">-</li>
							{/if}
						{/if}
					</ul>
				</div>
			</div>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	</svelte:fragment>
</Modal>
