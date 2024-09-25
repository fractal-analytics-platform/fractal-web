import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { readable } from 'svelte/store';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
			data: {
				userInfo: {
					id: 2
				}
			}
		})
	};
});

// The component to be tested must be imported after the mock setup
import UserEditor from '../../src/lib/components/v2/admin/UserEditor.svelte';

describe('UserEditor', () => {
	beforeEach(() => {
		fetch.mockClear();
	});

	const selectedUser = {
		id: 1,
		group_ids: []
	};

	const initialSettings = {
		id: 1,
		slurm_accounts: [],
		slurm_user: null,
		cache_dir: null,
		ssh_host: null,
		ssh_username: null,
		ssh_private_key_path: null,
		ssh_tasks_dir: null,
		ssh_jobs_dir: null
	};

	it('Update settings with slurm runner backend - success', async () => {
		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm',
				user: selectedUser,
				settings: { ...initialSettings },
				save: () => {}
			}
		});

		const mockRequest = fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				new Promise((resolve) =>
					resolve({
						...initialSettings,
						slurm_user: 'user',
						cache_dir: '/path/to/cache/dir'
					})
				)
		});

		await user.type(screen.getByRole('textbox', { name: 'SLURM user' }), 'user');
		await user.type(screen.getByRole('textbox', { name: 'Cache dir' }), '/path/to/cache/dir');
		await user.click(screen.getAllByRole('button', { name: 'Save' })[1]);
		await screen.findByText('Settings successfully updated');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					slurm_user: 'user',
					cache_dir: '/path/to/cache/dir',
					slurm_accounts: []
				})
			})
		);
	});

	it('Update settings with slurm runner backend - validation error', async () => {
		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm',
				user: selectedUser,
				settings: { ...initialSettings },
				save: () => {}
			}
		});

		const mockRequest = fetch.mockResolvedValue({
			ok: false,
			status: 422,
			json: () =>
				new Promise((resolve) =>
					resolve({
						detail: [
							{
								loc: ['body', 'cache_dir'],
								msg: 'mocked_error',
								type: 'value_error'
							}
						]
					})
				)
		});

		await user.type(screen.getByRole('textbox', { name: 'Cache dir' }), 'xxx');
		await user.click(screen.getAllByRole('button', { name: 'Save' })[1]);
		await screen.findByText('mocked_error');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					cache_dir: 'xxx',
					slurm_accounts: []
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
				save: () => {}
			}
		});

		const mockRequest = fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: () =>
				new Promise((resolve) =>
					resolve({
						...initialSettings,
						ssh_host: 'localhost',
						ssh_username: 'username',
						ssh_private_key_path: '/path/to/private/key',
						ssh_tasks_dir: '/path/to/tasks/dir',
						ssh_jobs_dir: '/path/to/jobs/dir'
					})
				)
		});

		await user.type(screen.getByRole('textbox', { name: 'SSH host' }), 'localhost');
		await user.type(screen.getByRole('textbox', { name: 'SSH username' }), 'username');
		await user.type(screen.getByRole('textbox', { name: 'SSH Private Key Path' }), 'xxx');
		await user.type(screen.getByRole('textbox', { name: 'SSH Tasks Dir' }), 'yyy');
		await user.type(screen.getByRole('textbox', { name: 'SSH Jobs Dir' }), 'zzz');
		await user.click(screen.getAllByRole('button', { name: 'Save' })[1]);
		await screen.findByText('Settings successfully updated');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					ssh_host: 'localhost',
					ssh_username: 'username',
					ssh_private_key_path: 'xxx',
					ssh_tasks_dir: 'yyy',
					ssh_jobs_dir: 'zzz',
					slurm_accounts: []
				})
			})
		);
	});

	it('Update settings with slurm_ssh runner backend - validation error', async () => {
		const user = userEvent.setup();

		render(UserEditor, {
			props: {
				runnerBackend: 'slurm_ssh',
				user: selectedUser,
				settings: { ...initialSettings },
				save: () => {}
			}
		});

		const mockRequest = fetch.mockResolvedValue({
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
							},
							{
								loc: ['body', 'ssh_tasks_dir'],
								msg: 'mock_error_ssh_tasks_dir',
								type: 'value_error'
							},
							{
								loc: ['body', 'ssh_jobs_dir'],
								msg: 'mock_error_ssh_jobs_dir',
								type: 'value_error'
							}
						]
					})
				)
		});

		await user.type(screen.getByRole('textbox', { name: 'SSH host' }), 'localhost');
		await user.type(screen.getByRole('textbox', { name: 'SSH username' }), 'username');
		await user.type(
			screen.getByRole('textbox', { name: 'SSH Private Key Path' }),
			'/path/to/private/key'
		);
		await user.type(screen.getByRole('textbox', { name: 'SSH Tasks Dir' }), '/path/to/tasks/dir');
		await user.type(screen.getByRole('textbox', { name: 'SSH Jobs Dir' }), '/path/to/jobs/dir');
		await user.click(screen.getAllByRole('button', { name: 'Save' })[1]);
		await screen.findByText('mock_error_ssh_private_key_path');
		await screen.findByText('mock_error_ssh_tasks_dir');
		await screen.findByText('mock_error_ssh_jobs_dir');

		expect(mockRequest).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({
					ssh_host: 'localhost',
					ssh_username: 'username',
					ssh_private_key_path: '/path/to/private/key',
					ssh_tasks_dir: '/path/to/tasks/dir',
					ssh_jobs_dir: '/path/to/jobs/dir',
					slurm_accounts: []
				})
			})
		);
	});
});
