import { describe, it, expect } from 'vitest';
import { renderSchema } from './property_test_utils';
import { screen } from '@testing-library/svelte';

describe('Unsupported properties', () => {
	it('Show errors for unsupported properties', async () => {
		const schema = {
			type: 'object',
			properties: {
				foo: { type: 'string' },
				bar: { type: 'null' },
				baz: {
					type: 'object',
					properties: {
						foo2: { type: 'string' },
						bar2: { type: 'null' }
					}
				}
			}
		};

		const { component } = renderSchema(schema);

		expect(component.getArguments()).deep.eq({
			foo: null,
			bar: null,
			baz: {
				foo2: null,
				bar2: null
			}
		});

		expect(screen.getByText('Unsupported property at #/properties/bar')).toBeVisible();
		expect(
			screen.getByText('Unsupported property at #/properties/baz/properties/bar2')
		).toBeVisible();
	});
});
