import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mocking fetch
global.fetch = vi.fn();

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			params: {
				projectId: 1
			},
			data: {
				userInfo: {
					project_dirs: ['/path/to/proj/dir1', '/path/to/proj/dir2']
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

import CreateDatasetModal from '../../src/lib/components/v2/projects/datasets/CreateDatasetModal.svelte';

const defaultProps = {
	props: {
		project: /** @type {import("fractal-components/types/api").ProjectV2} */ ({
			id: 1,
			name: 'My Project'
		}),
		createDatasetCallback: vi.fn()
	}
};

function mockFetch() {
	/** @type {import('vitest').Mock} */ (fetch).mockImplementation(() => ({
		ok: true,
		status: 200,
		json: () =>
			new Promise((resolve) => {
				resolve({
					id: 1
				});
			})
	}));
}

describe('CreateDatasetModal', () => {
	beforeEach(() => {
		/** @type {import('vitest').Mock} */ (fetch).mockClear();
	});

	it('validate missing name', async () => {
		const user = userEvent.setup();
		mockFetch();
		const result = render(CreateDatasetModal, defaultProps);
		await user.click(result.getByRole('button', { name: 'Save' }));
		expect(result.queryAllByText('Required field').length).eq(1);
	});

	it('validate absolute zarr subfolder', async () => {
		const user = userEvent.setup();
		mockFetch();
		const result = render(CreateDatasetModal, defaultProps);
		await user.click(result.getByRole('button', { name: 'Save' }));
		await user.type(result.getByRole('textbox', { name: 'Zarr subfolder' }), '/my_subfolder');
		expect(result.queryAllByText('Zarr subfolder must be a relative path').length).eq(1);
	});

	it('create dataset specifying Zarr subfolder', async () => {
		const user = userEvent.setup();
		mockFetch();
		const result = render(CreateDatasetModal, defaultProps);
		await user.type(result.getByRole('textbox', { name: 'Dataset Name' }), 'my dataset');
		await user.type(result.getByRole('textbox', { name: 'Zarr subfolder' }), 'my_subfolder');
		expect(await result.findByText('/path/to/proj/dir1/my_subfolder')).toBeVisible();
		await user.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenLastCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					project_dir: '/path/to/proj/dir1',
					zarr_subfolder: 'my_subfolder'
				})
			})
		);
	});

	it('create dataset selecting the second project dir', async () => {
		const user = userEvent.setup();
		mockFetch();
		const result = render(CreateDatasetModal, defaultProps);
		await user.type(result.getByRole('textbox', { name: 'Dataset Name' }), 'my dataset');
		await user.selectOptions(result.getByRole('combobox', { name: 'Project directory' }), [
			'/path/to/proj/dir2'
		]);
		await user.type(result.getByRole('textbox', { name: 'Zarr subfolder' }), 'my_subfolder');
		expect(await result.findByText('/path/to/proj/dir2/my_subfolder')).toBeVisible();
		await user.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenLastCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					project_dir: '/path/to/proj/dir2',
					zarr_subfolder: 'my_subfolder'
				})
			})
		);
	});

	it('create dataset without specifying zarr subfolder', async () => {
		const user = userEvent.setup();
		mockFetch();
		const result = render(CreateDatasetModal, defaultProps);
		await user.type(result.getByRole('textbox', { name: 'Dataset Name' }), 'my dataset');
		expect(
			await result.findByText('/path/to/proj/dir1/fractal/1_my_project/{dataset_id}_my_dataset')
		).toBeVisible();
		await user.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenLastCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					project_dir: '/path/to/proj/dir1'
				})
			})
		);
	});

	it('validate missing dataset name', async () => {
		const user = userEvent.setup();
		const result = render(CreateDatasetModal, defaultProps);
		await user.click(result.getByRole('button', { name: 'Save' }));
		expect(result.queryAllByText('Required field').length).eq(1);
	});

	it('display validation errors from server', async () => {
		const user = userEvent.setup();

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValueOnce({
			ok: false,
			status: 422,
			json: async () => ({
				detail: [
					{
						loc: ['body', 'name'],
						msg: 'validation error 1',
						type: 'value_error'
					},
					{
						loc: ['body', 'project_dir'],
						msg: 'validation error 2',
						type: 'value_error'
					},
					{
						loc: ['body', 'zarr_subfolder'],
						msg: 'validation error 3',
						type: 'value_error'
					}
				]
			})
		});

		const result = render(CreateDatasetModal, defaultProps);
		await user.type(result.getByRole('textbox', { name: 'Dataset Name' }), 'my dataset');
		await user.type(result.getByRole('textbox', { name: 'Zarr subfolder' }), 'foo');
		await user.click(result.getByRole('button', { name: 'Save' }));
		expect(fetch).toHaveBeenLastCalledWith(
			'/api/v2/project/1/dataset',
			expect.objectContaining({
				body: JSON.stringify({
					name: 'my dataset',
					project_dir: '/path/to/proj/dir1',
					zarr_subfolder: 'foo'
				})
			})
		);
		expect(await result.findByText(/validation error 1/)).toBeVisible();
		expect(await result.findByText(/validation error 2/)).toBeVisible();
		expect(await result.findByText(/validation error 3/)).toBeVisible();
	});
});
