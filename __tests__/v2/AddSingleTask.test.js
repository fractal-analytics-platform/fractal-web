import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

const mockedUser = {
	group_ids_names: [
		[1, 'All'],
		[2, 'Group2']
	]
};

// The component to be tested must be imported after the mock setup
import AddSingleTask from '../../src/lib/components/v2/tasks/AddSingleTask.svelte';

describe('AddSingleTask', () => {
	beforeEach(() => {
		fetch.mockClear();
	});

	it('Add single task associated with specific group', async () => {
		const user = userEvent.setup();

		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({})
		});

		render(AddSingleTask, {
			props: {
				user: mockedUser,
				addNewTasks: vi.fn()
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Task name' }), 'test-task');
		await user.type(screen.getByRole('textbox', { name: 'Command non parallel' }), 'command');
		await user.type(screen.getByRole('textbox', { name: 'Source' }), 'task-source');
		await user.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'Group2');
		await user.click(screen.getByRole('button', { name: 'Create' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task?private=false&user_group_id=2',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'test-task',
					command_non_parallel: 'command',
					source: 'task-source',
					input_types: {},
					output_types: {}
				})
			})
		);
	});

	it('Add private task', async () => {
		const user = userEvent.setup();

		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({})
		});

		render(AddSingleTask, {
			props: {
				user: mockedUser,
				addNewTasks: vi.fn()
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Task name' }), 'test-task');
		await user.type(screen.getByRole('textbox', { name: 'Command non parallel' }), 'command');
		await user.type(screen.getByRole('textbox', { name: 'Source' }), 'task-source');
		await user.click(screen.getByText('Private task'));
		await user.click(screen.getByRole('button', { name: 'Create' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task?private=true',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'test-task',
					command_non_parallel: 'command',
					source: 'task-source',
					input_types: {},
					output_types: {}
				})
			})
		);
	});
});
