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

global.window.bootstrap = {
	Modal: MockModal
};

import RunWorkflowModal from '../../src/lib/components/v2/workflow/RunWorkflowModal.svelte';

describe('RunWorkflowModal', () => {
	beforeEach(() => {
		fetch
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
			datasets: [
				{
					id: 1,
					filters: { attributes: {}, types: {} }
				}
			],
			selectedDatasetId: 1,
			workflow: {
				id: 1,
				task_list: [
					{
						id: 1,
						task: { name: 'task1' },
						input_filters: { attributes: {}, types: {} }
					}
				]
			},
			onJobSubmitted: vi.fn(),
			onDatasetsUpdated: vi.fn(),
			statuses: { 1: 'failed' },
			attributeFiltersEnabled: false
		});

		result.component.open('continue');
		await fireEvent.click(result.getByRole('button', { name: 'Run' }));
		expect(result.getByText('No filters')).toBeDefined();
	});
});
