import { expect, test } from '@playwright/test';

test('Alive endpoint', async ({ request }) => {
	const response = await request.get('/alive');
	expect(response.ok).toBeTruthy();
	const payload = await response.json();
	expect(payload.alive).toEqual(true);
	expect(payload.version).not.toBeNull();
	expect(payload.fractal_server_alive).toEqual(true);
	expect(payload.fractal_server_version).not.toBeNull();
});
