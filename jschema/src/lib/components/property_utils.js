/**
 * @param {import("../types/jschema").JSONSchemaNumberProperty} property
 * @returns {number|null}
 */
export function getMin(property) {
	return 'minimum' in property && property.minimum !== undefined
		? Number(property.minimum)
		: 'exclusiveMinimum' in property && property.exclusiveMinimum !== undefined
		? Number(property.exclusiveMinimum) + 1
		: null;
}

/**
 * @param {import("../types/jschema").JSONSchemaNumberProperty} property
 * @returns {number|null}
 */
export function getMax(property) {
	return 'maximum' in property && property.maximum !== undefined
		? Number(property.maximum)
		: 'exclusiveMaximum' in property && property.exclusiveMaximum !== undefined
		? Number(property.exclusiveMaximum) - 1
		: null;
}

/**
 * @param {import("../types/jschema").JSONSchemaArrayProperty} property
 * @returns {boolean}
 */
export function isTuple(property) {
	return (
		'minItems' in property &&
		typeof property.minItems === 'number' &&
		'maxItems' in property &&
		typeof property.maxItems === 'number' &&
		property.minItems === property.maxItems
	);
}

/**
 * Returns all the child properties, including the additional properties
 * @param {import("../types/jschema").JSONSchemaObjectProperty} property
 * @param {object} value
 */
export function getAllObjectProperties(property, value) {
	const properties = property.properties || {};
	if (property.additionalProperties) {
		for (const key of Object.keys(value)) {
			if (!Object.keys(properties).includes(key)) {
				properties[key] = property.additionalProperties;
			}
		}
	}
	return properties;
}

/**
 * @param {import("../types/jschema").JSONSchemaObjectProperty} parentProperty
 * @param {string} childKey
 */
export function isRemovableChildProperty(parentProperty, childKey) {
	const properties = parentProperty.properties || {};
	return !Object.keys(properties).includes(childKey);
}

/**
 * @param {boolean} legacy
 * @returns {string[]}
 */
export function getPropertiesToIgnore(legacy) {
	return legacy
		? ['input_paths', 'output_path', 'metadata', 'component']
		: ['zarr_url', 'zarr_urls', 'init_args', 'zarr_dir'];
}
