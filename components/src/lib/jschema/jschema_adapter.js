import { deepCopy, isObject } from '../common/utils.js';
import { isDiscriminator } from './property_utils.js';

/**
 * Creates a simpler but still equivalent JSON Schema. Removes properties to ignore,
 * resolve and replace $ref values and merge the allOf definitions
 * @param {import("../types/jschema.js").JSONSchema} originalJsonSchema
 * @param {string[]} propertiesToIgnore
 * @returns {import("../types/jschema.js").JSONSchema}
 */
export function adaptJsonSchema(originalJsonSchema, propertiesToIgnore = []) {
	let adaptedJsonSchema = stripIgnoredProperties(originalJsonSchema, propertiesToIgnore);
	adaptedJsonSchema = adaptDiscriminators(adaptedJsonSchema, adaptedJsonSchema);
	adaptedJsonSchema = replaceReferences(adaptedJsonSchema, adaptedJsonSchema);
	adaptedJsonSchema = mergeAllOf(adaptedJsonSchema);
	return adaptedJsonSchema;
}

/**
 * @param {import("../types/jschema.js").JSONSchema} originalJsonSchema
 * @param {string[]} propertiesToIgnore
 * @returns {import("../types/jschema.js").JSONSchema}
 */
export function stripIgnoredProperties(originalJsonSchema, propertiesToIgnore = []) {
	const adaptedSchema = deepCopy(originalJsonSchema);
	for (const k of Object.keys(adaptedSchema.properties || {})) {
		if (propertiesToIgnore.includes(k)) {
			delete adaptedSchema.properties[k];
		}
	}
	if (adaptedSchema.required) {
		adaptedSchema.required = adaptedSchema.required.filter(
			(/** @type {string}*/ k) => !propertiesToIgnore.includes(k)
		);
	}
	return adaptedSchema;
}

/**
 * @param {import("../types/jschema.js").JSONSchemaProperty} jschema
 * @param {any} parentObject
 */
function replaceReferences(jschema, parentObject) {
	if (Array.isArray(parentObject)) {
		const adaptedArray = [];
		for (const item of parentObject) {
			adaptedArray.push(replaceReferences(jschema, item));
		}
		return adaptedArray;
	} else if (isObject(parentObject)) {
		const adaptedObject = {};
		for (const [key, child] of Object.entries(parentObject)) {
			if (key === '$ref' && typeof child === 'string') {
				const reference = resolveRef(jschema, child);
				for (const [k, v] of Object.entries(reference)) {
					adaptedObject[k] = replaceReferences(jschema, v);
				}
			} else {
				adaptedObject[key] = replaceReferences(jschema, child);
			}
		}
		return adaptedObject;
	} else {
		return parentObject;
	}
}

/**
 * @param {import("../types/jschema.js").JSONSchemaProperty} jschema
 * @param {any} parentObject
 */
function adaptDiscriminators(jschema, parentObject) {
	if (Array.isArray(parentObject)) {
		const adaptedArray = [];
		for (let i = 0; i < parentObject.length; i++) {
			const item = parentObject[i];
			adaptedArray.push(adaptDiscriminators(jschema, item));
		}
		return adaptedArray;
	} else if (isObject(parentObject)) {
		const adaptedObject = {};
		for (const [key, child] of Object.entries(parentObject)) {
			if (key === 'discriminator' && isDiscriminator(child) && 'oneOf' in parentObject) {
				const refs = parentObject.oneOf.map((o) => o['$ref']);
				adaptedObject[key] = {
					propertyName: child.propertyName,
					mapping: Object.fromEntries(
						Object.entries(child.mapping).map(([k, v]) => [k, refs.indexOf(v)])
					)
				};
			} else {
				adaptedObject[key] = adaptDiscriminators(jschema, child);
			}
		}
		return adaptedObject;
	} else {
		return parentObject;
	}
}

/**
 * Resolve a reference ($ref) to an internal schema definition
 * @param {import("../types/jschema.js").JSONSchemaProperty} jsonSchema
 * @param {string} refName
 * @returns {import("../types/jschema.js").JSONSchemaProperty}
 */
function resolveRef(jsonSchema, refName) {
	if (!refName.startsWith('#/')) {
		throw new Error(`Unsupported $ref field format: ${refName}`);
	}

	const path = refName.substring(2).split('/');

	let ref = jsonSchema;
	for (const key of path) {
		if (!(key in ref)) {
			throw new Error(`Unable to resolve reference ${refName}. Key ${key} not found.`);
		}
		ref = ref[key];
	}
	return ref;
}

/**
 * @param {any} parentObject
 */
function mergeAllOf(parentObject) {
	if (Array.isArray(parentObject)) {
		const adaptedArray = [];
		for (const item of parentObject) {
			adaptedArray.push(mergeAllOf(item));
		}
		return adaptedArray;
	} else if (isObject(parentObject)) {
		const adaptedObject = {};
		for (const [key, child] of Object.entries(parentObject)) {
			if (key === 'allOf' && Array.isArray(child)) {
				for (const schema of child) {
					for (const [k, v] of Object.entries(schema)) {
						mergeProperty(adaptedObject, k, v);
					}
				}
			} else {
				adaptedObject[key] = mergeAllOf(child);
			}
		}
		return adaptedObject;
	} else {
		return parentObject;
	}
}

/**
 * @param {object} parentObject
 * @param {string} key
 * @param {any} value
 */
function mergeProperty(parentObject, key, value) {
	if (key in parentObject) {
		if (Array.isArray(parentObject[key]) && Array.isArray(value)) {
			parentObject[key] = [...parentObject[key], ...value];
		} else if (isObject(parentObject) && isObject(value)) {
			parentObject[key] = { ...parentObject[key], ...value };
		}
	} else {
		parentObject[key] = value;
	}
}

/**
 * @param {import("../types/jschema.js").JSONSchema} jschema
 * @param {any} parentObject
 * @returns {object}
 */
export function stripDiscriminator(jschema, parentObject = null, initialized = false) {
	if (!initialized) {
		parentObject = deepCopy(jschema);
	}
	if (Array.isArray(parentObject)) {
		const adaptedArray = [];
		for (const item of parentObject) {
			adaptedArray.push(stripDiscriminator(jschema, item, true));
		}
		return adaptedArray;
	} else if (isObject(parentObject)) {
		const adaptedObject = {};
		for (const [key, child] of Object.entries(parentObject)) {
			const discriminator =
				key === 'discriminator' && 'oneOf' in parentObject && isDiscriminator(child);
			if (!discriminator) {
				adaptedObject[key] = stripDiscriminator(jschema, child, true);
			}
		}
		return adaptedObject;
	} else {
		return parentObject;
	}
}
