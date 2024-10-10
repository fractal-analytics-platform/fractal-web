import { marked } from 'marked';
import DOMPurify from 'dompurify';
import coerce from 'semver/functions/coerce';
import gte from 'semver/functions/gte';
import lte from 'semver/functions/lte';
import valid from 'semver/functions/valid';

/**
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t1
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t2
 * @returns {-1|0|1}
 */
export function greatestVersionAsc(t1, t2) {
	const t1Version = validateVersion(t1.version);
	const t2Version = validateVersion(t2.version);
	if (t1Version !== null && t2Version !== null) {
		const t1VersionLt = lte(t1Version, t2Version);
		return t1VersionLt ? -1 : 1;
	}
	return 0;
}

/**
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t1
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t2
 * @returns {-1|0|1}
 */
export function greatestVersionDesc(t1, t2) {
	const t1Version = validateVersion(t1.version);
	const t2Version = validateVersion(t2.version);
	if (t1Version !== null && t2Version !== null) {
		const t1VersionGt = gte(t1Version, t2Version);
		return t1VersionGt ? -1 : 1;
	}
	return 0;
}

const semverValidationOptions = {
	loose: true,
	includePrerelease: true
};

/**
 * @param {string|null} version
 * @returns {string | null}
 */
function validateVersion(version) {
	return (
		valid(version, semverValidationOptions) ||
		valid(coerce(version), semverValidationOptions) ||
		null
	);
}

/**
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t1
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t2
 * @returns {-1|0|1}
 */
export function compareTaskNameAscAndVersionAsc(t1, t2) {
	if (t1.name.toLowerCase() < t2.name.toLowerCase()) return -1;
	if (t1.name.toLowerCase() > t2.name.toLowerCase()) return 1;
	// Names are equal, sort by version
	return greatestVersionAsc(t1, t2);
}

/**
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t1
 * @param {import('$lib/types').Task|import('$lib/types-v2').TaskV2} t2
 * @returns {-1|0|1}
 */
export function compareTaskNameAscAndVersionDesc(t1, t2) {
	if (t1.name.toLowerCase() < t2.name.toLowerCase()) return -1;
	if (t1.name.toLowerCase() > t2.name.toLowerCase()) return 1;
	// Names are equal, sort by version
	return greatestVersionDesc(t1, t2);
}

/**
 * @param {Array<import('$lib/types').Task>} tasks
 * @param {'asc'|'desc'} order
 * @returns {Array<import('$lib/types').Task>}
 */
export function orderTasksByOwnerThenByNameThenByVersion(tasks, ownerName = null, order = 'asc') {
	const sortingFunction = getVersionSortingFunction(order);
	// Sort tasks by owner, by name and by version
	return tasks.sort((t1, t2) => {
		// If ownerName is not null, filter tasks by owner
		if (ownerName !== null) {
			// If t1 owner is same as ownerName, t1 should go before t2
			if (t1.owner === ownerName) {
				if (t2.owner !== ownerName) return -1;
				// Both owners are same, sort by name and version
				return sortingFunction(t1, t2);
			} else {
				// t1 owner is not same as ownerName, t2 should go before t1
				if (t2.owner === ownerName) return 1;
			}
		}
		if (t1.owner === null) {
			// If t1 owner is null, t1 should go before t2 if t2 owner is null
			// Should check if t2 owner is null too
			if (t2.owner === null) {
				// Both owners are null, sort by name
				return sortingFunction(t1, t2);
			} else {
				// t1 owner is null, t2 owner is not null, t1 should go before t2
				return -1;
			}
		} else {
			// t1 owner is not null, t2 owner is null, t2 should go before t1
			if (t2.owner === null) return 1;
			// Both owners are not null, sort by owner
			if (t1.owner.toLowerCase() < t2.owner.toLowerCase()) return -1;
			if (t1.owner.toLowerCase() > t2.owner.toLowerCase()) return 1;
			// Owners are equal, sort by name
			return sortingFunction(t1, t2);
		}
	});
}

/**
 * @param {Array<import('$lib/types-v2').TaskV2>} tasks
 * @param {'asc'|'desc'} order
 * @returns {Array<import('$lib/types-v2').TaskV2>}
 */
export function orderTasksByGroupThenByNameThenByVersion(tasks, order = 'asc') {
	const sortingFunction = getVersionSortingFunction(order);
	return tasks.sort((t1, t2) => {
		if (t1.taskgroupv2_id < t2.taskgroupv2_id) {
			return -1;
		}
		if (t1.taskgroupv2_id > t2.taskgroupv2_id) {
			return 1;
		}
		return sortingFunction(t1, t2);
	});
}

/**
 * @param {'asc'|'desc'} order
 */
function getVersionSortingFunction(order) {
	if (order === 'asc') {
		return compareTaskNameAscAndVersionAsc;
	}
	return compareTaskNameAscAndVersionDesc;
}

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
 * @template {import('$lib/types').Project|import('$lib/types-v2').ProjectV2} T
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
