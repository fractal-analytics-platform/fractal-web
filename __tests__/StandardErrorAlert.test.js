import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

import StandardErrorAlert from '../src/lib/components/common/StandardErrorAlert.svelte';
import { AlertError } from '../src/lib/common/errors';

describe('StandardErrorAlert', () => {
	it('AlertError with string message', async () => {
		const result = render(StandardErrorAlert, {
			error: new AlertError('error message')
		});
		expect(result.container.textContent).toContain('error message');
	});

	it('AlertError with detail message', async () => {
		const result = render(StandardErrorAlert, {
			error: new AlertError({ detail: 'error message' })
		});
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('detail');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('AlertError with generic object message', async () => {
		const result = render(StandardErrorAlert, {
			error: new AlertError({ foo: 'bar' })
		});
		expect(result.container.textContent).toMatch(/{.*"foo".*:.*"bar".*}/s);
		expect(result.container.textContent).toContain('There has been an error');
	});

	it('AlertError with generic object message', async () => {
		const result = render(StandardErrorAlert, {
			error: new AlertError({ foo: 'bar' })
		});
		expect(result.container.textContent).toMatch(/{.*"foo".*:.*"bar".*}/s);
		expect(result.container.textContent).toContain('There has been an error');
	});

	it('Generic error with string message', async () => {
		const result = render(StandardErrorAlert, {
			error: new Error('error message')
		});
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('Generic object message with detail', async () => {
		const result = render(StandardErrorAlert, {
			error: { detail: 'error message' }
		});
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('detail');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('Generic object message without detail', async () => {
		const result = render(StandardErrorAlert, {
			error: { foo: 'bar' }
		});
		expect(result.container.textContent).toMatch(/{.*"foo".*:.*"bar".*}/s);
		expect(result.container.textContent).toContain('There has been an error');
	});
});
