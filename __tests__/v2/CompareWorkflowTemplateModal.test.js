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
				data: {
					task_list: [
						{
							task: { pkg_name: 'p1', name: 't1', version: '0.0.1' },
							args_parallel: { x: 1 },
							args_non_parallel: { y: 2 }
						}
					]
				}
			},
			{
				task_list: [
					{
						task: { pkg_name: 'p1', name: 't1', version: '0.0.1' },
						args_parallel: { x: 1 },
						args_non_parallel: { y: 2 }
					}
				]
			}
		);

		expect(await screen.findByText(/Non-parallel arguments match/)).toBeVisible();
		expect(await screen.findByText(/Parallel arguments match/)).toBeVisible();
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

		await expectText('Template: p1, 0.0.1, t1');
		await expectText('Workflow: p2, 0.0.1, t1');
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

		await expectText('Template: p1, 0.0.1, t1');
		await expectText('Workflow: p1, 0.0.2, t1');
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

		expect(await screen.findByText(/t1 \/ t2/)).toBeVisible();
		await expectText('Template: p1, 0.0.1, t1');
		await expectText('Workflow: p1, 0.0.1, t2');
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

		await expectText('Template: not defined');
		await expectText('Workflow: p1, 0.0.1, t1');
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

		await expectText('Template: p1, 0.0.1, t1');
		await expectText('Workflow: not defined');
	});

	it('Different args_non_parallel', async () => {
		await mockDiff(
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

		expect(screen.findByTestId(`non-parallel-0`)).not.toBeNull();
	});

	it('Different args_parallel', async () => {
		await mockDiff(
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

		expect(screen.findByTestId(`parallel-0`)).not.toBeNull();
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
async function expectText(text) {
	expect(
		await screen.findByText((_, element) => element?.textContent === text)
	).toBeInTheDocument();
}
