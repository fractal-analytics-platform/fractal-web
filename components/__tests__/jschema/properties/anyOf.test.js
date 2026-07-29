import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderSchema } from './property_test_utils';
import { screen } from '@testing-library/svelte';

describe('anyOf properties', () => {
	it('Nullable object', async () => {
		const user = userEvent.setup();
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

		// Should use parent title and description
		expect(screen.getByText('Nullable Arg With Null Default')).toBeVisible();
		expect(screen.getByLabelText('Description').getAttribute('data-bs-content').trim()).eq(
			'<p>Type hint SimpleModel | None = None</p>'
		);

		await user.click(screen.getByRole('switch', { name: 'Set' }));

		expect(component.getArguments()).deep.eq({
			nullable_arg_with_null_default: { foo: null }
		});
	});
});
