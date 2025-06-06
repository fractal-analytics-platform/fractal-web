<script>
	import DragAndDropUploader from '$lib/components/common/DragAndDropUploader.svelte';
	import { SchemaValidator } from 'fractal-components';
	import manifestSchema from './manifest_v2.json';
	import { replaceEmptyStrings } from '$lib/common/component_utilities';
	import { FormErrorHandler } from '$lib/common/errors';
	import StandardDismissableAlert from '$lib/components/common/StandardDismissableAlert.svelte';
	import TaskGroupSelector from './TaskGroupSelector.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {(task: import('fractal-components/types/api').TaskV2[]) => void} addNewTasks
	 * @property {import('fractal-components/types/api').User} user
	 */

	/** @type {Props} */
	let { addNewTasks, user } = $props();

	let python_interpreter = $state('');
	let label = $state('');
	let version = $state('');
	let package_name = $state('');
	let package_root = $state('');
	let manifestData = null;
	let privateTask = $state(false);
	let selectedGroup = $state(null);
	let successMessage = $state('');

	const formErrorHandler = new FormErrorHandler('errorAlert-customEnvTask', [
		'python_interpreter',
		'label',
		'version',
		'package_name',
		'package_root'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	let dragAndDropUploader = $state();

	/**
	 * @param {string} content
	 * @returns {object}
	 */
	function validateManifestContent(content) {
		let manifestData;
		try {
			manifestData = JSON.parse(content);
		} catch {
			throw new Error("File doesn't contain valid JSON");
		}
		const argsSchemaVersion = manifestData.args_schema_version;
		if (argsSchemaVersion !== 'pydantic_v2' && argsSchemaVersion !== 'pydantic_v1') {
			throw new Error('Unsupported manifest args schema version');
		}
		if (!isManifestValid(manifestData, argsSchemaVersion)) {
			throw new Error('Invalid manifest format');
		} else if (manifestData.manifest_version !== '2') {
			throw new Error('Unsupported manifest version');
		}
		return manifestData;
	}

	/**
	 * @param {object} data
	 * @param {'pydantic_v1'|'pydantic_v2'} argsSchemaVersion
	 */
	function isManifestValid(data, argsSchemaVersion) {
		const validator = new SchemaValidator(argsSchemaVersion);
		validator.loadSchema(manifestSchema);
		return validator.isValid(data);
	}

	function onManifestChange({ detail }) {
		if (detail.value === null) {
			manifestData = null;
		} else {
			manifestData = detail.value;
		}
	}

	let collecting = $state(false);

	async function handleCollect() {
		if (!manifestData) {
			return;
		}

		collecting = true;
		formErrorHandler.clearErrors();
		successMessage = '';
		try {
			const body = {
				python_interpreter,
				label,
				version,
				package_name,
				package_root,
				manifest: manifestData
			};

			const headers = new Headers();
			headers.append('Content-Type', 'application/json');

			let url = `/api/v2/task/collect/custom?private=${privateTask}`;
			if (!privateTask) {
				url += `&user_group_id=${selectedGroup}`;
			}

			const response = await fetch(url, {
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify(body, replaceEmptyStrings)
			});

			if (response.ok) {
				const result = await response.json();
				addNewTasks(result);
				successMessage = 'Tasks collected successfully';
				python_interpreter = '';
				label = '';
				version = '';
				package_name = '';
				package_root = '';
				manifestData = null;
				dragAndDropUploader.clearSelectedFile();
			} else {
				await formErrorHandler.handleErrorResponse(response);
			}
		} finally {
			collecting = false;
		}
	}
</script>

<div class="alert alert-warning">
	<i class="bi bi-exclamation-triangle"></i>
	Collecting tasks with a custom Python environment will use that environment for running the tasks.
	Be careful about changing this environment, as that may break existing workflows. It is recommended
	to use custom Python environments only during task development or when something needed for your environment
	building isn't supported in Fractal server yet. Collect the tasks with regular Fractal task collection
	for production setups.
</div>

<StandardDismissableAlert message={successMessage} />

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleCollect();
	}}
	class="mb-5"
