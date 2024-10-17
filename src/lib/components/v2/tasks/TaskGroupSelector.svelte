<script>
	import { onMount } from 'svelte';

	/** @type {import('$lib/types').User} */
	export let user;
	/** @type {string} */
	export let id;

	export let privateTask = false;
	export let selectedGroup = null;

	export let wrapperClass = 'mt-3 mb-3';

	onMount(() => {
		if (user.group_ids_names && selectedGroup === null) {
			const groupAll = user.group_ids_names.find((i) => i[1] === 'All');
			if (groupAll) {
				selectedGroup = groupAll[0];
			}
		}
	});
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
						{#if user.group_ids_names}
							{#each user.group_ids_names as [groupId, groupName]}
								<option value={groupId}>{groupName}</option>
							{/each}
						{/if}
					</select>
				</div>
			</div>
		{/if}
	</div>
</div>
