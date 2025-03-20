import { it, expect } from 'vitest';
import {
	extractJobErrorParts,
	extractRelevantJobError,
	generateNewUniqueDatasetName,
	getFirstTaskIndexForContinuingWorkflow
} from '$lib/common/job_utilities.js';

const completeTracebackError = `TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:
2024-01-29 16:52:02,328; INFO; START create_ome_zarr task
Traceback (most recent call last):
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/create_ome_zarr.py", line 470, in <module>
    run_fractal_task(
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/_utils.py", line 79, in run_fractal_task
    metadata_update = task_function(**pars)
  File "pydantic/decorator.py", line 40, in pydantic.decorator.validate_arguments.validate.wrapper_function
  File "pydantic/main.py", line 341, in pydantic.main.BaseModel.__init__
pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)
`;

const shortTracebackError = `TASK ERROR:Task id: 20 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:
Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`;

it('detect parts of a workflow task error message with complete traceback', () => {
	const parts = extractJobErrorParts(completeTracebackError);
	expect(parts.length).eq(3);
	expect(parts[0].text).eq(
		'TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0'
	);
	expect(parts[0].highlight).eq(true);
	expect(parts[1].text).eq(`TRACEBACK:
2024-01-29 16:52:02,328; INFO; START create_ome_zarr task
Traceback (most recent call last):
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/create_ome_zarr.py", line 470, in <module>
    run_fractal_task(
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/_utils.py", line 79, in run_fractal_task
    metadata_update = task_function(**pars)
  File "pydantic/decorator.py", line 40, in pydantic.decorator.validate_arguments.validate.wrapper_function
  File "pydantic/main.py", line 341, in pydantic.main.BaseModel.__init__`);
	expect(parts[1].highlight).eq(false);
	expect(parts[2].text)
		.eq(`pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)`);
	expect(parts[2].highlight).eq(true);
});

it('detect parts of a workflow task error message with short traceback', () => {
	const parts = extractJobErrorParts(shortTracebackError);
	expect(parts.length).eq(3);
	expect(parts[0].text).eq(
		'TASK ERROR:Task id: 20 (Create OME-Zarr structure), e.workflow_task_order=0'
	);
	expect(parts[0].highlight).eq(true);
	expect(parts[1].text).eq('TRACEBACK:');
	expect(parts[1].highlight).eq(false);
	expect(parts[2].text).eq(
		`Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`
	);
	expect(parts[2].highlight).eq(true);
});

it('detect parts of a workflow task error message with short traceback, ignoring uppercase traceback', () => {
	const parts = extractJobErrorParts(shortTracebackError, true);
	expect(parts.length).eq(1);
	expect(parts[0].text)
		.eq(`TASK ERROR:Task id: 20 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:
Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`);
	expect(parts[0].highlight).eq(false);
});

it('detect parts of a workflow task error message without traceback', () => {
	const parts = extractJobErrorParts('foo');
	expect(parts.length).eq(1);
	expect(parts[0].text).eq('foo');
	expect(parts[0].highlight).eq(false);
});

it('extract relevant part of a workflow task error message with complete traceback', () => {
	const relevantError = extractRelevantJobError(completeTracebackError);
	expect(relevantError)
		.eq(`TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0
pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)`);
});

it('extract relevant part of a workflow task error message with short traceback', () => {
	const relevantError = extractRelevantJobError(shortTracebackError);
	expect(relevantError).eq(
		`TASK ERROR:Task id: 20 (Create OME-Zarr structure), e.workflow_task_order=0
Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`
	);
});

it('extract relevant part of a workflow task error message without traceback', () => {
	const relevantError = extractRelevantJobError('foo');
	expect(relevantError).eq('foo');
});

it('extract relevant part of a workflow task error with max lines reached', () => {
	const relevantError = extractRelevantJobError(completeTracebackError, 3);
	expect(relevantError)
		.eq(`TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0
pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
[...]`);
});

it('extract relevant part of a workflow task error with max lines not reached', () => {
	const relevantError = extractRelevantJobError(completeTracebackError, 4);
	expect(relevantError)
		.eq(`TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0
pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)`);
});

