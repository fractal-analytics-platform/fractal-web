import { it, expect } from 'vitest';
import { extractJobErrorParts, extractRelevantJobError } from '$lib/common/job_utilities.js';

const completeTracebackError = `TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:
2024-01-29 16:52:02,328; INFO; START create_ome_zarr task
Traceback (most recent call last):
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/create_ome_zarr.py", line 470, in <module>
    run_fractal_task(
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/_utils.py", line 79, in run_fractal_task
    metadata_update = task_function(**pars)
  File "pydantic/decorator.py", line 40, in pydantic.decorator.validate_arguments.validate.wrapper_function
  File "pydantic/decorator.py", line 133, in pydantic.decorator.ValidatedFunction.call
  File "pydantic/decorator.py", line 130, in pydantic.decorator.ValidatedFunction.init_model_instance
  File "pydantic/main.py", line 341, in pydantic.main.BaseModel.__init__
pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)
`;

const shortTracebackError = `TASK ERROR:Task id: 20 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:
Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`;

it('detect parts of a workflow job error message with complete traceback', () => {
	const parts = extractJobErrorParts(completeTracebackError);

	expect(parts.length).eq(2);
	expect(parts[0].text)
		.eq(`TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:
2024-01-29 16:52:02,328; INFO; START create_ome_zarr task
Traceback (most recent call last):
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/create_ome_zarr.py", line 470, in <module>
    run_fractal_task(
  File "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/lib/python3.10/site-packages/fractal_tasks_core/tasks/_utils.py", line 79, in run_fractal_task
    metadata_update = task_function(**pars)
  File "pydantic/decorator.py", line 40, in pydantic.decorator.validate_arguments.validate.wrapper_function
  File "pydantic/decorator.py", line 133, in pydantic.decorator.ValidatedFunction.call
  File "pydantic/decorator.py", line 130, in pydantic.decorator.ValidatedFunction.init_model_instance
  File "pydantic/main.py", line 341, in pydantic.main.BaseModel.__init__`);
	expect(parts[0].highlight).eq(false);
	expect(parts[1].text)
		.eq(`pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)`);
	expect(parts[1].highlight).eq(true);
});

it('detect parts of a workflow job error message with short traceback', () => {
	const parts = extractJobErrorParts(shortTracebackError);
	expect(parts.length).eq(2);
	expect(parts[0].text)
		.eq(`TASK ERROR:Task id: 20 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:`);
	expect(parts[0].highlight).eq(false);
	expect(parts[1].text).eq(
		`Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`
	);
	expect(parts[1].highlight).eq(true);
});

it('detect parts of a workflow job error message without traceback', () => {
	const parts = extractJobErrorParts('foo');
	expect(parts.length).eq(1);
	expect(parts[0].text).eq('foo');
	expect(parts[0].highlight).eq(false);
});

it('extract relevant part of a workflow job error message with complete traceback', () => {
	const relevantError = extractRelevantJobError(completeTracebackError);
	expect(relevantError)
		.eq(`pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)`);
});

it('extract relevant part of a workflow job error message with short traceback', () => {
	const relevantError = extractRelevantJobError(shortTracebackError);
	expect(relevantError).eq(
		`Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`
	);
});

it('extract relevant part of a workflow job error message without traceback', () => {
	const relevantError = extractRelevantJobError('foo');
	expect(relevantError).eq('foo');
});
