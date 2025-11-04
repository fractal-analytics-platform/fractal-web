import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import TaskGroupSelector from '../../src/lib/components/v2/tasks/TaskGroupSelector.svelte';

describe('TaskGroupSelector', () => {
	it('Default group is selected', async () => {
		render(TaskGroupSelector, {
			props: {
				id: 'test',
				groupIdsNames: [
					[2, 'group2'],
					[1, 'All']
				],
				defaultGroupName: 'All'
			}
		});
		expect(screen.getByRole('combobox')).toHaveValue('1');
	});

	it('Validate required group', async () => {
		const { component } = render(TaskGroupSelector, {
			props: {
				id: 'test',
				groupIdsNames: [],
				defaultGroupName: null
			}
		});

		component.validate();

		expect(await screen.findByText('Shared tasks must be associated with a group')).toBeVisible();
	});

	it('The only present group is selected', async () => {
		render(TaskGroupSelector, {
			props: {
				id: 'test',
				groupIdsNames: [[1, 'group1']],
				defaultGroupName: null
			}
		});
		expect(screen.getByRole('combobox')).toHaveValue('1');
	});
});
