import { JsonSchemaDataError } from '../jschema/form_manager';

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

/**
 * Transform an object setting to null all the keys having empty string as value
 * @param {object} inputValues
 * @returns {object}
 */
export function nullifyEmptyStrings(inputValues) {
	const clearedValues = {};
	for (let key in inputValues) {
		if (typeof inputValues[key] === 'string' && inputValues[key].trim() === '') {
			clearedValues[key] = null;
		} else if (
			inputValues[key] !== null &&
			typeof inputValues[key] === 'object' &&
			!Array.isArray(inputValues[key])
		) {
			clearedValues[key] = nullifyEmptyStrings(inputValues[key]);
		} else {
			clearedValues[key] = inputValues[key];
		}
	}
	return clearedValues;
}

/**
 * Replacer function to ignore empty strings when using JSON.stringify().
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description}
 * @param {string} _key
 * @param {any} value
 * @returns {any}
 */
function stripEmptyStrings(_key, value) {
	if (typeof value === 'string' && value.trim() === '') {
		return undefined;
	} else {
		return value;
	}
}

/**
 * @typedef {Object} NormalizerOptions
 * @property {boolean} stripEmptyStrings - Indicates whether to remove empty strings from the input. Not needed if `stripEmptyElements` is used.
 * @property {boolean} stripEmptyElements - Removes both empty strings and empty, null and undefined objects from the input
 * @property {boolean} nullifyEmptyStrings - Convert empty strings to null
 * @property {boolean} deepCopy - Indicates whether to create a deep copy of the input.
 * @property {boolean} showWarning - Indicates whether to show a warning when normalization has been applied.
 */

/** @type {NormalizerOptions} */
const defaultNormalizerOptions = {
	stripEmptyStrings: false,
	stripEmptyElements: false,
	nullifyEmptyStrings: false,
	deepCopy: false,
	showWarning: true
};

/**
 * @param {object} payload
 * @param {Partial<NormalizerOptions>} options
 * @returns {string}
 */
export function normalizePayload(payload, options = {}) {
	options = {
		...defaultNormalizerOptions,
		...options
	};
	payload = options.deepCopy ? deepCopy(payload) : payload;
	const normalizedPaths = _normalize(payload);
	if (options.nullifyEmptyStrings) {
		payload = nullifyEmptyStrings(payload);
	}
	if (options.stripEmptyElements) {
		payload = stripNullAndEmptyObjectsAndArrays(payload);
	}
	if (options.showWarning) {
		showNormalizationWarning(normalizedPaths);
	}
	if (options.stripEmptyStrings) {
		return JSON.stringify(payload, stripEmptyStrings);
	}
	return JSON.stringify(payload);
}

/**
 * Note: export for testing only.
 * @param {object} payload
 * @param {string[]} normalizedPaths
 * @param {string} parentPath
 * @returns {string[]}
 */
export function _normalize(payload, normalizedPaths = [], parentPath = '') {
	for (const [key, value] of Object.entries(payload)) {
		// normalize key
		const normalizedKey = normalizeString(key);
		if (normalizedKey !== key) {
			payload[normalizedKey] = value;
			delete payload[key];
			normalizedPaths.push(parentPath === '' ? 'root' : parentPath);
		}

		const path = Array.isArray(payload)
			? `${parentPath}[${normalizedKey}]`
			: parentPath === ''
				? normalizedKey
				: `${parentPath}.${normalizedKey}`;

		// normalize value
		if (value === null || value === undefined) {
			payload[normalizedKey] = value;
		} else if (typeof value === 'string') {
			const normalizedValue = normalizeString(value);
			if (value !== normalizedValue) {
				normalizedPaths.push(path);
			}
			payload[normalizedKey] = normalizedValue;
		} else if (typeof value === 'object') {
			if (Array.isArray(payload)) {
				_normalize(value, normalizedPaths, path);
			} else {
				_normalize(value, normalizedPaths, path);
			}
		} else {
			payload[normalizedKey] = value;
		}
	}
	return normalizedPaths;
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeString(value) {
	return value
		.normalize('NFC')
		.trim()
		.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * @param {string[]} normalizedPaths
 */
function showNormalizationWarning(normalizedPaths) {
	if (typeof document === 'undefined' || normalizedPaths.length === 0) {
		return;
	}
	const ul = document.getElementById('normalized-parameters');
	if (ul) {
		ul.innerHTML = '';
		for (const path of [...new Set(normalizedPaths)]) {
			const li = document.createElement('li');
			const code = document.createElement('code');
			code.textContent = path;
			li.appendChild(code);
			ul.appendChild(li);
		}
	}
	const toastElement = document.getElementById('normalization-toast');
	if (toastElement) {
		// @ts-expect-error
		// eslint-disable-next-line no-undef
		const toast = new bootstrap.Toast(toastElement);
		toast.show();
	}
}
