import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { mockDataset, mockTask, mockWorkflow, mockWorkflowTask } from '../mock/mock-types';
import userEvent from '@testing-library/user-event';

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			data: {
				userInfo: {
					project_dirs: ['/tmp']
				}
			}
		}
	};
});

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// Mocking fetch
global.fetch = vi.fn();

const task1 = mockTask({
	id: 1,
	name: 'task1',
	args_schema_parallel: {
		type: 'object',
		properties: {
			p1: { type: 'string' }
		}
	}
})
const task2 = mockTask({
	id: 2,
	name: 'task2',
	args_schema_non_parallel: {
		type: 'object',
		properties: {
			p2: { type: 'string' }
		},
		required: ['p2']
	}
})
const wft1 = mockWorkflowTask({ id: 1, order: 0, task: task1, args_parallel: {} });
const wft2 = mockWorkflowTask({ id: 2, order: 1, task: task2, args_non_parallel: {} });

const datasets = [mockDataset({ name: 'dataset' })]
const workflow = mockWorkflow({
	name: 'workflow', task_list: [wft1, wft2]
});

// The component to be tested must be imported after the mock setup
import RunWorkflowModal from '../../src/lib/components/v2/workflow/RunWorkflowModal.svelte';

describe('RunWorkflowModal', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
		mockOnMountCalls();
	});

	it('Attempt to run with invalid arguments and no selection', async () => {
		const user = userEvent.setup();

		render(RunWorkflowModal, { props: getWorkflowModalProps() });

		await user.click(screen.getByRole('button', { name: 'Run' }));

		expect(screen.getByText(/You cannot run submit/)).toBeVisible();
	});

	it('Attempt to run with invalid arguments and selection', async () => {
		const user = userEvent.setup();

		render(RunWorkflowModal, { props: getWorkflowModalProps() });

		await user.selectOptions(screen.getByRole('combobox', { name: /Stop workflow early/ }), 'task2');
		await user.click(screen.getByRole('button', { name: 'Run' }));

		expect(screen.getByText(/You cannot run submit/)).toBeVisible();
	});

	it('Click on Run selecting only valid tasks', async () => {
		const user = userEvent.setup();

		render(RunWorkflowModal, { props: getWorkflowModalProps() });

		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				// mock type-filters-flow
				json: () => new Promise((resolve) => resolve([]))
			});

		await user.selectOptions(screen.getByRole('combobox', { name: /Stop workflow early/ }), 'task1');
		await user.click(screen.getByRole('button', { name: 'Run' }));

		expect(screen.getByRole('button', { name: 'Confirm' })).toBeVisible();
	});
});

function getWorkflowModalProps() {
	return {
		datasets,
		workflow,
		selectedWorkflowTask: wft1,
		selectedDatasetId: 1,
		onDatasetsUpdated: vi.fn(),
		onJobSubmitted: vi.fn(),
		statuses: {}
	}
}

function mockOnMountCalls() {
	return /** @type {import('vitest').Mock} */ (fetch)
		.mockResolvedValueOnce({
			ok: true,
			status: 200,
			// mock current user
			json: () => new Promise((resolve) => resolve({ id: 1, email: 'admin@fractal.xy', slurm_accounts: [] }))
		});
}
