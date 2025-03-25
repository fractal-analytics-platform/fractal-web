import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
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
							task: {
								id: 1,
								name: 'test',
								taskgroupv2_id: 1
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
		})
	};
});

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// The component to be tested must be imported after the mock setup
import page from '../../src/routes/v2/projects/[projectId]/workflows/[workflowId]/+page.svelte';

describe('Workflow page', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('Display error when submission failed before starting execution of tasks', async () => {
		/** @type {import('vitest').Mock} */ (fetch).mockImplementation((url) => {
			return Promise.resolve({
				ok: true,
				status: 200,
				json: async () => {
					switch (url) {
						case '/api/v2/task-group?only_active=false':
							return [
								{
									id: 1,
									pkg_name: 'group1',
									version: null,
									task_list: [
										{
											id: 1,
											name: 'test',
											taskgroupv2_id: 1
										}
									]
								}
							];
						case '/api/v2/project/1/dataset/1':
							return { id: 1, name: 'test' };
						case '/api/v2/project/1/status?dataset_id=1&workflow_id=1':
							return { status: {} }; // status is an empty object, since no tasks started
						case '/api/v2/project/1/workflow/1/job':
							return [
								{
									id: 1,
									project_id: 1,
									workflow_id: 1,
									dataset_id: 1,
									status: 'failed',
									log: 'Exception error occurred while creating job folder and subfolders.\nOriginal error: test'
								}
							];
						case '/api/v2/project/1/latest-job?workflow_id=1&dataset_id=1':
							return {
								id: 1,
								project_id: 1,
								workflow_id: 1,
								dataset_id: 1,
								status: 'failed',
								log: 'Exception error occurred while creating job folder and subfolders.\nOriginal error: test'
							};
						case '/api/auth/current-user/settings':
							return { slurm_accounts: [] };
						default:
							throw Error(`Unexpected API call: ${url}`);
					}
				}
			});
		});

		const result = render(page);
		expect(
			await result.findByText(/Exception error occurred while creating job folder and subfolders/)
		).toBeDefined();
	});
});
