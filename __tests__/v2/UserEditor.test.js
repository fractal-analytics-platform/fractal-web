import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { mockUser } from '../mock/mock-types';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			data: {
				userInfo: {
					id: 2
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
import UserEditor from '../../src/lib/components/v2/admin/UserEditor.svelte';

describe('UserEditor', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
		mockResourcesAndProfiles();
	});

	const selectedUser = mockUser();

	it('Update settings - success', async () => {
		const user = userEvent.setup();

		const mockSaveUser = vi.fn(async (u) => {
			return /** @type {Response} */ ({
				ok: true,
				status: 200,
				json: () => new Promise((resolve) => resolve(u))
			});
		});

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_sudo',
				user: {
					...selectedUser,
					slurm_accounts: [],
					project_dirs: ['']
				},
				saveUser: mockSaveUser,
				defaultGroupName: 'All'
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Project dir' }), '/path/to/project/dir');
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('User successfully updated');

		expect(mockSaveUser).toHaveBeenCalledWith(
			expect.objectContaining({
				slurm_accounts: [],
				project_dirs: ['/path/to/project/dir']
			})
		);
	});

	it('Update settings - validation error', async () => {
		const user = userEvent.setup();

		const mockSaveUser = vi.fn(async () => {
			return /** @type {Response} */ ({
				ok: false,
				status: 422,
				json: () =>
					new Promise((resolve) =>
						resolve({
							detail: [
								{
									loc: ['body', 'project_dirs', 0],
									msg: 'mocked_error',
									type: 'value_error'
								}
							]
						})
					)
			});
		});

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_sudo',
				user: {
					...selectedUser,
					slurm_accounts: [],
					project_dirs: ['']
				},
				saveUser: mockSaveUser,
				defaultGroupName: 'All'
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Project dir' }), 'xxx');
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('mocked_error');

		expect(mockSaveUser).toHaveBeenCalledWith(
			expect.objectContaining({
				slurm_accounts: [],
				project_dirs: ['xxx']
			})
		);
	});

	it('Update settings - add slurm accounts', async () => {
		const mockSaveUser = vi.fn(async (u) => {
			return /** @type {Response} */ ({
				ok: true,
				status: 200,
				json: () => new Promise((resolve) => resolve(u))
			});
		});

		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_sudo',
				user: {
					...selectedUser,
					slurm_accounts: [],
					project_dirs: ['/path/to/project/dir']
				},
				saveUser: mockSaveUser,
				defaultGroupName: 'All'
			}
		});

		expect(await screen.findByRole('textbox', { name: 'Project dir' })).toHaveValue(
			'/path/to/project/dir'
		);
		await user.click(screen.getByRole('button', { name: 'Add SLURM account' }));
		await user.type(screen.getByRole('textbox', { name: 'SLURM account #1' }), 'foo');
		await user.click(screen.getByRole('button', { name: 'Add SLURM account' }));
		await user.type(screen.getByRole('textbox', { name: 'SLURM account #2' }), 'bar');
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('User successfully updated');

		expect(mockSaveUser).toHaveBeenCalledWith(
			expect.objectContaining({
				slurm_accounts: ['foo', 'bar'],
				project_dirs: ['/path/to/project/dir']
			})
		);
	});

	it('Update settings - remove slurm account', async () => {
		const mockSaveUser = vi.fn(async (u) => {
			return /** @type {Response} */ ({
				ok: true,
				status: 200,
				json: () => new Promise((resolve) => resolve(u))
			});
		});

		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_sudo',
				user: {
					...selectedUser,
					slurm_accounts: ['foo', 'bar'],
					project_dirs: ['/path/to/project/dir']
				},
				saveUser: mockSaveUser,
				defaultGroupName: 'All'
			}
		});

		expect(await screen.findByRole('textbox', { name: 'Project dir' })).toHaveValue(
			'/path/to/project/dir'
		);
		await user.click(screen.getByRole('button', { name: 'Remove SLURM account #2' }));
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('User successfully updated');

		expect(mockSaveUser).toHaveBeenCalledWith(
			expect.objectContaining({
				slurm_accounts: ['foo'],
				project_dirs: ['/path/to/project/dir']
			})
		);
	});
});

function mockResourcesAndProfiles() {
	return /** @type {import('vitest').Mock} */ (fetch)
		.mockResolvedValueOnce({
			ok: true,
			status: 200,
			// mock profile
			json: () => new Promise((resolve) => resolve({ id: 1, resource_id: 1 }))
		})
		.mockResolvedValueOnce({
			ok: true,
			status: 200,
			// mock resources
			json: () => new Promise((resolve) => resolve([{ id: 1 }]))
		})
		.mockResolvedValueOnce({
			ok: true,
			status: 200,
			// mock profiles
			json: () => new Promise((resolve) => resolve([{ id: 1 }]))
		});
}
