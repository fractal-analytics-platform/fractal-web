import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			data: {
				projects: [{ id: 1, name: 'test_project_1' }],
				invitations: [],
				userInfo: {
					is_guest: false
				}
			},
			state: { showModal: true }
		}
	};
});
vi.mock('$app/navigation', () => {
	return { pushState: vi.fn() };
});

// The component to be tested must be imported after the mock setup
import page from '../../src/routes/v2/projects/+page.svelte';

describe('Projects page', () => {
	beforeEach(async () => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
		global.window.bootstrap = await import('bootstrap');
	});

	it('Deleted project is propagated to parent component (#1111)', async () => {
		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: true,
			json: () => []
		});

		const user = userEvent.setup();

		const result = render(page);

		expect(result.queryByText('test_project_1')).not.toBeNull();

		await user.click(screen.getByRole('button', { name: 'Shared with me' }));
		expect(result.queryByText('test_project_1')).toBeNull();

		await user.click(screen.getByRole('button', { name: 'My projects' }));
		expect(result.queryByText('test_project_1')).not.toBeNull();

		await user.click(screen.getByRole('button', { name: 'Delete' }));
		await user.click(screen.getByRole('button', { name: 'Confirm' }));
		expect(result.queryByText('test_project_1')).toBeNull();

		await user.click(screen.getByRole('button', { name: 'Shared with me' }));
		expect(result.queryByText('test_project_1')).toBeNull();

		await user.click(screen.getByRole('button', { name: 'My projects' }));
		expect(result.queryByText('test_project_1')).toBeNull();
	});
});
