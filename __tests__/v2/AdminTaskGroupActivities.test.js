import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: { PUBLIC_UPDATE_JOBS_INTERVAL: 500 } };
});

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			url: new URL('http://localhost:5173/v2/tasks/activities')
		}
	};
});

// The component to be tested must be imported after the mock setup
import AdminTaskGroupActivities from '../../src/lib/components/v2/tasks/AdminTaskGroupActivities.svelte';

describe('AdminTaskGroupActivities', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('Update ongoing activity in background - admin', async () => {
		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					items: [{ id: 1, pkg_name: 'fractal-tasks-core', status: 'ongoing' }]
				})
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ items: [{ id: 1, pkg_name: 'fractal-tasks-core', status: 'OK' }] })
			});

		render(AdminTaskGroupActivities);

		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /Search activities/ }));

		const row = await screen.findByRole('row', { name: /fractal-tasks-core/ });
		expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('ongoing');

		await waitFor(() => {
			const row = screen.getByRole('row', { name: /fractal-tasks-core/ });
			expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('OK');
		});
	});

	it('Search activities - admin user', async () => {
		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ items: [] })
		});

		render(AdminTaskGroupActivities, {
			props: {
				users: [
					{
						id: 1,
						email: 'admin@fractal.xy',
						is_active: true,
						is_superuser: true,
						is_verified: true,
						group_ids_names: [],
						oauth_accounts: [],
						profile_id: 1,
						project_dirs: ['/tmp'],
						slurm_accounts: []
					}
				]
			}
		});

		const user = userEvent.setup();
		await user.type(screen.getByRole('textbox', { name: /Package name/ }), 'pkg');
		await user.selectOptions(screen.getByRole('combobox', { name: /Status/ }), 'OK');
		await user.selectOptions(screen.getByRole('combobox', { name: /Action/ }), 'Collect');
		await user.type(screen.getByRole('spinbutton', { name: /Task-group id/ }), '1');
		await user.selectOptions(screen.getByRole('combobox', { name: /User/ }), 'admin@fractal.xy');

		await user.click(screen.getByRole('button', { name: /Search activities/ }));

		expect(fetch).toHaveBeenLastCalledWith(
			new URL(
				'http://localhost:3000/api/admin/v2/task-group/activity?page=1&page_size=10&pkg_name=pkg&status=OK&action=collect&taskgroupv2_id=1&user_id=1'
			),
			expect.anything()
		);

		await user.click(screen.getByRole('button', { name: /Reset/ }));
		await user.click(screen.getByRole('button', { name: /Search activities/ }));

		expect(fetch).toHaveBeenLastCalledWith(
			new URL('http://localhost:3000/api/admin/v2/task-group/activity?page=1&page_size=10'),
			expect.anything()
		);
	});
});
