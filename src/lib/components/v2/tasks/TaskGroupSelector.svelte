<script>
	import { onMount } from 'svelte';

	/** @type {import('$lib/types').User} */
	export let user;

	export let privateTask = false;
	export let selectedGroup = null;

	onMount(() => {
		if (user.group_ids_names) {
			const groupAll = user.group_ids_names.find((i) => i[1] === 'All');
			if (groupAll) {
				selectedGroup = groupAll[0];
			}
		}
	});
</script>

<div class="mt-3 mb-3">
	<div class="row row-cols-lg-auto g-3 align-items-center">
		<div class="col-12">
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="privateTaskSelector"
					id="taskSelectorShared"
					value={false}
					bind:group={privateTask}
				/>
				<label class="form-check-label" for="taskSelectorShared">Shared task</label>
			</div>
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="privateTaskSelector"
					id="taskSelectorPrivate"
					value={true}
					bind:group={privateTask}
				/>
				<label class="form-check-label" for="taskSelectorPrivate">Private task</label>
			</div>
		</div>
		{#if !privateTask}
			<div class="col-12">
				<div class="input-group">
					<label class="input-group-text" for="task-group-selector">Group</label>
					<select class="form-control" id="task-group-selector" bind:value={selectedGroup}>
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
