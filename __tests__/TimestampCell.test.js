import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

import TimestampCell from '../src/lib/components/jobs/TimestampCell.svelte';

describe('TimestampCell', () => {
	it('handles null timestamp', async () => {
		const result = render(TimestampCell, {
			props: { timestamp: null }
		});
		expect(result.container.textContent).eq('-');
	});

	it('handles empty timestamp', async () => {
		const result = render(TimestampCell, {
			props: { timestamp: '' }
		});
		expect(result.container.textContent).eq('-');
	});

	it('handles valid timestamp', async () => {
		const result = render(TimestampCell, {
			props: { timestamp: '2024-02-09T10:35:56.237579+00:00' }
		});
		expect(result.container.textContent).eq('9/2/2024 11:35:56');
	});
});
