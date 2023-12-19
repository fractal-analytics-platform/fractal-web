import { it, expect } from 'vitest';
import semver from 'semver';
import { greatestVersionAsc } from '../src/lib/common/component_utilities';

it('should be able to loosely validate versions', () => {
	const cases = [
		['0.10.0a0', '0.10.0-a0'],
		['0.10.0a2', '0.10.0-a2'],
		['0.10.0alpha0', '0.10.0-alpha0'],
		['0.10.0alpha3', '0.10.0-alpha3'],
		['0.10.0b4', '0.10.0-b4'],
		['0.10.0beta5', '0.10.0-beta5'],
		['0.10.0c0', '0.10.0-c0'],
		['1.0.0rc4.dev7', '1.0.0-rc4.dev7']
	];

	const validationOptions = {
		loose: true,
		includePrerelease: true
	};

	cases.forEach(([input, expected]) => {
		const validatedVersion = semver.valid(input, validationOptions);
		expect(validatedVersion).toBe(expected);
	});
});

it('should sort versions correctly', () => {
	const versions = [
		{ version: '2' },
		{ version: '0.10.0c0' },
		{ version: '0.10.0b4' },
		{ version: '0.10.0' },
		{ version: '0.10.0alpha3' },
		{ version: '0.10.0a2' },
		{ version: '1.0.0' },
		{ version: '0.10.0a0' },
		{ version: '1.0.0rc4.dev7' },
		{ version: '0.10.0beta5' },
		{ version: '0.10.0alpha0' },
		{ version: '0.1.2' },
		{ version: '0.1.dev27+g1458b59' },
		{ version: '0.2.0a0' }
	];

	const sortedVersions = [...versions].sort(greatestVersionAsc);

	const expectedSortedVersions = [
		{ version: '0.1.dev27+g1458b59' },
		{ version: '0.1.2' },
		{ version: '0.2.0a0' },
		{ version: '0.10.0a0' },
		{ version: '0.10.0a2' },
		{ version: '0.10.0alpha0' },
		{ version: '0.10.0alpha3' },
		{ version: '0.10.0b4' },
		{ version: '0.10.0beta5' },
		{ version: '0.10.0c0' },
		{ version: '0.10.0' },
		{ version: '1.0.0rc4.dev7' },
		{ version: '1.0.0' },
		{ version: '2' }
	];

	expect(sortedVersions).toEqual(expectedSortedVersions);

	// Test that the sorting works also with 'v' prefix
	const v_versions = versions.map((v) => ({ version: `v${v.version}` }));
	const v_expectedSortedVersions = expectedSortedVersions.map((v) => ({
		version: `v${v.version}`
	}));

	const v_sortedVersions = [...v_versions].sort(greatestVersionAsc);

	expect(v_sortedVersions).toEqual(v_expectedSortedVersions);
});
