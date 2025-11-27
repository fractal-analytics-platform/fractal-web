import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/svelte';

// Mocking fetch
global.fetch = vi.fn();

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: { PUBLIC_UPDATE_JOBS_INTERVAL: 90 } };
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
import TaskGroupActivities from '../../src/lib/components/v2/tasks/TaskGroupActivities.svelte';

describe('TaskGroupActivities', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('Update ongoing activity in background - standard user', async () => {
		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => [{ id: 1, pkg_name: 'fractal-tasks-core', status: 'ongoing' }]
			})
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ id: 1, pkg_name: 'fractal-tasks-core', status: 'OK' })
			});

		render(TaskGroupActivities);

		const row = await screen.findByRole('row', { name: /fractal-tasks-core/ });
		expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('ongoing');

		await waitFor(() => {
			const row = screen.getByRole('row', { name: /fractal-tasks-core/ });
			expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('OK');
		});
	});
});
