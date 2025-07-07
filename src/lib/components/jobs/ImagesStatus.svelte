<script>
	import { isConverterType, isParallelType } from 'fractal-components/common/workflow_task_utils';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').ImagesStatus|undefined} status
	 * @property {boolean} running
	 * @property {import('fractal-components/types/api').DatasetV2} dataset
	 * @property {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @property {import('./ImagesStatusModal.svelte').default} imagesStatusModal
	 */

	/** @type {Props} */
	let { status, running, dataset, workflowTask, imagesStatusModal } = $props();

	let fullyDone = $derived(
		status && 'num_done_images' in status && status.num_done_images === status.num_available_images
	);
	let fullyFailed = $derived(
		status &&
			'num_failed_images' in status &&
			status.num_failed_images === status.num_available_images
	);
	let partial = $derived(status && !fullyDone && !fullyFailed);

	/**
	 * @param {import('fractal-components/types/api').WorkflowTaskV2} workflowTask
	 * @param {import('fractal-components/types/api').ImagesStatus} status
	 * @returns {boolean}
	 */
	function handleAsConverter(workflowTask, status) {
		if (isConverterType(workflowTask.task_type)) {
			return true;
		}
		if (isParallelType(workflowTask.task_type)) {
			return false;
		}
		return (
			'num_available_images' in status &&
			status.num_submitted_images === 0 &&
			status.num_done_images === 0 &&
			status.num_failed_images === 0 &&
			status.num_available_images === 0
		);
	}
</script>

{#if status}
	{#if handleAsConverter(workflowTask, status)}
		<span class="d-flex">
			{#if status.status === 'done'}
				<i class="status-icon bi bi-check text-success pe-1"></i>
			{:else if status.status === 'failed'}
				<i class="status-icon bi bi-x text-danger pe-1"></i>
			{:else if status.status === 'submitted'}
				{#if running}
					<div
						class="mt-1 pe-1 spinner-border spinner-border-sm text-primary status-wrapper"
						role="status"
					>
						<span class="visually-hidden">Loading...</span>
					</div>
				{:else}
					<i class="bi bi-hourglass"></i>
				{/if}
			{/if}
		</span>
	{:else}
		<span class="d-flex">
			{#if 'num_submitted_images' in status && status.num_submitted_images > 0}
				<button
					aria-label="Submitted images"
					class="status-modal-btn btn btn-link text-decoration-none p-0"
					onclick={() => imagesStatusModal.open(dataset, workflowTask)}
				>
					<span class="d-flex pe-1">
						<span class="pe-1 status-wrapper text-primary">
							{status.num_submitted_images}
						</span>
						<div
							class="mt-1 pe-1 spinner-border spinner-border-sm text-primary status-wrapper"
							role="status"
						>
							<span class="visually-hidden">Loading...</span>
						</div>
					</span>
				</button>
			{:else if status.status === 'submitted' && !running}
				<i class="bi bi-hourglass"></i>
			{/if}
			{#if 'num_done_images' in status && status.num_done_images > 0}
				<button
					aria-label="Done images"
					class="status-modal-btn btn btn-link text-decoration-none p-0"
					onclick={() => imagesStatusModal.open(dataset, workflowTask)}
				>
					<span class="d-flex">
						<span class="status-wrapper text-success ps-1">
							{status.num_done_images}
						</span>
						<i class="status-icon bi bi-check text-success pe-1"></i>
					</span>
				</button>
			{/if}
			{#if 'num_done_images' in status && status.num_done_images > 0 && status.num_failed_images}
				/
			{/if}
			{#if 'num_failed_images' in status && status.num_failed_images > 0}
				<button
					aria-label="Failed images"
					class="status-modal-btn btn btn-link text-decoration-none p-0"
					onclick={() => imagesStatusModal.open(dataset, workflowTask)}
				>
					<span class="d-flex">
						<span class="status-wrapper text-danger ps-1">
							{status.num_failed_images}
						</span>
						<i class="status-icon bi bi-x text-danger pe-1"></i>
					</span>
				</button>
			{/if}
			{#if partial && 'num_available_images' in status}
				/
				<span class="ps-1" aria-label="Available images">
					{status.num_available_images === null ? '?' : status.num_available_images}
				</span>
			{/if}
		</span>
	{/if}
{/if}
