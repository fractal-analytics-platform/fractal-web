import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { renderSchemaWithSingleProperty } from './property_test_utils';

describe('Reset properties to their default values', async () => {
	it('Reset object with default value on top-level property', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				type: 'object',
				default: { key1: { key2: 'foo' } },
				properties: { key1: { type: 'object', properties: { key2: { type: 'string' } } } },
				required: ['key1']
			},
			true
		);
		expect(component.getArguments()).deep.eq({ testProp: { key1: { key2: 'foo' } } });
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'bar' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: { key1: { key2: 'bar' } } });
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(onChange).toHaveBeenCalledWith({ testProp: { key1: { key2: 'foo' } } });
	});

	it('Object with default on nested object does not have the Reset button', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				type: 'object',
				properties: {
					key1: {
						type: 'object',
						default: { key2: 'foo' },
						properties: { key2: { type: 'string' } }
					}
				},
				required: ['key1']
			},
			'pydantic_v1',
			true
		);
		expect(component.getArguments()).deep.eq({ testProp: { key1: { key2: 'foo' } } });
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'bar' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: { key1: { key2: 'bar' } } });
		expect(screen.queryAllByRole('button', { name: 'Reset' })).toHaveLength(0);
	});

	it('Reset tuple with default value on top-level property', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				type: 'array',
				minItems: 2,
				maxItems: 2,
				items: [{ type: 'integer' }, { type: 'integer' }],
				default: [1, 2]
			},
			'pydantic_v1',
			true
		);
		expect(component.getArguments()).deep.eq({ testProp: [1, 2] });
		const [input1, input2] = screen.getAllByRole('spinbutton');
		expect(input1).toHaveValue(1);
		expect(input2).toHaveValue(2);
		await fireEvent.input(input1, { target: { value: '3' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: [3, 2] });
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(onChange).toHaveBeenCalledWith({ testProp: [1, 2] });
	});

	it('Tuple with default on nested items does not have the Reset button', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				type: 'array',
				minItems: 2,
				maxItems: 2,
				items: [
					{ type: 'integer', default: 1 },
					{ type: 'integer', default: 2 }
				]
			},
			'pydantic_v1',
			true
		);
		expect(component.getArguments()).deep.eq({ testProp: [1, 2] });
		const [input1, input2] = screen.getAllByRole('spinbutton');
		expect(input1).toHaveValue(1);
		expect(input2).toHaveValue(2);
		await fireEvent.input(input1, { target: { value: '3' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: [3, 2] });
		expect(screen.queryAllByRole('button', { name: 'Reset' })).toHaveLength(0);
	});

	it('Reset array with default value on top-level property', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				type: 'array',
				items: { type: 'string' },
				default: ['a', 'b']
			},
			'pydantic_v1',
			true
		);
		expect(component.getArguments()).deep.eq({ testProp: ['a', 'b'] });
		const [input1, input2] = screen.getAllByRole('textbox');
		expect(input1).toHaveValue('a');
		expect(input2).toHaveValue('b');
		await fireEvent.input(input1, { target: { value: 'x' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: ['x', 'b'] });
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(onChange).toHaveBeenCalledWith({ testProp: ['a', 'b'] });
	});

	it('Array with default on nested items does not have the Reset button', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				type: 'array',
				items: { type: 'string', default: 'a' },
				minItems: 2
			},
			'pydantic_v1',
			true
		);
		expect(component.getArguments()).deep.eq({ testProp: ['a', 'a'] });
		const [input1, input2] = screen.getAllByRole('textbox');
		expect(input1).toHaveValue('a');
		expect(input2).toHaveValue('a');
		await fireEvent.input(input1, { target: { value: 'x' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: ['x', 'a'] });
		expect(screen.queryAllByRole('button', { name: 'Reset' })).toHaveLength(0);
	});
});
