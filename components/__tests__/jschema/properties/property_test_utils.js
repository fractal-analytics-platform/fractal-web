import { render } from '@testing-library/svelte';
import { expect, vi } from 'vitest';
import JSchemaTestWrapper from '../JSchemaTestWrapper.svelte';

/**
 * @param {object} schemaProperty
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {boolean} required
 */
export function renderSchemaWithSingleProperty(schemaProperty, schemaVersion, required = false) {
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
	return renderSchema(schema, schemaVersion);
}

/**
 * @param {object} schemaProperty
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 */
export function renderSchemaWithReferencedProperty(schemaProperty, schemaVersion) {
	return renderSchema(
		{
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
		},
		schemaVersion
	);
}

/**
 * @param {object} schema
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {object} schemaData
 */
export function renderSchema(schema, schemaVersion, schemaData = undefined) {
	const onChange = vi.fn();
	const result = render(JSchemaTestWrapper, {
		props: { schema, onChange, schemaData, schemaVersion }
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
