<script>
	/** @type {import('fractal-components/types/api').HistoryRunRead} */
	export let run;

	$: doneImages = run.units.reduce((agg, u) => (u.status === 'done' ? agg + 1 : agg), 0);
	$: failedImages = run.units.reduce((agg, u) => (u.status === 'failed' ? agg + 1 : agg), 0);
	$: submittedImages = run.units.reduce((agg, u) => (u.status === 'submitted' ? agg + 1 : agg), 0);
</script>

<span class="d-flex">
	<span class="d-flex">
		{#if submittedImages > 0}
			<button
				aria-label="Submitted images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() => {}}
			>
				<span class="d-flex">
					<span class="pe-1 image-status text-primary">
						{submittedImages}
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
		{#if doneImages > 0}
			<button
				aria-label="Done images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() => {}}
			>
				<span class="d-flex">
					<span class="image-status text-success ps-1">
						{doneImages}
					</span>
					<i class="image-status-icon bi bi-check text-success pe-1" />
				</span>
			</button>
		{/if}
		{#if doneImages > 0 && failedImages > 0}
			/
		{/if}
		{#if failedImages > 0}
			<button
				aria-label="Failed images"
				class="status-modal-btn btn btn-link text-decoration-none p-0"
				on:click={() => {}}
			>
				<span class="d-flex">
					<span class="image-status text-danger ps-1">
						{failedImages}
					</span>
					<i class="image-status-icon bi bi-x text-danger pe-1" />
				</span>
			</button>
		{/if}
	</span>
</span>
