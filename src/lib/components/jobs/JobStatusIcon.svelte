<script>
	/** @type {import('$lib/types').JobStatus|undefined} */
	export let status;
</script>

{#if status}
	<span title={status}>
		{#if status === 'submitted'}
    <div class="spinner-border spinner-border-sm text-primary job-status-submitted" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
		{:else if status === 'done'}
			<i class="job-status-icon bi bi-check text-success" />
		{:else if status === 'failed'}
			<i class="job-status-icon bi bi-x text-danger" />
		{/if}
	</span>
{/if}

<style>
	:global(.job-status-icon) {
		font-size: 160%;
		font-weight: bold;
		margin: 0 -5px -5px -5px;
		line-height: 0;
		display: block;
	}

	:global(.active .job-status-icon) {
		background-color: #fff;
		border-radius: 50%;
	}

	:global(.active .job-status-submitted) {
		color: #fff !important;
	}
</style>
