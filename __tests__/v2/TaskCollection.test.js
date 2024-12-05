import { describe, it, beforeEach, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

const mockedUser = {
	group_ids_names: [
		[1, 'All'],
		[2, 'Group2']
	]
};

// The component to be tested must be imported after the mock setup
import TaskCollection from '../../src/lib/components/v2/tasks/TaskCollection.svelte';

describe('TaskCollection', () => {
	beforeAll(() => {
		expect.extend({
			toBeFormDataWith(received, expectedProperties) {
				const pass = received instanceof FormData;
				const receivedObject = pass ? Object.fromEntries(received.entries()) : {};
				expect(receivedObject).toMatchObject(expectedProperties);
				return {
					message: () => `expected ${received} to be FormData`,
					pass
				};
			}
		});
	});

	beforeEach(() => {
		fetch.mockClear();
	});

	it('Add single task associated with specific group', async () => {
		const user = userEvent.setup();

		fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => []
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 1, status: 'ongoing' })
			});

		render(TaskCollection, {
			props: {
				user: mockedUser,
				reloadTaskGroupsList: vi.fn()
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Package' }), 'test-task');
		await user.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'Group2');
		await user.click(screen.getByRole('button', { name: 'Collect' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task/collect/pip?private=false&user_group_id=2',
			expect.objectContaining({
				body: expect.toBeFormDataWith({ package: 'test-task' })
			})
		);
	});

	it('Add private task', async () => {
		const user = userEvent.setup();

		fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => []
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 1, status: 'ongoing' })
			});

		render(TaskCollection, {
			props: {
				user: mockedUser,
				reloadTaskGroupsList: vi.fn()
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Package' }), 'test-task');
		await user.click(screen.getByText('Private task'));
		await user.click(screen.getByRole('button', { name: 'Collect' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task/collect/pip?private=true',
			expect.objectContaining({
				body: expect.toBeFormDataWith({ package: 'test-task' })
			})
		);
	});
});
