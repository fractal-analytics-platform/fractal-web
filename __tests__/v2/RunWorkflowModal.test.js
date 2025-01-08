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

const dataset1 = {
	id: 1,
	filters: {
		attributes: {
			k1: 'dataset-value1',
			k3: 'dataset-value3'
		},
		types: {
			t1: false,
			t3: true
		}
	}
};

const workflow1 = {
	id: 1,
	task_list: [
		{
			id: 1,
			task: { name: 'task1' },
			input_filters: {
				attributes: { k1: 'wft-value1', k2: 'wft-value2' },
				types: { t1: true, t2: false }
			}
		}
	]
};

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

	it('When continuing a workflow, show applied filters prioritizing the first workflow task filters', async () => {
		const result = render(RunWorkflowModal, {
			datasets: [dataset1],
			selectedDatasetId: 1,
			workflow: workflow1,
			onJobSubmitted: vi.fn(),
			onDatasetsUpdated: vi.fn(),
			statuses: { 1: 'failed' },
			attributeFiltersEnabled: false
		});

		result.component.open('continue');
		await fireEvent.click(result.getByRole('button', { name: 'Run' }));

		const items = await result.findAllByRole('listitem');

		expect(items.length).toEqual(6);
		expect(result.getByText('k1:').innerHTML).toContain('wft-value1');
		expect(result.getByText('k2:').innerHTML).toContain('wft-value2');
		expect(result.getByText('k3:').innerHTML).toContain('dataset-value3');
		expect(result.getByText('t1:').innerHTML).toContain('text-success');
		expect(result.getByText('t2:').innerHTML).toContain('text-danger');
		expect(result.getByText('t3:').innerHTML).toContain('text-success');
	});

	it('When restarting a workflow, show applied filters from workflow task only', async () => {
		const result = render(RunWorkflowModal, {
			datasets: [dataset1],
			selectedDatasetId: 1,
			workflow: workflow1,
			onJobSubmitted: vi.fn(),
			onDatasetsUpdated: vi.fn(),
			statuses: { 1: 'done' },
			attributeFiltersEnabled: false
		});

		result.component.open('restart');
		await fireEvent.click(result.getByRole('button', { name: 'Run' }));

		const items = await result.findAllByRole('listitem');

		expect(items.length).toEqual(4);
		expect(result.getByText('k1:').innerHTML).toContain('wft-value1');
		expect(result.getByText('k2:').innerHTML).toContain('wft-value2');
		expect(result.getByText('t1:').innerHTML).toContain('text-success');
		expect(result.getByText('t2:').innerHTML).toContain('text-danger');
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
