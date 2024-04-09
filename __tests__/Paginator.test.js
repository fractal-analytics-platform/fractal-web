import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

import Paginator from '../src/lib/components/common/Paginator.svelte';

describe('Paginator', () => {
	it('display without ellipsis', () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 70, currentPage: 4, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual(['«', '1', '2', '3', '4', '5', '6', '7', '»']);
	});
	it('display ellipsis at beginning', () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 1000, currentPage: 99, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual(['«', '1', '...', '96', '97', '98', '99', '100', '»']);
	});
	it('display ellipsis at end', () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 1000, currentPage: 2, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual(['«', '1', '2', '3', '4', '5', '...', '100', '»']);
	});
	it('display ellipsis both at beginning and end', () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 1000, currentPage: 50, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual([
			'«',
			'1',
			'...',
			'47',
			'48',
			'49',
			'50',
			'51',
			'52',
			'53',
			'...',
			'100',
			'»'
		]);
	});
	it('omit ellipsis at end bewteen consecutive numbers', () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 70, currentPage: 3, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual(['«', '1', '2', '3', '4', '5', '6', '7', '»']);
	});
	it('omit ellipsis at begninning bewteen consecutive numbers', () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 70, currentPage: 5, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual(['«', '1', '2', '3', '4', '5', '6', '7', '»']);
	});
	it('go to previous page', async () => {
		const onPageChange = vi.fn();
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 100, currentPage: 3, onPageChange }
		});
		await fireEvent.click(result.getByLabelText('Previous'));
		expect(onPageChange).toHaveBeenCalledWith(2, 10);
	});
	it('go to next page', async () => {
		const onPageChange = vi.fn();
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 100, currentPage: 3, onPageChange }
		});
		await fireEvent.click(result.getByLabelText('Next'));
		expect(onPageChange).toHaveBeenCalledWith(4, 10);
	});
	it('change page size', async () => {
		const onPageChange = vi.fn();
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 100, currentPage: 3, onPageChange }
		});
		await fireEvent.change(result.getByRole('combobox'), { target: { value: '50' } });
		await fireEvent.click(result.getByLabelText('Next'));
		expect(onPageChange).toHaveBeenCalledWith(1, 50);
	});
	it('hide pages if total results is zero', async () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 0, currentPage: 3, onPageChange: () => {} }
		});
		expect(result.queryByLabelText('Previous')).toBeNull();
	});
	it('previous is disabled on first page', async () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 3, currentPage: 1, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual(['«', '1', '»']);
		expect(result.queryByLabelText('Previous').disabled).true;
	});
	it('next is disabled on last page', async () => {
		const result = render(Paginator, {
			props: { pageSize: 10, totalCount: 3, currentPage: 1, onPageChange: () => {} }
		});
		expect(getPageItems(result)).toEqual(['«', '1', '»']);
		expect(result.queryByLabelText('Next').disabled).true;
	});
});

/**
 *
 * @param {import('@testing-library/svelte').RenderResult} result
 */
function getPageItems(result) {
	const itemElements = result.getByRole('list').querySelectorAll('.page-item');
	const items = [];
	for (const element of itemElements) {
		if (element instanceof HTMLElement && element.textContent) {
			items.push(element.textContent.trim());
		}
	}
	return items;
}
