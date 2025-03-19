<script>
	/** @type {import('fractal-components/types/api').HistoryRunAggregated} */
	export let run;
</script>

<span class="d-flex">
	<span class="d-flex">
		{#if run.num_submitted_units > 0}
			<button
				aria-label="Submitted images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() => {}}
			>
				<span class="d-flex">
					<span class="pe-1 image-status text-primary">
						{run.num_submitted_units}
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
		{#if run.num_done_units > 0}
			<button
				aria-label="Done images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() => {}}
			>
				<span class="d-flex">
					<span class="image-status text-success ps-1">
						{run.num_done_units}
					</span>
					<i class="image-status-icon bi bi-check text-success pe-1" />
				</span>
			</button>
		{/if}
		{#if run.num_done_units > 0 && run.num_failed_units > 0}
			/
		{/if}
		{#if run.num_failed_units > 0}
			<button
				aria-label="Failed images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() => {}}
			>
				<span class="d-flex">
					<span class="image-status text-danger ps-1">
						{run.num_failed_units}
					</span>
					<i class="image-status-icon bi bi-x text-danger pe-1" />
				</span>
			</button>
		{/if}
	</span>
</span>
