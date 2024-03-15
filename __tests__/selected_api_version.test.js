import { it, expect, vi, beforeEach } from 'vitest';
import { reloadVersionedPage } from '../src/lib/common/selected_api_version';

vi.mock('$app/navigation', () => {
	return { goto: vi.fn() };
});

import { goto } from '$app/navigation';

beforeEach(() => {
	vi.resetAllMocks();
});

it('should reload versioned page (v1 -> v2)', async () => {
	await reloadVersionedPage('/v1/projects', 'v2');
	expect(goto).toHaveBeenCalledWith('/v2/projects');
});

it('should reload versioned page (v2 -> v1)', async () => {
	await reloadVersionedPage('/v2/projects', 'v1');
	expect(goto).toHaveBeenCalledWith('/v1/projects');
});

it('should ignore page without version', async () => {
	await reloadVersionedPage('/admin', 'v2');
	expect(goto).not.toHaveBeenCalled();
});
