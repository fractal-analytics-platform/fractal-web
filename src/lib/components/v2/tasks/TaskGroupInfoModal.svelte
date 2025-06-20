<script>
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import TimestampCell from '$lib/components/jobs/TimestampCell.svelte';
	import Modal from '../../common/Modal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').User} user
	 */

	/** @type {Props} */
	let { user } = $props();
	/** @type {import('fractal-components/types/api').TaskGroupV2|undefined} */
	let taskGroup = $state();

	/** @type {Modal|undefined} */
	let modal = $state();

	/**
	 * @param {import('fractal-components/types/api').TaskGroupV2} taskGroupToLoad
	 */
	export async function open(taskGroupToLoad) {
		taskGroup = taskGroupToLoad;
		modal?.show();
	}

	/**
	 * @param {import('fractal-components/types/api').TaskGroupV2} taskGroup
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
	{#snippet header()}
		{#if taskGroup}
			<h1 class="h5 modal-title">Task group {taskGroup.pkg_name}</h1>
		{/if}
	{/snippet}
	{#snippet body()}
		<span id="errorAlert-taskGroupInfoModal"></span>
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
						{#if taskGroup.origin === 'pixi'}
							<li class="list-group-item list-group-item-light fw-bold">Pixi version</li>
							<li class="list-group-item">{taskGroup.pixi_version || '-'}</li>
						{:else}
							<li class="list-group-item list-group-item-light fw-bold">Venv path</li>
							<li class="list-group-item">{taskGroup.venv_path || '-'}</li>
						{/if}
						<li class="list-group-item list-group-item-light fw-bold">Number of files</li>
						<li class="list-group-item">{taskGroup.venv_file_number || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Size (MB)</li>
						<li class="list-group-item">
							{taskGroup.venv_size_in_kB ? (taskGroup.venv_size_in_kB / 1000).toFixed(2) : '-'}
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Pip extras</li>
						<li class="list-group-item">{taskGroup.pip_extras || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Last used</li>
						<li class="list-group-item">
							<TimestampCell timestamp={taskGroup.timestamp_last_used} />
						</li>
					</ul>
				</div>
			</div>
		{/if}
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	{/snippet}
</Modal>
