<script>
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';
	import Modal from '../../common/Modal.svelte';

	/** @type {import('$lib/types').User} */
	export let user;
	/** @type {import('$lib/types-v2').TaskGroupV2|undefined} */
	let taskGroup;

	/** @type {Modal} */
	let modal;

	/**
	 * @param {import('$lib/types-v2').TaskGroupV2} taskGroupToLoad
	 */
	export async function open(taskGroupToLoad) {
		taskGroup = taskGroupToLoad;
		modal.show();
	}

	/**
	 * @param {import('$lib/types-v2').TaskGroupV2} taskGroup
	 */
	function getGroupName(taskGroup) {
		const group = user.group_ids_names?.find((i) => i[0] === taskGroup?.user_group_id);
		if (group) {
			return group[1];
		}
		return '-';
	}
</script>

<Modal id="taskGroupInfoModal" size="xl" bind:this={modal}>
	<svelte:fragment slot="header">
		{#if taskGroup}
			<h1 class="h5 modal-title">Task group {taskGroup.pkg_name}</h1>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		<span id="errorAlert-taskGroupInfoModal" />
		{#if taskGroup}
			<div class="row mb-3">
				<div class="col-12">
					<ul class="list-group">
						<li class="list-group-item list-group-item-light fw-bold">Package name</li>
						<li class="list-group-item">{taskGroup.pkg_name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Group</li>
						<li class="list-group-item">{getGroupName(taskGroup)}</li>
						<li class="list-group-item list-group-item-light fw-bold">Active</li>
						<li class="list-group-item"><BooleanIcon value={taskGroup.active} /></li>
						<li class="list-group-item list-group-item-light fw-bold">Origin</li>
						<li class="list-group-item">{taskGroup.origin || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Version</li>
						<li class="list-group-item">{taskGroup.version || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Python version</li>
						<li class="list-group-item">{taskGroup.python_version || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Path</li>
						<li class="list-group-item">{taskGroup.path || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Venv path</li>
						<li class="list-group-item">{taskGroup.venv_path || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Number of files</li>
						<li class="list-group-item">{taskGroup.venv_file_number || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Size (kB)</li>
						<li class="list-group-item">{taskGroup.venv_size_in_kB || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Pip extras</li>
						<li class="list-group-item">{taskGroup.pip_extras || '-'}</li>
					</ul>
				</div>
			</div>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	</svelte:fragment>
</Modal>
