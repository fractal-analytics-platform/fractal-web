import { marked } from 'marked';
import DOMPurify from 'dompurify';
import semver from 'semver';

/**
 * @param {import('$lib/types').Task} t1
 * @param {import('$lib/types').Task} t2
 * @returns {-1|0|1}
 */
export function greatestVersionAsc(t1, t2) {
	const t1Version = validateVersion(t1.version);
	const t2Version = validateVersion(t2.version);
	if (t1Version !== null && t2Version !== null) {
		const t1VersionLt = semver.lte(t1Version, t2Version);
		return t1VersionLt ? -1 : 1;
	}
	return 0;
}

/**
 * @param {import('$lib/types').Task} t1
 * @param {import('$lib/types').Task} t2
 * @returns {-1|0|1}
 */
export function greatestVersionDesc(t1, t2) {
	const t1Version = validateVersion(t1.version);
	const t2Version = validateVersion(t2.version);
	if (t1Version !== null && t2Version !== null) {
		const t1VersionGt = semver.gte(t1Version, t2Version);
		return t1VersionGt ? -1 : 1;
	}
	return 0;
}

const semverValidationOptions = {
	loose: true,
	includePrerelease: true
};

/**
 * @param {string} version
 * @returns {string | null}
 */
function validateVersion(version) {
	return (
		semver.valid(version, semverValidationOptions) ||
		semver.valid(semver.coerce(version), semverValidationOptions)
	);
}

/**
 * @param {import('$lib/types').Task} t1
 * @param {import('$lib/types').Task} t2
 * @returns {-1|0|1}
 */
export function compareTaskNameAscAndVersionAsc(t1, t2) {
	if (t1.name < t2.name) return -1;
	if (t1.name > t2.name) return 1;
	// Names are equal, sort by version
	return greatestVersionAsc(t1, t2);
}

/**
 * @param {import('$lib/types').Task} t1
 * @param {import('$lib/types').Task} t2
 * @returns {-1|0|1}
 */
export function compareTaskNameAscAndVersionDesc(t1, t2) {
	if (t1.name < t2.name) return -1;
	if (t1.name > t2.name) return 1;
	// Names are equal, sort by version
	return greatestVersionDesc(t1, t2);
}

/**
 * @param {import('$lib/types').Task[]} tasks
 * @param {string|null} ownerName
 * @param {'asc'|'desc'} order
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
			if (t1.owner < t2.owner) return -1;
			if (t1.owner > t2.owner) return 1;
			// Owners are equal, sort by name
			return sortingFunction(t1, t2);
		}
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
	return items.sort((a, b) => (a.name < b.name ? -1 : a.name === b.name ? 0 : 1));
}
