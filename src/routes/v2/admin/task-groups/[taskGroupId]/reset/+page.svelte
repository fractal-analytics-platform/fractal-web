<script>
	import { page } from '$app/state';
	import { FormErrorHandler } from '$lib/common/errors';
	import { PropertyDescription } from 'fractal-components';

	/** @type {import('fractal-components/types/api').TaskGroupV2} */
	const taskGroup = $derived(page.data.taskGroup);

	let python_version = $state('');
	let includePackageExtras = $state(false);
	let package_extras = $state('');
	/** @type {Array<{key: string, value: string, type: 'pre' | 'post'}>} */
	let pinnedPackageVersions = $state([]);

	const formErrorHandler = new FormErrorHandler('taskResetError', [
		'package_version',
		'package_extras',
		'python_version'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	function addPackageVersion() {
		pinnedPackageVersions = [...pinnedPackageVersions, { key: '', value: '', type: 'post' }];
	}

	/**
	 * @param {number} index
	 */
	function removePackageVersion(index) {
		pinnedPackageVersions = pinnedPackageVersions.filter((_, i) => i !== index);
	}

	async function handleReset() {
		let url;
		if (taskGroup.origin === 'pypi' || taskGroup.origin === 'wheel') {
			url = `/admin/v2/task-group/${taskGroup.id}/reset/pip`;
		} else if (taskGroup.origin === 'pixi') {
			url = `/admin/v2/task-group/${taskGroup.id}/reset/pixi`;
		} else {
			throw new Error('Not supported');
		}
		console.log(url);
	}
</script>

<div class="container mt-3">
	<div class="mb-2" id="errorSection"></div>

	<h3 class="fw-light mb-3">Reset Task Group</h3>

	<div class="mb-4">
		You are about to reset the task group
		<code>{taskGroup.pkg_name}</code>
		(version <code>{taskGroup.version}</code>), collected by <code>{taskGroup.user_email}</code>.
	</div>

	{#if taskGroup.origin === 'pypi' || taskGroup.origin === 'wheel'}
		<div class="mb-2">
			<div class="row mb-2">
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
							<option value="3.9">3.9</option>
							<option value="3.10">3.10</option>
							<option value="3.11">3.11</option>
							<option value="3.12">3.12</option>
							<option value="3.13">3.13</option>
							<option value="3.14">3.14</option>
						</select>
						<span class="invalid-feedback">{$validationErrors['python_version']}</span>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col-md-6 mb-2">
					<input
						id="includePackageExtrasCheckbox"
						type="checkbox"
						class="form-check-input"
						bind:checked={includePackageExtras}
					/>

					<label class="form-check-label small" for="includePackageExtrasCheckbox">
						Include package extras
					</label>
				</div>
			</div>

			<div class="row mb-2">
				<div class="col-md-6 mb-2">
					<div class="input-group has-validation" class:opacity-50={!includePackageExtras}>
						<div class="input-group-text">
							<label class="font-monospace" for="package_extras"> Package extras </label>
						</div>

						<input
							id="package_extras"
							name="package_extras"
							type="text"
							class="form-control"
							class:is-invalid={$validationErrors['package_extras']}
							bind:value={package_extras}
							disabled={!includePackageExtras}
						/>

						<span class="invalid-feedback">
							{$validationErrors['package_extras']}
						</span>
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
		</div>
	{:else if taskGroup.origin === 'pixi'}
		PIXI PLACEHOLDER
	{:else}
		NOT AVAILABLE
	{/if}

	{#if ['pypi', 'wheel', 'pixi'].includes(taskGroup.origin)}
		<button class="btn btn-primary" disabled={false} onclick={handleReset}> Reset </button>
	{/if}
</div>
