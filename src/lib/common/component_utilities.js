import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function fieldHasValue(event) {
	const inputValue = event.target?.value || undefined;
	return inputValue !== undefined && inputValue !== '';
}

export function getOnlyModifiedProperties(oldProperties, newProperties) {
	const modifiedProperties = {};
	for (let key in newProperties) {
		if (newProperties[key] !== oldProperties[key]) {
			modifiedProperties[key] = newProperties[key];
		}
	}
	return modifiedProperties;
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
 * Removes null values from an object
 * @param {object} inputValues
 * @returns {object}
 */
export function removeNullValues(inputValues) {
	const clearedValues = {};
	for (let key in inputValues) {
		if (inputValues[key] !== null) {
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
export function replaceEmptyStrings(_key, value) {
	if (typeof value === 'string' && value.trim() === '') {
		return undefined;
	} else {
		return value;
	}
}

export function formatMarkdown(markdownValue) {
	if (!markdownValue) {
		return '';
	}
	return DOMPurify.sanitize(marked.parse(markdownValue));
}

/**
 * @param {{id: number, name: string}[]} allItems
 * @returns {{id: number, name: string}[]}
 */
export function removeDuplicatedItems(allItems) {
	const items = [];
	for (const item of allItems) {
		const exists = items.find((e) => e.id === item.id);
		if (!exists) {
			items.push(item);
		}
	}
	return items.sort((a, b) =>
		a.name.toLowerCase() < b.name.toLowerCase()
			? -1
			: a.name.toLowerCase() === b.name.toLowerCase()
			? 0
			: 1
	);
}

/**
 * @template {import('fractal-components/types/api').ProjectV2} T
 * @param {T[]} projects
 */
export function sortProjectsByTimestampCreatedDesc(projects) {
	projects.sort((p1, p2) =>
		p1.timestamp_created < p2.timestamp_created
			? 1
			: p1.timestamp_created > p2.timestamp_created
			? -1
			: 0
	);
}

/**
 * @param {string} content
 * @param {string} filename
 * @param {string} contentType
 */
export function downloadBlob(content, filename, contentType) {
	// Create a blob
	var blob = new Blob([content], { type: contentType });
	var url = URL.createObjectURL(blob);

	// Create a link to download it
	var downloader = document.createElement('a');
	downloader.href = url;
	downloader.setAttribute('download', filename);
	downloader.click();
}

/**
 * @param {{ [key: string]: null | string | number | boolean}} oldObject
 * @param {{ [key: string]: null | string | number | boolean}} newObject
 */
export function objectChanged(oldObject, newObject) {
	if (Object.keys(oldObject).length !== Object.keys(newObject).length) {
		return true;
	}
	for (const [oldKey, oldValue] of Object.entries(oldObject)) {
		if (!(oldKey in newObject)) {
			return true;
		}
		if (oldValue !== newObject[oldKey]) {
			return true;
		}
	}
	return false;
}

/**
 * @param {any} value
 */
export function deepCopy(value) {
	return JSON.parse(JSON.stringify(value));
}

/**
 * @param {string|undefined} date
 * @param {string|undefined} time
 * @returns {string|undefined}
 */
export function getTimestamp(date, time) {
	if (date === undefined || date === '') {
		return undefined;
	}
	if (time === undefined || time === '') {
		return new Date(`${date}T00:00:00`).toISOString();
	}
	return new Date(`${date}T${time}:00`).toISOString();
}

/**
 * @param {any[][]} data
 */
export function arrayToCsv(data) {
	return data
		.map((row) =>
			row
				.map((v) => (v === null || v === undefined ? '' : v))
				.map(String) // convert every value to String
				.map((v) => v.replaceAll('"', '""')) // escape double quotes
				.map((v) => `"${v}"`)
				.join(',')
		)
		.join('\n');
}

export function hideAllTooltips() {
	for (const element of document.querySelectorAll('.tooltip')) {
		element.remove();
	}
}

/**
 * @param {string} zarrUrl
 */
export function encodePathForUrl(zarrUrl) {
	let encodedPath = encodeURIComponent(zarrUrl);
	// Replace encoded slashes back to slashes
	encodedPath = encodedPath.replace(/%2F/g, '/');
	return encodedPath;
}
