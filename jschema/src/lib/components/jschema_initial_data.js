import { undefinedToNull } from '../utils.js';
import { getAllObjectProperties, isTuple } from './property_utils.js';

/**
 * @param {import("../types/jschema.js").JSONSchema} jsonSchema
 * @param {any} initialValue
 */
export function getJsonSchemaData(jsonSchema, initialValue = undefined) {
	return getPropertyData(jsonSchema, true, initialValue, initialValue === undefined);
}

/**
 * @param {import("../types/jschema.js").JSONSchemaObjectProperty} property
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
function getObjectPropertyData(property, initialValue, loadDefaults) {
	const requiredChildren = property.required || [];
	const data = {};
	if (initialValue === null || initialValue === undefined) {
		initialValue = {};
	}
	const properties = getAllObjectProperties(property, initialValue);
	for (const [childKey, childProperty] of Object.entries(properties)) {
		const childRequired = requiredChildren.includes(childKey);
		data[childKey] = getPropertyData(
			childProperty,
			childRequired,
			undefinedToNull(initialValue[childKey]),
			loadDefaults
		);
	}
	return data;
}

/**
 * @param {import("../types/jschema.js").JSONSchemaProperty} property
 * @param {boolean} required
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
export function getPropertyData(property, required, initialValue, loadDefaults) {
	if (loadDefaults && 'default' in property) {
		return getPropertyData(property, required, property.default, false);
	}
	if (property.type === null) {
		return null;
	}
	switch (property.type) {
		case 'object':
			return getObjectPropertyData(
				/** @type {import("../types/jschema.js").JSONSchemaObjectProperty}*/ (property),
				initialValue,
				loadDefaults
			);
		case 'array': {
			const arrayProperty = /** @type {import("../types/jschema.js").JSONSchemaArrayProperty}*/ (
				property
			);
			if (isTuple(arrayProperty)) {
				return getTuplePropertyData(arrayProperty, required, initialValue, loadDefaults);
			} else {
				return getArrayPropertyData(arrayProperty, required, initialValue, loadDefaults);
			}
		}
		default:
			return undefinedToNull(initialValue);
	}
}

/**
 * @param {import("../types/jschema.js").JSONSchemaArrayProperty} property
 * @param {boolean} required
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
function getArrayPropertyData(property, required, initialValue, loadDefaults) {
	if (!Array.isArray(initialValue)) {
		initialValue = [];
	}
	const childProperty = /** @type {import("../types/jschema.js").JSONSchemaProperty} */ (
		property.items
	);
	let data = [];
	for (let i = 0; i < initialValue.length; i++) {
		data.push(getPropertyData(childProperty, required, initialValue[i], loadDefaults));
	}
	if (required && typeof property.minItems === 'number' && data.length < property.minItems) {
		// Create the minimum required number of items
		for (let i = data.length; i < property.minItems; i++) {
			data.push(getPropertyData(childProperty, required, null, loadDefaults));
		}
	}
	return data;
}

/**
 * @param {import("../types/jschema.js").JSONSchemaArrayProperty} property
 * @param {boolean} required
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
function getTuplePropertyData(property, required, initialValue, loadDefaults) {
	if (!Array.isArray(initialValue)) {
		initialValue = [];
	}
	if (!required && initialValue.length === 0) {
		return initialValue;
	}
	let data = [];
	for (let i = 0; i < initialValue.length; i++) {
		data.push(
			getPropertyData(getTupleChildProperty(property, i), required, initialValue[i], loadDefaults)
		);
	}
	const size = /** @type {number} */ (property.minItems);
	// Create the minimum required number of items
	for (let i = data.length; i < size; i++) {
		data.push(getPropertyData(getTupleChildProperty(property, i), false, null, loadDefaults));
	}
	if (data.length > size) {
		console.warn('Tuple initial value has more items than allowed (%d)', size, initialValue);
		data.splice(size, data.length);
	}
	return data;
}

/**
 * @param {import("../types/jschema.js").JSONSchemaArrayProperty} tupleProperty
 * @param {number} index
 */
function getTupleChildProperty(tupleProperty, index) {
	if (Array.isArray(tupleProperty.items)) {
		return tupleProperty.items[index];
	} else {
		return tupleProperty.items;
	}
}
