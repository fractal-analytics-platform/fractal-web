import { describe, it, expect } from 'vitest';
import { renderSchema, renderSchemaWithReferencedProperty } from './property_test_utils';
import { fireEvent, screen } from '@testing-library/svelte';

describe('Tuple properties', () => {
	it('optional tuple with default values', async function () {
		const { component, onChange } = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					default: [1300, 'foo', 1],
					type: 'array',
					minItems: 3,
					maxItems: 3,
					items: [
						{
							type: 'integer'
						},
						{
							type: 'string'
						},
						{
							type: 'integer'
						}
					]
				}
			}
		});

		expect(component.getArguments()).deep.eq({ patch_size: [1300, 'foo', 1] });

		let inputs = screen.getAllByRole('spinbutton');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('1300');
		expect(screen.getByRole('textbox').value).eq('foo');
		expect(inputs[1].value).eq('1');
		await fireEvent.input(inputs[0], { target: { value: '500' } });
		expect(onChange).toHaveBeenCalledWith({ patch_size: [500, 'foo', 1] });
		expect(inputs[0]).toHaveValue(500);
		const removeTupleBtn = screen.getByRole('button', { name: 'Remove tuple' });
		await fireEvent.click(removeTupleBtn);

		expect(onChange).toHaveBeenCalledWith({ patch_size: [] });

		expect(screen.queryAllByRole('spinbutton').length).eq(0);
		expect(screen.queryAllByRole('textbox').length).eq(0);
		const addTupleBtn = screen.getByRole('button', { name: 'Add tuple' });
		await fireEvent.click(addTupleBtn);

		// verify that value has been reset to default
		expect(onChange).toHaveBeenCalledWith({ patch_size: [1300, 'foo', 1] });
	});

	it('optional tuple without default values', async function () {
		const { component, onChange } = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					type: 'array',
					minItems: 2,
					maxItems: 2,
					items: [
						{
							type: 'string'
						},
						{
							type: 'string'
						}
					]
				}
			}
		});

		expect(component.getArguments()).deep.eq({ patch_size: [] });

		expect(screen.queryAllByRole('textbox').length).eq(0);
		await fireEvent.click(screen.getByRole('button', { name: 'Add tuple' }));
		let inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('');
		expect(inputs[1].value).eq('');

		expect(onChange).toHaveBeenCalledWith({ patch_size: [null, null] });

		await fireEvent.input(inputs[0], { target: { value: 'foo' } });
		expect(inputs[0].value).eq('foo');

		expect(onChange).toHaveBeenCalledWith({ patch_size: ['foo', null] });

		const removeTupleBtn = screen.getByRole('button', { name: 'Remove tuple' });
		await fireEvent.click(removeTupleBtn);
		expect(screen.queryAllByRole('textbox').length).eq(0);

		expect(onChange).toHaveBeenCalledWith({ patch_size: [] });

		await fireEvent.click(screen.getByRole('button', { name: 'Add tuple' }));
		inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq(''); // verify that value has been reset
		expect(inputs[1].value).eq('');

		expect(onChange).toHaveBeenCalledWith({ patch_size: [null, null] });
	});

	it('required tuple with default values', async function () {
		const { component, onChange } = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					default: [1300, 1500, 1],
					type: 'array',
					minItems: 3,
					maxItems: 3,
					items: [
						{
							type: 'integer'
						},
						{
							type: 'integer'
						},
						{
							type: 'integer'
						}
					]
				}
			},
			required: ['patch_size']
		});

		expect(component.getArguments()).deep.eq({ patch_size: [1300, 1500, 1] });

		const inputs = screen.getAllByRole('spinbutton');
		expect(inputs.length).eq(3);
		expect(inputs[0].value).eq('1300');
		expect(inputs[1].value).eq('1500');
		expect(inputs[2].value).eq('1');
		expect(screen.queryAllByRole('button', { name: 'Remove tuple' }).length).eq(0);
		await fireEvent.input(screen.getAllByRole('spinbutton')[0], { target: { value: 10 } });
		expect(onChange).toHaveBeenCalledWith({ patch_size: [10, 1500, 1] });
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		expect(onChange).toHaveBeenCalledWith({ patch_size: [1300, 1500, 1] });
	});

	it('required tuple without default values', async function () {
		const { component, onChange } = renderSchema({
			title: 'test',
			type: 'object',
			properties: {
				patch_size: {
					title: 'Patch Size',
					type: 'array',
					minItems: 2,
					maxItems: 2,
					items: [
						{
							type: 'string'
						},
						{
							type: 'string'
						}
					]
				}
			},
			required: ['patch_size']
		});

		expect(component.getArguments()).deep.eq({ patch_size: [null, null] });

		const inputs = screen.getAllByRole('textbox');
		expect(inputs.length).eq(2);
		expect(inputs[0].value).eq('');
		expect(inputs[1].value).eq('');
		expect(screen.queryAllByRole('button', { name: 'Remove tuple' }).length).eq(0);
		await fireEvent.input(inputs[0], { target: { value: 'foo' } });
		expect(inputs[0].value).eq('foo');
		expect(onChange).toHaveBeenCalledWith({ patch_size: ['foo', null] });
		expect(screen.queryAllByRole('button', { name: 'Reset' })).toHaveLength(0);
	});

	it('nested tuple', async function () {
		const { component, onChange } = renderSchema({
			title: 'TaskFunction',
			type: 'object',
			properties: {
				arg_A: {
					type: 'array',
					minItems: 1,
					maxItems: 1,
					items: [
						{
							type: 'array',
							minItems: 1,
							maxItems: 1,
							items: [
								{
									type: 'array',
									minItems: 1,
									maxItems: 1,
									items: [
										{
											type: 'string'
										}
									]
								}
							]
						}
					]
				}
			},
			required: ['arg_A'],
			additionalProperties: false
		});

		expect(component.getArguments()).deep.eq({ arg_A: [[]] });
		expect(component.unsavedChanges).toEqual(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Add tuple' }));
		expect(onChange).toHaveBeenCalledWith({ arg_A: [[[]]] });
		expect(component.unsavedChanges).toEqual(true);
		expect(screen.getAllByRole('button', { name: 'Remove tuple' }).length).toEqual(1);
		await fireEvent.click(screen.getByRole('button', { name: 'Add tuple' }));
		expect(onChange).toHaveBeenCalledWith({ arg_A: [[[null]]] });
		expect(screen.getAllByRole('button', { name: 'Remove tuple' }).length).toEqual(2);
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'foo' } });
		expect(onChange).toHaveBeenCalledWith({ arg_A: [[['foo']]] });
	});

	it('referenced tuple', async function () {
		const { component, onChange } = renderSchemaWithReferencedProperty({
			type: 'array',
			minItems: 1,
			maxItems: 1,
			items: [
				{
					type: 'array',
					minItems: 2,
					maxItems: 2,
					items: [{ type: 'string' }, { type: 'string' }]
				}
			]
		});

		expect(component.getArguments()).deep.eq({ testProp: [] });
		expect(component.unsavedChanges).toEqual(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Add tuple' }));
		expect(component.unsavedChanges).toEqual(true);
		expect(onChange).toHaveBeenCalledWith({ testProp: [[]] });
		await fireEvent.click(screen.getByRole('button', { name: 'Add tuple' }));
		expect(onChange).toHaveBeenCalledWith({ testProp: [[null, null]] });
		expect(screen.getAllByRole('textbox').length).eq(2);
	});
});
