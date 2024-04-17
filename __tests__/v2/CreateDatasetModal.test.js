import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
			params: {
				projectId: 1
			}
		})
	};
});

// Mocking bootstrap.Modal
class MockModal {
	show = vi.fn();
	hide = vi.fn();
}
MockModal.getInstance = vi.fn();

global.window.bootstrap = {
	Modal: MockModal
};

import CreateDatasetModal from '../../src/lib/components/v2/projects/datasets/CreateDatasetModal.svelte';

const defaultProps = {
	props: { createDatasetCallback: vi.fn() }
};

describe('CreateDatasetModal', () => {
	fetch.mockResolvedValue({
		ok: true,
		status: 200,
		json: () =>
			new Promise((resolve) =>
				resolve({
					data: {
						id: 1
					}
				})
			)
	});

	it('validate missing name and zarr dir', async () => {
		const result = render(CreateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.queryAllByText('Required field').length).eq(2);
	});

	it('create dataset with string filter', async () => {
		const createDatasetCallback = vi.fn();
		const result = render(CreateDatasetModal, {
			props: { createDatasetCallback }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: '/tmp' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'my-value' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					zarr_dir: '/tmp',
					filters: {
						attributes: { 'my-key': 'my-value' },
						types: {}
					}
				})
			})
		);
	});

	it('create dataset with number filter', async () => {
		const createDatasetCallback = vi.fn();
		const result = render(CreateDatasetModal, {
			props: { createDatasetCallback }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: '/tmp' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: '123' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'number' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					zarr_dir: '/tmp',
					filters: {
						attributes: { 'my-key': 123 },
						types: {}
					}
				})
			})
		);
	});

	it('create dataset with type filter set to false', async () => {
		const createDatasetCallback = vi.fn();
		const result = render(CreateDatasetModal, {
			props: { createDatasetCallback }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: '/tmp' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add type filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					zarr_dir: '/tmp',
					filters: {
						attributes: {},
						types: { 'my-key': false }
					}
				})
			})
		);
	});

	it('create dataset with type filter set to true', async () => {
		const createDatasetCallback = vi.fn();
		const result = render(CreateDatasetModal, {
			props: { createDatasetCallback }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: '/tmp' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add type filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.click(result.getByLabelText('Value for my-key'));
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					zarr_dir: '/tmp',
					filters: {
						attributes: {},
						types: { 'my-key': true }
					}
				})
			})
		);
	});
});
