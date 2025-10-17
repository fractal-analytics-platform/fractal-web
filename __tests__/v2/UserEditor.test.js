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
	});

	const selectedUser = mockUser();

	/** @type {import('fractal-components/types/api').UserSettings} */
	const initialSettings = {
		slurm_accounts: [],
		project_dir: null,
		slurm_user: null,
		ssh_host: null,
		ssh_username: null,
		ssh_private_key_path: null,
		ssh_tasks_dir: null,
		ssh_jobs_dir: null
	};

	/**
	 * @type {() => Promise<Response>}
	 */
	const mockSaveUser = vi.fn();

	it('Update settings with slurm_sudo runner backend - success', async () => {
		const mockRequest = /** @type {import('vitest').Mock} */ (fetch)
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
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: () =>
					new Promise((resolve) =>
						resolve({
							...initialSettings,
							slurm_user: 'user',
							project_dir: '/path/to/project/dir'
						})
					)
			});

		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_sudo',
				user: selectedUser,
				settings: { ...initialSettings },
				saveUser: mockSaveUser
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Project dir' }), '/path/to/project/dir');
		await user.type(screen.getByRole('textbox', { name: 'SLURM user' }), 'user');
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('User successfully updated');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					project_dir: '/path/to/project/dir',
					slurm_user: 'user'
				})
			})
		);
	});

	it('Update settings with slurm_sudo runner backend - validation error', async () => {
		const mockRequest = /** @type {import('vitest').Mock} */ (fetch)
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
			})
			.mockResolvedValue({
				ok: false,
				status: 422,
				json: () =>
					new Promise((resolve) =>
						resolve({
							detail: [
								{
									loc: ['body', 'project_dir'],
									msg: 'mocked_error',
									type: 'value_error'
								}
							]
						})
					)
			});

		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_sudo',
				user: selectedUser,
				settings: { ...initialSettings },
				saveUser: mockSaveUser
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Project dir' }), 'xxx');
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('mocked_error');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					project_dir: 'xxx'
				})
			})
		);
	});

	it('Update settings with slurm_ssh runner backend - success', async () => {
		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_ssh',
				user: selectedUser,
				settings: { ...initialSettings },
				saveUser: mockSaveUser
			}
		});

		const mockRequest = /** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				new Promise((resolve) =>
					resolve({
						...initialSettings,
						ssh_host: 'localhost',
						ssh_username: 'username',
						ssh_private_key_path: '/path/to/private/key'
					})
				)
		});

		await user.type(screen.getByRole('textbox', { name: 'SSH host' }), 'localhost');
		await user.type(screen.getByRole('textbox', { name: 'SSH username' }), 'username');
		await user.type(screen.getByRole('textbox', { name: 'SSH Private Key Path' }), 'xxx');
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('User successfully updated');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					ssh_host: 'localhost',
					ssh_username: 'username',
					ssh_private_key_path: 'xxx'
				})
			})
		);
	});

	it('Update settings with slurm_ssh runner backend - validation error', async () => {
		const mockRequest = /** @type {import('vitest').Mock} */ (fetch)
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
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: () =>
					new Promise((resolve) =>
						resolve({
							detail: [
								{
									loc: ['body', 'ssh_private_key_path'],
									msg: 'mock_error_ssh_private_key_path',
									type: 'value_error'
								}
							]
						})
					)
			});

		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_ssh',
				user: selectedUser,
				settings: { ...initialSettings },
				saveUser: mockSaveUser
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'SSH host' }), 'localhost');
		await user.type(screen.getByRole('textbox', { name: 'SSH username' }), 'username');
		await user.type(
			screen.getByRole('textbox', { name: 'SSH Private Key Path' }),
			'/path/to/private/key'
		);
		await user.click(screen.getByRole('button', { name: 'Save' }));
		await screen.findByText('mock_error_ssh_private_key_path');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					ssh_host: 'localhost',
					ssh_username: 'username',
					ssh_private_key_path: '/path/to/private/key'
				})
			})
		);
	});
});
