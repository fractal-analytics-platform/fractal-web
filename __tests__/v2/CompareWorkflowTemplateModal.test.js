import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// Mocking fetch
global.fetch = vi.fn();

import CompareWorkflowTemplateModal from '../../src/lib/components/v2/workflow/CompareWorkflowTemplateModal.svelte';

const workflow = /** @type {import('fractal-components/types/api').WorkflowV2} */ ({
	id: 1,
	project_id: 1,
	template_id: 1
});

describe('CompareWorkflowTemplateModal', () => {
	it('Exact match', async () => {
		await mockDiff(
			{
				data: { task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }] }
			},
			{
				task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }]
			}
		);

		expect(screen.getByText(/Non-parallell arguments match/)).toBeVisible();
		expect(screen.getByText(/Parallell arguments match/)).toBeVisible();
	});

	it('Different pkg_name', async () => {
		await mockDiff(
			{
				data: { task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }] }
			},
			{
				task_list: [{ task: { pkg_name: 'p2', name: 't1', version: '0.0.1' } }]
			}
		);

		expectText('Template: p1, 0.0.1, t1');
		expectText('Workflow: p2, 0.0.1, t1');
	});

	it('Different version', async () => {
		await mockDiff(
			{
				data: { task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }] }
			},
			{
				task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.2' } }]
			}
		);

		expectText('Template: p1, 0.0.1, t1');
		expectText('Workflow: p1, 0.0.2, t1');
	});

	it('Different task name', async () => {
		await mockDiff(
			{
				data: { task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }] }
			},
			{
				task_list: [{ task: { pkg_name: 'p1', name: 't2', version: '0.0.1' } }]
			}
		);

		expect(screen.getByText(/t1 \/ t2/)).toBeVisible();
		expectText('Template: p1, 0.0.1, t1');
		expectText('Workflow: p1, 0.0.1, t2');
	});

	it('Missing task in template', async () => {
		await mockDiff(
			{
				data: { task_list: [] }
			},
			{
				task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }]
			}
		);

		expectText('Template: not defined');
		expectText('Workflow: p1, 0.0.1, t1');
	});

	it('Missing task in workflow', async () => {
		await mockDiff(
			{
				data: { task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }] }
			},
			{
				task_list: []
			}
		);

		expectText('Template: p1, 0.0.1, t1');
		expectText('Workflow: not defined');
	});

	it('Different args_non_parallel', async () => {
		const container = await mockDiff(
			{
				data: {
					task_list: [
						{
							task: { pkg_name: 'p1', name: 't1', version: '0.0.1' },
							args_non_parallel: { a: 'foo' },
							args_parallel: null
						}
					]
				}
			},
			{
				task_list: [
					{
						task: { pkg_name: 'p1', name: 't1', version: '0.0.1' },
						args_non_parallel: { a: 'bar' },
						args_parallel: {}
					}
				]
			}
		);

		expect(screen.getByText(/Parallell arguments match/)).toBeVisible();
		expect(container.querySelector('json-diff-viewer')).not.toBeNull();
	});

	it('Different args_parallel', async () => {
		const container = await mockDiff(
			{
				data: {
					task_list: [
						{
							task: { pkg_name: 'p1', name: 't1', version: '0.0.1' },
							args_non_parallel: {},
							args_parallel: { a: 'foo' }
						}
					]
				}
			},
			{
				task_list: [
					{
						task: { pkg_name: 'p1', name: 't1', version: '0.0.1' },
						args_non_parallel: null,
						args_parallel: { a: 'bar' }
					}
				]
			}
		);

		expect(screen.getByText(/Non-parallell arguments match/)).toBeVisible();
		expect(container.querySelector('json-diff-viewer')).not.toBeNull();
	});

	it('Error loading template', async () => {
		const { component } = render(CompareWorkflowTemplateModal, { props: { workflow } });
		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValueOnce({
			ok: false,
			json: () => new Promise((resolve) => resolve({ detail: 'error loading template' }))
		});
		await component.loadTemplate();
		expect(screen.getByText(/error loading template/)).toBeVisible();
	});

	it('Error loading workflow', async () => {
		const { component } = render(CompareWorkflowTemplateModal, { props: { workflow } });

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValueOnce({
			ok: true,
			json: () =>
				new Promise((resolve) =>
					resolve({
						data: {
							task_list: [{ task: { pkg_name: 'p1', name: 't1', version: '0.0.1' } }]
						}
					})
				)
		});

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValueOnce({
			ok: false,
			json: () => new Promise((resolve) => resolve({ detail: 'error loading workflow' }))
		});

		await component.loadTemplate();
		expect(screen.getByText(/error loading workflow/)).toBeVisible();
	});
});

/**
 * @param {object} payload1
 * @param {object} payload2
 */
async function mockDiff(payload1, payload2) {
	const { component, container } = render(CompareWorkflowTemplateModal, { props: { workflow } });

	/** @type {import('vitest').Mock} */ (fetch).mockResolvedValueOnce({
		ok: true,
		json: () => new Promise((resolve) => resolve(payload1))
	});

	/** @type {import('vitest').Mock} */ (fetch).mockResolvedValueOnce({
		ok: true,
		json: () => new Promise((resolve) => resolve(payload2))
	});

	await component.loadTemplate();
	return container;
}

/**
 * @param {string} text string that may be split in multiple HTML tags
 */
function expectText(text) {
	expect(screen.getByText((_, element) => element?.textContent === text)).toBeInTheDocument();
}
