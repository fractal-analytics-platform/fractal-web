import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/svelte';
import {
	checkBold,
	renderSchemaWithSingleProperty,
	renderSchemaWithReferencedProperty,
	renderSchema
} from './property_test_utils';

describe('Enum properties', () => {
	it('Required EnumProperty with title', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				title: 'Enum title',
				enum: ['option1', 'option2'],
				type: 'string'
			},
			'pydantic_v1',
			true
		);
		checkBold(screen.getByText('Enum title'), true);
		const combobox = screen.getByRole('combobox', { name: 'Enum title' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('Optional EnumProperty without title', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				enum: ['option1', 'option2'],
				type: 'string'
			},
			'pydantic_v1'
		);
		checkBold(screen.getByText('testProp'), false);
		const combobox = screen.getByRole('combobox', { name: 'testProp' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('EnumProperty referenced', async () => {
		const { component, onChange } = renderSchemaWithReferencedProperty(
			{
				enum: ['option1', 'option2'],
				type: 'string'
			},
			'pydantic_v2'
		);
		checkBold(screen.getByText('testProp'), false);
		const combobox = screen.getByRole('combobox', { name: 'testProp' });
		const options = combobox.querySelectorAll('option');
		expect(options[0].text).eq('Select...');
		expect(options[1].value).eq('option1');
		expect(options[2].value).eq('option2');
		expect(component.getArguments()).deep.eq({ testProp: null });

		await fireEvent.change(combobox, { target: { value: 'option2' } });
		expect(onChange).toHaveBeenCalledWith({ testProp: 'option2' });
	});

	it('enum without type', async () => {
		const { component, onChange } = renderSchema(
			{
				title: 'TaskFunction2',
				type: 'object',
				properties: {
					arg2: {
						$ref: '#/definitions/Color',
						title: 'Arg2',
						description: 'Description of arg2.'
					}
				},
				required: ['arg2'],
				additionalProperties: false,
				definitions: {
					Color: {
						title: 'Color',
						description: 'An enumeration.',
						enum: [1, 2]
					}
				}
			},
			'pydantic_v1'
		);

		const dropdowns = screen.getAllByRole('combobox');
		expect(dropdowns.length).eq(1);
		const dropdown = /** @type {HTMLSelectElement} */ (dropdowns[0]);
		expect(dropdown.options.length).eq(3);
		expect(dropdown.options[0].text).eq('Select...');
		expect(dropdown.options[1].text).eq('1');
		expect(dropdown.options[2].text).eq('2');

		expect(component.getArguments()).deep.eq({ arg2: null });

		await fireEvent.change(dropdown, { target: { value: '1' } });
		expect(onChange).toHaveBeenCalledWith({ arg2: 1 });
	});

	it('Enum initialized with invalid value', async () => {
		const { component } = renderSchema(
			{
				type: 'object',
				properties: {
					k: {
						enum: ['A', 'B']
					}
				},
			},
			'pydantic_v2',
			{ k: 'C' }
		);

		expect(component.getArguments()).deep.eq({ k: 'C' });
		expect(screen.queryAllByText('must be equal to one of the allowed values')).toHaveLength(1);
		expect(component.valid).toEqual(false);
	});
});
