import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import {
	checkBold,
	renderSchemaWithSingleProperty,
	renderSchemaWithReferencedProperty,
	renderSchema
} from './property_test_utils';

describe('String properties', () => {
	it('Required StringProperty with title', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				title: 'String title',
				type: 'string'
			},
			'pydantic_v1',
			true
		);
		checkBold(screen.getByText('String title'), true);
		const textbox = screen.getByRole('textbox', { name: 'String title' });
		expect(textbox).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('Optional StringProperty without title', async () => {
		const { component } = renderSchemaWithSingleProperty({ type: 'string' }, 'pydantic_v1');
		checkBold(screen.getByText('testProp'), false);
		const textbox = screen.getByRole('textbox', { name: 'testProp' });
		expect(textbox).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('StringProperty referenced', async () => {
		const { component } = renderSchemaWithReferencedProperty({ type: 'string' }, 'pydantic_v2');
		checkBold(screen.getByText('testProp'), false);
		const textbox = screen.getByRole('textbox', { name: 'testProp' });
		expect(textbox).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('Empty strings always converted to null', async () => {
		const user = userEvent.setup();
		const { component } = renderSchema(
			{
				type: 'object',
				properties: {
					simple: { type: 'string' },
					array: {
						type: 'array',
						items: { type: 'string' }
					}
				}
			},
			'fractal_schema_v1'
		);

		// Simple textbox
		checkBold(screen.getByText('simple'), false);
		const textbox = screen.getByRole('textbox', { name: 'simple' });
		expect(textbox).toBeDefined();
		expect(component.getArguments()).deep.eq({ simple: null, array: [] });
		await user.type(textbox, 'foo');
		expect(component.getArguments()).deep.eq({ simple: 'foo', array: [] });
		await user.clear(textbox);
		expect(component.getArguments()).deep.eq({ simple: null, array: [] });

		// Array
		await user.click(screen.getByRole('button', { name: 'Add argument to list' }));
		expect(component.getArguments()).deep.eq({ simple: null, array: [null] });
		await user.type(screen.getAllByRole('textbox')[1], 'bar');
		expect(component.getArguments()).deep.eq({ simple: null, array: ['bar'] });
		await user.clear(screen.getAllByRole('textbox')[1]);
		expect(component.getArguments()).deep.eq({ simple: null, array: [null] });
	});
});