it('detect parts of a workflow JobExecutionError', () => {
	const error = `JOB ERROR:
TRACEBACK:
JobExecutionError

Job cancelled due to executor shutdown.`;
	const parts = extractJobErrorParts(error);
	expect(parts.length).eq(3);
	expect(parts[0].text).eq('JOB ERROR:');
	expect(parts[0].highlight).eq(true);
	expect(parts[1].text).eq('TRACEBACK:');
	expect(parts[1].highlight).eq(false);
	expect(parts[2].text).eq(`JobExecutionError

Job cancelled due to executor shutdown.`);
	expect(parts[2].highlight).eq(true);
});

it('detect parts of an error with multiple tracebacks', () => {
	const log = `TASK ERROR:Task id: 1400 (Measure Features), e.workflow_task_order=10
TRACEBACK:
Traceback (most recent call last):
  File "/redacted/anaconda3/envs/fractal-server-1.4.0/lib/python3.10/site-packages/fractal_server/app/runner/_common.py", line 408, in call_single_parallel_task
    raise e
  File "/redacted/anaconda3/envs/fractal-server-1.4.0/lib/python3.10/site-packages/fractal_server/app/runner/_common.py", line 401, in call_single_parallel_task
    _call_command_wrapper(
  File "/redacted/anaconda3/envs/fractal-server-1.4.0/lib/python3.10/site-packages/fractal_server/app/runner/_common.py", line 184, in _call_command_wrapper
    raise TaskExecutionError(err)
fractal_server.app.runner.common.TaskExecutionError: 2024-02-05 15:56:19,240; INFO; START measure_features task
Traceback (most recent call last):
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/zarr/core.py", line 252, in _load_metadata_nosync
    meta_bytes = self._store[mkey]
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/zarr/storage.py", line 1113, in __getitem__
    raise KeyError(key)
KeyError: '.zarray'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/apx_fractal_task_collection/measure_features.py", line 299, in <module>
    run_fractal_task(
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/_utils.py", line 79, in run_fractal_task
    metadata_update = task_function(**pars)
  File "pydantic/decorator.py", line 40, in pydantic.decorator.validate_arguments.validate.wrapper_function
  File "pydantic/decorator.py", line 134, in pydantic.decorator.ValidatedFunction.call
  File "pydantic/decorator.py", line 206, in pydantic.decorator.ValidatedFunction.execute
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/apx_fractal_task_collection/measure_features.py", line 211, in measure_features
    label_image = da.from_zarr(
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/dask/array/core.py", line 3599, in from_zarr
    z = zarr.Array(store, read_only=True, path=component, **kwargs)
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/zarr/core.py", line 224, in __init__
    self._load_metadata()
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/zarr/core.py", line 243, in _load_metadata
    self._load_metadata_nosync()
  File "/redacted/fractal-demos/examples/server/FRACTAL_TASKS_DIR/.fractal/apx_fractal_task_collection0.1.1/venv/lib/python3.10/site-packages/zarr/core.py", line 254, in _load_metadata_nosync
    raise ArrayNotFoundError(self._path)
zarr.errors.ArrayNotFoundError: array not found at path %r' ''`;
	const parts = extractJobErrorParts(log);
	expect(parts.length).eq(3);
	expect(parts[0].text).eq('TASK ERROR:Task id: 1400 (Measure Features), e.workflow_task_order=10');
	expect(parts[0].highlight).eq(true);
	expect(parts[1].highlight).eq(false);
	expect(parts[2].text).eq("zarr.errors.ArrayNotFoundError: array not found at path %r' ''");
	expect(parts[2].highlight).eq(true);
});

it('detect parts of an unknown error without traceback', () => {
	const log = `UNKNOWN ERROR
Original error: something went really wrong`;
	const parts = extractJobErrorParts(log);
	expect(parts.length).eq(2);
	expect(parts[0].text).eq('UNKNOWN ERROR');
	expect(parts[0].highlight).eq(true);
	expect(parts[1].text).eq('Original error: something went really wrong');
	expect(parts[1].highlight).eq(false);
});

