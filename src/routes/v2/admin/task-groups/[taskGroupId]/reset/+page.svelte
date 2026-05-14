<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { FormErrorHandler } from '$lib/common/errors';
	import { PropertyDescription } from 'fractal-components';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('fractal-components/types/api').TaskGroupV2} */
	const taskGroup = $derived(page.data.taskGroup);

	let python_version = $state('');
	let includePackageExtras = $state(false);
	let package_extras = $state('');
	/** @type {Array<{key: string, value: string, type: 'pre' | 'post'}>} */
	let pinnedPackageVersions = $state([]);

	let usePixiLockFile = $state(false);

	/** @type {Modal|undefined} */
	let modal = $state();

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

	async function handleReset() {
		formErrorHandler.clearErrors();
		const payload = {};

		let url;
		if (['pypi', 'wheel-file'].includes(taskGroup.origin)) {
			url = `/api/admin/v2/task-group/${taskGroup.id}/reset/pip`;
			if (python_version) {
				payload.python_version = python_version;
			}
			if (includePackageExtras) {
				payload.pip_extras = package_extras;
			}
			const ppvPre = getPinnedPackageVersionsMap('pre');
			if (ppvPre) {
				payload.pinned_package_versions_pre = JSON.stringify(ppvPre);
			}
			const ppvPost = getPinnedPackageVersionsMap('post');
			if (ppvPost) {
				payload.pinned_package_versions_post = JSON.stringify(ppvPost);
			}
		} else if (taskGroup.origin === 'pixi') {
			url = `/api/admin/v2/task-group/${taskGroup.id}/reset/pixi`;
			payload.use_pixi_lockfile = usePixiLockFile;
		} else {
			throw new Error('Not supported');
		}

		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		if (response.ok) {
			const result = /** @type {import('fractal-components/types/api').TaskGroupActivityV2} */ (
				await response.json()
			);
			goto(`/v2/admin/task-groups/activities?activity_id=${result.id}`);
		} else {
			console.error('Task collection request failed');
			await formErrorHandler.handleErrorResponse(response);
		}
	}
</script>

<div class="container mt-3">
	<h3 class="fw-light mb-3">Reset task group</h3>

	<div class="mb-3">You are about to reset the following task group:</div>

	<div class="card mb-4">
		<div class="card-body">
			<div class="row mb-2">
				<div class="col-2 fw-semibold">Package name</div>
				<div class="col">
					<code>{taskGroup.pkg_name}</code>
				</div>
			</div>

			<div class="row mb-2">
				<div class="col-2 fw-semibold">Version</div>
				<div class="col">
					<code>{taskGroup.version}</code>
				</div>
			</div>

			<div class="row mb-2">
				<div class="col-2 fw-semibold">Origin</div>
				<div class="col">
					<code>{taskGroup.origin}</code>
				</div>
			</div>

			<div class="row">
				<div class="col-2 fw-semibold">Collected by</div>
				<div class="col">
					<code>{taskGroup.user_email}</code>
				</div>
			</div>
		</div>
	</div>

	{#if ['pypi', 'wheel-file'].includes(taskGroup.origin)}
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
		<div class="col-xl-3 col-lg-6 mt-2 mb-xl-0">
			<div class="form-check form-switch ms-xl-2">
				<input
					id="lockfile"
					class="form-check-input"
					type="checkbox"
					bind:checked={usePixiLockFile}
					role="switch"
					class:is-invalid={$validationErrors['use_pixi_lockfile']}
				/>
				<label class="form-check-label" for="lockfile">
					Use <code>pixi.lock</code> file
				</label>
				<span class="invalid-feedback">{$validationErrors['use_pixi_lockfile']}</span>
			</div>
		</div>
	{:else}
		<div class="alert alert-danger" role="alert">
			Task group reset is not available for
			<code>{taskGroup.origin}</code>.
		</div>
	{/if}

	{#if ['pypi', 'wheel-file', 'pixi'].includes(taskGroup.origin)}
		<button class="btn btn-primary" onclick={modal?.show}> Reset </button>
	{/if}
</div>

<Modal id="confirmTaskGroupReset" bind:this={modal}>
	{#snippet body()}
		<div class="alert alert-warning" role="alert">
			<b>WARNING</b><br />
			This action may override existing information about the task-group environment (like the
			<code>pip freeze</code>
			output, or the <code>pixi.lock</code> contents), in a non-reversible way.
		</div>
		<div id="taskResetError" class="mt-3 mb-3"></div>

		<div class="row">
			<div class="col">
				<button class="btn btn-primary" onclick={handleReset}> Confirm </button>
				<button class="btn btn-danger" onclick={modal?.hide}> Cancel </button>
			</div>
		</div>
	{/snippet}
</Modal>
