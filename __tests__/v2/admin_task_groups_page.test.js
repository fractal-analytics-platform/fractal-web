import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			data: {
				users: [
					{ id: 1, email: 'admin@fractal.xy' },
					{ id: 2, email: 'mario@fractal.xy' }
				],
				groups: [
					{ id: 1, name: 'All' },
					{ id: 2, name: 'g2' }
				]
			}
		}
	};
});

// The component to be tested must be imported after the mock setup
import page from '../../src/routes/v2/admin/task-groups/+page.svelte';

function mockTaskGroups() {
	return /** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
		ok: true,
		status: 200,
		json: () =>
			new Promise((resolve) =>
				resolve({
					items: [
						{
							id: 1,
							task_list: [],
							user_id: 1,
							user_group_id: 1,
							origin: 'pypi',
							pkg_name: 'fractal-tasks-core',
							version: '1.3.2',
							python_version: '3.10',
							active: true
						}
					],
					total_count: 1
				})
			)
	});
}

describe('Admin task-groups page', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('Search without filters', async () => {
		const mockRequest = mockTaskGroups();

		const user = userEvent.setup();
		render(page);
		await user.click(screen.getByRole('button', { name: 'Search task groups' }));

		expect(mockRequest).toHaveBeenCalledWith(
			new URL('http://localhost:3000/api/admin/v2/task-group?page=1&page_size=10')
		);

		expect(screen.getAllByRole('row').length).toEqual(2);
	});

	it('Search with filters', async () => {
		const mockRequest = mockTaskGroups();

		const user = userEvent.setup();
		render(page);

		await user.type(screen.getByRole('textbox', { name: 'Package name' }), 'fractal-tasks-core');
		await user.selectOptions(screen.getByRole('combobox', { name: 'User' }), 'mario@fractal.xy');
		await user.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'All');
		await user.selectOptions(screen.getByRole('combobox', { name: 'Active' }), 'True');
		await user.selectOptions(screen.getByRole('combobox', { name: 'Private' }), 'False');
		await user.selectOptions(screen.getByRole('combobox', { name: 'Origin' }), 'PyPI');

		await user.click(screen.getByRole('button', { name: 'Search task groups' }));

		expect(mockRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				pathname: '/api/admin/v2/task-group',
				search:
					'?page=1&page_size=10&user_id=2&user_group_id=1&pkg_name=fractal-tasks-core&origin=pypi&private=false&active=true'
			})
		);

		expect(screen.getAllByRole('row').length).toEqual(2);

		expect(screen.getByRole('textbox', { name: 'Package name' })).toHaveValue('fractal-tasks-core');
		expect(screen.getByRole('combobox', { name: 'User' })).toHaveValue('2');
		expect(screen.getByRole('combobox', { name: 'Group' })).toHaveValue('1');
		expect(screen.getByRole('combobox', { name: 'Active' })).toHaveValue('true');
		expect(screen.getByRole('combobox', { name: 'Private' })).toHaveValue('false');
		expect(screen.getByRole('combobox', { name: 'Origin' })).toHaveValue('pypi');

		await user.click(screen.getByRole('button', { name: 'Reset' }));

		expect(screen.queryAllByRole('row').length).toEqual(0);
		expect(screen.getByRole('textbox', { name: 'Package name' })).toHaveValue('');
		expect(screen.getByRole('combobox', { name: 'User' })).toHaveValue('');
		expect(screen.getByRole('combobox', { name: 'Group' })).toHaveValue('');
		expect(screen.getByRole('combobox', { name: 'Active' })).toHaveValue('');
		expect(screen.getByRole('combobox', { name: 'Private' })).toHaveValue('');
		expect(screen.getByRole('combobox', { name: 'Origin' })).toHaveValue('');
	});
});
