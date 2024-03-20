<script>
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('$lib/types-v2').DatasetV2} */
	export let dataset;
</script>

<Modal id="datasetFiltersModal" centered={true} scrollable={true}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Dataset filters</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<h5>Attribute filters</h5>
		{#if Object.entries(dataset.attribute_filters).length > 0}
			<table class="table table-bordered caption-top align-middle">
				<thead class="bg-light">
					<tr>
						<th class="col-4">Key</th>
						<th class="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(dataset.attribute_filters) as [filterKey, filterValue]}
						<tr>
							<td>{filterKey}</td>
							<td class="text-break"><code>{filterValue}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			None
		{/if}

		<h5 class="mt-4">Flag filters</h5>
		{#if Object.entries(dataset.flag_filters).length > 0}
			<table class="table table-bordered caption-top align-middle">
				<thead class="bg-light">
					<tr>
						<th class="col-4">Key</th>
						<th class="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(dataset.flag_filters) as [filterKey, filterValue]}
						<tr>
							<td>{filterKey}</td>
							<td>
								<BooleanIcon value={filterValue} />
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			None
		{/if}
	</svelte:fragment>
</Modal>
