import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			data: {}
		}
	};
});

// Mocking public variables
vi.mock('$app/env/public', () => {
	return {
		PUBLIC_FRACTAL_ADMIN_SUPPORT_EMAIL: 'admin@fractal.xy',
		PUBLIC_ENABLE_HELP_LINKS: true,
		PUBLIC_HELP_LINKS_BASE_URL: ''
	};
});

// The component to be tested must be imported after the mock setup
import page from '../src/routes/+page.svelte';

describe('Main page', () => {
	describe('OAuth2 errors', () => {
		it('should display message without params', async () => {
			setOAuth2Message({ error_msg: 'please contact an administrator', params: [] });
			render(page);
			expect(screen.getByText('please contact an administrator')).toBeVisible();
		});

		it('should display message with email and url params', async () => {
			setOAuth2Message({
				error_msg: 'Examples: %s and %s.',
				params: [
					{
						text: 'example 1',
						url: 'https://example.org'
					},
					{
						text: 'example 2',
						email: 'someone@example.org'
					}
				]
			});
			render(page);
			const alert = screen.getByText(/Examples: /);
			expect(alert).toBeVisible();
			expect(alert.textContent).toMatch(/Examples:.*example 1.*and.*example 2\./s);
			expect(screen.getByRole('link', { name: 'example 1' })).toHaveAttribute(
				'href',
				'https://example.org'
			);
			expect(screen.getByRole('link', { name: 'example 2' })).toHaveAttribute(
				'href',
				'mailto:someone@example.org'
			);
		});

		it('should handle invalid number of params', async () => {
			setOAuth2Message({
				error_msg: 'Examples: %s and %s.',
				params: [
					{
						text: 'example 1',
						url: 'https://example.org'
					}
				]
			});
			render(page);
			const alert = screen.getByText(/Examples: /);
			expect(alert).toBeVisible();
			expect(alert.textContent).toMatch(/Examples:.*example 1.*and. \./s);
			expect(screen.getByRole('link', { name: 'example 1' })).toHaveAttribute(
				'href',
				'https://example.org'
			);
		});

		/**
		 * @param {import('#fractal-components/types/api').OAuth2ErrorMessage} data
		 */
		function setOAuth2Message(data) {
			sessionStorage.setItem('temporary-message', JSON.stringify(data));
		}
	});
});
