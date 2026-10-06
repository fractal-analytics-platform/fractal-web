import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			data: {
				workflow: {
					id: 1,
					name: 'test',
					project_id: 1,
					task_list: [
						{
							id: 1,
							workflow_id: 1,
							task_id: 1,
							order: 0,
							task: {
								id: 1,
								name: 'task 1',
								taskgroupv2_id: 1
							}
						},
						{
							id: 2,
							workflow_id: 1,
							task_id: 2,
							order: 1,
							task: {
								id: 2,
								name: 'task 2',
								taskgroupv2_id: 2
							}
						}
					],
					project: { id: 1, name: 'test' }
				},
				datasets: [{ id: 1, name: 'test' }],
				defaultDatasetId: 1,
				userInfo: { id: 1, slurm_accounts: [] }
			},
			params: { projectId: 1 }
		}
	};
});

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

import TasksOrderModal from '../mock/MockTasksOrderModal.svelte';
vi.mock('$lib/components/v2/workflow/TasksOrderModal.svelte', () => {
	return {
		default: TasksOrderModal
	};
});

// The component to be tested must be imported after the mock setup
import page from '../../src/routes/v2/projects/[projectId]/workflows/[workflowId]/+page.svelte';

const baseMockResponses = {
	'/api/v2/project/1/dataset/1': { id: 1, name: 'test' },
	'/api/auth/current-user': { slurm_accounts: [] },
	'/api/auth/current-user?group_ids_names=true': {
		id: 1,
		email: 'user@example.com',
		is_active: true,
		is_superuser: false,
		is_verified: false,
		is_guest: true,
		group_ids_names: [],
		oauth_accounts: [],
		profile_id: 1,
		project_dirs: ['/tmp'],
		slurm_accounts: []
	},
	'/api/v2/project/1/workflow/1/version-update-candidates': [],
	'/api/v2/project/1/workflow/1/type-filters-flow': []
};

describe('Workflow page', () => {
	let mockResponses;

	beforeEach(async () => {
		mockResponses = { ...baseMockResponses };

		/** @type {import('vitest').Mock} */ (fetch).mockImplementation((url) => {
			if (mockResponses[url]) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => mockResponses[url]
				});
			} else {
				return Promise.resolve({
					ok: false,
					status: 404
				});
			}
		});

		global.window.bootstrap = await import('bootstrap');
	});

	it('Display error when submission failed before starting execution of tasks', async () => {
		mockResponses = {
			...mockResponses,
			'/api/v2/project/1/workflow/1/job': [
				{
					id: 1,
					project_id: 1,
					workflow_id: 1,
					dataset_id: 1,
					status: 'failed',
					log: 'Exception error occurred while creating job folder and subfolders.\nOriginal error: test'
				}
			],
			'/api/v2/project/1/latest-job?workflow_id=1&dataset_id=1': {
				id: 1,
				project_id: 1,
				workflow_id: 1,
				dataset_id: 1,
				status: 'failed',
				log: 'Exception error occurred while creating job folder and subfolders.\nOriginal error: test',
				task_statuses: { 1: null } // status is null, since no tasks started
			}
		};

		render(page);
		expect(
			await screen.findByText(/Exception error occurred while creating job folder and subfolders/)
		).toBeDefined();
		expect(
			await screen.findByText(/Some jobs ran for this workflow and dataset, but/)
		).toBeDefined();
	});

	it('Initial task for continuing workflow is updated after task reordering', async () => {
		const user = userEvent.setup();
		mockResponses = {
			...mockResponses,
			'/api/v2/project/1/workflow/1/job': [
				{
					id: 1,
					project_id: 1,
					workflow_id: 1,
					dataset_id: 1,
					status: 'done'
				}
			],
			'/api/v2/project/1/latest-job?workflow_id=1&dataset_id=1': {
				id: 1,
				project_id: 1,
				workflow_id: 1,
				dataset_id: 1,
				status: 'failed',
				log: 'Exception error occurred while creating job folder and subfolders.\nOriginal error: test',
				task_statuses: { 1: { status: 'done' }, 2: { status: 'done' } }
			}
		};
		render(page);

		const continueBtn = await screen.findByRole('button', { name: 'Continue workflow' });

		await user.click(screen.getByRole('button', { name: 'task 2' }));
		await user.click(continueBtn);
		expect(screen.getByRole('combobox', { name: 'Start workflow at' })).toHaveValue('1');
		await user.click(
			within(screen.getByTestId('runWorkflowModal')).getByRole('button', { name: 'Close' })
		);

		await user.type(screen.getByRole('textbox', { name: 'Mock position' }), '1,0');
		await user.click(screen.getByRole('button', { name: 'Apply mock sorting' }));

		await user.click(continueBtn);
		expect(screen.getByRole('combobox', { name: 'Start workflow at' })).toHaveValue('0');
	});
});
