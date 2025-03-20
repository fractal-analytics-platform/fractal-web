import { describe, beforeEach, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

// Mocking fetch
global.fetch = vi.fn();

// Mocking bootstrap.Modal
class MockModal {
	constructor() {
		this.show = vi.fn();
		this.hide = vi.fn();
	}
}
MockModal.getInstance = vi.fn();

// @ts-expect-error
global.window.bootstrap = {
	Modal: MockModal
};

import RunWorkflowModal from '../../src/lib/components/v2/workflow/RunWorkflowModal.svelte';
import { mockDataset, mockTask, mockWorkflow, mockWorkflowTask } from '../mock/mock-types';

describe('RunWorkflowModal', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () => new Promise((resolve) => resolve({ slurm_accounts: [] }))
			})
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: () =>
					new Promise((resolve) =>
						resolve({
							total_count: 0,
							page_size: 10,
							current_page: 1,
							attributes: {},
							types: [],
							images: []
						})
					)
			});
	});

	it('Handles empty filters list', async () => {
		const result = render(RunWorkflowModal, {
			datasets: [mockDataset()],
			selectedDatasetId: 1,
			workflow: mockWorkflow({
				task_list: [
					mockWorkflowTask({
						task: mockTask({ name: 'task1' })
					})
				]
			}),
			onJobSubmitted: vi.fn(),
			onDatasetsUpdated: vi.fn(),
			statuses: {
				1: {
					status: 'partial',
					num_submitted_images: 0,
					num_done_images: 0,
					num_failed_images: 5,
					num_available_images: 5
				}
			},
			attributeFiltersEnabled: false
		});

		result.component.open('continue');
		await fireEvent.click(result.getByRole('button', { name: 'Run' }));
		expect(result.getByText('No filters')).toBeDefined();
	});
});
