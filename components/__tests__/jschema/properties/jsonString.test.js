import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import { renderSchema } from './property_test_utils';
import userEvent from '@testing-library/user-event';

describe('JSON string properties', () => {
	it('JSON string', async () => {
		const user = userEvent.setup();
		const { component } = renderSchema(
			{
				$defs: {
					JsonChild: {
						type: 'object',
						properties: {
							foo: {
								type: 'string'
							},
							bar: {
								type: 'number'
							}
						},
						required: ['foo', 'bar']
					}
				},
				type: 'object',
				properties: {
					test: {
						type: 'object',
						properties: {
							json_prop: {
								contentMediaType: 'application/json',
								contentSchema: {
									$ref: '#/$defs/JsonChild'
								},
								type: 'string'
							}
						}
					}
				}
			},
			'fractal_schema_v1',
			{ test: { json_prop: '{"foo": "xxx", "bar": 1}' } }
		);

		expect(component.getArguments()).deep.eq({ test: { json_prop: '{"foo": "xxx", "bar": 1}' } });
		expect(component.isValid()).toEqual(true);

		await user.clear(screen.getByRole('textbox'));
		await user.type(screen.getByRole('textbox'), 'xxx');
		expect(component.isValid()).toEqual(false);

		await user.clear(screen.getByRole('textbox'));
		// See https://testing-library.com/docs/user-event/keyboard/
		await user.type(screen.getByRole('textbox'), '{\\{}"foo": "aaa", "bar": 2{\\}}');
		expect(component.isValid()).toEqual(true);

		await user.clear(screen.getByRole('textbox'));
		// See https://testing-library.com/docs/user-event/keyboard/
		await user.type(screen.getByRole('textbox'), '{\\{}"foo": "xxx"{\\}}');
		expect(component.isValid()).toEqual(false);
		expect(component.getArguments()).deep.eq({ test: { json_prop: '{"foo": "xxx"}' } });
	});
});
