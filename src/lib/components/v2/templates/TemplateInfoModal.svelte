<script>
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('fractal-components/types/api').WorkflowTemplate|undefined} */
	let template = $state();

	/** @type {Modal|undefined} */
	let modal = $state();

    /**
	 * @param {import('fractal-components/types/api').WorkflowTemplate} templateObj
	*/
	export function openInfo(templateObj) {
		template = templateObj;
		modal?.show();
	}

</script>

<Modal
    id="templateInfoModal"
    centered={true}
    scrollable={true}
    bind:this={modal}
    size="lg"
>
	{#snippet header()}
		<h5 class="modal-title">Workflow Template {template?.id}</h5>
	{/snippet}
	{#snippet body()}
		<ul class="list-group">
            <li class="list-group-item text-bg-light">
				<strong>Name</strong>
			</li>
			<li class="list-group-item">
				<span>{template?.name}</span>
			</li>
            <li class="list-group-item text-bg-light">
				<strong>Version</strong>
			</li>
			<li class="list-group-item">
				<span>{template?.version}</span>
			</li>
            <li class="list-group-item text-bg-light">
				<strong>Group</strong>
			</li>
			<li class="list-group-item">
				<span>{template?.user_group_id}</span>
			</li>
            <li class="list-group-item text-bg-light">
				<strong>Description</strong>
			</li>
			<li class="list-group-item">
				<span>{template?.description}</span>
			</li>
            <li class="list-group-item text-bg-light">
				<strong>Created at</strong>
			</li>
			<li class="list-group-item">
				<span>{template?.timestamp_created}</span>
			</li>
		</ul>
	{/snippet}
</Modal>
