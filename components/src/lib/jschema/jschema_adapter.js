import { deepCopy, isObject } from '../common/utils.js';

/**
 * Creates a simpler but still equivalent JSON Schema. Removes properties to ignore,
 * resolve and replace $ref values and merge the allOf definitions
 * @param {import("../types/jschema.js").JSONSchema} originalJsonSchema
 * @param {string[]} propertiesToIgnore
 * @returns {import("../types/jschema.js").JSONSchema}
 */
export function adaptJsonSchema(originalJsonSchema, propertiesToIgnore = []) {
	let adaptedJsonSchema = stripIgnoredProperties(originalJsonSchema, propertiesToIgnore);
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
