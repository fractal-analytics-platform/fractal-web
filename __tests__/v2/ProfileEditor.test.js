import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// The component to be tested must be imported after the mock setup
import ProfileEditor from '../../src/lib/components/v2/admin/ProfileEditor.svelte';

describe('ProfileEditor', () => {
	const mockedResource = /** @type {import('fractal-components/types/api').Resource} */ ({
		id: 1,
		type: 'slurm_ssh'
	});

	it('Edit SLURM SSH profile - success', async () => {
		/**
		 * @type {(profile: any) => Promise<Response>}
		 */
		const mockSaveProfile = vi.fn(
			async () =>
				/** @type {Response} */ ({
					ok: true,
					status: 200,
					json: () => new Promise((resolve) => resolve({ id: 1 }))
				})
		);

		const user = userEvent.setup();
		render(ProfileEditor, {
			props: {
				resource: mockedResource,
				profile: /** @type {import('fractal-components/types/api').Profile} */ ({
					id: 1,
					resource_id: 1,
					resource_type: 'slurm_ssh'
				}),
				saveProfile: mockSaveProfile
			}
		});

		await user.type(screen.getByRole('textbox', { name: 'Profile name' }), 'profile name');
		await user.type(screen.getByRole('textbox', { name: 'Username' }), 'foo');
		await user.type(screen.getByRole('textbox', { name: 'SSH key path' }), '/path/to/key');
		await user.type(screen.getByRole('textbox', { name: 'Jobs remote dir' }), '/path/to/jobs');
		await user.type(screen.getByRole('textbox', { name: 'Tasks remote dir' }), '/path/to/tasks');

		await user.click(screen.getByRole('button', { name: 'Save' }));

		await screen.findByText('Profile successfully updated');

		expect(mockSaveProfile).toHaveBeenCalledWith({
			id: 1,
			name: 'profile name',
			username: 'foo',
			ssh_key_path: '/path/to/key',
			jobs_remote_dir: '/path/to/jobs',
			tasks_remote_dir: '/path/to/tasks',
			resource_id: 1,
			resource_type: 'slurm_ssh'
		});
	});

	it('Edit SLURM SSH profile - validation error', async () => {
		/**
		 * @type {(profile: any) => Promise<Response>}
		 */
		const mockSaveProfile = vi.fn(
			async () =>
				/** @type {Response} */ ({
					ok: false,
					status: 422,
					json: () =>
						new Promise((resolve) =>
							resolve({
								detail: [
									{
										loc: ['body', 'slurm_ssh', 'name'],
										msg: 'mocked_error_name',
										type: 'value_error'
									},
									{
										loc: ['body', 'slurm_ssh', 'username'],
										msg: 'mocked_error_username',
										type: 'value_error'
									},
									{
										loc: ['body', 'slurm_ssh', 'ssh_key_path'],
										msg: 'mocked_error_ssh_key_path',
										type: 'value_error'
									},
									{
										loc: ['body', 'slurm_ssh', 'jobs_remote_dir'],
										msg: 'mocked_error_jobs_remote_dir',
										type: 'value_error'
									},
									{
										loc: ['body', 'slurm_ssh', 'tasks_remote_dir'],
										msg: 'mocked_error_tasks_remote_dir',
										type: 'value_error'
									}
								]
							})
						)
				})
		);

		const user = userEvent.setup();
		render(ProfileEditor, {
			props: {
				resource: mockedResource,
				profile: {
					id: 1,
					resource_id: 1,
					name: 'profile name',
					resource_type: 'slurm_ssh',
					username: 'foo',
					ssh_key_path: '/path/to/key',
					jobs_remote_dir: '/path/to/jobs',
					tasks_remote_dir: '/path/to/tasks'
				},
				saveProfile: mockSaveProfile
			}
		});

		await user.clear(screen.getByRole('textbox', { name: 'Profile name' }));
		await user.clear(screen.getByRole('textbox', { name: 'Username' }));
		await user.clear(screen.getByRole('textbox', { name: 'SSH key path' }));
		await user.clear(screen.getByRole('textbox', { name: 'Jobs remote dir' }));
		await user.clear(screen.getByRole('textbox', { name: 'Tasks remote dir' }));

		await user.click(screen.getByRole('button', { name: 'Save' }));

		await screen.findByText('mocked_error_name');
		await screen.findByText('mocked_error_username');
		await screen.findByText('mocked_error_ssh_key_path');
		await screen.findByText('mocked_error_jobs_remote_dir');
		await screen.findByText('mocked_error_tasks_remote_dir');

		expect(mockSaveProfile).toHaveBeenCalledWith({
			id: 1,
			name: '',
			username: '',
			ssh_key_path: '',
			jobs_remote_dir: '',
			tasks_remote_dir: '',
			resource_id: 1,
			resource_type: 'slurm_ssh'
		});
	});
});