>
	<div class="row mb-2 pb-1">
		<div class="col">
			<div class="input-group has-validation">
				<div class="input-group-text">
					<label class="font-monospace" for="python_interpreter">Python Intepreter</label>
				</div>
				<input
					bind:value={python_interpreter}
					name="python_interpreter"
					id="python_interpreter"
					class="form-control"
					type="text"
					required
					class:is-invalid={$validationErrors['python_interpreter']}
				/>
				<span class="invalid-feedback">{$validationErrors['python_interpreter']}</span>
			</div>
			<div class="form-text">
				Absolute path to the Python interpreter to be used for running tasks
			</div>
		</div>
	</div>
	<div class="row mb-2 pb-1">
		<div class="col">
			<DragAndDropUploader
				description="Manifest"
				accept="application/json"
				id="manifestFileUpload"
				validateFile={validateManifestContent}
				on:change={onManifestChange}
				bind:this={dragAndDropUploader}
				required={true}
			/>
			<div class="form-text">
				Manifest of a Fractal task package (this is typically the content of <code
					>__FRACTAL_MANIFEST__.json</code
				>)
			</div>
		</div>
		<div class="col">
			<div class="input-group has-validation">
				<div class="input-group-text">
					<label class="font-monospace" for="label">Label</label>
				</div>
				<input
					bind:value={label}
					name="label"
					id="label"
					class="form-control"
					type="text"
					required
					class:is-invalid={$validationErrors['label']}
				/>
				<span class="invalid-feedback">{$validationErrors['label']}</span>
			</div>
			<div class="form-text">A common label identifying this package.</div>
		</div>
	</div>
	<div class="row mb-1 pb-1">
		<div class="col">
			<div class="input-group has-validation">
				<div class="input-group-text">
					<label class="font-monospace" for="package_name">Package Name</label>
				</div>
				<input
					bind:value={package_name}
					name="package_name"
					id="package_name"
					class="form-control"
					type="text"
					class:is-invalid={$validationErrors['package_name']}
				/>
				<span class="invalid-feedback">{$validationErrors['package_name']}</span>
			</div>
			<div class="form-text">
				Name of the package, as used in <code>import &lt;package_name&gt;</code>; this is then used
				to extract the package directory (<code>package_root</code>) via
				<code>pip show &lt;package_name&gt;</code>
			</div>
		</div>
		<div class="col">
			<div class="input-group has-validation">
				<div class="input-group-text">
					<label class="font-monospace" for="version">Version</label>
				</div>
				<input
					bind:value={version}
					name="version"
					id="version"
					class="form-control"
					type="text"
					class:is-invalid={$validationErrors['version']}
				/>
				<span class="invalid-feedback">{$validationErrors['version']}</span>
			</div>
			<div class="form-text">Optional version of tasks to be collected</div>
		</div>
	</div>
	<div class="row mb-1">
		<div class="col">
			<div class="input-group has-validation">
				<div class="input-group-text">
					<label class="font-monospace" for="package_root">Package Folder</label>
				</div>
				<input
					bind:value={package_root}
					name="package_root"
					id="package_root"
					class="form-control"
					type="text"
					class:is-invalid={$validationErrors['package_root']}
				/>
				<span class="invalid-feedback">{$validationErrors['package_root']}</span>
			</div>
			<div class="form-text">
				The folder where the package is installed. If not provided, it will be extracted via
				<code>pip show</code> (requires <code>package_name</code> to be set)
			</div>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<div id="errorAlert-customEnvTask"></div>
		</div>
	</div>

	<TaskGroupSelector
		id="custom-env-task"
		groupIdsNames={user.group_ids_names || []}
		bind:privateTask
		bind:selectedGroup
	/>

	<button type="submit" class="btn btn-primary" disabled={collecting}>
		{#if collecting}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		{/if}
		Collect
	</button>
</form>