it('detect parts of an unknown error with traceback', () => {
	const log = `UNKNOWN ERROR
Original error: Traceback (most recent call last):
  File "/redacted/anaconda3/envs/fractal-server-1.4.0/lib/python3.10/site-packages/fractal_server/app/runner/_common.py", line 281, in call_single_task
    raise e
  File "/redacted/anaconda3/envs/fractal-server-1.4.0/lib/python3.10/site-packages/fractal_server/app/runner/_common.py", line 274, in call_single_task
    _call_command_wrapper(
  File "/redacted/anaconda3/envs/fractal-server-1.4.0/lib/python3.10/site-packages/fractal_server/app/runner/_common.py", line 184, in _call_command_wrapper
    raise TaskExecutionError(err)
fractal_server.app.runner.common.TaskExecutionError: Traceback (most recent call last):
  File "/redacted/apx_fractal_task_collection/src/apx_fractal_task_collection/multiplexed_pixel_clustering.py", line 26, in <module>
    from sklearn.preprocessing import StandardScalerfrom, PowerTransformer
ImportError: cannot import name 'StandardScalerfrom' from 'sklearn.preprocessing' (/redacted/.conda/envs/custom_fractal_task_collection/lib/python3.10/site-packages/sklearn/preprocessing/__init__.py)`;
	const parts = extractJobErrorParts(log);
	expect(parts.length).eq(3);
	expect(parts[0].text).eq('UNKNOWN ERROR');
	expect(parts[0].highlight).eq(true);
	expect(parts[1].highlight).eq(false);
	expect(parts[2].text).eq(
		"ImportError: cannot import name 'StandardScalerfrom' from 'sklearn.preprocessing' (/redacted/.conda/envs/custom_fractal_task_collection/lib/python3.10/site-packages/sklearn/preprocessing/__init__.py)"
	);
	expect(parts[2].highlight).eq(true);
});

it('handles null or undefined inputs', () => {
	expect(extractJobErrorParts(null)).toHaveLength(0);
	expect(extractJobErrorParts()).toHaveLength(0);
	expect(extractRelevantJobError(null)).eq('');
	expect(extractRelevantJobError()).eq('');
});

it('generates new unique dataset name', () => {
	expect(generateNewUniqueDatasetName(getMockedDatasets(['a', 'b']), 'a')).toEqual('a_1');
	expect(generateNewUniqueDatasetName(getMockedDatasets(['a', 'a_1', 'b']), 'a')).toEqual('a_2');
	expect(generateNewUniqueDatasetName(getMockedDatasets(['a', 'a_1', 'b']), 'a_1')).toEqual('a_2');
	expect(generateNewUniqueDatasetName(getMockedDatasets(['a', 'a_1', 'a_2', 'b']), 'a_1')).toEqual(
		'a_3'
	);
});

it('get first task index for continuing workflow', () => {
	const doneImages = createImageStatus('done', 0, 2, 0);
	const failedImages = createImageStatus('failed', 0, 0, 3);
	const submittedImages = createImageStatus('submitted', 5, 0, 0);
	expect(testGetFirstTaskIndexForContinuingWorkflow([null, null, null, null])).toEqual(0);
	expect(testGetFirstTaskIndexForContinuingWorkflow([doneImages, doneImages, null, null])).toEqual(
		2
	);
	expect(
		testGetFirstTaskIndexForContinuingWorkflow([doneImages, failedImages, doneImages, null])
	).toEqual(1);
	expect(testGetFirstTaskIndexForContinuingWorkflow([doneImages, null, doneImages, null])).toEqual(
		1
	);
	expect(
		testGetFirstTaskIndexForContinuingWorkflow([doneImages, doneImages, doneImages, doneImages])
	).toEqual(undefined);
	expect(
		testGetFirstTaskIndexForContinuingWorkflow([submittedImages, failedImages, null, null])
	).toEqual(undefined);
});

/**
 * @param {string[]} names
 */
function getMockedDatasets(names) {
	return names.map((name, index) => {
		return /** @type {import('fractal-components/types/api').DatasetV2} */ ({
			id: index + 1,
			name
		});
	});
}

/**
 * @param {number} submitted
 * @param {number} done
 * @param {number} failed
 * @returns {import('fractal-components/types/api').ImagesStatus}
 */
function createImageStatus(status, submitted, done, failed) {
	return {
		status,
		num_submitted_images: submitted,
		num_done_images: done,
		num_failed_images: failed,
		num_available_images: 10
	};
}

/**
 * @param {Array<import('fractal-components/types/api').ImagesStatus|null>} values
 * @returns {number|undefined}
 */
function testGetFirstTaskIndexForContinuingWorkflow(values) {
	const workflowTasks = values.map((_, i) => {
		return /** @type {import('fractal-components/types/api').WorkflowTaskV2} */ ({
			id: i + 1,
			order: i
		});
	});
	const statuses = Object.fromEntries(
		values.map((v, i) => [i + 1, v]).filter((e) => e[1] !== null)
	);
	return getFirstTaskIndexForContinuingWorkflow(workflowTasks, statuses);
}
