import { describe, it, expect } from 'vitest';
import { renderSchema } from './property_test_utils';
import { screen } from '@testing-library/svelte';

describe('allOf properties', () => {
	it('allOf property with single $ref', async () => {
		const { component } = renderSchema({
			title: 'TaskFunction3',
			type: 'object',
			properties: {
				normalizer: {
					title: 'Normalizer',
					default: {
						type: 'B'
					},
					allOf: [
						{
							$ref: '#/definitions/Normalizer'
						}
					]
				}
			},
			additionalProperties: false,
			definitions: {
				Normalizer: {
					title: 'Normalizer',
					type: 'object',
					properties: {
						type: {
							title: 'Type',
							enum: ['A', 'B'],
							type: 'string'
						}
					}
				}
			}
		});

		const dropdown = screen.getByRole('combobox');
		expect(dropdown.options.length).eq(3);
		expect(dropdown.options[0].text).eq('Select...');
		expect(dropdown.options[1].text).eq('A');
		expect(dropdown.options[2].text).eq('B');
		expect(dropdown.value).eq('B');

		expect(component.getArguments()).deep.eq({ normalizer: { type: 'B' } });
	});

	it('allOf property with multiple $ref', async () => {
		const { component } = renderSchema({
			title: 'TaskFunction3',
			type: 'object',
			properties: {
				normalizer: {
					title: 'Normalizer',
					default: {
						type1: 'A',
						type2: 'C'
					},
					allOf: [{ $ref: '#/definitions/Normalizer1' }, { $ref: '#/definitions/Normalizer2' }]
				}
			},
			additionalProperties: false,
			definitions: {
				Normalizer1: {
					title: 'Normalizer1',
					type: 'object',
					properties: {
						type1: {
							title: 'Type1',
							default: 'A',
							enum: ['A', 'B'],
							type: 'string'
						}
					}
				},
				Normalizer2: {
					title: 'Normalizer2',
					type: 'object',
					properties: {
						type2: {
							title: 'Type2',
							default: 'D',
							enum: ['C', 'D'],
							type: 'string'
						}
					}
				}
			}
		});

		const dropdowns = screen.getAllByRole('combobox');
		expect(dropdowns.length).eq(2);
		const [dropdown1, dropdown2] = dropdowns;
		expect(dropdown1.options.length).eq(3);
		expect(dropdown1.options[0].text).eq('Select...');
		expect(dropdown1.options[1].text).eq('A');
		expect(dropdown1.options[2].text).eq('B');
		expect(dropdown1).toHaveValue('A');
		expect(dropdown2.options[0].text).eq('Select...');
		expect(dropdown2.options[1].text).eq('C');
		expect(dropdown2.options[2].text).eq('D');
		expect(dropdown2).toHaveValue('C');

		expect(component.getArguments()).deep.eq({ normalizer: { type1: 'A', type2: 'C' } });
	});

	it('allOf property with multiple inline schemas', async () => {
		const { component } = renderSchema({
			title: 'allOf test',
			type: 'object',
			properties: {
				myNumber: {
					title: 'My Number',
					allOf: [
						{ type: 'number', minimum: 5 },
						{ type: 'number', maximum: 10 }
					]
				}
			}
		});

		const input = screen.getByRole('spinbutton');
		expect(input.getAttribute('min')).eq('5');
		expect(input.getAttribute('max')).eq('10');

		expect(component.getArguments()).deep.eq({ myNumber: null });
	});
});
