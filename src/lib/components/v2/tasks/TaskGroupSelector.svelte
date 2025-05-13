<script>
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {Array<[number, string]>} groupIdsNames
	 * @property {string} id
	 * @property {boolean} [privateTask]
	 * @property {any} [selectedGroup]
	 * @property {string} [wrapperClass]
	 */

	/** @type {Props} */
	let {
		groupIdsNames,
		id,
		privateTask = $bindable(false),
		selectedGroup = $bindable(null),
		wrapperClass = 'mt-3 mb-3'
	} = $props();

	onMount(() => {
		selectAllGroup();
	});

	function selectAllGroup() {
		if (selectedGroup === null) {
			const groupAll = groupIdsNames.find((i) => i[1] === 'All');
			if (groupAll) {
				selectedGroup = groupAll[0];
			}
		}
	}
</script>

<div class={wrapperClass}>
	<div class="row row-cols-lg-auto g-3 align-items-center">
		<div class="col-12">
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="privateTaskSelector-{id}"
					id="taskSelectorShared-{id}"
					value={false}
					bind:group={privateTask}
					onchange={selectAllGroup}
				/>
				<label class="form-check-label" for="taskSelectorShared-{id}">Shared task</label>
			</div>
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="privateTaskSelector-{id}"
					id="taskSelectorPrivate-{id}"
					value={true}
					bind:group={privateTask}
				/>
				<label class="form-check-label" for="taskSelectorPrivate-{id}">Private task</label>
			</div>
		</div>
		{#if !privateTask}
			<div class="col-12">
				<div class="input-group">
					<label class="input-group-text" for="task-group-selector">Group</label>
					<select class="form-select" id="task-group-selector" bind:value={selectedGroup}>
						{#if groupIdsNames}
							{#each groupIdsNames as [groupId, groupName] (groupId)}
								<option value={groupId}>{groupName}</option>
							{/each}
						{/if}
					</select>
				</div>
			</div>
		{/if}
	</div>
</div>
