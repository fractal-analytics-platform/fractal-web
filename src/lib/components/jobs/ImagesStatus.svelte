<script>
	/** @type {import('fractal-components/types/api').ImagesStatus|undefined} */
	export let status;
</script>

{#if status}
	<span class="d-flex">
		{#if status.num_submitted_images > 0}
			<span class="pe-1 image-status text-primary" aria-label="Submitted images">
				{status.num_submitted_images}
			</span>
			<div
				class="mt-1 pe-1 spinner-border spinner-border-sm text-primary image-status"
				role="status"
			>
				<span class="visually-hidden">Loading...</span>
			</div>
		{/if}
		<span class="image-status text-success ps-1" aria-label="Done images">
			{status.num_done_images}
		</span>
		<i class="image-status-icon bi bi-check text-success pe-1" />
		/
		<span class="image-status text-danger ps-1" aria-label="Failed images">
			{status.num_failed_images}
		</span>
		<i class="image-status-icon bi bi-x text-danger pe-1" />
		/
		<span class="ps-1" aria-label="Available images">{status.num_available_images}</span>
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
</style>
