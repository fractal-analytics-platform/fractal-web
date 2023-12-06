import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

// Mocking fetch
global.fetch = vi.fn();

// The component to be tested must be imported after the mock setup
import TaskCollection from '../src/lib/components/tasks/TaskCollection.svelte';

describe('TaskCollection', () => {
	it('collect tasks with pinned package versions', async () => {
		render(TaskCollection);

		const addPpvBtn = screen.getByRole('button', { name: 'Add pinned package version' });

		expect(screen.getAllByRole('textbox').length).eq(4);

		// add ppv
		await fireEvent.click(addPpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(6);
		await fireEvent.click(addPpvBtn);
		await fireEvent.click(addPpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(10);

		// remove ppv
		const removePpvBtn = screen.getAllByRole('button', {
			name: 'Remove pinned package version'
		})[1];
		await fireEvent.click(removePpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(8);

		const [key1, key2] = screen.getAllByRole('textbox', { name: 'Key' });
		const [value1, value2] = screen.getAllByRole('textbox', { name: 'Value' });

		await fireEvent.input(key1, { target: { value: 'package1' } });
		await fireEvent.input(value1, { target: { value: '1.2.3' } });
		await fireEvent.input(key2, { target: { value: 'package2' } });
		await fireEvent.input(value2, { target: { value: '0.0.8' } });

		const packageInput = screen.getByRole('textbox', { name: 'Package' });
		await fireEvent.input(packageInput, { target: { value: 'main-package' } });

		fetch.mockResolvedValue({
			ok: true,
			status: 201,
			json: () =>
				new Promise((resolve) =>
					resolve({
						data: {
							status: 'pending'
						}
					})
				)
		});

		const collectBtn = screen.getByRole('button', { name: 'Collect' });
		await fireEvent.click(collectBtn);

		expect(fetch).toHaveBeenCalledWith(
			'/api/v1/task/collect/pip',
			expect.objectContaining({
				body: JSON.stringify({
					package: 'main-package',
					pinned_package_versions: {
						package1: '1.2.3',
						package2: '0.0.8'
					}
				})
			})
		);

		await new Promise(setTimeout);
		expect(screen.getAllByRole('textbox').length).eq(4);
	});
});
