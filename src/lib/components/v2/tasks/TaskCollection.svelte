<script>
	import { FormErrorHandler } from '$lib/common/errors';
	import TaskGroupSelector from './TaskGroupSelector.svelte';
	import { recentActivities } from '$lib/stores';
	import { PropertyDescription } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {'pypi'|'local'} [packageType]
	 * @property {import('fractal-components/types/api').User} user
	 * @property {string|null} defaultGroupName
	 */

	/** @type {Props} */
	let { packageType = 'pypi', user, defaultGroupName } = $props();

	let python_package = $state('');
	let package_version = $state('');
	let python_version = $state('');
	let package_extras = $state('');
	/** @type {Array<{key: string, value: string, type: 'pre' | 'post'}>} */
	let pinnedPackageVersions = $state([]);
	let privateTask = $state(false);
	let selectedGroup = $state(null);
	/** @type {TaskGroupSelector|undefined} */
	let taskGroupSelector = $state();

	/** @type {FileList|null} */
	let wheelFiles = $state(null);
	/** @type {HTMLInputElement|undefined} */
	let wheelFileInput = $state();

	const formErrorHandler = new FormErrorHandler('taskCollectionError', [
		'package',
		'package_version',
		'package_extras',
		'python_version'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	export function clearForm() {
		formErrorHandler.clearErrors();
		python_package = '';
		package_version = '';
		python_version = '';
		package_extras = '';
		pinnedPackageVersions = [];
		taskGroupSelector?.clear();
	}

	let taskCollectionInProgress = $state(false);

	/**
	 * Requests a task collection to the server
	 * @returns {Promise<*>}
	 */
	async function handleTaskCollection() {
		formErrorHandler.clearErrors();

		if (packageType === 'local' && (wheelFiles === null || wheelFiles.length === 0)) {
			formErrorHandler.addValidationError('file', 'Required field');
			return;
		}

		const formData = new FormData();

		if (packageType === 'pypi') {
			formData.append('package', python_package);
		} else if (wheelFiles?.length === 1) {
			formData.append('file', wheelFiles[0]);
		}

		if (python_version) {
			formData.append('python_version', python_version);
		}

		if (package_extras) {
			formData.append('package_extras', package_extras);
		}

		if (packageType === 'pypi' && package_version) {
			formData.append('package_version', package_version);
		}

		const ppvPre = getPinnedPackageVersionsMap('pre');
		if (ppvPre) {
			formData.append('pinned_package_versions_pre', JSON.stringify(ppvPre));
		}
		const ppvPost = getPinnedPackageVersionsMap('post');
		if (ppvPost) {
			formData.append('pinned_package_versions_post', JSON.stringify(ppvPost));
		}

		let url = `/api/v2/task/collect/pip?private=${privateTask}`;
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
			python_package = '';
			package_version = '';
			python_version = '';
			package_extras = '';
			pinnedPackageVersions = [];
			clearWheelFileUpload();
		} else {
			console.error('Task collection request failed');
			await formErrorHandler.handleErrorResponse(response);
		}
	}

	/**
	 * @param {'pre'|'post'} type
	 * @returns {{[key: string]: string}|undefined}
	 */
	function getPinnedPackageVersionsMap(type) {
		/** @type {{[key: string]: string}} */
		const map = {};
		for (const ppv of pinnedPackageVersions) {
			if (ppv.key && ppv.value && ppv.type === type) {
				map[ppv.key] = ppv.value;
			}
		}
		if (Object.keys(map).length === 0) {
			return undefined;
		}
		return map;
	}

	function addPackageVersion() {
		pinnedPackageVersions = [...pinnedPackageVersions, { key: '', value: '', type: 'post' }];
	}

	/**
	 * @param {number} index
	 */
	function removePackageVersion(index) {
		pinnedPackageVersions = pinnedPackageVersions.filter((_, i) => i !== index);
	}

	function clearWheelFileUpload() {
		wheelFiles = null;
		if (wheelFileInput) {
			wheelFileInput.value = '';
		}
		formErrorHandler.removeValidationError('file');
	}
</script>

<div>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			if (taskGroupSelector?.validate()) {
				handleTaskCollection();
			}
		}}
	>
		<div class="row">
			{#if packageType === 'pypi'}
				<div class="mb-2 col-md-6">
					<div class="input-group has-validation">
						<div class="input-group-text">
							<label class="font-monospace" for="package">Package</label>
						</div>
						<input
							name="package"
							id="package"
							type="text"
							class="form-control"
							required
							class:is-invalid={$validationErrors['package']}
							bind:value={python_package}
						/>
						<span class="invalid-feedback">{$validationErrors['package']}</span>
					</div>
					<div class="form-text">The name of a package published on PyPI</div>
				</div>
			{:else if packageType === 'local'}
				<div class="mb-2 col-md-6">
					<div class="input-group has-validation">
						<label for="wheelFile" class="input-group-text">
							<i class="bi bi-file-earmark-arrow-up"></i> &nbsp; Upload a wheel file
						</label>
						<input
							class="form-control"
							accept=".whl"
							type="file"
							name="wheelFile"
							id="wheelFile"
							bind:this={wheelFileInput}
							bind:files={wheelFiles}
							class:is-invalid={$validationErrors['file']}
						/>
						{#if wheelFiles && wheelFiles.length > 0}
							<button class="btn btn-outline-secondary" onclick={clearWheelFileUpload}>
								Clear
							</button>
						{/if}
						<span class="invalid-feedback">{$validationErrors['file']}</span>
					</div>
				</div>
			{/if}
			{#if packageType === 'pypi'}
				<div class="col-md-6 mb-2">
					<div class="input-group has-validation">
						<div class="input-group-text">
							<label class="font-monospace" for="package_version">Package Version</label>
						</div>
						<input
							id="package_version"
							name="package_version"
							type="text"
							class="form-control"
							class:is-invalid={$validationErrors['package_version']}
							bind:value={package_version}
						/>
						<span class="invalid-feedback">{$validationErrors['package_version']}</span>
					</div>
				</div>
			{/if}
		</div>
		<div class="row mb-2 mt-2">
			<div class="col">
				<span class="fw-bold text-secondary">Optional arguments</span>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6 mb-2">
				<div class="input-group has-validation">
					<div class="input-group-text">
						<label class="font-monospace" for="python_version">Python Version</label>
					</div>
					<select
						id="python_version"
						name="python_version"
						class="form-select"
						bind:value={python_version}
						class:is-invalid={$validationErrors['python_version']}
					>
						<option value="">Select...</option>
						<option>3.9</option>
						<option>3.10</option>
						<option>3.11</option>
						<option>3.12</option>
						<option>3.13</option>
						<option>3.14</option>
					</select>
					<span class="invalid-feedback">{$validationErrors['python_version']}</span>
				</div>
				<div class="form-text">Python version to install and run the package tasks</div>
			</div>
			<div class="col-md-6 mb-2">
				<div class="input-group has-validation">
					<div class="input-group-text">
						<label class="font-monospace" for="package_extras">Package extras</label>
					</div>
					<input
						id="package_extras"
						name="package_extras"
						type="text"
						class="form-control"
						class:is-invalid={$validationErrors['package_extras']}
						bind:value={package_extras}
					/>
					<span class="invalid-feedback">{$validationErrors['package_extras']}</span>
				</div>
				<div class="form-text">
					Package extras to include in the <code>pip install</code> command
				</div>
			</div>
		</div>
		{#if pinnedPackageVersions.length > 0}
			<p class="mt-2">Pinned packages versions:</p>
		{/if}
		{#each pinnedPackageVersions as ppv, i (i)}
			<div class="row">
				<div class="col-xl-8 col-lg-10 col-md-12 mb-2">
					<div class="input-group">
						<label class="input-group-text" for="ppv_key_{i}">Name</label>
						<input
							type="text"
							class="form-control ppv-input"
							id="ppv_key_{i}"
							bind:value={ppv.key}
							required
						/>
						<label class="input-group-text" for="ppv_value_{i}">Version</label>
						<input
							type="text"
							class="form-control ppv-input"
							id="ppv_value_{i}"
							bind:value={ppv.value}
							required
						/>
						<span class="input-group-text">
							<div class="form-check form-check-inline">
								<input
									class="form-check-input"
									type="radio"
									name="ppv-type-{i}"
									id="ppv-pre-{i}"
									value="pre"
									bind:group={ppv.type}
								/>
								<label class="form-check-label" for="ppv-pre-{i}">Pre</label>
							</div>
							<div class="form-check form-check-inline me-1">
								<input
									class="form-check-input"
									type="radio"
									name="ppv-type-{i}"
									id="ppv-post-{i}"
									value="post"
									bind:group={ppv.type}
								/>
								<label class="form-check-label" for="ppv-post-{i}">Post</label>
							</div>
							<PropertyDescription
								description="Whether the pinned dependency should be installed before or after the main package"
							/>
						</span>
						<button
							class="btn btn-outline-secondary"
							type="button"
							id="ppv_remove_{i}"
							aria-label="Remove pinned package version"
							onclick={(e) => {
								e.preventDefault();
								removePackageVersion(i);
							}}
						>
							<i class="bi bi-trash"></i>
						</button>
					</div>
				</div>
			</div>
		{/each}
		<div class="row">
			<div class="col-12 mb-1">
				<button
					class="btn btn-light"
					onclick={(e) => {
						e.preventDefault();
						addPackageVersion();
					}}
					type="button"
				>
					<i class="bi bi-plus-circle"></i> Add pinned package version
				</button>
			</div>
		</div>

		<TaskGroupSelector
			id="task-collection"
			groupIdsNames={user.group_ids_names || []}
			{defaultGroupName}
			bind:privateTask
			bind:selectedGroup
			bind:this={taskGroupSelector}
		/>

		<div id="taskCollectionError" class="mt-3"></div>

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
</div>

<style>
	.ppv-input {
		min-width: 100px;
	}
</style>
