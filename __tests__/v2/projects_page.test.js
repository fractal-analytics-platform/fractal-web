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
			}
		}
	};
});

// Mocking bootstrap.Modal
class MockModal {
	constructor() {
		this.show = vi.fn();
		this.hide = vi.fn();
	}
}
MockModal.getInstance = vi.fn();

// @ts-expect-error
global.window.bootstrap = {
	Modal: MockModal
};

// The component to be tested must be imported after the mock setup
import page from '../../src/routes/v2/projects/+page.svelte';

describe('Projects page', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
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
