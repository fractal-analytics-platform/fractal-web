import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/svelte';
import ImagesStatus from '../src/lib/components/jobs/ImagesStatus.svelte';

describe('ImagesStatus', () => {
	const baseProps = {
		dataset: /** @type {import('#fractal-components/types/api').DatasetV2} */ ({ id: 1 }),
		imagesStatusModal: /** @type {any} */ ({})
	};

	it('done converter', () => {
		render(ImagesStatus, {
			props: {
				...baseProps,
				running: false,
				workflowTask: getMockedWorkflowTask('converter_compound'),
				status: { status: 'done' }
			}
		});
		expect(screen.getByRole('img')).toHaveClass('bi-check', 'text-success');
	});

	it('failed non_parallel - handled as converter', () => {
		render(ImagesStatus, {
			props: {
				...baseProps,
				running: false,
				workflowTask: getMockedWorkflowTask('non_parallel'),
				status: {
					status: 'failed',
					num_submitted_images: 0,
					num_done_images: 0,
					num_failed_images: 0,
					num_available_images: 0
				}
			}
		});
		expect(screen.getByRole('img')).toHaveClass('bi-x', 'text-danger');
	});

	it('submitted converter - running', () => {
		render(ImagesStatus, {
			props: {
				...baseProps,
				running: true,
				workflowTask: getMockedWorkflowTask('converter_non_parallel'),
				status: { status: 'submitted' }
			}
		});
		expect(screen.getByRole('status')).toHaveTextContent(/Loading/);
	});

	it('submitted converter - not running', () => {
		render(ImagesStatus, {
			props: {
				...baseProps,
				running: false,
				workflowTask: getMockedWorkflowTask('converter_compound'),
				status: { status: 'submitted' }
			}
		});
		expect(screen.getByRole('img')).toHaveClass('bi-hourglass');
	});

	it('parallel - num_submitted_images > 0', () => {
		render(ImagesStatus, {
			props: {
				...baseProps,
				running: true,
				workflowTask: getMockedWorkflowTask('parallel'),
				status: {
					status: 'submitted',
					num_submitted_images: 5,
					num_done_images: 0,
					num_failed_images: 0,
					num_available_images: 5
				}
			}
		});
		expect(screen.getByRole('button')).toHaveTextContent(/5/);
		expect(screen.getByRole('status')).toHaveTextContent(/Loading/);
	});

	it('parallel - num_submitted_images == 0, running', () => {
		render(ImagesStatus, {
			props: {
				...baseProps,
				running: true,
				workflowTask: getMockedWorkflowTask('parallel'),
				status: {
					status: 'submitted',
					num_submitted_images: 0,
					num_done_images: 0,
					num_failed_images: 0,
					num_available_images: 0
				}
			}
		});
		expect(screen.getByRole('status')).toHaveTextContent(/Loading/);
	});

	it('parallel - num_submitted_images == 0, not running', () => {
		render(ImagesStatus, {
			props: {
				...baseProps,
				running: false,
				workflowTask: getMockedWorkflowTask('parallel'),
				status: {
					status: 'submitted',
					num_submitted_images: 0,
					num_done_images: 0,
					num_failed_images: 0,
					num_available_images: 0
				}
			}
		});
		expect(screen.getByRole('img')).toHaveClass('bi-hourglass');
	});

	it('non_parallel - partial success', () => {
		const component = render(ImagesStatus, {
			props: {
				...baseProps,
				running: false,
				workflowTask: getMockedWorkflowTask('non_parallel'),
				status: {
					status: 'failed',
					num_submitted_images: 0,
					num_done_images: 4,
					num_failed_images: 6,
					num_available_images: 10
				}
			}
		});
		expect(component.baseElement).toHaveTextContent('4 / 6 / 10');
		expect(screen.getByRole('button', { name: 'Done images of test' })).toHaveTextContent('4');
		expect(screen.getByRole('button', { name: 'Failed images of test' })).toHaveTextContent('6');
	});

	it('compound - success', () => {
		const component = render(ImagesStatus, {
			props: {
				...baseProps,
				running: false,
				workflowTask: getMockedWorkflowTask('compound'),
				status: {
					status: 'done',
					num_submitted_images: 0,
					num_done_images: 10,
					num_failed_images: 0,
					num_available_images: 10
				}
			}
		});
		expect(component.baseElement).toHaveTextContent('10');
		expect(screen.getByRole('button', { name: 'Done images of test' })).toHaveTextContent('10');
	});

	it('parallel - running, partial done, partial failed', () => {
		const component = render(ImagesStatus, {
			props: {
				...baseProps,
				running: true,
				workflowTask: getMockedWorkflowTask('parallel'),
				status: {
					status: 'done',
					num_submitted_images: 3,
					num_done_images: 2,
					num_failed_images: 5,
					num_available_images: 10
				}
			}
		});
		expect(component.baseElement).toHaveTextContent(/3 .* 2 \/ 5 \/ 10/);
		expect(screen.getByRole('status')).toHaveTextContent(/Loading/);
		expect(screen.getByRole('button', { name: 'Done images of test' })).toHaveTextContent('2');
		expect(screen.getByRole('button', { name: 'Failed images of test' })).toHaveTextContent('5');
	});
});

/**
 * @param {import('#fractal-components/types/api').TaskV2Type} taskType
 * @returns {import('#fractal-components/types/api').WorkflowTaskV2}
 */
function getMockedWorkflowTask(taskType) {
	return /** @type {import('#fractal-components/types/api').WorkflowTaskV2} */ ({
		task_type: taskType,
		alias: null,
		task: /** @type {import('#fractal-components/types/api').TaskV2} */ ({
			name: 'test'
		})
	});
}
