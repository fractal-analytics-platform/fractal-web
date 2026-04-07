import '@testing-library/jest-dom/vitest';
import { vi, expect } from 'vitest';

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Vitest extension to check FormData objects
expect.extend({
	toBeFormDataWith(received, expectedProperties) {
		const pass = received instanceof FormData;
		const receivedObject = pass ? Object.fromEntries(received.entries()) : {};
		expect(receivedObject).toMatchObject(expectedProperties);
		return {
			message: () => `expected ${received} to be FormData`,
			pass
		};
	}
});
