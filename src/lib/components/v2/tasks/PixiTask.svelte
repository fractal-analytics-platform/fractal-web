<script>
	import { FormErrorHandler } from '#lib/common/errors.js';
	import { recentActivities } from '#lib/stores.js';
	import { fileToBase64 } from '../../../common/component_utilities';
	import TaskGroupSelector from './TaskGroupSelector.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('#fractal-components/types/api').User} user
	 * @property {string|null} defaultGroupName
	 */

	/** @type {Props} */
	let { user, defaultGroupName } = $props();

	/** @type {FileList|null} */
	let tarFiles = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let tarFileInput = $state();

	let version = $state('');
	let useLockfile = $state(true);
	let privateTask = $state(false);
	let selectedGroup = $state(null);
	/** @type {TaskGroupSelector|undefined} */
	let taskGroupSelector = $state();

	let taskCollectionInProgress = $state(false);

	const formErrorHandler = new FormErrorHandler('pixiCollectionError', [
		'file',
		'pixi_version',
		'use_pixi_lockfile',
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

		/** @type {import('#fractal-components/types/api').PixiCollectionRequest} */
		const body = {
			private: privateTask,
			use_pixi_lockfile: useLockfile
		};

		if (tarFiles !== null && tarFiles.length === 1) {
			const file = tarFiles[0];
			body.file = {
				data: await fileToBase64(file),
				fileName: file.name,
				contentType: file.type
			};
		}
		if (version) {
			body.pixi_version = version;
		}

		if (!privateTask && selectedGroup) {
			body.user_group_id = selectedGroup;
		}

		taskCollectionInProgress = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch('/api/v2/task/collect/pixi', {
			method: 'POST',
			headers,
			body: JSON.stringify(body)
		});

		taskCollectionInProgress = false;

		if (response.ok) {
			const result = /** @type {import('#fractal-components/types/api').TaskGroupActivityV2} */ (
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
	onsubmit={async (e) => {
		e.preventDefault();
		if (taskGroupSelector?.validate()) {
			await handlePixiCollection();
		}
	}}
>
	<div class="row">
		<div class="col-xl-5 mb-2 mb-xl-0">
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

		<div class="col-xl-4 col-lg-6 mb-2 mb-xl-0">
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

		<div class="col-xl-3 col-lg-6 mt-2 mb-xl-0">
			<div class="form-check form-switch ms-xl-2">
				<input
					id="lockfile"
					class="form-check-input"
					type="checkbox"
					bind:checked={useLockfile}
					role="switch"
					class:is-invalid={$validationErrors['use_pixi_lockfile']}
				/>
				<label class="form-check-label" for="lockfile">
					Use <code>pixi.lock</code> file
				</label>
				<span class="invalid-feedback">{$validationErrors['use_pixi_lockfile']}</span>
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
