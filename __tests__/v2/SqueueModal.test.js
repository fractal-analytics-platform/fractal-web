import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

// The component to be tested must be imported after the mock setup
import SqueueModal from '../../src/lib/components/v2/jobs/SqueueModal.svelte';

describe('SqueueModal', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('Scope all', async () => {
		const mockApi = mockSqueueCallSuccess();
		render(SqueueModal);
		const element = /** @type {HTMLElement} */ (document.getElementById('squeueModal'));
		element.dispatchEvent(new CustomEvent('show.bs.modal'));
		expect(mockApi).toHaveBeenCalledWith(expect.stringContaining('?scope=all'));
		expect(await screen.findByText(/fake-command-output/)).toBeVisible();
	});

	it('Scope user', async () => {
		const user = userEvent.setup();
		const mockApi = mockSqueueCallSuccess();
		render(SqueueModal);
		await user.click(screen.getByRole('radio', { name: 'My Slurm user' }));
		expect(mockApi).toHaveBeenCalledWith(expect.stringContaining('?scope=user'));
		expect(screen.getByText(/fake-command-output/)).toBeVisible();
	});

	it('Scope accounts', async () => {
		const user = userEvent.setup();
		const mockApi = mockSqueueCallSuccess();
		render(SqueueModal);
		await user.click(screen.getByRole('radio', { name: 'My Slurm accounts' }));
		expect(mockApi).toHaveBeenCalledWith(expect.stringContaining('?scope=accounts'));
		expect(screen.getByText(/fake-command-output/)).toBeVisible();
	});

	it('Refresh', async () => {
		const user = userEvent.setup();
		const mockApi = mockSqueueCallSuccess();
		render(SqueueModal);
		await user.click(screen.getByRole('button', { name: 'Refresh' }));
		expect(mockApi).toHaveBeenCalledWith(expect.stringContaining('?scope=all'));
		expect(screen.getByText(/fake-command-output/)).toBeVisible();
	});

	it('Error', async () => {
		const user = userEvent.setup();
		const mockApi = mockSqueueCallError();
		render(SqueueModal);
		await user.click(screen.getByRole('radio', { name: 'My Slurm accounts' }));
		expect(mockApi).toHaveBeenCalledWith(expect.stringContaining('?scope=accounts'));
		expect(screen.getByText(/squeue error/)).toBeVisible();
	});
});

function mockSqueueCallSuccess() {
	return /** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
		ok: true,
		status: 200,
		text: () => new Promise((resolve) => resolve('fake-command-output'))
	});
}

function mockSqueueCallError() {
	return /** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
		ok: true,
		status: 422,
		text: () => new Promise((resolve) => resolve('squeue error'))
	});
}
