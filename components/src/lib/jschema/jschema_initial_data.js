import { undefinedToNull } from '../common/utils.js';
import { getAllObjectProperties, isTuple } from './property_utils.js';

/**
 * @param {import("../types/jschema.js").JSONSchema} jsonSchema
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {any} initialValue
 */
export function getJsonSchemaData(jsonSchema, schemaVersion, initialValue = undefined) {
	const loadDefaults =
		initialValue === undefined || initialValue === null || Object.keys(initialValue).length === 0;
	return getPropertyData(jsonSchema, schemaVersion, true, initialValue, loadDefaults);
}

/**
 * @param {import("../types/jschema.js").JSONSchemaObjectProperty} property
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
function getObjectPropertyData(property, schemaVersion, initialValue, loadDefaults) {
	const requiredChildren = property.required || [];
	const data = {};
	if (initialValue && (typeof initialValue !== 'object' || Array.isArray(initialValue))) {
		// invalid data (to be fixed by user)
		return initialValue;
	}
	if (initialValue === null || initialValue === undefined) {
		initialValue = {};
	}
	const properties = getAllObjectProperties(property, initialValue);
	for (const [childKey, childProperty] of Object.entries(properties)) {
		const childRequired = requiredChildren.includes(childKey);
		data[childKey] = getPropertyData(
			childProperty,
			schemaVersion,
			childRequired,
			undefinedToNull(initialValue[childKey]),
			loadDefaults
		);
	}
	// Added extra properties
	if (initialValue && typeof initialValue === 'object') {
		for (const [k, v] of Object.entries(initialValue)) {
			if (!Object.keys(data).includes(k)) {
				data[k] = v;
			}
		}
	}
	return data;
}

function getConditionalPropertyData(property, schemaVersion, required, initialValue, loadDefaults) {
	if ('discriminator' in property) {
		const { discriminator } = property;
		if (initialValue) {
			const key = initialValue[discriminator.propertyName];
			if (!key || discriminator.mapping[key] === undefined) {
				// invalid data (to be fixed by user)
				return initialValue;
			}
			const index = discriminator.mapping[key];
			return getPropertyData(
				property.oneOf[index],
				schemaVersion,
				required,
				initialValue,
				loadDefaults
			);
		} else if (property.oneOf.length > 0) {
			return getPropertyData(
				property.oneOf[0],
				schemaVersion,
				required,
				initialValue,
				loadDefaults
			);
		}
	}
	return {};
}

/**
 * @param {import("../types/jschema.js").JSONSchemaProperty | null} property
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {boolean} required
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
export function getPropertyData(property, schemaVersion, required, initialValue, loadDefaults) {
	if (!property) {
		return null;
	}
	if (loadDefaults && 'default' in property) {
		return getPropertyData(property, schemaVersion, required, property.default, false);
	}
	if ('oneOf' in property) {
		return getConditionalPropertyData(
			property,
			schemaVersion,
			required,
			initialValue,
			loadDefaults
		);
	}
	if ('const' in property) {
		return property.const;
	}
	if (property.type === null) {
		return null;
	}
	switch (property.type) {
		case 'object':
			return getObjectPropertyData(
				/** @type {import("../types/jschema.js").JSONSchemaObjectProperty}*/(property),
				schemaVersion,
				initialValue,
				loadDefaults
			);
		case 'array': {
			const arrayProperty = /** @type {import("../types/jschema.js").JSONSchemaArrayProperty}*/ (
				property
			);
			if (isTuple(arrayProperty)) {
				return getTuplePropertyData(
					arrayProperty,
					schemaVersion,
					required,
					initialValue,
					loadDefaults
				);
			} else {
				return getArrayPropertyData(
					arrayProperty,
					schemaVersion,
					required,
					initialValue,
					loadDefaults
				);
			}
		}
		default:
			return undefinedToNull(initialValue);
	}
}

/**
 * @param {import("../types/jschema.js").JSONSchemaArrayProperty} property
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {boolean} required
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
function getArrayPropertyData(property, schemaVersion, required, initialValue, loadDefaults) {
	if (!Array.isArray(initialValue)) {
		if (initialValue) {
			// return invalid data (to be fixed by user)
			return initialValue;
		}
		initialValue = [];
	}
	const childProperty = /** @type {import("../types/jschema.js").JSONSchemaProperty} */ (
		property.items
	);
	let data = [];
	for (let i = 0; i < initialValue.length; i++) {
		data.push(
			getPropertyData(childProperty, schemaVersion, required, initialValue[i], loadDefaults)
		);
	}
	if (required && typeof property.minItems === 'number' && data.length < property.minItems) {
		// Create the minimum required number of items
		for (let i = data.length; i < property.minItems; i++) {
			data.push(getPropertyData(childProperty, schemaVersion, required, null, loadDefaults));
		}
	}
	return data;
}

/**
 * @param {import("../types/jschema.js").JSONSchemaArrayProperty} property
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {boolean} required
 * @param {any} initialValue
 * @param {boolean} loadDefaults
 */
function getTuplePropertyData(property, schemaVersion, required, initialValue, loadDefaults) {
	if (initialValue && !Array.isArray(initialValue)) {
		// return invalid data (to be fixed by user)
		return initialValue;
	}
	if (!initialValue) {
		initialValue = [];
	}
	if (!required && initialValue.length === 0) {
		return initialValue;
	}

	let data = [];
	for (let i = 0; i < initialValue.length; i++) {
		const childProperty = getTupleChildProperty(property, schemaVersion, i)
		if (childProperty) {
			data.push(
				getPropertyData(
					childProperty,
					schemaVersion,
					required,
					initialValue[i],
					loadDefaults
				)
			);
		} else {
			// invalid extra value (to be removed by user)
			data.push(initialValue[i]);
		}
	}
	const size = /** @type {number} */ (property.minItems);
	// Create the minimum required number of items
	for (let i = data.length; i < size; i++) {
		data.push(
			getPropertyData(
				getTupleChildProperty(property, schemaVersion, i),
				schemaVersion,
				false,
				null,
				loadDefaults
			)
		);
	}
	return data;
}

/**
 * @param {import("../types/jschema.js").JSONSchemaArrayProperty} tupleProperty
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 * @param {number} index
 * @returns {import("../types/jschema.js").JSONSchemaProperty|null}
 */
function getTupleChildProperty(tupleProperty, schemaVersion, index) {
	const items = schemaVersion === 'pydantic_v1' ? tupleProperty.items : tupleProperty.prefixItems;
	if (Array.isArray(items)) {
		if (index < items.length) {
			return items[index];
		}
		return null;
	} else {
		return items;
	}
}
