<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script>
	/**
	 * @type {any[]}
	 */
	export let tasks;

	/**
	 * @param {number} index
	 */
	function isOldVersion(index) {
		if (index === 0) {
			return false;
		}
		const currentTask = tasks[index];
		const previousTask = tasks[index - 1];
		return previousTask.name === currentTask.name && previousTask.owner === currentTask.owner;
	}

	/**
	 * @param {number} index
	 */
	function isLastOldVersion(index) {
		if (!isOldVersion(index)) {
			return false;
		}
		if (index === tasks.length - 1) {
			return false;
		}
		const currentTask = tasks[index];
		const nextTask = tasks[index + 1];
		return nextTask.name !== currentTask.name || nextTask.owner !== currentTask.owner;
	}

	/**
	 * @param {number} index
	 */
	function isMainVersion(index) {
		if (isOldVersion(index)) {
			return false;
		}
		if (index === tasks.length - 1) {
			return false;
		}
		const currentTask = tasks[index];
		const nextTask = tasks[index + 1];
		return nextTask.name === currentTask.name && nextTask.owner === currentTask.owner;
	}

	/**
	 * @param {Event} event
	 */
	function handleToggleOldVersions(event) {
		const element = /** @type {HTMLElement} */ (event.target);
		/** @type {HTMLElement|null} */
		let row = /** @type {HTMLElement} */ (element.closest('tr'));
		if (!row.classList.contains('expanded')) {
			closeAllOldVersions(/** @type {HTMLElement} */ (row.closest('table')));
		}
		toggleOldVersions(row);
	}

	/**
	 * @param {HTMLElement} table
	 */
	function closeAllOldVersions(table) {
		const rows = table.querySelectorAll('tr');
		for (const row of rows) {
			if (row.classList.contains('expanded')) {
				toggleOldVersions(row);
			}
		}
	}

	/**
	 * @param {HTMLElement} mainRow
	 */
	function toggleOldVersions(mainRow) {
		mainRow.classList.toggle('expanded');
		/** @type {HTMLElement|null} */
		let row = mainRow;
		while ((row = /** @type {HTMLElement|null} */ (row?.nextSibling))) {
			if (!row.classList) {
				continue;
			}
			if (row.classList.contains('old-version')) {
				row.classList.toggle('collapsed');
			} else {
				break;
			}
		}
	}
</script>

<table class="table align-middle">
	<slot name="thead" />
	<tbody>
		{#key tasks}
			{#each tasks as task, i}
				<tr
					class:old-version={isOldVersion(i)}
					class:last-old-version={isLastOldVersion(i)}
					class:is-main-version={isMainVersion(i)}
					class:collapsed={isOldVersion(i)}
				>
					<slot name="custom-columns-left" {task} />
					<td>{isOldVersion(i) ? '' : task.name}</td>
					<td>
						{task.version || '–'}
						{#if isMainVersion(i)}
							<button class="btn btn-link" on:click={handleToggleOldVersions} aria-label="Expand old versions">
								<i class="bi bi-plus-circle" />
							</button>
						{/if}
					</td>
					<slot name="custom-columns-right" {task} />
				</tr>
			{/each}
		{/key}
	</tbody>
</table>

<style>
	:global(.is-main-version.expanded td) {
		border-bottom-style: dashed;
	}

	:global(.old-version.collapsed) {
		display: none;
	}

	:global(.old-version) {
		display: table-row;
	}

	:global(.old-version td) {
		border-bottom-style: dashed;
	}

	:global(.last-old-version td) {
		border-bottom-style: solid;
	}
</style>
