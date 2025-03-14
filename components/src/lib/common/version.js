import coerce from 'semver/functions/coerce';
import gte from 'semver/functions/gte';
import lte from 'semver/functions/lte';
import valid from 'semver/functions/valid';

/**
 * @param {string | null} version1
 * @param {string | null} version2
 * @returns {-1|0|1}
 */
export function greatestVersionAsc(version1, version2) {
	const t1Version = validateVersion(version1);
	const t2Version = validateVersion(version2);
	if (t1Version !== null && t2Version !== null) {
		const t1VersionLt = lte(t1Version, t2Version);
		return t1VersionLt ? -1 : 1;
	}
	return 0;
}

/**
 * @param {string | null} version1
 * @param {string | null} version2
 * @returns {-1|0|1}
 */
export function greatestVersionDesc(version1, version2) {
	const t1Version = validateVersion(version1);
	const t2Version = validateVersion(version2);
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
