import { describe, it, expect } from 'vitest';
import { renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/svelte';

describe('oneOf properties', () => {
	it('oneOf property', async () => {
		const user = userEvent.setup();

		const { component, onChange } = renderSchema(
			{
				$defs: {
					ProcessAModel: {
						description: 'A process model with the same parameter name as ProcessBModel.',
						properties: {
							step: {
								const: 'ProcessA',
								title: 'Step',
								type: 'string',
								description: 'A literal to identify the process type.'
							},
							parameter1: {
								title: 'Parameter1',
								type: 'number',
								description: 'An integer parameter in A.'
							}
						},
						required: ['step', 'parameter1'],
						title: 'ProcessAModel',
						type: 'object'
					},
					ProcessBModel: {
						description: 'B process model with the same parameter name as ProcessAModel.',
						properties: {
							step: {
								const: 'ProcessB',
								title: 'Step',
								type: 'string',
								description: 'A literal to identify the process type.'
							},
							parameter1: {
								title: 'Parameter1',
								type: 'number',
								description: 'An integer parameter in B.'
							}
						},
						required: ['step', 'parameter1'],
						title: 'ProcessBModel',
						type: 'object'
					}
				},
				additionalProperties: false,
				properties: {
					proc_step: {
						discriminator: {
							mapping: {
								ProcessA: '#/$defs/ProcessAModel',
								ProcessB: '#/$defs/ProcessBModel'
							},
							propertyName: 'step'
						},
						oneOf: [
							{
								$ref: '#/$defs/ProcessAModel'
							},
							{
								$ref: '#/$defs/ProcessBModel'
							}
						],
						title: 'Proc Step',
						description: 'The processing step to apply.'
					}
				},
				required: ['proc_step'],
				type: 'object',
				title: 'ProcessTask'
			},
			'pydantic_v2',
			{
				proc_step: {
					step: 'ProcessB',
					parameter1: 1
				}
			}
		);

		const select = await screen.findByRole('combobox');
		expect(select).toHaveValue('1');
		expect(screen.getByRole('textbox', { name: 'Step' })).toHaveValue('ProcessB');
		expect(screen.getByRole('spinbutton')).toHaveValue(1);
		expect(component.getArguments()).deep.eq({
			proc_step: {
				step: 'ProcessB',
				parameter1: 1
			}
		});

		await user.selectOptions(select, 'ProcessAModel');
		expect(onChange).toHaveBeenCalledWith({
			proc_step: {
				step: 'ProcessA',
				parameter1: null
			}
		});
		expect(screen.getByRole('textbox', { name: 'Step' })).toHaveValue('ProcessA');
		expect(screen.getByRole('spinbutton')).toHaveValue(null);
		expect(component.getArguments()).deep.eq({
			proc_step: {
				step: 'ProcessA',
				parameter1: null
			}
		});
	});
});
