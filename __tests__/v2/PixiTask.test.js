/// <reference path="../../vitest-setup.d.ts" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { mockUser } from '../mock/mock-types';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

const mockedUser = mockUser({ group_ids_names: [[1, 'All']] });

// The component to be tested must be imported after the mock setup
import PixiTask from '../../src/lib/components/v2/tasks/PixiTask.svelte';

describe('PixiTask', () => {
	it('Public task with lockfile and custom pixi version', async () => {
		const user = userEvent.setup();

		render(PixiTask, {
			props: { user: mockedUser, defaultGroupName: 'All' }
		});

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: true,
			json: () => {}
		});

		await user.type(screen.getByRole('textbox', { name: 'Pixi version (optional)' }), '0.50.0');

		await user.click(screen.getByRole('button', { name: 'Collect' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task/collect/pixi?private=false&user_group_id=1',
			expect.objectContaining({
				body: expect.toBeFormDataWith({
					use_pixi_lockfile: 'true',
					pixi_version: '0.50.0'
				})
			})
		);
	});

	it('Private task without lockfile', async () => {
		const user = userEvent.setup();

		render(PixiTask, {
			props: { user: mockedUser, defaultGroupName: 'All' }
		});

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: true,
			json: () => {}
		});

		await user.click(screen.getByRole('switch'));
		await user.click(screen.getByLabelText('Private task'));

		await user.click(screen.getByRole('button', { name: 'Collect' }));

		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/task/collect/pixi?private=true',
			expect.objectContaining({
				body: expect.toBeFormDataWith({ use_pixi_lockfile: 'false' })
			})
		);
	});
});
