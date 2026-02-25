import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { checkBold, renderSchemaWithSingleProperty, renderSchema } from './property_test_utils';
import { FormManager } from '../../../src/lib/jschema/form_manager';

describe('Array properties', () => {
	it('Optional ArrayProperty with default values', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				title: 'ArrayProperty',
				type: 'array',
				items: { type: 'string' },
				default: ['foo', 'bar']
			},
			'pydantic_v1',
			false
		);
		checkBold(screen.getByText('ArrayProperty'), false);
		const inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0]).toHaveValue('foo');
		expect(inputs[1]).toHaveValue('bar');
		expect(component.getArguments()).deep.eq({ testProp: ['foo', 'bar'] });
	});

	it('Required ArrayProperty with minItems and maxItems', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				title: 'ArrayProperty',
				type: 'array',
				items: { type: 'string' },
				minItems: 3,
				maxItems: 5
			},
			'pydantic_v1',
			true
		);
		checkBold(screen.getByText('ArrayProperty'), true);
		let inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(3);
		expect(screen.queryAllByRole('button', { name: 'Remove' })).toHaveLength(0);
		expect(component.getArguments()).deep.eq({ testProp: [null, null, null] });
		await fireEvent.input(inputs[0], { target: { value: 'foo' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: ['foo', null, null] });
		const addBtn = screen.getByRole('button', { name: 'Add argument to list' });
		expect(addBtn).not.toBeDisabled();
		await fireEvent.click(addBtn);
		expect(onChange).toHaveBeenCalledWith({ testProp: ['foo', null, null, null] });
		expect(screen.getAllByRole('button', { name: 'Remove' }).length).eq(4);
		await fireEvent.click(addBtn);
		inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(5);
		expect(onChange).toHaveBeenCalledWith({
			testProp: ['foo', null, null, null, null]
		});
		expect(addBtn).toBeDisabled();
	});

	it('Optional ArrayProperty with minItems and maxItems', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				title: 'ArrayProperty',
				type: 'array',
				items: { type: 'string' },
				minItems: 2,
				maxItems: 3
			},
			'pydantic_v1',
			false
		);
		checkBold(screen.getByText('ArrayProperty'), false);
		let inputs = screen.queryAllByRole('textbox');
		expect(inputs.length).eq(0);
		expect(component.getArguments()).deep.eq({ testProp: [] });
		const addBtn = screen.getByRole('button', { name: 'Add argument to list' });
		await fireEvent.click(addBtn);
		expect(onChange).toHaveBeenCalledWith({ testProp: [null] });
		await fireEvent.click(addBtn);
		expect(onChange).toHaveBeenCalledWith({ testProp: [null, null] });
		await fireEvent.click(addBtn);
		expect(onChange).toHaveBeenCalledWith({ testProp: [null, null, null] });
		expect(addBtn).toBeDisabled();
		await fireEvent.click(addBtn);
		inputs = screen.queryAllByRole('textbox');
		expect(inputs.length).eq(3);
		expect(component.getArguments()).deep.eq({ testProp: [null, null, null] });
	});

	it('Object with additional array property', async () => {
		const { component, onChange } = renderSchema(
			{
				title: 'Object with additionalProperties',
				type: 'object',
				properties: {
					testProp: {
						title: 'testProp',
						type: 'object',
						additionalProperties: {
							type: 'array',
							items: {
								$ref: '#/definitions/Ref'
							}
						}
					}
				},
				definitions: {
					Ref: {
						title: 'argument',
						type: 'object',
						properties: {
							required_string: {
								title: 'Required String',
								type: 'string'
							},
							optional_number: {
								title: 'Optional Number',
								type: 'integer'
							}
						},
						required: ['required_string']
					}
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: {} });
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'my-key' } });
		const addPropertyBtn = screen.getByRole('button', { name: 'Add property' });
		await fireEvent.click(addPropertyBtn);
		expect(onChange).toHaveBeenCalledWith({ testProp: { 'my-key': [] } });
		expect(screen.queryByText('my-key')).not.null;
		const accordionBtn1 = screen.getByRole('button', { name: 'my-key' });
		await fireEvent.click(accordionBtn1);
		const addArgumentBtn = screen.getByRole('button', { name: 'Add argument to list' });
		await fireEvent.click(addArgumentBtn);
		expect(onChange).toHaveBeenCalledWith({
			testProp: { 'my-key': [{ required_string: null, optional_number: null }] }
		});
		const accordionBtn2 = screen.getByRole('button', { name: 'argument' });
		await fireEvent.click(accordionBtn2);
		expect(screen.queryByText('Required String')).not.null;
		checkBold(screen.getByText('Required String'), true);
		checkBold(screen.getByText('Optional Number'), false);
		const removeArgumentBtn = screen.getByRole('button', { name: 'Remove' });
		await fireEvent.click(removeArgumentBtn);
		expect(onChange).toHaveBeenCalledWith({ testProp: { 'my-key': [] } });
		expect(screen.queryByText('Required String')).null;
		const removePropertyBtn = screen.getByRole('button', { name: 'Remove Property Block' });
		await fireEvent.click(removePropertyBtn);
		expect(screen.queryByText('my-key')).null;
		expect(onChange).toHaveBeenCalledWith({ testProp: {} });
	});

	it('add array element', async function () {
		const { component, onChange } = renderSchema(
			{
				title: 'test',
				type: 'object',
				properties: {
					test: {
						title: 'Array',
						type: 'array',
						items: {
							type: 'string'
						}
					}
				}
			},
			'pydantic_v1'
		);

		expect(component.getArguments()).deep.eq({ test: [] });
		expect(component.unsavedChanges).toEqual(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Add argument to list' }));
		expect(onChange).toHaveBeenCalledWith({ test: [null] });
		expect(component.unsavedChanges).toEqual(true);
	});

	it('remove array element', async function () {
		const { component, onChange } = renderSchema(
			{
				title: 'test',
				type: 'object',
				properties: {
					test: {
						title: 'Array',
						type: 'array',
						default: ['foo'],
						items: {
							type: 'string'
						}
					}
				}
			},
			'pydantic_v1'
		);

		expect(component.getArguments()).deep.eq({ test: ['foo'] });
		expect(component.unsavedChanges).toEqual(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
		expect(onChange).toHaveBeenCalledWith({ test: [] });
		expect(component.unsavedChanges).toEqual(true);
	});

	it('A list of numbers', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: [0, 1, 2],
				type: 'array',
				items: {
					type: 'integer'
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: [0, 1, 2] });
		const inputs = screen.getAllByRole('spinbutton');
		expect(inputs.length).eq(3);
		expect(inputs[0]).toHaveValue(0);
		expect(inputs[1]).toHaveValue(1);
		expect(inputs[2]).toHaveValue(2);
	});

	it('A list of strings', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: ['hello', 'this', 'test'],
				type: 'array',
				items: {
					type: 'string'
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: ['hello', 'this', 'test'] });
		const inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(3);
		expect(inputs[0]).toHaveValue('hello');
		expect(inputs[1]).toHaveValue('this');
		expect(inputs[2]).toHaveValue('test');
	});

	it('A list of booleans', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: [true, false, false],
				type: 'array',
				items: {
					type: 'boolean'
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: [true, false, false] });
		const inputs = screen.getAllByRole('switch');
		expect(inputs.length).eq(3);
		expect(inputs[0]).toBeChecked();
		expect(inputs[1]).not.toBeChecked();
		expect(inputs[2]).not.toBeChecked();
	});

	it('A nested list of integers', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: [[1, 2], [3, 4], [5], [6]],
				type: 'array',
				items: {
					type: 'array',
					items: {
						type: 'integer'
					}
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: [[1, 2], [3, 4], [5], [6]] });
		const inputs = screen.getAllByRole('spinbutton');
		expect(inputs.length).eq(6);
		expect(inputs[0]).toHaveValue(1);
		expect(inputs[1]).toHaveValue(2);
		expect(inputs[2]).toHaveValue(3);
		expect(inputs[3]).toHaveValue(4);
		expect(inputs[4]).toHaveValue(5);
		expect(inputs[5]).toHaveValue(6);
	});

	it('A nested list of integers', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: [[1, 2], [3, 4], [5], [6]],
				type: 'array',
				items: {
					type: 'array',
					items: {
						type: 'integer'
					}
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: [[1, 2], [3, 4], [5], [6]] });
		const inputs = screen.getAllByRole('spinbutton');
		expect(inputs.length).eq(6);
		expect(inputs[0]).toHaveValue(1);
		expect(inputs[1]).toHaveValue(2);
		expect(inputs[2]).toHaveValue(3);
		expect(inputs[3]).toHaveValue(4);
		expect(inputs[4]).toHaveValue(5);
		expect(inputs[5]).toHaveValue(6);
	});

	it('A nested list of strings', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: [['this', 'is'], ['a', 'list'], ['of'], ['strings']],
				type: 'array',
				items: {
					type: 'array',
					items: {
						type: 'string'
					}
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({
			testProp: [['this', 'is'], ['a', 'list'], ['of'], ['strings']]
		});
		const inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(6);
		expect(inputs[0]).toHaveValue('this');
		expect(inputs[1]).toHaveValue('is');
		expect(inputs[2]).toHaveValue('a');
		expect(inputs[3]).toHaveValue('list');
		expect(inputs[4]).toHaveValue('of');
		expect(inputs[5]).toHaveValue('strings');
	});

	it('A nested list of bools', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: [[true], [false]],
				type: 'array',
				items: {
					type: 'array',
					items: {
						type: 'boolean'
					}
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({
			testProp: [[true], [false]]
		});
		const inputs = screen.getAllByRole('switch');
		expect(inputs.length).eq(2);
		expect(inputs[0]).toBeChecked();
		expect(inputs[1]).not.toBeChecked();
	});

	it('A highly nested list', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: [[[0]]],
				type: 'array',
				items: {
					type: 'array',
					items: {
						type: 'array',
						items: {
							type: 'integer'
						}
					}
				}
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: [[[0]]] });
		const inputs = screen.getAllByRole('spinbutton');
		expect(inputs.length).eq(1);
		expect(inputs[0]).toHaveValue(0);
	});

	it('handles array path update when adding and removing children', () => {
		const formManager = new FormManager({
			type: 'object',
			properties: {
				foo: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							bar: { type: 'string' }
						},
						required: ['bar']
					}
				}
			}
		}, vi.fn(), 'pydantic_v2');

		const foo = formManager.root.children[0];

		foo.addChild();
		foo.addChild();
		foo.addChild();

		expect(foo.children.length).eq(3);

		expect(foo.children[0].path).eq('/foo/0');
		expect(foo.children[1].path).eq('/foo/1');
		expect(foo.children[2].path).eq('/foo/2');

		foo.removeChild(1)

		expect(foo.children.length).eq(2);

		expect(foo.children[0].path).eq('/foo/0');
		expect(foo.children[1].path).eq('/foo/1');
	});
});
