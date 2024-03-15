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

import CreateUpdateDatasetModal from '../../src/lib/components/v2/projects/CreateUpdateDatasetModal.svelte';

const defaultProps = {
	props: { createDatasetCallback: vi.fn(), updateDatasetCallback: vi.fn() }
};

describe('CreateUpdateDatasetModal', () => {
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
		const result = render(CreateUpdateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.queryAllByText('Required field').length).eq(2);
	});

	it('add and remove filter', async () => {
		const result = render(CreateUpdateDatasetModal, defaultProps);
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(1);
		await fireEvent.click(result.getByRole('button', { name: 'Remove filter' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
	});

	it('validate missing filter key', async () => {
		const result = render(CreateUpdateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.getByText('Key is required')).toBeDefined();
	});

	it('validate missing filter value', async () => {
		const result = render(CreateUpdateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.getByText('Value is required')).toBeDefined();
	});

	it('validate invalid boolean', async () => {
		const result = render(CreateUpdateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'boolean' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.getByText('Invalid boolean value: use "true" or "false"')).toBeDefined();
	});

	it('validate invalid number', async () => {
		const result = render(CreateUpdateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'number' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.getByText('Invalid number')).toBeDefined();
	});

	it('validate duplicated key', async () => {
		const result = render(CreateUpdateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.queryAllByPlaceholderText('Key')[1], {
			target: { value: 'my-key' }
		});
		await fireEvent.input(result.queryAllByPlaceholderText('Value')[1], {
			target: { value: 'bar' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.getByText('Duplicated key')).toBeDefined();
	});

	it('create dataset with string filter', async () => {
		const createDatasetCallback = vi.fn();
		const result = render(CreateUpdateDatasetModal, {
			props: { createDatasetCallback, updateDatasetCallback: vi.fn() }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: '/tmp' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'my-value' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					read_only: false,
					zarr_dir: '/tmp',
					filters: { 'my-key': 'my-value' }
				})
			})
		);
	});

	it('create dataset with boolean filter', async () => {
		const createDatasetCallback = vi.fn();
		const result = render(CreateUpdateDatasetModal, {
			props: { createDatasetCallback, updateDatasetCallback: vi.fn() }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: '/tmp' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'true' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'boolean' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					read_only: false,
					zarr_dir: '/tmp',
					filters: { 'my-key': true }
				})
			})
		);
	});

	it('create dataset with number filter', async () => {
		const createDatasetCallback = vi.fn();
		const result = render(CreateUpdateDatasetModal, {
			props: { createDatasetCallback, updateDatasetCallback: vi.fn() }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: '/tmp' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Add filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: '123' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'number' } });
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					read_only: false,
					zarr_dir: '/tmp',
					filters: { 'my-key': 123 }
				})
			})
		);
	});
});
