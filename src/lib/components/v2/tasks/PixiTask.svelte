<script>
	import { FormErrorHandler } from '$lib/common/errors';
	import { recentActivities } from '$lib/stores';
	import TaskGroupSelector from './TaskGroupSelector.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').User} user
	 * @property {string|null} defaultGroupName
	 */

	/** @type {Props} */
	let { user, defaultGroupName } = $props();

	/** @type {FileList|null} */
	let tarFiles = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let tarFileInput = $state();

	let version = $state('');
	let privateTask = $state(false);
	let selectedGroup = $state(null);
	/** @type {TaskGroupSelector|undefined} */
	let taskGroupSelector = $state();

	let taskCollectionInProgress = $state(false);

	const formErrorHandler = new FormErrorHandler('pixiCollectionError', [
		'file',
		'pixi_version',
		'user_group_id'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	function clearTarFileUpload() {
		tarFiles = null;
		if (tarFileInput) {
			tarFileInput.value = '';
		}
		formErrorHandler.removeValidationError('file');
	}

	async function handlePixiCollection() {
		formErrorHandler.clearErrors();

		const formData = new FormData();

		if (tarFiles !== null && tarFiles.length === 1) {
			formData.append('file', tarFiles[0]);
		}
		if (version) {
			formData.append('pixi_version', version);
		}

		let url = `/api/v2/task/collect/pixi?private=${privateTask}`;
		if (!privateTask && selectedGroup) {
			url += `&user_group_id=${selectedGroup}`;
		}

		taskCollectionInProgress = true;
		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			body: formData
		});

		taskCollectionInProgress = false;

		if (response.ok) {
			const result = /** @type {import('fractal-components/types/api').TaskGroupActivityV2} */ (
				await response.json()
			);
			recentActivities.set([...$recentActivities, result]);
			version = '';
			clearTarFileUpload();
		} else {
			await formErrorHandler.handleErrorResponse(response);
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		if (taskGroupSelector?.validate()) {
			handlePixiCollection();
		}
	}}
>
	<div class="row">
		<div class="col-md-6">
			<div class="input-group has-validation">
				<label for="tarFile" class="input-group-text">
					<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Upload tar.gz file
				</label>
				<input
					class="form-control"
					accept=".tar.gz"
					type="file"
					name="tarFile"
					id="tarFile"
					bind:this={tarFileInput}
					bind:files={tarFiles}
					class:is-invalid={$validationErrors['file']}
					onchange={() => formErrorHandler.removeValidationError('file')}
				/>
				{#if tarFiles && tarFiles.length > 0}
					<button class="btn btn-outline-secondary" onclick={clearTarFileUpload}> Clear </button>
				{/if}
				<span class="invalid-feedback">{$validationErrors['file']}</span>
			</div>
		</div>

		<div class="col-md-6">
			<div class="input-group has-validation">
				<div class="input-group-text">
					<label for="pixi_version">Pixi version (optional)</label>
				</div>
				<input
					bind:value={version}
					name="pixi_version"
					id="pixi_version"
					class="form-control"
					type="text"
					class:is-invalid={$validationErrors['pixi_version']}
				/>
				<span class="invalid-feedback">{$validationErrors['pixi_version']}</span>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col">
			<TaskGroupSelector
				id="task-collection"
				groupIdsNames={user.group_ids_names || []}
				{defaultGroupName}
				bind:privateTask
				bind:selectedGroup
				bind:this={taskGroupSelector}
			/>
		</div>
	</div>

	<div id="pixiCollectionError" class="mt-1"></div>

	<div class="row">
		<div class="col-auto">
			<button type="submit" class="btn btn-primary mb-3" disabled={taskCollectionInProgress}>
				{#if taskCollectionInProgress}
					<div class="spinner-border spinner-border-sm" role="status">
						<span class="visually-hidden">Collecting...</span>
					</div>
				{/if}
				Collect
			</button>
		</div>
	</div>
</form>
