import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

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

const mockedWorkflow = {
	id: 20,
	name: 'test',
	project_id: 24,
	task_list: []
};

// The component to be tested must be imported after the mock setup
import AddWorkflowTaskModal from '../../src/lib/components/v2/workflow/AddWorkflowTaskModal.svelte';

describe('AddWorkflowTaskModal', () => {
	beforeEach(() => {
		fetch.mockClear();
	});

	it('Display task with loosely valid version', async () => {
		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => [
				{
					id: 1,
					task_list: [
						{
							id: 1,
							name: 'test_task',
							taskgroupv2_id: 1,
							category: null,
							modality: null,
							authors: null,
							tags: [],
							input_types: {},
							docs_info: ''
						}
					],
					user_id: 1,
					user_group_id: 1,
					pkg_name: 'test_task_package',
					version: '0.0.1',
					active: true
				},
				{
					id: 2,
					task_list: [
						{
							id: 2,
							name: 'test_task',
							taskgroupv2_id: 2,
							category: null,
							modality: null,
							authors: null,
							tags: [],
							input_types: {},
							docs_info: ''
						}
					],
					user_id: 1,
					user_group_id: 1,
					pkg_name: 'test_task_package',
					version: '0.7.10.dev4+g4c8ebe3',
					active: true
				}
			]
		});

		const result = render(AddWorkflowTaskModal, {
			props: {
				user: { id: 1 },
				workflow: mockedWorkflow,
				onWorkflowTaskAdded: vi.fn()
			}
		});

		result.component.show();

		await waitFor(() => screen.getByText(/Add new workflow task/));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task-group?only_active=true&args_schema=false',
			expect.anything()
		);
		await waitFor(() => screen.getAllByText(/test_task/));

		const dropdown = screen.getByRole('combobox');
		expect(dropdown.options.length).eq(2);
		expect(dropdown.options[0].text).eq('0.7.10.dev4+g4c8ebe3');
		expect(dropdown.options[1].text).eq('0.0.1');
		expect(dropdown.value).eq('0.7.10.dev4+g4c8ebe3');
	});

	it('Display task with invalid version', async () => {
		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => [
				{
					id: 1,
					task_list: [
						{
							id: 1,
							name: 'test_task',
							taskgroupv2_id: 1,
							category: null,
							modality: null,
							authors: null,
							tags: [],
							input_types: {},
							docs_info: ''
						}
					],
					user_id: 1,
					user_group_id: 1,
					pkg_name: 'test_task_package',
					version: '0.0.1',
					active: true
				},
				{
					id: 2,
					task_list: [
						{
							id: 2,
							name: 'test_task',
							taskgroupv2_id: 2,
							category: null,
							modality: null,
							authors: null,
							tags: [],
							input_types: {},
							docs_info: ''
						}
					],
					user_id: 1,
					user_group_id: 1,
					pkg_name: 'test_task_package',
					version: 'INVALID',
					active: true
				}
			]
		});

		const result = render(AddWorkflowTaskModal, {
			props: {
				user: { id: 1 },
				workflow: mockedWorkflow,
				onWorkflowTaskAdded: vi.fn()
			}
		});

		result.component.show();

		await waitFor(() => screen.getByText(/Add new workflow task/));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task-group?only_active=true&args_schema=false',
			expect.anything()
		);
		await waitFor(() => screen.getAllByText(/test_task/));

		const dropdown = await screen.findByRole('combobox');
		expect(dropdown.options.length).eq(2);
		expect(dropdown.options[0].text).eq('INVALID');
		expect(dropdown.options[1].text).eq('0.0.1');
		expect(dropdown.value).eq('INVALID');
	});
});
