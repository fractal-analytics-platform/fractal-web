import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// Mocking bootstrap.Modal
class MockModal {
	constructor() {
		this.show = vi.fn();
	}
}
MockModal.getInstance = vi.fn();

global.window.bootstrap = {
	Modal: MockModal
};

// Mocking fetch
global.fetch = vi.fn();

import JobLogsModal from '../../src/lib/components/v2/jobs/JobLogsModal.svelte';

describe('JobLogsModal', async () => {
	it('display error log fully highlighted', async () => {
		const result = render(JobLogsModal);
		const error = `TASK ERROR:Task id: 20 (Create OME-Zarr structure), e.workflow_task_order=0
TRACEBACK:
Command "/tmp/FRACTAL_TASKS_DIR/.fractal/fractal-tasks-core0.14.1/venv/bin/python" is not valid. Hint: make sure that it is executable.`;
		mockSuccesfulJobFetch({ id: 1, status: 'failed', log: error });
		await result.component.show({ id: 1, status: 'failed', log: null }, false);
		const pre = result.container.querySelector('pre');
		expect(pre.classList.contains('highlight')).eq(true);
		expect(pre.innerHTML).eq(error);
	});

	it('display log with highlighting and hidden details', async () => {
		const result = render(JobLogsModal);
		const error = `TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0
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
  field required (type=value_error.missing)`;
		mockSuccesfulJobFetch({ id: 1, status: 'failed', log: error });
		await result.component.show({ id: 1, status: 'failed', log: null }, true);
		const pre = result.container.querySelector('pre');
		let divs = pre.querySelectorAll('div');
		expect(divs.length).eq(2);
		expect(divs[0].classList.contains('highlight')).eq(true);
		expect(divs[0].innerHTML).eq(
			'TASK ERROR:Task id: 15 (Create OME-Zarr structure), e.workflow_task_order=0\n'
		);
		expect(divs[1].classList.contains('highlight')).eq(true);
		expect(divs[1].innerHTML)
			.eq(`pydantic.error_wrappers.ValidationError: 1 validation error for CreateOmeZarr
allowed_channels
  field required (type=value_error.missing)\n`);
		expect(pre.querySelectorAll('button').length).eq(1);
		await fireEvent.click(result.getByRole('button', { name: /details hidden/ }));
		divs = pre.querySelectorAll('div');
		expect(divs.length).eq(3);
		expect(divs[0].classList.contains('highlight')).eq(true);
		expect(divs[1].classList.contains('highlight')).eq(false);
		expect(divs[2].classList.contains('highlight')).eq(true);
		expect(divs[1].innerHTML.startsWith('TRACEBACK')).eq(true);
		expect(pre.querySelectorAll('button').length).eq(0);
	});

	it('display successful log', async () => {
		const result = render(JobLogsModal);
		const log = 'Successful log...';
		mockSuccesfulJobFetch({ id: 1, status: 'done', log });
		await result.component.show({ id: 1, status: 'done', log: null }, false);
		const pre = result.container.querySelector('pre');
		expect(pre.classList.contains('highlight')).eq(false);
		expect(pre.innerHTML).eq(log);
	});

	it('error while loading job for user', async () => {
		const result = render(JobLogsModal);
		fetch.mockResolvedValue({
			ok: false,
			json: () => new Promise((resolve) => resolve({ error: 'Something happened' }))
		});
		await result.component.show({ id: 1, status: 'done', log: null }, false);
		expect(result.queryByText(/Unable to fetch job/)).not.null;
	});

	it('error while loading job for admin', async () => {
		const result = render(JobLogsModal);
		fetch.mockResolvedValue({
			ok: false,
			json: () => new Promise((resolve) => resolve({ error: 'Something happened' }))
		});
		await result.component.show({ id: 1, status: 'done', log: null }, true);
		expect(result.queryByText(/Unable to fetch job/)).not.null;
	});
});

function mockSuccesfulJobFetch(job) {
	fetch.mockResolvedValue({
		ok: true,
		json: () => new Promise((resolve) => resolve(job))
	});
}
