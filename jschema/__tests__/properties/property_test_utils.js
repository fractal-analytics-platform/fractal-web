import { render } from '@testing-library/svelte';
import { expect, vi } from 'vitest';
import JSchemaTestWrapper from '../JSchemaTestWrapper.svelte';

/**
 * @param {object} schemaProperty
 * @param {boolean} required
 */
export function renderSchemaWithSingleProperty(schemaProperty, required = false) {
	const schema = {
		title: 'Args',
		type: 'object',
		properties: {
			testProp: schemaProperty
		}
	};
	if (required) {
		schema.required = ['testProp'];
	}
	return renderSchema(schema);
}

/**
 * @param {object} schemaProperty
 */
export function renderSchemaWithReferencedProperty(schemaProperty) {
	return renderSchema({
		title: 'Args',
		type: 'object',
		properties: {
			testProp: {
				$ref: '#/definitions/Ref'
			}
		},
		definitions: {
			Ref: schemaProperty
		}
	});
}

/**
 * @param {object} schema
 * @param {object} schemaData
 */
export function renderSchema(schema, schemaData = undefined) {
	const onChange = vi.fn();
	const result = render(JSchemaTestWrapper, {
		props: { schema, onChange, schemaData }
	});
	return {
		component: result.component,
		onChange
	};
}

/**
 * @param {HTMLElement} element
 * @param {boolean} expected
 */
export function checkBold(element, expected) {
	const isBold = element.classList.contains('fw-bold');
	if (isBold !== expected) {
		screen.debug(element);
	}
	expect(isBold).eq(expected);
}
