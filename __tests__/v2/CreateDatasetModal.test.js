import { describe, it, beforeEach, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			params: {
				projectId: 1
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

import CreateDatasetModal from '../../src/lib/components/v2/projects/datasets/CreateDatasetModal.svelte';

const defaultProps = {
	props: { createDatasetCallback: vi.fn() }
};

/**
 * @param {string|null} project_dir
 */
function mockFetch(project_dir) {
	/** @type {import('vitest').Mock} */ (fetch).mockImplementation((url) => ({
		ok: true,
		status: 200,
		json: () =>
			new Promise((resolve) => {
				if (url === '/api/auth/current-user') {
					resolve({
						project_dir
					});
				} else {
					resolve({
						id: 1
					});
				}
			})
	}));
}

describe('CreateDatasetModal', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('validate missing name and zarr dir', async () => {
		mockFetch(null);
		const result = render(CreateDatasetModal, defaultProps);
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.queryAllByText('Required field').length).eq(2);
	});

	it('create dataset with string filter', async () => {
		mockFetch(null);
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
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenLastCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					zarr_dir: '/tmp'
				})
			})
		);
	});

	it('create dataset without specifying zarr dir', async () => {
		mockFetch('/path/to/zarr/dir');
		const createDatasetCallback = vi.fn();
		const result = render(CreateDatasetModal, {
			props: { createDatasetCallback }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenLastCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset'
				})
			})
		);
	});

	it('validate missing dataset name', async () => {
		mockFetch('/path/to/zarr/dir');
		const result = render(CreateDatasetModal, defaultProps);
		expect(await result.findByText('/path/to/zarr/dir')).toBeVisible();
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(result.queryAllByText('Required field').length).eq(1);
	});

	it('display invalid zarr dir error', async () => {
		/** @type {import('vitest').Mock} */ (fetch)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ project_dir: null })
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: async () => ({
					detail: [
						{
							loc: ['body', 'zarr_dir'],
							msg: "URLs must begin with '/' or 's3'.",
							type: 'value_error'
						}
					]
				})
			});

		const createDatasetCallback = vi.fn();
		const result = render(CreateDatasetModal, {
			props: { createDatasetCallback }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Dataset Name' }), {
			target: { value: 'my dataset' }
		});
		await fireEvent.input(result.getByRole('textbox', { name: 'Zarr dir' }), {
			target: { value: 'foo' }
		});
		await fireEvent.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenLastCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					zarr_dir: 'foo'
				})
			})
		);
		expect(await result.findByText(/URLs must begin with '\/' or 's3'/)).toBeVisible();
	});
});
