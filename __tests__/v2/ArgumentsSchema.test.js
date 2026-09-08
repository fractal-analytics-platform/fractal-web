import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// The component to be tested must be imported after the mock setup
import ArgumentsSchema from '../../src/lib/components/v2/workflow/ArgumentsSchema.svelte';

const argsSchemaNonParallel = {
	properties: {
		test_non_parallel: {
			type: 'string',
			title: 'test_non_parallel'
		}
	},
	type: 'object',
	required: ['test_non_parallel']
};

const argsSchemaParallel = {
	properties: {
		test_parallel: {
			type: 'string',
			title: 'test_parallel'
		}
	},
	type: 'object',
	required: ['test_parallel']
};

const argsSchemaOnlyIgnoredProperties = {
	properties: {
		zarr_urls: { type: 'string' }
	},
	type: 'object',
	required: ['zarr_urls']
};

describe('ArgumentsSchema', () => {
	it('Compound task without schemas', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'compound',
					args_non_parallel: {},
					args_parallel: {},
					task: {
						args_schema_non_parallel: null,
						args_schema_parallel: null
					}
				},
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getAllByRole('button', { name: 'Add property' })).toHaveLength(2);
		expect(screen.getByText('Initialisation Arguments')).toBeVisible();
		expect(screen.getByText('Compute Arguments')).toBeVisible();
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Parallel task without schema', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'parallel',
					args_non_parallel: null,
					args_parallel: {},
					task: {
						args_schema_non_parallel: null,
						args_schema_parallel: null
					}
				},
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByRole('button', { name: 'Add property' })).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Non parallel task without schema', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'non_parallel',
					args_non_parallel: {},
					args_parallel: null,
					task: {
						args_schema_non_parallel: null,
						args_schema_parallel: null
					}
				},
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByRole('button', { name: 'Add property' })).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Compound task with schemas and no wft arguments', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'compound',
					args_non_parallel: {},
					args_parallel: {},
					task: {
						type: 'compound',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: argsSchemaParallel,
						args_schema_parallel: argsSchemaNonParallel
					}
				},
				argsSchemaParallel,
				argsSchemaNonParallel,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByText('Initialisation Arguments')).toBeVisible();
		expect(screen.getByText('Compute Arguments')).toBeVisible();
		expect(screen.getByRole('textbox', { name: 'test_non_parallel' })).toBeVisible();
		expect(screen.getByRole('textbox', { name: 'test_parallel' })).toBeVisible();
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Compound task with ignore-only schemas and no wft arguments', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'compound',
					args_non_parallel: {},
					args_parallel: {},
					task: {
						type: 'compound',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: argsSchemaOnlyIgnoredProperties,
						args_schema_parallel: argsSchemaOnlyIgnoredProperties
					}
				},
				argsSchemaParallel: argsSchemaOnlyIgnoredProperties,
				argsSchemaNonParallel: argsSchemaOnlyIgnoredProperties,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByText('No arguments')).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
	});

	it('Compound task with ignore-only schemas but with extra wft arguments', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'compound',
					args_non_parallel: { foo: 'bar' },
					args_parallel: { foo: 'baz' },
					task: {
						type: 'compound',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: argsSchemaOnlyIgnoredProperties,
						args_schema_parallel: argsSchemaOnlyIgnoredProperties
					}
				},
				argsSchemaParallel: argsSchemaOnlyIgnoredProperties,
				argsSchemaNonParallel: argsSchemaOnlyIgnoredProperties,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByText('Initialisation Arguments')).toBeVisible();
		expect(screen.getByText('Compute Arguments')).toBeVisible();
		expect(screen.getAllByLabelText('Remove Property Block')).toHaveLength(2);
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Compound task with ignore-only non parallel schema', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'compound',
					args_non_parallel: {},
					args_parallel: {},
					task: {
						type: 'compound',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: argsSchemaOnlyIgnoredProperties,
						args_schema_parallel: argsSchemaParallel
					}
				},
				argsSchemaParallel: argsSchemaParallel,
				argsSchemaNonParallel: argsSchemaOnlyIgnoredProperties,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByRole('textbox', { name: 'test_parallel' })).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Compound task with ignore-only parallel schema', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'compound',
					args_non_parallel: {},
					args_parallel: {},
					task: {
						type: 'compound',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: argsSchemaNonParallel,
						args_schema_parallel: argsSchemaOnlyIgnoredProperties
					}
				},
				argsSchemaParallel: argsSchemaOnlyIgnoredProperties,
				argsSchemaNonParallel: argsSchemaNonParallel,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByRole('textbox', { name: 'test_non_parallel' })).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Non parallel task with ignore-only schemas', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'non_parallel',
					args_non_parallel: {},
					args_parallel: null,
					task: {
						type: 'non_parallel',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: argsSchemaOnlyIgnoredProperties,
						args_schema_parallel: null
					}
				},
				argsSchemaParallel: null,
				argsSchemaNonParallel: argsSchemaOnlyIgnoredProperties,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByText('No arguments')).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
	});

	it('Parallel task with ignore-only schemas', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'parallel',
					args_non_parallel: null,
					args_parallel: {},
					task: {
						type: 'parallel',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: null,
						args_schema_parallel: argsSchemaOnlyIgnoredProperties
					}
				},
				argsSchemaParallel: argsSchemaOnlyIgnoredProperties,
				argsSchemaNonParallel: null,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByText('No arguments')).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
	});

	it('Non parallel task with ignore-only schemas and extra wft arguments', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'non_parallel',
					args_non_parallel: { foo: 'baz' },
					args_parallel: null,
					task: {
						type: 'non_parallel',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: argsSchemaOnlyIgnoredProperties,
						args_schema_parallel: null
					}
				},
				argsSchemaParallel: null,
				argsSchemaNonParallel: argsSchemaOnlyIgnoredProperties,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByLabelText('Remove Property Block')).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
		expect(screen.queryByText('No arguments')).toBeNull();
	});

	it('Parallel task with ignore-only schemas and extra wft arguments', async () => {
		render(ArgumentsSchema, {
			props: {
				taskName: 'test',
				workflowTask: {
					task_type: 'parallel',
					args_non_parallel: null,
					args_parallel: { foo: 'baz' },
					task: {
						type: 'parallel',
						args_schema_version: 'pydantic_v2',
						args_schema_non_parallel: null,
						args_schema_parallel: argsSchemaOnlyIgnoredProperties
					}
				},
				argsSchemaParallel: argsSchemaOnlyIgnoredProperties,
				argsSchemaNonParallel: null,
				onWorkflowTaskUpdated: vi.fn()
			}
		});
		expect(screen.getByLabelText('Remove Property Block')).toBeVisible();
		expect(screen.queryByText('Initialisation Arguments')).toBeNull();
		expect(screen.queryByText('Compute Arguments')).toBeNull();
		expect(screen.queryByText('No arguments')).toBeNull();
	});
});
