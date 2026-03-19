import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import {
	checkBold,
	renderSchemaWithSingleProperty,
	renderSchemaWithReferencedProperty,
	renderSchema
} from './property_test_utils';

describe('Number properties', () => {
	it('Required NumberProperty with title', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				title: 'Number title',
				type: 'integer'
			},
			'pydantic_v1',
			true
		);
		checkBold(screen.getByText('Number title'), true);
		const input = screen.getByRole('textbox', { name: 'Number title' });
		expect(input).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('Optional NumberProperty without title', async () => {
		const { component } = renderSchemaWithSingleProperty({ type: 'integer' }, 'pydantic_v1');
		checkBold(screen.getByText('testProp'), false);
		const input = screen.getByRole('textbox', { name: 'testProp' });
		expect(input).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('NumberProperty referenced', async () => {
		const { component } = renderSchemaWithReferencedProperty({ type: 'number' }, 'pydantic_v2');
		checkBold(screen.getByText('testProp'), false);
		const input = screen.getByRole('textbox', { name: 'testProp' });
		expect(input).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('NumberProperty initialized to zero', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				default: 0,
				type: 'integer'
			},
			'pydantic_v1'
		);
		expect(component.getArguments()).deep.eq({ testProp: 0 });
	});

	it('NumberProperty initialized to null', async () => {
		const { component } = renderSchema(
			{
				type: 'object',
				properties: {
					testProp: {
						type: 'number',
					}
				}
			},
			'pydantic_v2',
			{ testProp: null }
		);
		expect(component.getArguments()).deep.eq({ testProp: null });
	});
});
