import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import {
	checkBold,
	renderSchemaWithSingleProperty,
	renderSchemaWithReferencedProperty
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

	it('Empty string always converted to null', async () => {
		const user = userEvent.setup();
		const { component } = renderSchemaWithReferencedProperty(
			{ type: 'string' },
			'fractal_schema_v1'
		);
		checkBold(screen.getByText('testProp'), false);
		const textbox = screen.getByRole('textbox', { name: 'testProp' });
		expect(textbox).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
		await user.type(textbox, 'foo');
		expect(component.getArguments()).deep.eq({ testProp: 'foo' });
		await user.clear(textbox);
		expect(component.getArguments()).deep.eq({ testProp: null });
	});
});
