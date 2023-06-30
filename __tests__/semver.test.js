import { it, expect } from 'vitest';
import semver from 'semver';

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