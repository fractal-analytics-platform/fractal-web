import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

import StandardErrorAlert from '../src/lib/components/common/StandardErrorAlert.svelte';
import { AlertError } from '../src/lib/common/errors';

describe('StandardErrorAlert', () => {
	it('AlertError with string message', async () => {
		const result = renderStandardErrorAlert(new AlertError('error message'));
		expect(result.container.textContent).toContain('error message');
	});

	it('AlertError with string detail', async () => {
		const result = renderStandardErrorAlert(new AlertError({ detail: 'error message' }));
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('detail');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('AlertError with array detail', async () => {
		const result = renderStandardErrorAlert(new AlertError({ detail: ['error message'] }));
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('detail');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('AlertError with object detail and __root__ loc', async () => {
		const result = renderStandardErrorAlert(
			new AlertError(
				{
					detail: [
						{
							loc: ['body', '__root__'],
							msg: 'error message',
							type: 'value_error'
						}
					]
				},
				422
			)
		);
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('detail');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('AlertError with generic object message', async () => {
		const result = renderStandardErrorAlert(new AlertError({ foo: 'bar' }));
		expect(result.container.textContent).toMatch(/{.*"foo".*:.*"bar".*}/s);
		expect(result.container.textContent).toContain('There has been an error');
	});

	it('AlertError with generic object message', async () => {
		const result = renderStandardErrorAlert(new AlertError({ foo: 'bar' }));
		expect(result.container.textContent).toMatch(/{.*"foo".*:.*"bar".*}/s);
		expect(result.container.textContent).toContain('There has been an error');
	});

	it('Generic error with string message', async () => {
		const result = renderStandardErrorAlert(new Error('error message'));
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('Generic object message with detail', async () => {
		const result = renderStandardErrorAlert({ detail: 'error message' });
		expect(result.container.textContent).toContain('error message');
		expect(result.container.textContent).not.toContain('detail');
		expect(result.container.textContent).not.toContain('There has been an error');
	});

	it('Generic object message without detail', async () => {
		const result = renderStandardErrorAlert({ foo: 'bar' });
		expect(result.container.textContent).toMatch(/{.*"foo".*:.*"bar".*}/s);
		expect(result.container.textContent).toContain('There has been an error');
	});
});

/**
 * @param {any} error
 */
function renderStandardErrorAlert(error) {
	return render(StandardErrorAlert, { error });
}
