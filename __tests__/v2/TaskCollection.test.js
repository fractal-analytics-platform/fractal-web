import { describe, it, afterEach, beforeEach, expect, vi, beforeAll } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { mockUser } from '../mock/mock-types';

// Mocking fetch
global.fetch = vi.fn();

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

const mockedUser = mockUser({
	group_ids_names: /** @type {Array<[number, string]>} */ ([
		[1, 'All'],
		[2, 'Group2']
	])
});

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
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	it('Add single task associated with specific group', async () => {
		const user = userEvent.setup();

		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => []
			})
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ id: 1, status: 'ongoing' })
			});

		render(TaskCollection, {
			props: { user: mockedUser }
		});

		await user.type(screen.getByRole('textbox', { name: 'Package' }), 'test-task');
		await user.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'Group2');
		await user.click(screen.getByRole('button', { name: 'Collect' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task/collect/pip?private=false&user_group_id=2',
			expect.objectContaining({
				// @ts-expect-error
				body: expect.toBeFormDataWith({ package: 'test-task' })
			})
		);
	});

	it('Add private task', async () => {
		const user = userEvent.setup();

		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => []
			})
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ id: 1, status: 'ongoing' })
			});

		render(TaskCollection, {
			props: { user: mockedUser }
		});

		await user.type(screen.getByRole('textbox', { name: 'Package' }), 'test-task');
		await user.click(screen.getByText('Private task'));
		await user.click(screen.getByRole('button', { name: 'Collect' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task/collect/pip?private=true',
			expect.objectContaining({
				// @ts-expect-error
				body: expect.toBeFormDataWith({ package: 'test-task' })
			})
		);
	});

	it('collect tasks with pinned package versions', async () => {
		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => []
			})
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ id: 1, status: 'pending' })
			});

		render(TaskCollection, {
			props: { user: mockedUser }
		});

		const addPpvBtn = screen.getByRole('button', { name: 'Add pinned package version' });

		expect(screen.getAllByRole('textbox').length).eq(3);

		// add ppv
		await fireEvent.click(addPpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(5);
		await fireEvent.click(addPpvBtn);
		await fireEvent.click(addPpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(9);

		// remove ppv
		const removePpvBtn = screen.getAllByRole('button', {
			name: 'Remove pinned package version'
		})[1];
		await fireEvent.click(removePpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(7);

		const [key1, key2] = screen.getAllByRole('textbox', { name: 'Name' });
		const [value1, value2] = screen.getAllByRole('textbox', { name: 'Version' });

		await fireEvent.input(key1, { target: { value: 'package1' } });
		await fireEvent.input(value1, { target: { value: '1.2.3' } });
		await fireEvent.input(key2, { target: { value: 'package2' } });
		await fireEvent.input(value2, { target: { value: '0.0.8' } });

		const packageInput = screen.getByRole('textbox', { name: 'Package' });
		await fireEvent.input(packageInput, { target: { value: 'main-package' } });

		const collectBtn = screen.getByRole('button', { name: 'Collect' });
		await fireEvent.click(collectBtn);

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task/collect/pip?private=false&user_group_id=1',
			expect.objectContaining({
				// @ts-expect-error
				body: expect.toBeFormDataWith({
					package: 'main-package',
					pinned_package_versions: JSON.stringify({
						package1: '1.2.3',
						package2: '0.0.8'
					})
				})
			})
		);

		await new Promise((resolve) => setTimeout(resolve));
		expect(screen.getAllByRole('textbox').length).eq(3);
	});
});
