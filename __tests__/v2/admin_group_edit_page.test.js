import { describe, it, beforeEach, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

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
				group: {
					name: 'test',
					user_ids: [1],
					viewer_paths: []
				}
			}
		}
	};
});

// The component to be tested must be imported after the mock setup
import page from '../../src/routes/v2/admin/groups/[groupId]/edit/+page.svelte';

describe('Admin group edit page', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('User is added successfully', async () => {
		const result = render(page);

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ name: 'test', user_ids: [1, 2] })
		});
		fireEvent.dragStart(result.getByRole('button', { name: 'mario@fractal.xy' }));
		fireEvent.drop(result.getByText(/drag the users here/i));

		await result.findByText(/No more users available/);
		expect(await result.findByLabelText('Remove user mario@fractal.xy')).not.null;
	});

	it('Error happens when user is dragged and dropped', async () => {
		const result = render(page);

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: false,
			status: 422,
			json: async () => ({ detail: 'An error happened' })
		});

		fireEvent.dragStart(result.getByRole('button', { name: 'mario@fractal.xy' }));
		fireEvent.drop(result.getByText(/drag the users here/i));

		await result.findByText(/An error happened/);
		expect(result.queryByRole('button', { name: 'mario@fractal.xy' })).not.null;
		expect(result.queryByRole('button', { name: 'Remove user mario@fractal.xy' })).null;
	});
});
