<script>
	/** @type {import('fractal-components/types/api').ImagesStatus|Omit<import('fractal-components/types/api').ImagesStatus, 'num_available_images'>|undefined} */
	export let status;
	/** @type {number} */
	export let projectId;
	/** @type {number} */
	export let datasetId;
	/** @type {number} */
	export let workflowTaskId;
	/** @type {string|undefined} */
	export let parametersHash = undefined;

	/** @type {import('./ImagesStatusModal.svelte').default} */
	export let imagesStatusModal;

	$: showDone =
		status &&
		(status.num_done_images > 0 ||
			(status.num_done_images === 0 && status.num_failed_images === 0));
	$: showFailed =
		status &&
		(status.num_failed_images > 0 ||
			(status.num_done_images === 0 && status.num_failed_images === 0));
</script>

{#if status}
	<span class="d-flex">
		{#if status.num_submitted_images > 0}
			<button
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() =>
					imagesStatusModal.open(projectId, datasetId, workflowTaskId, parametersHash, 'submitted')}
			>
				<span class="d-flex">
					<span class="pe-1 image-status text-primary" aria-label="Submitted images">
						{status.num_submitted_images}
					</span>
					<div
						class="mt-1 pe-1 spinner-border spinner-border-sm text-primary image-status"
						role="status"
					>
						<span class="visually-hidden">Loading...</span>
					</div>
				</span>
			</button>
		{/if}
		{#if showDone}
			<button
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() =>
					imagesStatusModal.open(projectId, datasetId, workflowTaskId, parametersHash, 'done')}
			>
				<span class="d-flex">
					<span class="image-status text-success ps-1" aria-label="Done images">
						{status.num_done_images}
					</span>
					<i class="image-status-icon bi bi-check text-success pe-1" />
				</span>
			</button>
		{/if}
		{#if showDone && showFailed}
			/
		{/if}
		{#if showFailed}
			<button
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() =>
					imagesStatusModal.open(projectId, datasetId, workflowTaskId, parametersHash, 'failed')}
			>
				<span class="d-flex">
					<span class="image-status text-danger ps-1" aria-label="Failed images">
						{status.num_failed_images}
					</span>
					<i class="image-status-icon bi bi-x text-danger pe-1" />
				</span>
			</button>
		{/if}
		{#if 'num_available_images' in status}
			/
			<span class="ps-1" aria-label="Available images">{status.num_available_images}</span>
		{/if}
	</span>
{/if}

<style>
	:global(.image-status-icon) {
		font-size: 160%;
		font-weight: bold;
		margin: 0 -5px -5px -5px;
		line-height: 0;
		display: block;
	}

	:global(.active .image-status),
	:global(.active .image-status-icon) {
		color: #fff !important;
	}

	.status-modal-btn:hover span {
		text-decoration: underline;
	}
</style>
