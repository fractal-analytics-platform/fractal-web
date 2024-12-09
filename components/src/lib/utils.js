import { JsonSchemaDataError } from './jschema/form_manager';

/**
 * @param {any} value
 */
export function deepCopy(value) {
	if (value === undefined) {
		return undefined;
	}
	return JSON.parse(JSON.stringify(value));
}

/**
 * @param {any} value
 */
export function undefinedToNull(value) {
	return value === undefined ? null : value;
}

/**
 * @param {any} value
 */
export function isObject(value) {
	return typeof value === 'object' && value !== null && value !== undefined;
}

/**
 * Strip null and empty objects and arrays from a data object
 * @param {object} data
 * @returns {*}
 */
export function stripNullAndEmptyObjectsAndArrays(data) {
	const stripData = removeNullValuesAndEmptyStrings(data);
	return removeEmptyObjectsAndArrays(stripData);
}

/**
 * Remove null values and empty strings from an object and its nested objects
 * @param {object} obj
 * @returns {*}
 */
function removeNullValuesAndEmptyStrings(obj) {
	Object.keys(obj).forEach((key) => {
		if (Array.isArray(obj[key])) {
			// If the obj[key] is an array, filter its null and empty string values
			obj[key] = obj[key].filter((/**@type {any}*/ value) => value !== null && value !== '');
		}

		if (obj[key] && typeof obj[key] === 'object') removeNullValuesAndEmptyStrings(obj[key]);
		else if (obj[key] === null || obj[key] === '') delete obj[key];
	});
	return obj;
}

/**
 * Remove empty objects and arrays from an object and its nested objects
 * @param {object} obj
 * @returns {*}
 */
function removeEmptyObjectsAndArrays(obj) {
	Object.keys(obj).forEach((key) => {
		if (obj[key] && typeof obj[key] === 'object') {
			// Next line would enable removing empty objects and arrays from nested objects
			removeEmptyObjectsAndArrays(obj[key]);
			if (Object.keys(obj[key]).length === 0) delete obj[key];
		}
	});
	return obj;
}

/**
 * @param {any} err
 */
export function getValidationErrorMessage(err) {
	if (err instanceof JsonSchemaDataError) {
		return JSON.stringify(err.errors.length === 1 ? err.errors[0] : err.errors, null, 2);
	} else {
		console.error(err);
		return /** @type {Error}*/ (err).message;
	}
}
