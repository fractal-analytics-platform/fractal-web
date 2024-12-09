import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/svelte';
import {
	checkBold,
	renderSchemaWithSingleProperty,
	renderSchemaWithReferencedProperty
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
		const spinbutton = screen.getByRole('spinbutton', { name: 'Number title' });
		expect(spinbutton).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('Optional NumberProperty without title', async () => {
		const { component } = renderSchemaWithSingleProperty({ type: 'integer' }, 'pydantic_v1');
		checkBold(screen.getByText('testProp'), false);
		const spinbutton = screen.getByRole('spinbutton', { name: 'testProp' });
		expect(spinbutton).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('NumberProperty referenced', async () => {
		const { component } = renderSchemaWithReferencedProperty({ type: 'number' });
		checkBold(screen.getByText('testProp'), false);
		const spinbutton = screen.getByRole('spinbutton', { name: 'testProp' });
		expect(spinbutton).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('NumberProperty with min and max constraints', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				type: 'integer',
				minimum: 5,
				maximum: 10
			},
			'pydantic_v1'
		);
		const spinbutton = screen.getByRole('spinbutton', { name: 'testProp' });
		expect(spinbutton).toBeDefined();
		expect(spinbutton.getAttribute('min')).toBe('5');
		expect(spinbutton.getAttribute('max')).toBe('10');
		expect(component.getArguments()).deep.eq({ testProp: null });
	});

	it('NumberProperty with exclusive min and max constraints', async () => {
		const { component } = renderSchemaWithSingleProperty(
			{
				type: 'integer',
				exclusiveMinimum: 5,
				exclusiveMaximum: 10
			},
			'pydantic_v1'
		);
		const spinbutton = screen.getByRole('spinbutton', { name: 'testProp' });
		expect(spinbutton).toBeDefined();
		expect(spinbutton.getAttribute('min')).toBe('6');
		expect(spinbutton.getAttribute('max')).toBe('9');
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
});
