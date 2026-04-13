import { describe, it, expect } from 'vitest';
import { renderSchema } from './property_test_utils';
import { screen } from '@testing-library/svelte';

describe('anyOf properties', () => {
	it('Nullable property should use parent title and description', async () => {
		const { component } = renderSchema(
			{
				$defs: {
					SimpleModel: {
						type: 'object',
						title: 'SimpleModel',
						description: 'Description of `SimpleModel`.',
						properties: {
							foo: { type: 'string' }
						}
					}
				},
				type: 'object',
				properties: {
					nullable_arg_with_null_default: {
						anyOf: [{ $ref: '#/$defs/SimpleModel' }, { type: 'null' }],
						default: null,
						title: 'Nullable Arg With Null Default',
						description: 'Type hint SimpleModel | None = None'
					}
				}
			},
			'fractal_schema_v1'
		);

		expect(component.getArguments()).deep.eq({
			nullable_arg_with_null_default: null
		});

		expect(screen.getByText('Nullable Arg With Null Default')).toBeVisible();
		expect(screen.getByLabelText('Description').getAttribute('data-bs-content')).eq(
			'Type hint SimpleModel | None = None'
		);
	});
});
