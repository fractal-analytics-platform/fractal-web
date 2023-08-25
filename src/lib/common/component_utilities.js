import semver from 'semver';

export function greatestVersionAsc(t1, t2) {
	const semverValidationOptions = {
		loose: true,
		includePrerelease: true
	};
	try {
		const t1Version = semver.valid(t1.version, semverValidationOptions);
		const t2Version = semver.valid(t2.version, semverValidationOptions);
		const t1VersionLt = semver.lte(t1Version, t2Version);
		if (t1VersionLt) return -1;
		if (!t1VersionLt) return 1;
	} catch {
		return 0;
	}
}

export function greatestVersionDesc(t1, t2) {
	const semverValidationOptions = {
		loose: true,
		includePrerelease: true
	};
	try {
		const t1Version = semver.valid(t1.version, semverValidationOptions);
		const t2Version = semver.valid(t2.version, semverValidationOptions);
		const t1VersionGt = semver.gte(t1Version, t2Version);
		if (t1VersionGt) return -1;
		if (!t1VersionGt) return 1;
	} catch {
		return 0;
	}
}

function compareTaskNameAndVersion(t1, t2) {
	if (t1.name < t2.name) return -1;
	if (t1.name > t2.name) return 1;
	// Names are equal, sort by version
	return greatestVersionAsc(t1, t2);
}

export function orderTasksByOwnerThenByNameThenByVersion(tasks, ownerName = null) {
	// Sort tasks by owner, by name and by version
	return tasks.sort((t1, t2) => {
		// If ownerName is not null, filter tasks by owner
		if (ownerName !== null) {
			// If t1 owner is same as ownerName, t1 should go before t2
			if (t1.owner === ownerName) {
				if (t2.owner !== ownerName) return -1;
				// Both owners are same, sort by name and version
				return compareTaskNameAndVersion(t1, t2);
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
				return compareTaskNameAndVersion(t1, t2);
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
			return compareTaskNameAndVersion(t1, t2);
		}
	});
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

export function unsetEmptyStrings(inputValues) {
	const clearedValues = {};
	for (let key in inputValues) {
		if (typeof(inputValues[key]) === 'string' && inputValues[key].trim() === '') {
			clearedValues[key] = null;
		} else {
			clearedValues[key] = inputValues[key];
		}
	}
	return clearedValues;
}
