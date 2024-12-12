import { beforeEach, it, describe, vi, expect } from 'vitest';
import { getAllNewVersions } from '$lib/components/v2/workflow/version-checker.js';

// Mocking fetch
global.fetch = vi.fn();

describe('Version checker', () => {
	beforeEach(() => {
		fetch.mockClear();
	});

	it('getAllNewVersions checks pkg_name', async () => {
		const workflowTasks = [
			{
				id: 1,
				name: 'task1',
				args_schema_non_parallel: {},
				type: 'non_parallel',
				taskgroupv2_id: 1
			},
			{
				id: 2,
				name: 'task1',
				args_schema_non_parallel: {},
				type: 'non_parallel',
				taskgroupv2_id: 2
			},
			{
				id: 3,
				name: 'task1',
				args_schema_non_parallel: {},
				type: 'non_parallel',
				taskgroupv2_id: 3
			}
		];

		const taksGroups = [
			{
				id: 1,
				version: '1.0.0',
				task_list: [
					{
						id: 1,
						name: 'task1',
						args_schema_non_parallel: {},
						type: 'non_parallel',
						taskgroupv2_id: 1
					}
				],
				pkg_name: 'group1',
				active: true
			},
			{
				id: 2,
				version: '1.5.0',
				task_list: [
					{
						id: 2,
						name: 'task1',
						args_schema_non_parallel: {},
						type: 'non_parallel',
						taskgroupv2_id: 2
					}
				],
				pkg_name: 'group1',
				active: true
			},
			{
				id: 3,
				version: '2.0.0',
				task_list: [
					{
						id: 3,
						name: 'task1',
						args_schema_non_parallel: {},
						type: 'non_parallel',
						taskgroupv2_id: 3
					}
				],
				pkg_name: 'group2',
				active: true
			}
		];

		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => taksGroups
		});

		const { updateCandidates } = await getAllNewVersions(workflowTasks);

		expect(updateCandidates['1']).toHaveLength(1);
		expect(updateCandidates['1'][0].version).eq('1.5.0');
		expect(updateCandidates['2']).toHaveLength(0);
		expect(updateCandidates['3']).toHaveLength(0);
	});

	it('getAllNewVersions checks task type', async () => {
		const workflowTasks = [
			{
				id: 1,
				name: 'task1',
				args_schema_non_parallel: {},
				type: 'non_parallel',
				taskgroupv2_id: 1
			},
			{
				id: 2,
				name: 'task1',
				args_schema_parallel: {},
				type: 'parallel',
				taskgroupv2_id: 2
			},
			{
				id: 3,
				name: 'task1',
				args_schema_non_parallel: {},
				type: 'non_parallel',
				taskgroupv2_id: 3
			}
		];

		const taksGroups = [
			{
				id: 1,
				version: '1.0.0',
				task_list: [
					{
						id: 1,
						name: 'task1',
						args_schema_non_parallel: {},
						type: 'non_parallel',
						taskgroupv2_id: 1
					}
				],
				pkg_name: 'group1',
				active: true
			},
			{
				id: 2,
				version: '1.5.0',
				task_list: [
					{
						id: 2,
						name: 'task1',
						args_schema_parallel: {},
						type: 'parallel',
						taskgroupv2_id: 2
					}
				],
				pkg_name: 'group1',
				active: true
			},
			{
				id: 3,
				version: '1.2.0',
				task_list: [
					{
						id: 3,
						name: 'task1',
						args_schema_non_parallel: {},
						type: 'non_parallel',
						taskgroupv2_id: 3
					}
				],
				pkg_name: 'group1',
				active: true
			}
		];

		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => taksGroups
		});

		const { updateCandidates } = await getAllNewVersions(workflowTasks);

		expect(updateCandidates['1']).toHaveLength(1);
		expect(updateCandidates['1'][0].version).eq('1.2.0');
		expect(updateCandidates['2']).toHaveLength(0);
		expect(updateCandidates['3']).toHaveLength(0);
	});

	it('getAllNewVersions ignore tasks without version', async () => {
		const workflowTasks = [
			{
				id: 1,
				name: 'task1',
				args_schema_non_parallel: {},
				type: 'non_parallel',
				taskgroupv2_id: 1
			},
			{
				id: 2,
				name: 'task1',
				args_schema_non_parallel: {},
				type: 'non_parallel',
				taskgroupv2_id: 2
			}
		];

		const taksGroups = [
			{
				id: 1,
				version: '1.0.0',
				task_list: [
					{
						id: 1,
						name: 'task1',
						args_schema_non_parallel: {},
						type: 'non_parallel',
						taskgroupv2_id: 1
					}
				],
				pkg_name: 'group1',
				active: true
			},
			{
				id: 2,
				version: null,
				task_list: [
					{
						id: 2,
						name: 'task1',
						args_schema_non_parallel: {},
						type: 'non_parallel',
						taskgroupv2_id: 2
					}
				],
				pkg_name: 'group1',
				active: true
			}
		];

		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => taksGroups
		});

		const { updateCandidates } = await getAllNewVersions(workflowTasks);

		expect(updateCandidates['1']).toHaveLength(0);
		expect(updateCandidates['2']).toHaveLength(0);
	});

	it('getAllNewVersions ignore tasks without schema', async () => {
		const workflowTasks = [
			{
				id: 1,
				name: 'task1',
				args_schema_non_parallel: {},
				args_schema_parallel: null,
				type: 'non_parallel',
				taskgroupv2_id: 1
			},
			{
				id: 2,
				name: 'task1',
				args_schema_non_parallel: {},
				args_schema_parallel: null,
				type: 'non_parallel',
				taskgroupv2_id: 2
			},
			{
				id: 3,
				name: 'task1',
				args_schema_non_parallel: null,
				args_schema_parallel: null,
				type: 'non_parallel',
				taskgroupv2_id: 3
			}
		];

		const taksGroups = [
			{
				id: 1,
				version: '1.0.0',
				task_list: [
					{
						id: 1,
						name: 'task1',
						args_schema_non_parallel: {},
						args_schema_parallel: null,
						type: 'non_parallel',
						taskgroupv2_id: 1
					}
				],
				pkg_name: 'group1',
				active: true
			},
			{
				id: 2,
				version: '1.2.0',
				task_list: [
					{
						id: 2,
						name: 'task1',
						args_schema_non_parallel: {},
						args_schema_parallel: null,
						type: 'non_parallel',
						taskgroupv2_id: 2
					}
				],
				pkg_name: 'group1',
				active: true
			},
			{
				id: 3,
				version: '1.3.0',
				task_list: [
					{
						id: 3,
						name: 'task1',
						args_schema_non_parallel: null,
						args_schema_parallel: null,
						type: 'non_parallel',
						taskgroupv2_id: 3
					}
				],
				pkg_name: 'group1',
				active: true
			}
		];

		fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => taksGroups
		});

		const { updateCandidates } = await getAllNewVersions(workflowTasks);

		expect(updateCandidates['1']).toHaveLength(1);
		expect(updateCandidates['1'][0].version).eq('1.2.0');
		expect(updateCandidates['2']).toHaveLength(0);
		expect(updateCandidates['3']).toHaveLength(0);
	});
});
