import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
			data: {
				users: [
					{ id: 1, email: 'admin@fractal.xy' },
					{ id: 2, email: 'mario@fractal.xy' },
					{ id: 3, email: 'paola@fractal.xy' },
					{ id: 4, email: 'anna@fractal.xy' }
				],
				userInfo: {
					id: 2
				}
			}
		})
	};
});

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// The component to be tested must be imported after the mock setup
import page from '../src/routes/admin/jobs/+page.svelte';

describe('Admin jobs page', () => {
	it('Users in dropdown are correctly sorted', async () => {
		const result = render(page);
		const dropdown = result.getByLabelText('User');
		const options = dropdown.querySelectorAll('option');
		expect(options.length).eq(5);
		expect(options[0].text).eq('All');
		expect(options[1].text).eq('mario@fractal.xy');
		expect(options[2].text).eq('admin@fractal.xy');
		expect(options[3].text).eq('anna@fractal.xy');
		expect(options[4].text).eq('paola@fractal.xy');
	});
});
