<script>
  import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

  /**
   * @typedef {Object} Props
   * @property {import('fractal-components/types/api').WorkflowImportErrorData[]|undefined} workflowImportErrorData
   * @property {(string|undefined)[]} selectedVersions
   * @property {boolean} includeOlderVersions
   * @property {import('fractal-components/types/api').WorkflowImport|undefined} workflowMetadata
   * @property {boolean} creating
   */

  /** @type {Props} */
  let {
    workflowImportErrorData = $bindable(),
    selectedVersions = $bindable(),
    includeOlderVersions = $bindable(),
    workflowMetadata = $bindable(),
    creating,
  } = $props();
</script>

<hr />
	<p>
		Some of the requested tasks are not available on this Fractal instance.
		You can collect missing task packages at the <a href="/v2/tasks/management">Tasks management</a> page, 
		or select one of the available versions listed below.
	</p>
	

	<div class="mb-3">
		<div class="form-check">
			<input
				class="form-check-input"
				type="checkbox"
				id="checkIncludeOlderVersions"
				bind:checked={includeOlderVersions}
			/>
			<label class="form-check-label" for="checkIncludeOlderVersions">
				<i>Include older versions</i>
			</label>
		</div>
	</div>
	

{#each workflowImportErrorData as data, index (index)}
	<hr />	
	<section class="task-to-import">
		<div
			style="display: flex; align-items: center; gap: 8px;"
		>
			<div>
				{#if data.outcome === "success" || selectedVersions[index]}
					<BooleanIcon value={true} />
				{:else}
					<BooleanIcon value={false} />
				{/if}
			</div>
			<div>
				Task <strong>{data.task_name}</strong> <span>({data.pkg_name})</span>
			</div>
		</div>
		<div>Requested version: {data.version || '-'}</div>
		<div>
		{#if data.outcome !== "success"}
			{#if data.available_tasks.some(task => !data.version || includeOlderVersions || (!includeOlderVersions && task.version > data.version))}
			<div class="row row-cols-lg-auto g-3 align-items-center">
			  <div class="col-12">
				Available versions:
			</div>
			<div class="col-12">
				<select
					bind:value={selectedVersions[index]}
					style="width: 15ch"
					class="form-select"
				>
					<option value={undefined}>Select...</option>
					{#each [...data.available_tasks].sort(
						(a, b) => a.version.localeCompare(b.version)
					) as task, i (i)}
						{#if !data.version || includeOlderVersions || (!includeOlderVersions && task.version > data.version)}
							<option
								value={task.version}
								title={task.active ? "" : "Not active"}
							>
									{task.version}{task.active ? "" : " ⚠️"}
							</option>
						{/if}
					{/each}
				</select>
			</div>
			</div>
			{:else}
				No available versions.<br>
				You should collect the task package at the <a href="/v2/tasks/management">Tasks management</a>
				page{#if !includeOlderVersions}, or try including older versions{/if}.
			{/if}
		{/if}
		</div>
	</section>
	{/each}
<hr />
<div>
	<button
		class="btn btn-primary mt-2"
		disabled={creating || selectedVersions.some(v => v === undefined)}
	>
		{#if creating}
			<span
				class="spinner-border spinner-border-sm"
				role="status"
				aria-hidden="true"
			></span>
		{/if}
		Import workflow
	</button>
	<button
		class="btn btn-danger mt-2"
		onclick={() => {
			workflowImportErrorData = undefined;
			workflowMetadata = undefined;
			includeOlderVersions = false;
		}}
	>
		Cancel
	</button>
</div>