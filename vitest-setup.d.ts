import 'vitest';

declare module 'vitest' {
	interface ExpectStatic {
		toBeFormDataWith(expected: Record<string, unknown>): void;
	}
}
