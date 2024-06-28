import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/svelte';
import {
	checkBold,
	renderSchema,
	renderSchemaWithSingleProperty,
	renderSchemaWithReferencedProperty
} from './property_test_utils';

describe('Boolean properties', () => {
	it('Required BooleanProperty with title', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty(
			{
				title: 'Boolean title',
				type: 'boolean'
			},
			true
		);
		const title = screen.getByText('Boolean title');
		checkBold(title, true);
		expect(title).toBeDefined();
		const switcher = screen.getByRole('switch');
		expect(switcher).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });

		await fireEvent.click(switcher);
		expect(onChange).toHaveBeenCalledWith({ testProp: true });
		await fireEvent.click(switcher);
		expect(onChange).toHaveBeenCalledWith({ testProp: false });
	});

	it('BooleanProperty without title', async () => {
		const { component, onChange } = renderSchemaWithSingleProperty({ type: 'boolean' }, false);
		const title = screen.getByText('testProp');
		checkBold(title, false);
		expect(title).toBeDefined();
		const switcher = screen.getByRole('switch');
		expect(switcher).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });

		await fireEvent.click(switcher);
		expect(onChange).toHaveBeenCalledWith({ testProp: true });
		await fireEvent.click(switcher);
		expect(onChange).toHaveBeenCalledWith({ testProp: false });
	});

	it('BooleanProperty referenced', async () => {
		const { component, onChange } = renderSchemaWithReferencedProperty({ type: 'boolean' });
		const title = screen.getByText('testProp');
		checkBold(title, false);
		expect(title).toBeDefined();
		const switcher = screen.getByRole('switch');
		expect(switcher).toBeDefined();
		expect(component.getArguments()).deep.eq({ testProp: null });

		await fireEvent.click(switcher);
		expect(onChange).toHaveBeenCalledWith({ testProp: true });
		await fireEvent.click(switcher);
		expect(onChange).toHaveBeenCalledWith({ testProp: false });
	});

	it('Required BooleanProperty initialized to false', async () => {
		const { component } = renderSchema(
			{
				type: 'object',
				properties: {
					b: { type: 'boolean' }
				},
				required: ['b']
			},
			{ b: false }
		);
		expect(component.getArguments()).deep.eq({ b: false });
	});
});
