<script>
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('$lib/types-v2').DatasetV2} */
	export let dataset;
</script>

<Modal id="datasetInfoModal" centered={true} scrollable={true}>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Dataset properties</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<ul class="list-group">
			<li class="list-group-item text-bg-light">
				<strong>Id</strong>
			</li>
			<li class="list-group-item">
				<span>{dataset.id}</span>
			</li>
			<li class="list-group-item text-bg-light">
				<strong>Name</strong>
			</li>
			<li class="list-group-item">
				<span>{dataset.name}</span>
			</li>
			<li class="list-group-item text-bg-light">
				<strong>Zarr dir</strong>
			</li>
			<li class="list-group-item">
				<span>{dataset.zarr_dir}</span>
			</li>
		</ul>
	</svelte:fragment>
</Modal>
