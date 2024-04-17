import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

import FiltersCreationForm from '../../src/lib/components/v2/projects/datasets/FiltersCreationForm.svelte';
import { tick } from 'svelte';

describe('FiltersCreationForm', () => {
	it('init with existing filters', async () => {
		const result = render(FiltersCreationForm);
		result.component.init(
			{
				key1: 'value1',
				key2: 42
			},
			{
				key3: true
			}
		);
		await tick();
		const keys = result.queryAllByPlaceholderText('Key').map((e) => e.value);
		expect(keys.length).eq(3);
		expect(keys[0]).eq('key1');
		expect(keys[1]).eq('key2');
		expect(keys[2]).eq('key3');
		const values = result.queryAllByPlaceholderText('Value').map((e) => e.value);
		expect(values.length).eq(2);
		expect(values[0]).eq('value1');
		expect(values[1]).eq('42');
	});

	it('add and remove attribute filter', async () => {
		const result = render(FiltersCreationForm);
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(1);
		await fireEvent.click(result.getByRole('button', { name: 'Remove attribute filter' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
	});

	it('add and remove type filter', async () => {
		const result = render(FiltersCreationForm);
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
		await fireEvent.click(result.getByRole('button', { name: 'Add type filter' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(1);
		await fireEvent.click(result.getByRole('button', { name: 'Remove type filter' }));
		expect(result.queryAllByPlaceholderText('Key').length).eq(0);
	});

	it('validate missing attribute filter key', async () => {
		const result = render(FiltersCreationForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Key is required')).toBeDefined();
	});

	it('validate missing attribute filter value', async () => {
		const result = render(FiltersCreationForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Value is required')).toBeDefined();
	});

	it('validate invalid number', async () => {
		const result = render(FiltersCreationForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'number' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Invalid number')).toBeDefined();
	});

	it('switch to boolean attribute', async () => {
		const result = render(FiltersCreationForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.change(result.getByLabelText('Type'), { target: { value: 'boolean' } });
		expect(result.getByLabelText('Value').value).eq('true');
		expect(result.component.validateFields()).true;
	});

	it('validate duplicated attribute key', async () => {
		const result = render(FiltersCreationForm);
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.input(result.getByPlaceholderText('Value'), { target: { value: 'foo' } });
		await fireEvent.click(result.getByRole('button', { name: 'Add attribute filter' }));
		await fireEvent.input(result.queryAllByPlaceholderText('Key')[1], {
			target: { value: 'my-key' }
		});
		await fireEvent.input(result.queryAllByPlaceholderText('Value')[1], {
			target: { value: 'bar' }
		});
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Duplicated key')).toBeDefined();
	});

	it('validate missing type filter key', async () => {
		const result = render(FiltersCreationForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add type filter' }));
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Key is required')).toBeDefined();
	});

	it('validate duplicated type filter key', async () => {
		const result = render(FiltersCreationForm);
		result.component.init({}, {});
		await fireEvent.click(result.getByRole('button', { name: 'Add type filter' }));
		await fireEvent.input(result.getByPlaceholderText('Key'), { target: { value: 'my-key' } });
		await fireEvent.click(result.getByRole('button', { name: 'Add type filter' }));
		await fireEvent.input(result.queryAllByPlaceholderText('Key')[1], {
			target: { value: 'my-key' }
		});
		expect(result.component.validateFields()).false;
		await tick();
		expect(result.getByText('Duplicated key')).toBeDefined();
	});
});
